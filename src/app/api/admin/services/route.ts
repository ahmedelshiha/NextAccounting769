import { NextRequest, NextResponse } from 'next/server'
import * as Sentry from '@sentry/nextjs'
import { ServicesService } from '@/services/services.service'
import { PERMISSIONS, hasPermission } from '@/lib/permissions'
import { ServiceFiltersSchema, ServiceSchema } from '@/schemas/services'
import { applyRateLimit, getClientIp } from '@/lib/rate-limit'
import { logAudit } from '@/lib/audit'
import { createHash } from 'crypto'
import { makeErrorBody, mapPrismaError, mapZodError, isApiError } from '@/lib/api/error-responses'
import { withCache, handleCacheInvalidation } from '@/lib/api-cache'
import { withTenantContext } from '@/lib/api-wrapper'
import { requireTenantContext } from '@/lib/tenant-utils'
import prisma from '@/lib/prisma'

const svc = new ServicesService()

// Create cached handler for services data
const getCachedServices = withCache<any>(
  {
    key: 'admin-services',
    ttl: 300, // 5 minutes
    staleWhileRevalidate: 600, // 10 minutes stale
    tenantAware: true,
  },
  async (request: NextRequest): Promise<any> => {
    const sp = new URL(request.url).searchParams
    const filters = ServiceFiltersSchema.parse({
      search: sp.get('search') || undefined,
      category: sp.get('category') || 'all',
      featured: (sp.get('featured') as any) || 'all',
      status: (sp.get('status') as any) || 'all',
      limit: sp.get('limit') ? Number(sp.get('limit')) : 20,
      offset: sp.get('offset') ? Number(sp.get('offset')) : 0,
      sortBy: (sp.get('sortBy') as any) || 'updatedAt',
      sortOrder: (sp.get('sortOrder') as any) || 'desc',
    })

    // Resolve tenant from context (middleware/wrapper sets it)
    const ctx = requireTenantContext()
    const tenantId = ctx.tenantId

    return svc.getServicesList(tenantId, filters as any)
  }
)

export const GET = withTenantContext(async (request: NextRequest) => {
  try {
    const ip = getClientIp(request as any)
    {
      const key = `services-list:${ip}`
      const rl = await applyRateLimit(key, 100, 60_000)
      if (rl && rl.allowed === false) {
        try { const { logAudit } = await import('@/lib/audit'); await logAudit({ action: 'security.ratelimit.block', details: { ip, key, route: new URL(request.url).pathname } }) } catch {}
        return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 })
      }
    }

    const ctx = requireTenantContext()
    if (!ctx || !hasPermission(ctx.role, PERMISSIONS.SERVICES_VIEW)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    // Use cached handler for data retrieval
    const cachedRes = await getCachedServices(request)
    try {
      // Attempt to unwrap the wrapper produced by withCache which returns { data, cached, ... }
      const body = await cachedRes.json()
      if (body && body.data) {
        const out = body.data
        const etag = '"' + createHash('md5').update(JSON.stringify(out)).digest('hex') + '"'
        const clientETag = request.headers.get('if-none-match')
        if (clientETag && clientETag === etag) {
          return new NextResponse(null, { status: 304, headers: { ETag: etag } })
        }
        const resp = NextResponse.json(out, { status: cachedRes.status })
        try { resp.headers.set('X-Total-Count', String((Array.isArray(out) ? out.length : (out.total ?? 0)))) } catch {}
        try { resp.headers.set('ETag', etag); resp.headers.set('Cache-Control', 'private, max-age=60') } catch {}
        return resp
      }
    } catch (err) {
      // If unwrapping fails, fall back to returning the cached response directly
      return cachedRes
    }
    return cachedRes
  } catch (e: any) {
    const prismaMapped = mapPrismaError(e)
    if (prismaMapped) return NextResponse.json(makeErrorBody(prismaMapped), { status: prismaMapped.status })
    if (e?.name === 'ZodError') {
      const apiErr = mapZodError(e)
      return NextResponse.json(makeErrorBody(apiErr), { status: apiErr.status })
    }
    if (isApiError(e)) return NextResponse.json(makeErrorBody(e), { status: e.status })
    Sentry.captureException(e)
    console.error('services GET error', e)
    return NextResponse.json(makeErrorBody(e), { status: 500 })
  }
})

export const HEAD = withTenantContext(async (request: NextRequest) => {
  try {
    const ctx = requireTenantContext()
    if (!ctx || !hasPermission(ctx.role, PERMISSIONS.SERVICES_VIEW)) return new NextResponse(null, { status: 403 })
    return new NextResponse(null, { status: 200, headers: { 'Cache-Control': 'private, max-age=60' } })
  } catch (e: any) {
    const prismaMapped = mapPrismaError(e)
    if (prismaMapped) return NextResponse.json(makeErrorBody(prismaMapped), { status: prismaMapped.status })
    if (isApiError(e)) return NextResponse.json(makeErrorBody(e), { status: e.status })
    Sentry.captureException(e)
    console.error('services HEAD error', e)
    return new NextResponse(null, { status: 500 })
  }
})

export const POST = withTenantContext(async (request: NextRequest) => {
  try {
    const ip = getClientIp(request as any)
    {
      const key = `services-create:${ip}`
      const rl = await applyRateLimit(key, 10, 60_000)
      if (rl && rl.allowed === false) {
        try { const { logAudit } = await import('@/lib/audit'); await logAudit({ action: 'security.ratelimit.block', details: { ip, key, route: new URL(request.url).pathname } }) } catch {}
        return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 })
      }
    }

    const ctx = requireTenantContext()
    if (!ctx || !hasPermission(ctx.role, PERMISSIONS.SERVICES_CREATE)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const body = await request.json()
    const validated = ServiceSchema.parse(body)

    // If attempting to set 'featured' without permission, block
    if (Object.prototype.hasOwnProperty.call(validated, 'featured') && !!validated.featured) {
      if (!hasPermission(ctx.role, PERMISSIONS.SERVICES_MANAGE_FEATURED)) {
        return NextResponse.json({ error: 'Forbidden: missing permission to set featured' }, { status: 403 })
      }
    }

    let tenantId = ctx.tenantId
    // If tenantId is missing, it will fail validation in service creation if it's required
    // We trust the context provider to resolve it correctly

    const service = await svc.createService(tenantId ?? null, validated as any, String(ctx.userId ?? ''))

    try { await logAudit({ action: 'SERVICE_CREATED', actorId: ctx.userId ?? null, targetId: service.id, details: { slug: service.slug } }) } catch {}

    // Invalidate related caches
    await handleCacheInvalidation('SERVICE_CHANGED')

    return NextResponse.json({ service }, { status: 201 })
  } catch (e: any) {
    const prismaMapped = mapPrismaError(e)
    if (prismaMapped) return NextResponse.json(makeErrorBody(prismaMapped), { status: prismaMapped.status })
    if (e?.name === 'ZodError') {
      const apiErr = mapZodError(e)
      return NextResponse.json(makeErrorBody(apiErr), { status: apiErr.status })
    }
    if (isApiError(e)) return NextResponse.json(makeErrorBody(e), { status: e.status })
    Sentry.captureException(e)
    console.error('services POST error', e)
    return NextResponse.json(makeErrorBody(e), { status: 500 })
  }
})
