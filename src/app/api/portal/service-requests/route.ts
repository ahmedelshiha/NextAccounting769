import { NextRequest } from 'next/server'
import prisma from '@/lib/prisma'
import { z } from 'zod'
import { applyRateLimit, getClientIp } from '@/lib/rate-limit'
import { respond, zodDetails } from '@/lib/api-response'
import { logAudit } from '@/lib/audit'
import { planRecurringBookings } from '@/lib/booking/recurring'
import { realtimeService } from '@/lib/realtime-enhanced'
import { withTenantContext } from '@/lib/api-wrapper'
import { requireTenantContext, getTenantFilter } from '@/lib/tenant-utils'

export const runtime = 'nodejs'

const CreateBase = z.object({
  serviceId: z.string().min(1),
  title: z.string().min(5).max(300).optional(),
  description: z.string().optional(),
  priority: z.union([
    z.enum(['LOW','MEDIUM','HIGH','URGENT']),
    z.enum(['low','medium','high','urgent']).transform(v => v.toUpperCase() as 'LOW'|'MEDIUM'|'HIGH'|'URGENT'),
  ]).default('MEDIUM'),
  budgetMin: z.preprocess((v) => {
    if (v === undefined || v === null || v === '') return undefined
    if (typeof v === 'string') return Number(v)
    return v
  }, z.number().optional()),
  budgetMax: z.preprocess((v) => {
    if (v === undefined || v === null || v === '') return undefined
    if (typeof v === 'string') return Number(v)
    return v
  }, z.number().optional()),
  requirements: z.record(z.string(), z.any()).optional(),
  attachments: z.any().optional(),
})

const CreateRequestSchema = CreateBase.extend({
  isBooking: z.literal(false).optional(),
  deadline: z.string().datetime().optional(),
})

const CreateBookingSchema = CreateBase.extend({
  isBooking: z.literal(true),
  scheduledAt: z.string().datetime(),
  duration: z.number().int().positive().optional(),
  bookingType: z.enum(['STANDARD','RECURRING','EMERGENCY','CONSULTATION']).optional(),
  recurringPattern: z.object({
    frequency: z.enum(['DAILY','WEEKLY','MONTHLY']),
    interval: z.number().int().positive().optional(),
    count: z.number().int().positive().optional(),
    until: z.string().datetime().optional(),
    byWeekday: z.array(z.number().int().min(0).max(6)).optional(),
  }).optional(),
})

const CreateSchema = z.union([CreateRequestSchema, CreateBookingSchema])

