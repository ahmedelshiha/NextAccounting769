import { NextResponse } from 'next/server'
export const runtime = 'nodejs'
import prisma from '@/lib/prisma'
import { z } from 'zod'
import { getClientIp, applyRateLimit } from '@/lib/rate-limit'
import { logAudit } from '@/lib/audit'
import { hasPermission, PERMISSIONS } from '@/lib/permissions'
import { realtimeService } from '@/lib/realtime-enhanced'
import { respond, zodDetails } from '@/lib/api-response'
import { isMultiTenancyEnabled } from '@/lib/tenant'
import { planRecurringBookings } from '@/lib/booking/recurring'
import { parseListQuery } from '@/schemas/list-query'
import { withTenantContext } from '@/lib/api-wrapper'
import { requireTenantContext, getTenantFilter } from '@/lib/tenant-utils'

const CreateBase = z.object({
  clientId: z.string().min(1),
  serviceId: z.string().min(1),
  title: z.string().min(1).max(300).optional(),
  description: z.string().optional(),
  priority: z.union([
    z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']),
    z.enum(['low', 'medium', 'high', 'urgent']).transform((v) => v.toUpperCase() as 'LOW'|'MEDIUM'|'HIGH'|'URGENT'),
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
  assignedTeamMemberId: z.string().optional(),
})

const CreateRequestSchema = CreateBase.extend({
  isBooking: z.literal(false).optional(),
  deadline: z.string().datetime().optional(),
})

const CreateBookingSchema = CreateBase.extend({
  isBooking: z.literal(true),
  scheduledAt: z.string().datetime(),
  duration: z.number().int().positive().optional(),
  clientName: z.string().optional(),
  clientEmail: z.string().email().optional(),
  clientPhone: z.string().optional(),
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

type Filters = {
  page: number
  limit: number
  status?: string | null
  priority?: string | null
  assignedTo?: string | null
  clientId?: string | null
  serviceId?: string | null
  q?: string | null
  dateFrom?: string | null
  dateTo?: string | null
  bookingType?: string | null
  paymentStatus?: 'UNPAID'|'INTENT'|'PAID'|'FAILED'|'REFUNDED' | null
}

export const GET = withTenantContext(async (request: Request) => {
  const ctx = requireTenantContext()
  const role = ctx.role as string | undefined
  if (!hasPermission(role, PERMISSIONS.SERVICE_REQUESTS_READ_ALL)) {
    return respond.unauthorized()
  }

  const { searchParams } = new URL(request.url)
  const type = (searchParams.get('type') || '').toLowerCase()
  const allowed = type === 'appointments' ? ['scheduledAt','createdAt','priority','status'] : ['createdAt','priority','status','scheduledAt']
  const defaults = type === 'appointments' ? 'scheduledAt' : 'createdAt'
  const common = parseListQuery(searchParams, { allowedSortBy: allowed, defaultSortBy: defaults, maxLimit: 100 })

  const filters: Filters = {
    page: common.page,
    limit: common.limit,
    status: searchParams.get('status'),
    priority: searchParams.get('priority'),
    assignedTo: searchParams.get('assignedTo'),
    clientId: searchParams.get('clientId'),
    serviceId: searchParams.get('serviceId'),
    q: common.q || null,
    dateFrom: searchParams.get('dateFrom'),
    dateTo: searchParams.get('dateTo'),
    bookingType: searchParams.get('bookingType'),
    paymentStatus: (searchParams.get('paymentStatus') as any) || null,
  }

  const skip = common.skip
  const sortBy = common.sortBy
  const sortOrderParam = common.sortOrder
  const sortByLegacy = (['createdAt','priority','status','deadline'].includes(sortBy) ? sortBy : 'createdAt')

  const tenantId = ctx.tenantId
  const where: any = {
    ...(filters.status && { status: filters.status }),
    ...(filters.priority && { priority: filters.priority }),
    ...(filters.assignedTo && { assignedTeamMemberId: filters.assignedTo }),
    ...(filters.clientId && { clientId: filters.clientId }),
    ...(filters.serviceId && { serviceId: filters.serviceId }),
    ...(filters.q && { OR: [
      { title: { contains: filters.q, mode: 'insensitive' } },
      { description: { contains: filters.q, mode: 'insensitive' } },
    ] }),
    ...(filters.bookingType && { bookingType: filters.bookingType as any }),
    ...(filters.paymentStatus && { paymentStatus: filters.paymentStatus as any }),
    ...(type === 'appointments' ? { isBooking: true } : {}),
    ...(type === 'requests' ? { OR: [{ isBooking: false }, { isBooking: null }] } : {}),
    ...(filters.dateFrom || filters.dateTo ? (
      type === 'appointments'
        ? {
            scheduledAt: {
              ...(filters.dateFrom ? { gte: new Date(filters.dateFrom) } : {}),
              ...(filters.dateTo ? { lte: new Date(new Date(filters.dateTo).setHours(23,59,59,999)) } : {}),
            },
          }
        : {
            createdAt: {
              ...(filters.dateFrom ? { gte: new Date(filters.dateFrom) } : {}),
              ...(filters.dateTo ? { lte: new Date(new Date(filters.dateTo).setHours(23,59,59,999)) } : {}),
            },
          }
    ) : {}),
    ...getTenantFilter(),
  }

  try {
    const [items, total] = await Promise.all([
      prisma.serviceRequest.findMany({
        where,
        include: {
          client: { select: { id: true, name: true, email: true } },
          service: { select: { id: true, name: true, slug: true, category: true } },
          assignedTeamMember: { select: { id: true, name: true, email: true } },
        },
        orderBy: { [sortBy]: sortOrderParam },
        skip,
        take: filters.limit,
      }),
      prisma.serviceRequest.count({ where }),
    ])

    return NextResponse.json({ success: true, data: items, pagination: { page: filters.page, limit: filters.limit, total, totalPages: Math.ceil(total / filters.limit) } }, { headers: { 'X-Total-Count': String(total) } })
  } catch (e: any) {
    const code = String((e as any)?.code || '')
    const msg = String(e?.message || '')

    // Fallback when DB hasn't applied Phase 1 columns yet (scheduledAt/isBooking)
    if (code === 'P2022' || /column .*does not exist/i.test(msg)) {
      const whereLegacy: any = {
        ...(filters.status && { status: filters.status }),
        ...(filters.priority && { priority: filters.priority }),
        ...(filters.assignedTo && { assignedTeamMemberId: filters.assignedTo }),
        ...(filters.clientId && { clientId: filters.clientId }),
        ...(filters.serviceId && { serviceId: filters.serviceId }),
        ...(filters.q && { OR: [
          { title: { contains: filters.q, mode: 'insensitive' } },
          { description: { contains: filters.q, mode: 'insensitive' } },
        ] }),
        ...(type === 'appointments' ? { deadline: { not: null } } : {}),
        ...(type === 'requests' ? { deadline: null } : {}),
        ...(filters.dateFrom || filters.dateTo ? {
          createdAt: {
            ...(filters.dateFrom ? { gte: new Date(filters.dateFrom) } : {}),
            ...(filters.dateTo ? { lte: new Date(new Date(filters.dateTo).setHours(23,59,59,999)) } : {}),
          }
        } : {}),
        ...getTenantFilter(),
      }

      const [items, total] = await Promise.all([
        prisma.serviceRequest.findMany({
          where: whereLegacy,
          include: {
            client: { select: { id: true, name: true, email: true } },
            service: { select: { id: true, name: true, slug: true, category: true } },
            assignedTeamMember: { select: { id: true, name: true, email: true } },
          },
          orderBy: { [sortByLegacy]: sortOrderParam },
          skip,
          take: filters.limit,
        }),
        prisma.serviceRequest.count({ where: whereLegacy }),
      ])

      return NextResponse.json({ success: true, data: items, pagination: { page: filters.page, limit: filters.limit, total, totalPages: Math.ceil(total / filters.limit) } }, { headers: { 'X-Total-Count': String(total) } })
    }

    if (code.startsWith('P10') || /Database is not configured/i.test(msg)) {
      try {
        const { getAllRequests } = await import('@/lib/dev-fallbacks')
        let all: any[] = getAllRequests() as any[]
        if (isMultiTenancyEnabled() && tenantId) {
          all = all.filter((r: any) => String(r.tenantId || '') === String(tenantId))
        }
        // Optional type filter for early UI support: appointments vs requests (fallback only)
        if (type === 'appointments') {
          all = all.filter((r: any) => !!((r as any).scheduledAt || r.deadline))
        } else if (type === 'requests') {
          all = all.filter((r: any) => !((r as any).scheduledAt || r.deadline))
        }
        if (filters.status) all = all.filter((r: any) => String(r.status) === String(filters.status))
        if (filters.priority) all = all.filter((r: any) => String(r.priority) === String(filters.priority))
        if (filters.assignedTo) all = all.filter((r: any) => String((r as any).assignedTeamMemberId || '') === String(filters.assignedTo))
        if (filters.clientId) all = all.filter((r: any) => String(r.clientId) === String(filters.clientId))
        if (filters.serviceId) all = all.filter((r: any) => String(r.serviceId) === String(filters.serviceId))
        if (filters.q) {
          const q = String(filters.q).toLowerCase()
          all = all.filter((r: any) =>
            String(r.title || '').toLowerCase().includes(q) ||
            String(r.description || '').toLowerCase().includes(q)
          )
        }
        if (filters.bookingType) {
          const bt = String(filters.bookingType)
          all = all.filter((r: any) => String((r as any).bookingType || '') === bt)
        }
        if (filters.paymentStatus) {
          const ps = String(filters.paymentStatus)
          all = all.filter((r: any) => String((r as any).paymentStatus || '') === ps)
        }
        if (filters.dateFrom) {
          const from = new Date(filters.dateFrom).getTime()
          all = all.filter((r: any) => {
            const t = new Date(r.deadline || r.createdAt || 0).getTime()
            return t >= from
          })
        }
        if (filters.dateTo) {
          const to = new Date(new Date(filters.dateTo).setHours(23,59,59,999)).getTime()
          all = all.filter((r: any) => {
            const t = new Date(r.deadline || r.createdAt || 0).getTime()
            return t <= to
          })
        }
        all.sort((a: any, b: any) => {
          const ad = new Date(a.createdAt || 0).getTime()
          const bd = new Date(b.createdAt || 0).getTime()
          return bd - ad
        })
        const total = all.length
        const start = (filters.page - 1) * filters.limit
        const end = start + filters.limit
        const pageItems = all.slice(start, end)
        return NextResponse.json({ success: true, data: pageItems, pagination: { page: filters.page, limit: filters.limit, total, totalPages: Math.ceil(total / filters.limit) } }, { headers: { 'X-Total-Count': String(total) } })
      } catch {
        return respond.serverError()
      }
    }
    throw e
  }
})

export const POST = withTenantContext(async (request: Request) => {
  const ctx = requireTenantContext()
  const role = ctx.role as string | undefined
  if (!hasPermission(role, PERMISSIONS.SERVICE_REQUESTS_CREATE)) {
    return respond.unauthorized()
  }

  const tenantId = ctx.tenantId
  if (!tenantId) return respond.badRequest('Tenant context missing')
  const ip = getClientIp(request)
  {
    const key = `service-requests:create:${ip}`
    const rl = await applyRateLimit(key, 10, 60_000)
    if (!rl.allowed) {
      try { await logAudit({ action: 'security.ratelimit.block', actorId: ctx.userId ?? null, details: { tenantId: tenantId, ip, key, route: new URL((request as any).url).pathname } }) } catch {}
      return respond.tooMany()
    }
  }
  const body = await request.json().catch(() => null)
  const parsed = CreateSchema.safeParse(body)
  if (!parsed.success) {
    return respond.badRequest('Invalid payload', zodDetails(parsed.error))
  }

  const data = parsed.data
  // Generate title if missing
  let titleToUse = data.title
  if (!titleToUse) {
    try {
      const svc = await prisma.service.findUnique({ where: { id: data.serviceId } })
      const client = await prisma.user.findUnique({ where: { id: data.clientId } })
      const clientName = client?.name || data.clientId
      const svcName = svc?.name || data.serviceId
      titleToUse = `${svcName} request — ${clientName} — ${new Date().toISOString().slice(0,10)}`
    } catch {
      titleToUse = `${data.serviceId} request — ${data.clientId} — ${new Date().toISOString().slice(0,10)}`
    }
  }

  try {
    // Validate foreign keys only when Prisma models are available; skip in fallback/test environments
    const canValidateFK = typeof (prisma as any)?.user?.findUnique === 'function' && typeof (prisma as any)?.service?.findUnique === 'function'
    if (canValidateFK) {
      const clientExists = await (prisma as any).user.findUnique({ where: { id: (data as any).clientId }, select: { id: true } })
      const serviceExists = await (prisma as any).service.findUnique({ where: { id: (data as any).serviceId }, select: { id: true } })
      if (!clientExists) return respond.badRequest('Invalid clientId')
      if (!serviceExists) return respond.badRequest('Invalid serviceId')
    }

    // For booking-type requests, enforce conflict detection prior to creation
    if ((data as any).isBooking) {
      try {
        const { checkBookingConflict } = await import('@/lib/booking/conflict-detection')
        const duration = (data as any).duration ?? (await prisma.service.findUnique({ where: { id: (data as any).serviceId } }))?.duration ?? 60
        const conflict = await checkBookingConflict({
          serviceId: (data as any).serviceId,
          start: new Date((data as any).scheduledAt),
          durationMinutes: Number(duration),
          excludeBookingId: undefined,
          teamMemberId: (data as any).assignedTeamMemberId || null,
          tenantId: (isMultiTenancyEnabled() && tenantId) ? String(tenantId) : null,
        })
        if (conflict.conflict) {
          return respond.conflict('Scheduling conflict detected', { reason: conflict.details?.reason, conflictingBookingId: conflict.details?.conflictingBookingId })
        }
      } catch {}
    }

    // Recurring series creation: when bookingType is RECURRING and a recurringPattern is provided,
    // create a parent record and non-conflicting child appointments. Conflicts are skipped and logged as comments.
    if ((data as any).isBooking && String((data as any).bookingType) === 'RECURRING' && (data as any).recurringPattern) {
      const svcDuration = (await prisma.service.findUnique({ where: { id: (data as any).serviceId } }))?.duration ?? 60
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
        clientId: (data as any).clientId,
        durationMinutes,
        start: new Date((data as any).scheduledAt),
        pattern: normalized as any,
        tenantId: (isMultiTenancyEnabled() && tenantId) ? String(tenantId) : null,
        teamMemberId: (data as any).assignedTeamMemberId || null,
      })

      // Create parent request capturing the pattern for auditability
      const parent = await prisma.serviceRequest.create({
        data: {
          client: { connect: { id: String((data as any).clientId) } },
          service: { connect: { id: String((data as any).serviceId) } },
          title: titleToUse,
          description: (data as any).description ?? null,
          priority: (data as any).priority as any,
          budgetMin: (data as any).budgetMin != null ? (data as any).budgetMin : null,
          budgetMax: (data as any).budgetMax != null ? (data as any).budgetMax : null,
          requirements: ((data as any).requirements as any) ?? undefined,
          attachments: ((data as any).attachments as any) ?? undefined,
          isBooking: true,
          scheduledAt: new Date((data as any).scheduledAt),
          duration: durationMinutes,
          clientName: (data as any).clientName ?? null,
          clientEmail: (data as any).clientEmail ?? null,
          clientPhone: (data as any).clientPhone ?? null,
          bookingType: 'RECURRING' as any,
          recurringPattern: normalized as any,
          tenant: { connect: { id: String(tenantId) } },
        },
        include: {
          client: { select: { id: true, name: true, email: true } },
          service: { select: { id: true, name: true, slug: true, category: true } },
        },
      })

      const childrenCreated: any[] = []
      const skipped: any[] = []
      for (const item of plan.plan) {
        if (item.conflict) {
          skipped.push(item)
          continue
        }
        const child = await prisma.serviceRequest.create({
          data: {
            client: { connect: { id: String((data as any).clientId) } },
            service: { connect: { id: String((data as any).serviceId) } },
            title: `${titleToUse} — ${item.start.toISOString().slice(0,10)}`,
            description: (data as any).description ?? null,
            priority: (data as any).priority as any,
            budgetMin: (data as any).budgetMin != null ? (data as any).budgetMin : null,
            budgetMax: (data as any).budgetMax != null ? (data as any).budgetMax : null,
            requirements: ((data as any).requirements as any) ?? undefined,
            attachments: ((data as any).attachments as any) ?? undefined,
            isBooking: true,
            scheduledAt: item.start,
            duration: durationMinutes,
            clientName: (data as any).clientName ?? null,
            clientEmail: (data as any).clientEmail ?? null,
            clientPhone: (data as any).clientPhone ?? null,
            bookingType: 'RECURRING' as any,
            parentBooking: { connect: { id: parent.id } },
            tenant: { connect: { id: String(tenantId) } },
          },
        })
        childrenCreated.push(child)
      }

      // Log skipped occurrences as comments on the parent for operational visibility
      try {
        for (const s of skipped) {
          await prisma.serviceRequestComment.create({
            data: {
              serviceRequestId: parent.id,
              authorId: ctx.userId ?? null,
              content: `Recurring occurrence skipped for ${new Date(s.start).toISOString()} due to ${s.reason || 'conflict'}.`,
            },
          })
        }
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err))
        console.error('[SERVICE_REQUESTS_CREATE] Failed to log skipped occurrences:', error)
      }

      try {
        realtimeService.emitServiceRequestUpdate(parent.id, { action: 'created' })
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err))
        console.error('[SERVICE_REQUESTS_CREATE] Failed to emit service request update:', error)
      }

      try {
        const dates = new Set<string>()
        try {
          dates.add(new Date((parent as any).scheduledAt).toISOString().slice(0,10))
        } catch (err) {
          const error = err instanceof Error ? err : new Error(String(err))
          console.error('[SERVICE_REQUESTS_CREATE] Failed to parse parent scheduled date:', error)
        }

        try {
          for (const item of plan.plan) {
            if (!item.conflict && item.start) {
              dates.add(new Date(item.start).toISOString().slice(0,10))
            }
          }
        } catch (err) {
          const error = err instanceof Error ? err : new Error(String(err))
          console.error('[SERVICE_REQUESTS_CREATE] Failed to collect plan dates:', error)
        }

        for (const d of Array.from(dates)) {
          try {
            realtimeService.emitAvailabilityUpdate(parent.serviceId, { date: d })
          } catch (err) {
            const error = err instanceof Error ? err : new Error(String(err))
            console.error('[SERVICE_REQUESTS_CREATE] Failed to emit availability update:', error)
          }
        }
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err))
        console.error('[SERVICE_REQUESTS_CREATE] Failed to emit availability updates:', error)
      }

      try {
        await logAudit({ action: 'service-request:create:recurring', actorId: ctx.userId ?? null, targetId: parent.id, details: { serviceId: parent.serviceId, occurrences: plan.plan.length, created: childrenCreated.length, skipped: skipped.length } })
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err))
        console.error('[SERVICE_REQUESTS_CREATE] Failed to log audit for recurring creation:', error)
      }

      return respond.created({ parent, childrenCreated, skipped })
    }

    const created = await prisma.serviceRequest.create({
      data: {
        client: { connect: { id: String((data as any).clientId) } },
        service: { connect: { id: String((data as any).serviceId) } },
        title: titleToUse,
        description: (data as any).description ?? null,
        priority: (data as any).priority as any,
        budgetMin: (data as any).budgetMin != null ? (data as any).budgetMin : null,
        budgetMax: (data as any).budgetMax != null ? (data as any).budgetMax : null,
        deadline: (data as any).deadline ? new Date((data as any).deadline) : null,
        requirements: ((data as any).requirements as any) ?? undefined,
        attachments: ((data as any).attachments as any) ?? undefined,
        ...('isBooking' in data && (data as any).isBooking ? {
          isBooking: true,
          scheduledAt: new Date((data as any).scheduledAt),
          duration: (data as any).duration ?? null,
          clientName: (data as any).clientName ?? null,
          clientEmail: (data as any).clientEmail ?? null,
          clientPhone: (data as any).clientPhone ?? null,
          bookingType: (data as any).bookingType ?? null,
        } : {}),
        tenant: { connect: { id: String(tenantId) } },
      },
      include: {
        client: { select: { id: true, name: true, email: true } },
        service: { select: { id: true, name: true, slug: true, category: true } },
      },
    })

    // Auto-assign to a team member based on skills and workload
    try {
      const { autoAssignServiceRequest } = await import('@/lib/service-requests/assignment')
      await autoAssignServiceRequest(created.id)
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err))
      console.error('[SERVICE_REQUESTS_CREATE] Failed to auto-assign service request:', error)
    }

    try {
      realtimeService.emitServiceRequestUpdate(created.id, { action: 'created' })
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err))
      console.error('[SERVICE_REQUESTS_CREATE] Failed to emit service request update:', error)
    }

    try {
      realtimeService.broadcastToUser(String(created.clientId), { type: 'service-request-updated', data: { serviceRequestId: created.id, action: 'created' }, timestamp: new Date().toISOString() })
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err))
      console.error('[SERVICE_REQUESTS_CREATE] Failed to broadcast to user:', error)
    }

    try {
      if ((created as any)?.isBooking && (created as any)?.scheduledAt) {
        const d = new Date((created as any).scheduledAt).toISOString().slice(0,10)
        try {
          realtimeService.emitAvailabilityUpdate(created.serviceId, { date: d })
        } catch (err) {
          const error = err instanceof Error ? err : new Error(String(err))
          console.error('[SERVICE_REQUESTS_CREATE] Failed to emit availability update:', error)
        }
      }
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err))
      console.error('[SERVICE_REQUESTS_CREATE] Failed to handle booking availability:', error)
    }

    try {
      await logAudit({ action: 'service-request:create', actorId: ctx.userId ?? null, targetId: created.id, details: { clientId: created.clientId, serviceId: created.serviceId, priority: created.priority, serviceSnapshot: (created.requirements as any)?.serviceSnapshot ?? null } })
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err))
      console.error('[SERVICE_REQUESTS_CREATE] Failed to log audit:', error)
    }

    return respond.created(created)
  } catch (e: any) {
    const msg = String(e?.message || '')
    const code = String((e as any)?.code || '')
    if (code === 'P2003') {
      return respond.badRequest('Invalid clientId or serviceId')
    }
    if (code.startsWith('P10') || /Database is not configured/i.test(msg)) {
      try {
        const { addRequest } = await import('@/lib/dev-fallbacks')
        const id = `dev-${Date.now().toString()}`
        const created: any = {
          id,
          clientId: (data as any).clientId,
          serviceId: (data as any).serviceId,
          title: titleToUse || `${(data as any).serviceId} request — ${(data as any).clientId} — ${new Date().toISOString().slice(0,10)}`,
          description: (data as any).description ?? null,
          priority: (data as any).priority,
          budgetMin: (data as any).budgetMin ?? null,
          budgetMax: (data as any).budgetMax ?? null,
          deadline: (data as any).deadline ? new Date((data as any).deadline).toISOString() : null,
          requirements: (data as any).requirements ?? undefined,
          attachments: (data as any).attachments ?? undefined,
          status: 'DRAFT',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }
        if ('isBooking' in (data as any) && (data as any).isBooking) {
          created.isBooking = true
          created.scheduledAt = new Date((data as any).scheduledAt).toISOString()
          created.duration = (data as any).duration ?? null
          created.clientName = (data as any).clientName ?? null
          created.clientEmail = (data as any).clientEmail ?? null
          created.clientPhone = (data as any).clientPhone ?? null
          created.bookingType = (data as any).bookingType ?? null
        }
        if (isMultiTenancyEnabled() && tenantId) (created as any).tenantId = tenantId
        addRequest(id, created)

        try {
          realtimeService.emitServiceRequestUpdate(id, { action: 'created' })
        } catch (err) {
          const error = err instanceof Error ? err : new Error(String(err))
          console.error('[SERVICE_REQUESTS_CREATE] Failed to emit service request update (fallback):', error)
        }

        try {
          if ((created as any)?.isBooking && (created as any)?.scheduledAt) {
            const d = new Date((created as any).scheduledAt).toISOString().slice(0,10)
            try {
              realtimeService.emitAvailabilityUpdate(created.serviceId, { date: d })
            } catch (err) {
              const error = err instanceof Error ? err : new Error(String(err))
              console.error('[SERVICE_REQUESTS_CREATE] Failed to emit availability update (fallback):', error)
            }
          }
        } catch (err) {
          const error = err instanceof Error ? err : new Error(String(err))
          console.error('[SERVICE_REQUESTS_CREATE] Failed to handle booking availability (fallback):', error)
        }

        try {
          await logAudit({ action: 'service-request:create', actorId: ctx.userId ?? null, targetId: id, details: { clientId: created.clientId, serviceId: created.serviceId, priority: created.priority } })
        } catch (err) {
          const error = err instanceof Error ? err : new Error(String(err))
          console.error('[SERVICE_REQUESTS_CREATE] Failed to log audit (fallback):', error)
        }

        return respond.created(created)
      } catch {
        return respond.serverError()
      }
    }
    return respond.serverError('Failed to create service request', { code, message: msg })
  }
})
