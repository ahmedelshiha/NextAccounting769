import { NextRequest, NextResponse } from 'next/server'
import { recommendationEngine } from '@/services/recommendation-engine.service'
import { withTenantContext } from '@/lib/api-wrapper'
import { requireTenantContext } from '@/lib/tenant-utils'

export const dynamic = 'force-dynamic'
export const revalidate = 600 // Cache for 10 minutes

export const GET = withTenantContext(async (req: NextRequest) => {
  try {
    // Use tenant context instead of getServerSession
    const ctx = requireTenantContext()

    if (!ctx?.tenantId || !ctx?.userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const recommendations = await recommendationEngine.generateRecommendations({
      tenantId: ctx.tenantId,
      userId: ctx.userId
    })

    return NextResponse.json(
      {
        recommendations,
        count: recommendations.length,
        timestamp: new Date().toISOString()
      },
      {
        headers: {
          'Cache-Control': 'public, max-age=600'
        }
      }
    )
  } catch (error) {
    console.error('Failed to fetch recommendations:', error)
    return NextResponse.json(
      { error: 'Failed to fetch recommendations' },
      { status: 500 }
    )
  }
})
