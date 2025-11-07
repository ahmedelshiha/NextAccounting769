import { NextRequest, NextResponse } from 'next/server'
import { dashboardMetricsService } from '@/services/dashboard-metrics.service'
import { withAdminAuth } from '@/lib/auth-middleware'

export const dynamic = 'force-dynamic'
export const revalidate = 600 // Cache for 10 minutes

export const GET = withAdminAuth(async (req: NextRequest) => {
  try {
    const [
      userGrowthTrend,
      departmentDistribution,
      roleDistribution,
      workflowEfficiency,
      complianceScore
    ] = await Promise.all([
      dashboardMetricsService.getUserGrowthTrend('default-tenant'),
      dashboardMetricsService.getDepartmentDistribution('default-tenant'),
      dashboardMetricsService.getRoleDistribution('default-tenant'),
      dashboardMetricsService.getWorkflowEfficiency('default-tenant'),
      dashboardMetricsService.getComplianceScore('default-tenant')
    ])

    return NextResponse.json(
      {
        analytics: {
          userGrowthTrend: userGrowthTrend,
          departmentDistribution: departmentDistribution,
          roleDistribution: roleDistribution,
          workflowEfficiency: workflowEfficiency,
          complianceScore: complianceScore
        },
        timestamp: new Date().toISOString()
      },
      {
        headers: {
          'Cache-Control': 'public, max-age=600'
        }
      }
    )
  } catch (error) {
    console.error('Failed to fetch analytics:', error)
    return NextResponse.json(
      { error: 'Failed to fetch analytics' },
      { status: 500 }
    )
  }
})
