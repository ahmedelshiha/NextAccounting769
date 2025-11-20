import { NextRequest, NextResponse } from 'next/server'
import { ServicesService } from '@/services/services.service'
import { PERMISSIONS, hasPermission } from '@/lib/permissions'
import { ServiceFiltersSchema, ServiceSchema } from '@/schemas/services'
import { withTenantContext } from '@/lib/api-wrapper'
import { requireTenantContext } from '@/lib/tenant-utils'
import { applyRateLimit, getClientIp } from '@/lib/rate-limit'
import { logAudit } from '@/lib/audit'
import { withCache } from '@/lib/api-cache'
import { respond } from '@/lib/api-response'
import { logger } from '@/lib/logger'

const svc = new ServicesService()

/**
 * Filter service fields based on user role
 * Admin sees all fields, Portal users see limited fields
 */
function filterServiceFields(service: any, userRole: string) {
  if (userRole === 'ADMIN' || userRole === 'TEAM_LEAD' || userRole === 'TEAM_MEMBER') {
    return service
  }

  // Portal user - exclude admin-only fields
  const { 
    basePrice,
    advanceBookingDays,
    minAdvanceHours,
    maxDailyBookings,
    bufferTime,
    businessHours,
    blackoutDates,
    costPerUnit,
    profitMargin,
    internalNotes,
    ...portalFields 
  } = service

  return portalFields
}

/**
 * Create cached handler for services list
 */
const getCachedServices = withCache<any>(
  {
    key: 'services-list',
    ttl: 300,
    staleWhileRevalidate: 600,
    tenantAware: true,
  },
  async (request: NextRequest, ctx: any): Promise<any> => {
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

    const tenantId = ctx.tenantId
    const userRole = ctx.role

    // For portal users, only show active services
    if (userRole !== 'ADMIN' && userRole !== 'TEAM_LEAD' && userRole !== 'TEAM_MEMBER') {
      filters.status = 'ACTIVE'
    }

    const result = await svc.getServicesList(tenantId, filters as any)

    // Filter fields based on role
    if (Array.isArray(result?.data)) {
      result.data = result.data.map((s: any) => filterServiceFields(s, userRole))
    }

    return result
  }
)

/**
 * GET /api/services
 * List services with optional filters
 * - Portal users: see only active services, limited fields
 * - Admin users: see all services, all fields
 * - Unauthenticated: see public active services
 */
export const GET = withTenantContext(
  async (request: NextRequest) => {
    try {
      // Rate limiting
      const ip = getClientIp(request as any)
      const rl = await applyRateLimit(`services-list:${ip}`, 100, 60_000)
      if (rl && !rl.allowed) {
        await logAudit({
          action: 'security.ratelimit.block',
          details: { ip, key: `services-list:${ip}`, route: new URL(request.url).pathname },
        }).catch(() => {}) // Don't fail if audit logging fails
        return respond.tooMany('Rate limit exceeded')
      }

      let ctx: any = null
      try {
        ctx = requireTenantContext()
      } catch {
        // Service catalog can be viewed without authentication
        ctx = { tenantId: null, userId: null, role: 'PUBLIC' }
      }

      // Check permission for admin operations
      if (ctx.role === 'ADMIN' || ctx.role === 'TEAM_LEAD' || ctx.role === 'TEAM_MEMBER') {
        if (!hasPermission(ctx.role, PERMISSIONS.SERVICES_VIEW)) {
          return respond.forbidden('You do not have permission to view services')
        }
      }

      // Get cached services
      const result = await getCachedServices(request, ctx)

      if (!result || !result.data) {
        return respond.ok(
          [],
          { pagination: { total: 0, limit: 20, offset: 0, hasMore: false } }
        )
      }

      return respond.ok(result.data, { pagination: result.pagination || {} })
    } catch (error) {
      logger.error('Failed to fetch services', { error })
      if (error instanceof Error && error.message.includes('Zod')) {
        return respond.badRequest('Invalid query parameters')
      }
      return respond.serverError('Failed to fetch services')
    }
  },
  { requireAuth: false }
)

/**
 * POST /api/services
 * Create a new service (Admin only)
 */
export const POST = withTenantContext(
  async (request: NextRequest) => {
    try {
      const ctx = requireTenantContext()

      // Check admin permission
      if (!hasPermission(ctx.role, PERMISSIONS.SERVICES_CREATE)) {
        return respond.forbidden('You do not have permission to create services')
      }

      // Rate limiting for creation
      const rl = await applyRateLimit(`services-create:${ctx.userId}`, 10, 3600_000)
      if (rl && !rl.allowed) {
        return respond.tooMany('Too many service creation attempts')
      }

      let body = await request.json()

      // Validate request
      const validatedData = ServiceSchema.parse(body)

      // Create service
      const service = await svc.createService(ctx.tenantId, validatedData as any)

      // Log audit
      await logAudit({
        action: 'service.created',
        actorId: ctx.userId,
        targetId: service.id,
        details: { name: service.name, slug: service.slug },
      })

      return respond.created(service)
    } catch (error) {
      logger.error('Failed to create service', { error })

      if (error instanceof Error) {
        if (error.message.includes('Zod') || error.message.includes('validation')) {
          return respond.badRequest('Invalid service data')
        }
        if (error.message.includes('already exists') || error.message.includes('unique')) {
          return respond.badRequest('Service with this slug already exists')
        }
      }

      return respond.serverError('Failed to create service')
    }
  },
  { requireAuth: true }
)
