import { NextRequest, NextResponse } from 'next/server'
import { withTenantContext } from '@/lib/api-wrapper'
import { requireTenantContext } from '@/lib/tenant-utils'
import { AuditLogService } from '@/services/audit-log.service'
import RateLimiter, { RATE_LIMITS } from '@/lib/security/rate-limit'
import { getClientIp } from '@/lib/rate-limit'

export const GET = withTenantContext(async (request: NextRequest) => {
  try {
    const ctx = requireTenantContext()
    
    if (!ctx.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const tenantId = ctx.tenantId
    const userId = ctx.userId

    if (!tenantId) {
      return NextResponse.json({ error: 'Tenant ID not found' }, { status: 400 })
    }

    // Rate limiting: Standard limit
    const clientIp = getClientIp(request as unknown as Request)
    const rateLimitKey = `audit-logs:${tenantId}:${userId}`
    const { allowed, remaining, resetTime } = RateLimiter.checkLimit(
      rateLimitKey,
      RATE_LIMITS.STANDARD.limit,
      RATE_LIMITS.STANDARD.windowMs
    )

    if (!allowed) {
      return NextResponse.json(
        { error: 'Rate limit exceeded', retryAfter: Math.ceil((resetTime - Date.now()) / 1000) },
        {
          status: 429,
          headers: {
            'Retry-After': String(Math.ceil((resetTime - Date.now()) / 1000))
          }
        }
      )
    }

    // Parse query parameters with validation
    const searchParams = request.nextUrl.searchParams
    const action = searchParams.get('action') || undefined
    const filterUserId = searchParams.get('userId') || undefined
    const resource = searchParams.get('resource') || undefined
    const search = searchParams.get('search') || undefined
    const startDate = searchParams.get('startDate')
      ? new Date(searchParams.get('startDate')!)
      : undefined
    const endDate = searchParams.get('endDate')
      ? new Date(searchParams.get('endDate')!)
      : undefined
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 1000)
    const offset = parseInt(searchParams.get('offset') || '0')

    // Validate offset to prevent resource exhaustion
    if (offset < 0 || offset > 1000000) {
      return NextResponse.json({ error: 'Invalid offset parameter' }, { status: 400 })
    }
    if (limit < 1 || limit > 1000) {
      return NextResponse.json({ error: 'Invalid limit parameter' }, { status: 400 })
    }

    const result = await AuditLogService.fetchAuditLogs({
      tenantId,
      action,
      userId: filterUserId,
      resource,
      startDate,
      endDate,
      search,
      limit,
      offset
    })

    // Add caching headers for responses
    const response = NextResponse.json(result)

    // Cache GET requests for 5 minutes (immutable data)
    if (request.method === 'GET' && !search) {
      response.headers.set('Cache-Control', 'private, max-age=300')
      response.headers.set('CDN-Cache-Control', 'max-age=300, stale-while-revalidate=600')
    } else {
      // Don't cache search results or mutations
      response.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate')
    }

    // Add security headers
    response.headers.set('X-Content-Type-Options', 'nosniff')
    response.headers.set('X-Frame-Options', 'DENY')
    response.headers.set('X-RateLimit-Remaining', String(remaining))
    response.headers.set('X-RateLimit-Reset', String(Math.ceil(resetTime / 1000)))

    return response
  } catch (error) {
    console.error('Error fetching audit logs:', error)
    return NextResponse.json(
      { error: 'Failed to fetch audit logs' },
      { status: 500 }
    )
  }
})