export const GET = withTenantContext(async (request: NextRequest) => {
  const ctx = requireTenantContext()

  const { searchParams } = new URL(request.url)
  const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10))
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '10', 10)))
  const status = searchParams.get('status')
  const priority = searchParams.get('priority')
  const q = searchParams.get('q')?.trim()
  const type = searchParams.get('type')
  const bookingType = searchParams.get('bookingType')
  const dateFrom = searchParams.get('dateFrom')
  const dateTo = searchParams.get('dateTo')

  // Use IDs from tenant context directly
  const resolvedUserId = ctx.userId
  const resolvedTenantId = ctx.tenantId

  // If no user ID is present after middleware, we can't proceed
  if (!resolvedUserId) {
    return respond.unauthorized()
  }

  const where: any = {
    clientId: resolvedUserId,
    ...(status && { status }),
    ...(priority && { priority }),
    ...(q && {
      OR: [
        { title: { contains: q, mode: 'insensitive' } },
        { description: { contains: q, mode: 'insensitive' } },
      ],
    }),
    ...(type === 'appointments' ? { isBooking: true } : {}),
    ...(bookingType ? { bookingType } : {}),
    ...((dateFrom || dateTo) ? (
      type === 'appointments'
        ? { scheduledAt: {
            ...(dateFrom ? { gte: new Date(dateFrom) } : {}),
            ...(dateTo ? { lte: new Date(new Date(dateTo).setHours(23,59,59,999)) } : {}),
          } }
        : { createdAt: {
            ...(dateFrom ? { gte: new Date(dateFrom) } : {}),
            ...(dateTo ? { lte: new Date(new Date(dateTo).setHours(23,59,59,999)) } : {}),
          } }
    ) : {}),
    ...(resolvedTenantId ? { tenantId: resolvedTenantId } : {}),
  }

  try {
    const [items, total] = await Promise.all([
      prisma.serviceRequest.findMany({
        where,
        include: {
          service: { select: { id: true, name: true, slug: true, category: true } },
        },
        orderBy: type === 'appointments' ? { scheduledAt: 'desc' } : { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.serviceRequest.count({ where }),
    ])

    return respond.ok(items, { pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } })
  } catch (e: any) {
    const code = String(e?.code || '')
    const msg = String(e?.message || '')

    // Legacy path when scheduledAt/isBooking columns are missing
    if (code === 'P2022' || /column .*does not exist/i.test(msg)) {
      const whereLegacy: any = {
        clientId: resolvedUserId,
        ...(status && { status }),
        ...(priority && { priority }),
        ...(q && {
          OR: [
            { title: { contains: q, mode: 'insensitive' } },
            { description: { contains: q, mode: 'insensitive' } },
          ],
        }),
        ...(type === 'appointments' ? { deadline: { not: null } } : {}),
        ...(type === 'requests' ? { deadline: null } : {}),
        ...(dateFrom || dateTo ? {
          createdAt: {
            ...(dateFrom ? { gte: new Date(dateFrom) } : {}),
            ...(dateTo ? { lte: new Date(new Date(dateTo).setHours(23,59,59,999)) } : {}),
          },
        } : {}),
        ...(resolvedTenantId ? { tenantId: resolvedTenantId } : {}),
      }
      const [items, total] = await Promise.all([
        prisma.serviceRequest.findMany({
          where: whereLegacy,
          include: { service: { select: { id: true, name: true, slug: true, category: true } } },
          orderBy: { createdAt: 'desc' },
          skip: (page - 1) * limit,
          take: limit,
        }),
        prisma.serviceRequest.count({ where: whereLegacy }),
      ])
      return respond.ok(items, { pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } })
    }

    // Prisma errors (no table / database not configured) — fallback to in-memory dev store
    if (code.startsWith('P20')) {
      try {
        const { getAllRequests } = await import('@/lib/dev-fallbacks')
        let all = getAllRequests()

        all = all.filter((r: any) => r.clientId === resolvedUserId && r.tenantId === resolvedTenantId)
        if (type === 'appointments') all = all.filter((r: any) => !!((r as any).scheduledAt || r.deadline))
        if (type === 'requests') all = all.filter((r: any) => !((r as any).scheduledAt || r.deadline))
        if (status) all = all.filter((r: any) => String(r.status) === String(status))
        if (priority) all = all.filter((r: any) => String(r.priority) === String(priority))
        if (bookingType) all = all.filter((r: any) => String((r as any).bookingType || '') === String(bookingType))
        if (q) {
          const qq = String(q).toLowerCase()
          all = all.filter((r: any) => String(r.title || '').toLowerCase().includes(qq) || String(r.description || '').toLowerCase().includes(qq))
        }
        if (dateFrom) {
          const from = new Date(dateFrom).getTime()
          all = all.filter((r: any) => new Date((r as any).scheduledAt || r.deadline || r.createdAt || 0).getTime() >= from)
        }
        if (dateTo) {
          const to = new Date(new Date(dateTo).setHours(23,59,59,999)).getTime()
          all = all.filter((r: any) => new Date((r as any).scheduledAt || r.deadline || r.createdAt || 0).getTime() <= to)
        }
        all.sort((a: any, b: any) => {
          const ad = new Date((a as any).scheduledAt || a.createdAt || 0).getTime()
          const bd = new Date((b as any).scheduledAt || b.createdAt || 0).getTime()
          return bd - ad
        })
        const total = all.length
        const pageItems = all.slice((page - 1) * limit, (page - 1) * limit + limit)
        return respond.ok(pageItems, { pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } })
      } catch {
        return respond.serverError()
      }
    }
    throw e
  }
})

