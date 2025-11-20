import { NextRequest, NextResponse } from 'next/server'
import { withTenantContext } from '@/lib/api-wrapper'
import { requireTenantContext } from '@/lib/tenant-utils'
import { hasPermission, PERMISSIONS } from '@/lib/permissions'
import { applyRateLimit, getClientIp } from '@/lib/rate-limit'
import { FilterAnalyticsService } from '@/app/admin/users/services/filter-analytics.service'

export const runtime = 'nodejs'
export const revalidate = 300 // Cache for 5 minutes

/**
 * GET /api/admin/analytics/filters
 * Get filter usage analytics
 */
export const GET = withTenantContext(async (request: NextRequest) => {
  const ctx = requireTenantContext()
  const tenantId = ctx.tenantId

  if (!tenantId) {
    return NextResponse.json({ error: 'Tenant context required' }, { status: 400 })
  }

  try {
    // Rate limiting
    const ip = getClientIp(request)
    const rl = await applyRateLimit(`analytics-filters:${ip}`, 60, 60_000)
    if (rl && rl.allowed === false) {
      return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 })
    }

    // Permission check
    const userRole = ctx.role ?? ''
    if (!ctx.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    if (!hasPermission(userRole, PERMISSIONS.USERS_MANAGE)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Parse query params
    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get('startDate')
      ? new Date(searchParams.get('startDate')!)
      : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Default: last 30 days
    const endDate = searchParams.get('endDate')
      ? new Date(searchParams.get('endDate')!)
      : new Date()

    // Get analytics data
    const [filterStats, presetMetrics, combinations, engagement, performance] = await Promise.all([
      FilterAnalyticsService.getFilterUsageStats(tenantId, startDate, endDate),
      FilterAnalyticsService.getPresetAdoptionMetrics(tenantId),
      FilterAnalyticsService.getFilterCombinations(tenantId, 10),
      FilterAnalyticsService.getUserEngagementMetrics(tenantId),
      FilterAnalyticsService.getFilterPerformanceMetrics(tenantId, 60)
    ])

    return NextResponse.json(
      {
        filterUsageStats: filterStats,
        presetAdoptionMetrics: presetMetrics,
        filterCombinations: combinations,
        userEngagementMetrics: engagement,
        performanceMetrics: performance,
        metadata: {
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
          tenantId
        }
      },
      {
        headers: {
          'Cache-Control': 'public, max-age=300, s-maxage=300'
        }
      }
    )
  } catch (error) {
    console.error('Analytics error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch analytics' },
      { status: 500 }
    )
  }
})
