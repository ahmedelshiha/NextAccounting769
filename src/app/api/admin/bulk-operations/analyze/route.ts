import { NextRequest, NextResponse } from 'next/server'
import { bulkOperationsAdvancedService, BulkOperationRequest } from '@/services/bulk-operations-advanced.service'
import { withAdminAuth } from '@/lib/auth-middleware'

export const POST = withAdminAuth(async (req: NextRequest) => {
  try {
    const request: BulkOperationRequest = await req.json()

    const impact = await bulkOperationsAdvancedService.analyzeImpact(request)

    return NextResponse.json({
      impact,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Failed to analyze bulk operation:', error)
    return NextResponse.json(
      { error: 'Failed to analyze bulk operation' },
      { status: 500 }
    )
  }
})
