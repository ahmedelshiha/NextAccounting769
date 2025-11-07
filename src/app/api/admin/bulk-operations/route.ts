import { NextRequest, NextResponse } from 'next/server'
import { withTenantContext } from '@/lib/api-wrapper'
import { requireTenantContext } from '@/lib/tenant-utils'
import { bulkOperationsService } from '@/services/bulk-operations.service'

/**
 * GET /api/admin/bulk-operations
 * List bulk operations with pagination
 */
export const GET = withTenantContext(async (request: NextRequest) => {
  try {
    const ctx = requireTenantContext()
    if (!ctx.userId || !ctx.tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const tenantId = ctx.tenantId as string
    const limit = parseInt(searchParams.get('limit') || '10')
    const offset = parseInt(searchParams.get('offset') || '0')
    const status = searchParams.get('status') as any

    const result = await bulkOperationsService.listBulkOperations(tenantId, {
      limit,
      offset,
      status
    })

    return NextResponse.json(result)
  } catch (error) {
    console.error('GET /api/admin/bulk-operations error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch bulk operations' },
      { status: 500 }
    )
  }
})

/**
 * POST /api/admin/bulk-operations
 * Create a new bulk operation
 */
export const POST = withTenantContext(async (request: NextRequest) => {
  try {
    const ctx = requireTenantContext()
    if (!ctx.userId || !ctx.tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { name, description, type, userFilter, operationConfig, approvalRequired, scheduledFor, notifyUsers } = body

    if (!name || !type || !operationConfig) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const operation = await bulkOperationsService.createBulkOperation(
      ctx.tenantId as string,
      ctx.userId,
      {
        name,
        description,
        type,
        userFilter,
        operationConfig,
        approvalRequired,
        scheduledFor: scheduledFor ? new Date(scheduledFor) : undefined,
        notifyUsers
      }
    )

    return NextResponse.json(operation, { status: 201 })
  } catch (error) {
    console.error('POST /api/admin/bulk-operations error:', error)
    return NextResponse.json(
      { error: 'Failed to create bulk operation' },
      { status: 500 }
    )
  }
})
