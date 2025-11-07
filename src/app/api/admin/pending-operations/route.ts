import { NextResponse } from 'next/server'
import { withTenantContext } from '@/lib/api-wrapper'
import { requireTenantContext } from '@/lib/tenant-utils'
import prisma from '@/lib/prisma'
import { respond } from '@/lib/api-response'
import { hasPermission, PERMISSIONS } from '@/lib/permissions'
import { getClientIp, applyRateLimit } from '@/lib/rate-limit'
import { tenantFilter } from '@/lib/tenant'

export const runtime = 'nodejs'

/**
 * GET /api/admin/pending-operations
 * 
 * Fetches pending operations and workflows for the admin dashboard
 * 
 * Query Parameters:
 * - limit: number (default: 20, max: 100)
 * - offset: number (default: 0)
 * - status: pending | in-progress | completed (optional)
 */
export const GET = withTenantContext(async (request: Request) => {
  const ctx = requireTenantContext()
  const tenantId = ctx.tenantId ?? null

  try {
    // Apply rate limiting
    const ip = getClientIp(request as unknown as Request)
    const rl = await applyRateLimit(`admin-pending-ops:${ip}`, 240, 60_000)
    if (rl && rl.allowed === false) {
      try {
        const { logAudit } = await import('@/lib/audit')
        await logAudit({
          action: 'security.ratelimit.block',
          details: {
            tenantId,
            ip,
            key: `admin-pending-ops:${ip}`,
            route: new URL(request.url).pathname
          }
        })
      } catch {}
      return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 })
    }

    // Check permissions
    const role = ctx.role ?? ''
    if (!ctx.userId) return respond.unauthorized()
    if (!hasPermission(role, PERMISSIONS.USERS_MANAGE)) return respond.forbidden('Forbidden')

    // Parse query parameters
    const { searchParams } = new URL(request.url)
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20', 10)))
    const offset = Math.max(0, parseInt(searchParams.get('offset') || '0', 10))
    const statusFilter = searchParams.get('status')

    // For now, return generated pending operations based on user activity
    // In Phase 4b, this will be replaced with real workflow data
    const pendingOperations = await generatePendingOperations(
      tenantId,
      limit,
      offset,
      statusFilter
    )

    return NextResponse.json({
      operations: pendingOperations.operations,
      pagination: {
        limit,
        offset,
        total: pendingOperations.total
      },
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Error fetching pending operations:', error)
    return respond.serverError('Failed to fetch pending operations')
  }
})

/**
 * Generate pending operations based on user activity
 * 
 * This is a temporary implementation that generates operations
 * based on recent user activity and system state.
 * 
 * In Phase 4b, this will be replaced with real workflow data
 * from the workflows table.
 */
async function generatePendingOperations(
  tenantId: string | null,
  limit: number,
  offset: number,
  statusFilter: string | null
) {
  try {
    // Fetch recently added or updated users for pending approvals
    const recentUsers = await prisma.user.findMany({
      where: {
        ...tenantFilter(tenantId),
        createdAt: {
          gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Last 30 days
        }
      },
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
        role: true
      },
      orderBy: { createdAt: 'desc' },
      take: 100
    })

    // Generate operations from user activity
    const operations = recentUsers
      .map((user, index) => {
        // Determine operation type based on user data
        const operationType = getOperationType(user.role, index)
        const daysAgo = Math.floor((Date.now() - new Date(user.createdAt).getTime()) / (24 * 60 * 60 * 1000))

        // Calculate progress based on time since creation
        const progress = Math.min(100, Math.max(0, daysAgo * 10))

        // Map to operation status
        let status: 'pending' | 'in-progress' | 'completed' = 'pending'
        if (progress > 70) status = 'in-progress'
        if (progress >= 95) status = 'completed'

        // Calculate due date
        const dueDate = new Date(user.createdAt)
        dueDate.setDate(dueDate.getDate() + 7)

        return {
          id: `op-${user.id}-${operationType}`,
          title: `${operationType} - ${user.name || 'Unknown User'}`,
          description: getOperationDescription(operationType, user.name || 'User'),
          progress,
          dueDate: dueDate.toISOString(),
          assignee: getAssigneeForOperation(operationType),
          status,
          type: operationType,
          userId: user.id,
          userEmail: user.email,
          createdAt: user.createdAt.toISOString(),
          actions: [
            { label: 'View', id: 'view' },
            { label: status === 'pending' ? 'Approve' : status === 'in-progress' ? 'Resume' : 'Complete', id: 'action' }
          ]
        }
      })
      .filter(op => !statusFilter || op.status === statusFilter)
      .slice(offset, offset + limit)

    return {
      operations,
      total: recentUsers.length
    }
  } catch (error) {
    console.warn('Error generating pending operations:', error)
    // Return empty list if there's an error
    return {
      operations: [],
      total: 0
    }
  }
}

/**
 * Determine operation type based on user role
 */
function getOperationType(role: string, index: number): string {
  const types = ['Onboarding', 'Role Change', 'Permission Grant', 'Account Activation']
  return types[index % types.length]
}

/**
 * Get operation description
 */
function getOperationDescription(type: string, userName: string): string {
  const descriptions: Record<string, string> = {
    'Onboarding': `New employee setup and system access provisioning for ${userName}`,
    'Role Change': `Permission escalation and role assignment for ${userName}`,
    'Permission Grant': `Additional system permissions for ${userName}`,
    'Account Activation': `Account verification and activation for ${userName}`
  }
  return descriptions[type] || `Operation for ${userName}`
}

/**
 * Get assignee for operation type
 */
function getAssigneeForOperation(type: string): string {
  const assignees: Record<string, string> = {
    'Onboarding': 'HR Manager',
    'Role Change': 'Admin',
    'Permission Grant': 'Security Officer',
    'Account Activation': 'IT Support'
  }
  return assignees[type] || 'Admin'
}

/**
 * POST /api/admin/pending-operations/:id/approve
 * 
 * Approve a pending operation
 */
export const POST = withTenantContext(async (request: Request) => {
  const ctx = requireTenantContext()
  const tenantId = ctx.tenantId ?? null

  try {
    // Check permissions
    const role = ctx.role ?? ''
    if (!ctx.userId) return respond.unauthorized()
    if (!hasPermission(role, PERMISSIONS.USERS_MANAGE)) return respond.forbidden('Forbidden')

    const body = await request.json()
    const { action, operationId } = body

    // Handle approve action
    if (action === 'approve') {
      // In Phase 4b, this will update the workflow status in the database
      // For now, log the action
      try {
        const { logAudit } = await import('@/lib/audit')
        await logAudit({
          action: 'admin.operation.approved',
          details: {
            tenantId,
            operationId,
            userId: ctx.userId
          }
        })
      } catch {}

      return NextResponse.json({
        success: true,
        message: 'Operation approved',
        operationId
      })
    }

    // Handle cancel action
    if (action === 'cancel') {
      try {
        const { logAudit } = await import('@/lib/audit')
        await logAudit({
          action: 'admin.operation.cancelled',
          details: {
            tenantId,
            operationId,
            userId: ctx.userId
          }
        })
      } catch {}

      return NextResponse.json({
        success: true,
        message: 'Operation cancelled',
        operationId
      })
    }

    return respond.badRequest('Invalid action')
  } catch (error) {
    console.error('Error handling operation action:', error)
    return respond.serverError('Failed to handle operation')
  }
})
