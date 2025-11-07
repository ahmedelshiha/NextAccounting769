import { NextRequest, NextResponse } from 'next/server'
import { withTenantContext } from '@/lib/api-wrapper'
import { requireTenantContext } from '@/lib/tenant-utils'
import { AuditLogService } from '@/services/audit-log.service'

export const GET = withTenantContext(async (request: NextRequest) => {
  try {
    const ctx = requireTenantContext()
    
    if (!ctx.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const tenantId = ctx.tenantId

    if (!tenantId) {
      return NextResponse.json({ error: 'Tenant ID not found' }, { status: 400 })
    }

    const searchParams = request.nextUrl.searchParams
    const type = searchParams.get('type') || 'actions'
    const days = parseInt(searchParams.get('days') || '30')

    let result: any
    if (type === 'actions') {
      const actions = await AuditLogService.getDistinctActions(tenantId)
      result = { actions }
    } else if (type === 'stats') {
      const stats = await AuditLogService.getAuditStats(tenantId, days)
      result = stats
    } else {
      return NextResponse.json({ error: 'Invalid type parameter' }, { status: 400 })
    }

    const response = NextResponse.json(result)

    // Aggressive caching for metadata (30 minutes) - doesn't change frequently
    response.headers.set('Cache-Control', 'private, max-age=1800, stale-while-revalidate=3600')
    response.headers.set('CDN-Cache-Control', 'max-age=1800, stale-while-revalidate=3600')

    return response
  } catch (error) {
    console.error('Error fetching audit metadata:', error)
    return NextResponse.json(
      { error: 'Failed to fetch audit metadata' },
      { status: 500 }
    )
  }
})
