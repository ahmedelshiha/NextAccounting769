import { NextRequest, NextResponse } from 'next/server'
import { entityRelationshipService } from '@/services/entity-relationship.service'
import { withAdminAuth } from '@/lib/auth-middleware'

export const dynamic = 'force-dynamic'
export const revalidate = 600 // Cache for 10 minutes

export const GET = withAdminAuth(async (req: NextRequest) => {
  try {
    const relationshipMap = await entityRelationshipService.buildRelationshipMap()

    return NextResponse.json(
      {
        relationshipMap,
        timestamp: new Date().toISOString()
      },
      {
        headers: {
          'Cache-Control': 'public, max-age=600'
        }
      }
    )
  } catch (error) {
    console.error('Failed to build relationship map:', error)
    return NextResponse.json(
      { error: 'Failed to build relationship map' },
      { status: 500 }
    )
  }
})
