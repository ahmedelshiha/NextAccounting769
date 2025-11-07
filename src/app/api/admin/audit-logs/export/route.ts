import { NextRequest, NextResponse } from 'next/server'
import { withTenantContext } from '@/lib/api-wrapper'
import { requireTenantContext } from '@/lib/tenant-utils'
import { AuditLogService } from '@/services/audit-log.service'
import RateLimiter, { RATE_LIMITS } from '@/lib/security/rate-limit'
import { getClientIp } from '@/lib/rate-limit'

export const POST = withTenantContext(async (request: NextRequest) => {
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

    // Rate limiting: Max 5 exports per minute per user
    const clientIp = getClientIp(request as unknown as Request)
    const rateLimitKey = `export:${tenantId}:${userId}`
    const { allowed, remaining, resetTime } = RateLimiter.checkLimit(
      rateLimitKey,
      RATE_LIMITS.EXPORT.limit,
      RATE_LIMITS.EXPORT.windowMs
    )

    if (!allowed) {
      const resetDate = new Date(resetTime)
      return NextResponse.json(
        {
          error: 'Export rate limit exceeded',
          message: `Too many exports. Try again at ${resetDate.toISOString()}`,
          retryAfter: Math.ceil((resetTime - Date.now()) / 1000)
        },
        {
          status: 429,
          headers: {
            'Retry-After': String(Math.ceil((resetTime - Date.now()) / 1000))
          }
        }
      )
    }

    // Parse and validate request body
    const body = await request.json()
    const filters = body.filters || {}

    // Build filters for export
    const exportFilters = {
      tenantId,
      ...filters
    }

    // Export as CSV
    const csv = await AuditLogService.exportAuditLogs(exportFilters)

    // Return as downloadable file
    return new NextResponse(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="audit-logs-${new Date().toISOString().split('T')[0]}.csv"`,
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'X-RateLimit-Remaining': String(remaining),
        'X-RateLimit-Reset': String(Math.ceil(resetTime / 1000))
      }
    })
  } catch (error) {
    console.error('Error exporting audit logs:', error)
    return NextResponse.json(
      { error: 'Failed to export audit logs' },
      { status: 500 }
    )
  }
})
