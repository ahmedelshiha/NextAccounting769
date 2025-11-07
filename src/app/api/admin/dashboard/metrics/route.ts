import { NextRequest, NextResponse } from 'next/server'
import { dashboardMetricsService } from '@/services/dashboard-metrics.service'
import { withAdminAuth } from '@/lib/auth-middleware'

export const dynamic = 'force-dynamic'
export const revalidate = 300 // Cache for 5 minutes

export const GET = withAdminAuth(async (req: NextRequest) => {
  try {
    const metrics = await dashboardMetricsService.getMetrics('default-tenant')

    return NextResponse.json(
      {
        metrics,
        timestamp: new Date().toISOString(),
        cached: false
      },
      {
        headers: {
          'Cache-Control': 'public, max-age=300'
        }
      }
    )
  } catch (error) {
    console.error('Failed to fetch dashboard metrics:', error)
    return NextResponse.json(
      { error: 'Failed to fetch metrics' },
      { status: 500 }
    )
  }
})
