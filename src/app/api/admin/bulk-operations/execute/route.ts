import { NextRequest, NextResponse } from 'next/server'
import { bulkOperationsAdvancedService, BulkOperationRequest } from '@/services/bulk-operations-advanced.service'
import { withAdminAuth } from '@/lib/auth-middleware'

export const POST = withAdminAuth(async (req: NextRequest) => {
  try {
    const body = await req.json()
    const { request, dryRun } = body as { request: BulkOperationRequest; dryRun: boolean }

    let result

    if (dryRun) {
      result = await bulkOperationsAdvancedService.executeDryRun(request)
    } else {
      result = await bulkOperationsAdvancedService.executeOperation(request)
    }

    return NextResponse.json({
      result,
      isDryRun: dryRun,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Failed to execute bulk operation:', error)
    return NextResponse.json(
      { error: 'Failed to execute bulk operation' },
      { status: 500 }
    )
  }
})
