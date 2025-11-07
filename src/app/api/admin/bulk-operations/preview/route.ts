import { NextRequest, NextResponse } from 'next/server'
import { withTenantContext } from '@/lib/api-wrapper'
import { requireTenantContext } from '@/lib/tenant-utils'
import { DryRunService } from '@/services/dry-run.service'

/**
 * POST /api/admin/bulk-operations/preview
 * Get a comprehensive preview of what a bulk operation would do (dry-run)
 *
 * Returns:
 * - User change previews
 * - Conflict detection
 * - Impact analysis
 * - Risk assessment
 */
export const POST = withTenantContext(async (request: NextRequest) => {
  try {
    const ctx = requireTenantContext()
    if (!ctx.userId || !ctx.tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { selectedUserIds, operationType, operationConfig } = body

    if (!selectedUserIds || !operationType || !operationConfig) {
      return NextResponse.json(
        { error: 'Missing required fields: selectedUserIds, operationType, operationConfig' },
        { status: 400 }
      )
    }

    if (!Array.isArray(selectedUserIds) || selectedUserIds.length === 0) {
      return NextResponse.json(
        { error: 'selectedUserIds must be a non-empty array' },
        { status: 400 }
      )
    }

    // Run comprehensive dry-run with conflict detection and impact analysis
    const dryRunResult = await DryRunService.runDryRun(
      ctx.tenantId as string,
      selectedUserIds,
      operationType,
      operationConfig,
      10 // Preview limit
    )

    return NextResponse.json(dryRunResult)
  } catch (error) {
    console.error('POST /api/admin/bulk-operations/preview error:', error)
    return NextResponse.json(
      {
        error: 'Failed to preview operation',
        details: error instanceof Error ? error.message : undefined
      },
      { status: 500 }
    )
  }
})