export const POST = withTenantContext(async (request: NextRequest) => {
  const ctx = requireTenantContext()

  // If no user ID is present after middleware, we can't proceed
  if (!ctx.userId) {
    return respond.unauthorized()
  }

  const idemKey = request.headers.get('x-idempotency-key') || ''
  if (idemKey) {
    try {
      const { findIdempotentResult, reserveIdempotencyKey } = await import('@/lib/idempotency')
      const existing = await findIdempotentResult(idemKey, ctx.tenantId ?? undefined)
      if (existing && existing.entityId && existing.entityType === 'ServiceRequest') {
        try {
          const existingEntity = await prisma.serviceRequest.findUnique({ where: { id: existing.entityId }, include: { service: { select: { id: true, name: true, slug: true, category: true } } } })
          if (existingEntity) return respond.created(existingEntity)
        } catch {}
      }
      await reserveIdempotencyKey(idemKey, ctx.userId || null, ctx.tenantId ?? undefined)
    } catch {}
  }
  const ip = getClientIp(request as any)
  const key = `portal:service-requests:create:${ip}`
  // In tests we want to bypass rate limiting to avoid flaky failures — Vitest sets VITEST=true
  let createLimit: any = { allowed: true }
  if (!(process.env.NODE_ENV === 'test' || process.env.VITEST === 'true')) {
    createLimit = await applyRateLimit(key, 5, 60_000)
  }
  if (!createLimit || !createLimit.allowed) {
    try { await logAudit({ action: 'security.ratelimit.block', details: { tenantId: ctx.tenantId ?? null, ip, key, route: new URL(request.url).pathname } }) } catch {}
    return respond.tooMany()
  }
  const body = await request.json().catch(() => null)
  const parsed = CreateSchema.safeParse(body)
  if (!parsed.success) {
    return respond.badRequest('Invalid payload', zodDetails(parsed.error))
  }

  const data = parsed.data

  // Validate service exists and active
  let svc: any = null
  try {
    svc = await prisma.service.findUnique({ where: { id: (data as any).serviceId } })
    const _status = (svc as any)?.status ? String((svc as any).status).toUpperCase() : undefined
    const _active = (svc as any)?.active
    if (!svc || (_status ? _status !== 'ACTIVE' : _active === false)) {
      return respond.badRequest('Service not found or inactive')
    }
    if ((svc as any)?.tenantId && (svc as any).tenantId !== ctx.tenantId) {
      return respond.badRequest('Service not found or inactive')
    }
  } catch (e: any) {
    try { const { captureError } = await import('@/lib/observability'); await captureError(e, { tags: { route: 'portal:service-requests:POST:service-lookup' } }) } catch {}
    // Prisma issues — fall back to internal services route (no network assumptions)
    if (String(e?.code || '').startsWith('P20')) {
      try {
        const mod = await import('@/app/api/services/route')
        const resp: any = await mod.GET(new Request('https://internal/api/services') as any, {} as any)
        const json = await resp.json().catch(() => null)
        const list = Array.isArray(json?.data) ? json.data : Array.isArray(json) ? json : []
        svc = list.find((s: any) => s.id === (data as any).serviceId) || null
        if (!svc) return respond.serverError()
      } catch {
        return respond.serverError()
      }
    } else {
      throw e
    }
  }

  try {
    // If title not provided, generate a friendly title using service name + client
    let titleToUse = (data as any).title as string | undefined
    if (!titleToUse) {
      try {
        titleToUse = `${svc.name} request — ${ctx.userId} — ${new Date().toISOString().slice(0,10)}`
      } catch {
        titleToUse = `${svc.name} request — ${ctx.userId} — ${new Date().toISOString().slice(0,10)}`
      }
    }

    const dataObj: any = {
      clientId: String(ctx.userId ?? ''),
      serviceId: (data as any).serviceId,
      title: titleToUse,
      description: (data as any).description ?? null,
      priority: (data as any).priority as any,
      budgetMin: (data as any).budgetMin != null ? (data as any).budgetMin : null,
      budgetMax: (data as any).budgetMax != null ? (data as any).budgetMax : null,
      deadline: (data as any).deadline ? new Date((data as any).deadline) : null,
      requirements: ((data as any).requirements as any) ?? undefined,
      attachments: ((data as any).attachments as any) ?? undefined,
      status: 'SUBMITTED',
      tenantId: ctx.tenantId,
      ...('isBooking' in data && (data as any).isBooking ? {
        isBooking: true,
        scheduledAt: new Date((data as any).scheduledAt),
        duration: (data as any).duration ?? null,
        bookingType: (data as any).bookingType ?? null,
        recurringPattern: (data as any).recurringPattern ?? undefined,
      } : {}),
    }
    // Elevate priority for emergency bookings
    if (String((data as any).bookingType || '').toUpperCase() === 'EMERGENCY') {
      dataObj.priority = 'URGENT'
    }

    // For booking-type requests, enforce minAdvance and conflict detection prior to creation
    if ((data as any).isBooking) {
      try {
        const bookingType = String((data as any).bookingType || '').toUpperCase()
        const svcRec = await prisma.service.findUnique({ where: { id: (data as any).serviceId } })
        const minAdvanceHours = typeof svcRec?.minAdvanceHours === 'number' ? svcRec!.minAdvanceHours : 0
        if (bookingType !== 'EMERGENCY' && minAdvanceHours > 0 && bookingType !== 'RECURRING') {
          const now = new Date()
          const scheduled = new Date((data as any).scheduledAt)
          const diffHours = (scheduled.getTime() - now.getTime()) / (1000 * 60 * 60)
          if (diffHours < minAdvanceHours) return respond.badRequest('Selected time is too soon for this service. Please respect min advance booking rules.')
        }

        // For recurring bookings, conflict checks are handled per-instance during plan application.
        if (bookingType !== 'RECURRING') {
          const { checkBookingConflict } = await import('@/lib/booking/conflict-detection')
          const svcDuration = (svcRec?.duration) ?? 60
          const check = await checkBookingConflict({
            serviceId: (data as any).serviceId,
            start: new Date((data as any).scheduledAt),
            durationMinutes: Number((data as any).duration ?? svcDuration),
            excludeBookingId: undefined,
            tenantId: ctx.tenantId,
            teamMemberId: null,
          })
          if (check.conflict) return respond.conflict('Scheduling conflict detected', { reason: check.details?.reason, conflictingBookingId: check.details?.conflictingBookingId })
        }

        // Extra validation for emergency bookings
        if (bookingType === 'EMERGENCY') {
          try {
            const req: any = (data as any).requirements || {}
            const emReason = (req.booking && req.booking.emergencyReason) || req.emergencyReason
            const phone = (req.booking && req.booking.clientPhone) || null
            if (!emReason || String(emReason).trim().length < 10) {
              return respond.badRequest('Emergency details are required (min 10 characters).')
            }
            if (!phone || String(phone).trim().length < 5) {
              return respond.badRequest('Phone number is required for emergency bookings.')
            }
          } catch {}
        }
      } catch {}
    }

    // Recurring series creation for portal clients
    if ((data as any).isBooking && String((data as any).bookingType) === 'RECURRING' && (data as any).recurringPattern) {
      const svcDuration = svc?.duration ?? 60
      const durationMinutes = Number((data as any).duration ?? svcDuration)
      const rp: any = (data as any).recurringPattern
      const normalized = {
        frequency: String(rp.frequency) as 'DAILY'|'WEEKLY'|'MONTHLY',
        interval: rp.interval ? Number(rp.interval) : undefined,
        count: rp.count ? Number(rp.count) : undefined,
        until: rp.until ? new Date(rp.until) : undefined,
        byWeekday: Array.isArray(rp.byWeekday) ? rp.byWeekday.map((n: any) => Number(n)) : undefined,
      }

      const plan = await planRecurringBookings({
        serviceId: (data as any).serviceId,
        clientId: String(ctx.userId ?? ''),
        durationMinutes,
        start: new Date((data as any).scheduledAt),
        pattern: normalized as any,
        tenantId: ctx.tenantId,
        teamMemberId: null,
      })

      const parentPayload = { ...dataObj }
      delete (parentPayload as any).clientId
      delete (parentPayload as any).serviceId
      delete (parentPayload as any).tenantId

      const parent = await prisma.serviceRequest.create({
        data: {
          client: { connect: { id: String(ctx.userId ?? '') } },
          service: { connect: { id: (data as any).serviceId } },
          ...(ctx.tenantId ? { tenant: { connect: { id: String(ctx.tenantId) } } } : {}),
          ...parentPayload,
          isBooking: true,
          duration: durationMinutes,
          bookingType: 'RECURRING' as any,
          recurringPattern: normalized as any,
        },
        include: { service: { select: { id: true, name: true, slug: true, category: true } } },
      })

      const childrenCreated: any[] = []
      const skipped: any[] = []
      for (const item of plan.plan) {
        if (item.conflict) { skipped.push(item); continue }
        const childPayload: any = {
          title: `${titleToUse} — ${item.start.toISOString().slice(0,10)}`,
          description: (data as any).description ?? null,
          priority: (data as any).priority as any,
          budgetMin: (data as any).budgetMin != null ? (data as any).budgetMin : null,
          budgetMax: (data as any).budgetMax != null ? (data as any).budgetMax : null,
          requirements: ((data as any).requirements as any) ?? undefined,
          attachments: ((data as any).attachments as any) ?? undefined,
          status: 'SUBMITTED',
          isBooking: true,
          scheduledAt: item.start,
          duration: durationMinutes,
          bookingType: 'RECURRING' as any,
          parentBookingId: parent.id,
          tenantId: ctx.tenantId,
        }

        const child = await prisma.serviceRequest.create({
          data: {
            client: { connect: { id: String(ctx.userId ?? '') } },
            service: { connect: { id: (data as any).serviceId } },
            ...childPayload,
          },
          include: { service: { select: { id: true, name: true, slug: true, category: true } } },
        })
        childrenCreated.push(child)
      }

      try { realtimeService.broadcastToUser(String(ctx.userId), { type: 'service-request-updated', data: { serviceRequestId: parent.id, action: 'created' }, timestamp: new Date().toISOString() }) } catch {}
      try {
        const dates = new Set<string>()
        try { dates.add(new Date((parent as any).scheduledAt).toISOString().slice(0,10)) } catch {}
        for (const item of plan.plan) {
          if (!item.conflict && item.start) {
            try { dates.add(new Date(item.start).toISOString().slice(0,10)) } catch {}
          }
        }
        for (const d of Array.from(dates)) {
          try { realtimeService.emitAvailabilityUpdate(parent.serviceId, { date: d }) } catch {}
        }
      } catch {}
      return respond.created({ parent, childrenCreated, skipped })
    }

    const finalPayload = { ...dataObj }
    delete (finalPayload as any).clientId
    delete (finalPayload as any).serviceId

    const created = await prisma.serviceRequest.create({
      data: {
        client: { connect: { id: String(ctx.userId ?? '') } },
        service: { connect: { id: (data as any).serviceId } },
        ...finalPayload,
      },
      include: {
        service: { select: { id: true, name: true, slug: true, category: true } },
      },
    })

    try { if (typeof idemKey === 'string' && idemKey) { const { finalizeIdempotencyKey } = await import('@/lib/idempotency'); await finalizeIdempotencyKey(idemKey, 'ServiceRequest', created.id, String(ctx.tenantId)) } } catch {}
    try { realtimeService.broadcastToUser(String(ctx.userId), { type: 'service-request-updated', data: { serviceRequestId: created.id, action: 'created' }, timestamp: new Date().toISOString() }) } catch {}

    // Auto-assign if team autoAssign is enabled (prefer team-based autoAssign flag)
    try {
      const autoCount = await prisma.teamMember.count({ where: { autoAssign: true, isAvailable: true } }).catch(() => 0)
      if (autoCount > 0) {
        try {
          const { autoAssignServiceRequest } = await import('@/lib/service-requests/assignment')
          await autoAssignServiceRequest(created.id).catch(() => null)
        } catch {}
      }
    } catch {}

    try {
      if ((created as any)?.isBooking && (created as any)?.scheduledAt) {
        const d = new Date((created as any).scheduledAt).toISOString().slice(0,10)
        try { realtimeService.emitAvailabilityUpdate(created.serviceId, { date: d }) } catch {}
      }
    } catch {}

    // Persist attachments as Attachment records if provided
    try {
      if (Array.isArray((data as any).attachments) && (data as any).attachments.length > 0) {
        const { default: prismaClient } = await import('@/lib/prisma')
        const toCreate = (data as any).attachments.map((a: any) => ({
          key: a.key || undefined,
          url: a.url || undefined,
          name: a.name || undefined,
          size: typeof a.size === 'number' ? a.size : undefined,
          contentType: a.type || undefined,
          provider: process.env.UPLOADS_PROVIDER || undefined,
          serviceRequestId: created.id,
          avStatus: a.uploadError ? 'error' : (a.avStatus || undefined),
          avDetails: a.avDetails || undefined,
          avScanAt: a.avScanAt ? new Date(a.avScanAt) : undefined,
          avThreatName: a.avThreatName || undefined,
          avScanTime: typeof a.avScanTime === 'number' ? a.avScanTime : undefined,
          tenantId: ctx.tenantId,
        }))
        // Bulk create, ignoring duplicates via try/catch per item
        for (const item of toCreate) {
          try { await prismaClient.attachment.create({ data: item }) } catch {}
        }
      }
    } catch (e) {
      try { const { captureError } = await import('@/lib/observability'); await captureError(e, { tags: { route: 'portal:create:attachments' } }) } catch {}
    }

    try { await logAudit({ action: 'service-request:create', actorId: ctx.userId ?? null, targetId: created.id, details: { clientId: created.clientId, serviceId: created.serviceId, priority: created.priority, serviceSnapshot: (created.requirements as any)?.serviceSnapshot ?? null } }) } catch {}
    return respond.created(created)
  } catch (e: any) {
    try { const { captureError } = await import('@/lib/observability'); await captureError(e, { tags: { route: 'portal:service-requests:POST:create' } }) } catch {}
    if (String(e?.code || '').startsWith('P20')) {
      // Fallback: store in-memory for dev
      try {
        const { addRequest } = await import('@/lib/dev-fallbacks')
        const id = `dev-${Date.now().toString()}`
        const genTitle = (data as any).title || `${svc?.name || (data as any).serviceId} request — ${ctx.userId} — ${new Date().toISOString().slice(0,10)}`
        const created: any = {
          id,
          clientId: ctx.userId,
          serviceId: (data as any).serviceId,
          title: genTitle,
          description: (data as any).description ?? null,
          priority: (data as any).priority,
          budgetMin: (data as any).budgetMin ?? null,
          budgetMax: (data as any).budgetMax ?? null,
          deadline: (data as any).deadline ? new Date((data as any).deadline).toISOString() : null,
          requirements: (data as any).requirements ?? undefined,
          attachments: (data as any).attachments ?? undefined,
          status: 'SUBMITTED',
          service: svc ? { id: svc.id, name: svc.name, slug: svc.slug, category: svc.category } : null,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          tenantId: ctx.tenantId,
        }
        if ('isBooking' in (data as any) && (data as any).isBooking) {
          created.isBooking = true
          created.scheduledAt = new Date((data as any).scheduledAt).toISOString()
          created.duration = (data as any).duration ?? null
          created.bookingType = (data as any).bookingType ?? null
        }
        addRequest(id, created)
        try { realtimeService.broadcastToUser(String(ctx.userId), { type: 'service-request-updated', data: { serviceRequestId: id, action: 'created' }, timestamp: new Date().toISOString() }) } catch {}
        try {
          if ((created as any)?.isBooking && (created as any)?.scheduledAt) {
            const d = new Date((created as any).scheduledAt).toISOString().slice(0,10)
            try { realtimeService.emitAvailabilityUpdate((created as any).serviceId, { date: d }) } catch {}
          }
        } catch {}
        return respond.created(created)
      } catch {
        return respond.serverError()
      }
    }
    throw e
  }
})

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: { Allow: 'GET,POST,OPTIONS' } })
}
