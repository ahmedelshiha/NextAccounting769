import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { withTenantContext } from '@/lib/api-wrapper'
import { requireTenantContext, getTenantFilter } from '@/lib/tenant-utils'
import { applyRateLimit, getClientIp } from '@/lib/rate-limit'
import { logAudit } from '@/lib/audit'

export const runtime = 'nodejs'
import { toCsvCell, streamCsv } from '@/lib/csv-export'
import type { Prisma } from '@prisma/client'
type ServiceRequestWithService = Prisma.ServiceRequestGetPayload<{ include: { service: { select: { name: true } } } }>

function toCsvValue(v: unknown): string {
  const s = v == null ? '' : String(v)
  return '"' + s.replace(/"/g, '""') + '"'
}

export const GET = withTenantContext(async (req: NextRequest) => {
  const ctx = requireTenantContext()

  if (!ctx.userId) {
    return new NextResponse('Unauthorized', { status: 401 })
  }

  const userId = String(ctx.userId)

  const ip = getClientIp(req as any)
  const key = `portal:service-requests:export:${ip}`
  let exportLimit: any = { allowed: true }
  // Skip distributed rate limiting in test environments (Vitest or NODE_ENV=test)
  if (!(process.env.NODE_ENV === 'test' || process.env.VITEST === 'true')) {
    exportLimit = await applyRateLimit(key, 3, 60_000)
  }

  if (!exportLimit || !exportLimit.allowed) {
    try { await logAudit({ action: 'security.ratelimit.block', details: { tenantId: ctx.tenantId ?? null, ip, key, route: new URL(req.url).pathname } }) } catch {}
    return new NextResponse('Too many requests', { status: 429 })
  }

  const { searchParams } = new URL(req.url)
  const status = searchParams.get('status') || undefined
  const priority = searchParams.get('priority') || undefined
  const q = searchParams.get('q')?.trim() || undefined
  const type = searchParams.get('type') || undefined
  const bookingType = searchParams.get('bookingType') || undefined
  const dateFrom = searchParams.get('dateFrom') || undefined
  const dateTo = searchParams.get('dateTo') || undefined
  const stream = (searchParams.get('stream') || '').toLowerCase() === 'true' || searchParams.get('stream') === '1'

  const where: any = {
    clientId: userId,
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
    ...getTenantFilter('tenantId'),
  }

  if (stream) {
    const header = ['id','title','service','priority','status','createdAt','scheduledAt','bookingType']
    const pageSize = 500
    const body = streamCsv({
      header,
      async writeRows(write) {
        let cursor: string | null = null
        for (;;) {
          const batch: ServiceRequestWithService[] = await prisma.serviceRequest.findMany({
            where,
            include: { service: { select: { name: true } } },
            orderBy: type === 'appointments' ? { scheduledAt: 'desc' } : { createdAt: 'desc' },
            take: pageSize,
            ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
          })
          if (!batch.length) break
          for (const r of batch) {
            const row = [
              r.id,
              r.title,
              r.service?.name || '',
              r.priority,
              r.status,
              r.createdAt?.toISOString?.() || (r as any).createdAt,
              (r as any).scheduledAt?.toISOString?.() || (r as any).scheduledAt || '',
              (r as any).bookingType || '',
            ]
            write(row.map(toCsvCell).join(','))
          }
          cursor = batch[batch.length - 1]?.id ?? null
          if (!cursor) break
        }
      },
    })
    return new NextResponse(body as any, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="service-requests-${new Date().toISOString().slice(0,10)}.csv"`,
        'Cache-Control': 'no-store',
        'Transfer-Encoding': 'chunked',
      },
    })
  }

  try {
    const items = await prisma.serviceRequest.findMany({
      where,
      include: { service: { select: { name: true } } },
      orderBy: type === 'appointments' ? { scheduledAt: 'desc' } : { createdAt: 'desc' },
      take: 5000,
    })

    const header = ['id','title','service','priority','status','createdAt','scheduledAt','bookingType']
    const rows = items.map((r: any) => [
      r.id,
      r.title,
      r.service?.name || '',
      r.priority,
      r.status,
      r.createdAt?.toISOString?.() || r.createdAt,
      r.scheduledAt?.toISOString?.() || r.scheduledAt || '',
      r.bookingType || '',
    ])

    const csv = [header.map(toCsvValue).join(','), ...rows.map((row) => row.map(toCsvValue).join(','))].join('\n')
    return new NextResponse(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="service-requests-${new Date().toISOString().slice(0,10)}.csv"`,
        'Cache-Control': 'no-store',
      },
    })
  } catch (e: any) {
    if (String(e?.code || '').startsWith('P20')) {
      try {
        const { getAllRequests } = await import('@/lib/dev-fallbacks')
        let all = getAllRequests()

        const resolvedUserId = userId
        const resolvedTenantId = ctx.tenantId

        all = all.filter((r: any) => r.clientId === resolvedUserId && r.tenantId === resolvedTenantId)
        if (type === 'appointments') all = all.filter((r: any) => !!((r as any).scheduledAt || r.deadline))
        if (status) all = all.filter((r: any) => String(r.status) === String(status))
        if (priority) all = all.filter((r: any) => String(r.priority) === String(priority))
        if (bookingType) all = all.filter((r: any) => String((r as any).bookingType || '') === String(bookingType))
        if (q) {
          const qq = String(q).toLowerCase()
          all = all.filter((r: any) => String(r.title || '').toLowerCase().includes(qq) || String(r.description || '').toLowerCase().includes(qq))
        }
        if (dateFrom) {
          const from = new Date(dateFrom).getTime()
          all = all.filter((r: any) => new Date((r as any).scheduledAt || r.createdAt || 0).getTime() >= from)
        }
        if (dateTo) {
          const to = new Date(new Date(dateTo).setHours(23,59,59,999)).getTime()
          all = all.filter((r: any) => new Date((r as any).scheduledAt || r.createdAt || 0).getTime() <= to)
        }
        const header = ['id','title','service','priority','status','createdAt','scheduledAt','bookingType']
        const rows = all.map((r: any) => [
          r.id,
          r.title,
          r.service?.name || '',
          r.priority,
          r.status,
          r.createdAt,
          (r as any).scheduledAt || '',
          (r as any).bookingType || '',
        ])
        const csv = [header.map(toCsvValue).join(','), ...rows.map((row) => row.map(toCsvValue).join(','))].join('\n')
        return new NextResponse(csv, {
          status: 200,
          headers: {
            'Content-Type': 'text/csv; charset=utf-8',
            'Content-Disposition': `attachment; filename="service-requests-${new Date().toISOString().slice(0,10)}.csv"`,
            'Cache-Control': 'no-store',
          },
        })
      } catch {}
    }
    throw e
  }
})
