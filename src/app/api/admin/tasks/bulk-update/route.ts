import { NextRequest, NextResponse } from 'next/server'
import { withTenantContext } from '@/lib/api-wrapper'
import { respond } from '@/lib/api-response'
import { TaskStatusSchema, TaskPrioritySchema } from '@/schemas/shared/entities/task'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

/**
 * POST /api/admin/tasks/bulk-update
 * Perform bulk operations on multiple tasks (admin only)
 */
export const POST = withTenantContext(
  async (request, { user, tenantId }) => {
    try {
      if (!user.isAdmin) {
        return respond.forbidden('Only administrators can perform bulk operations')
      }

      const bodySchema = z.object({
        taskIds: z.array(z.string()).min(1, 'At least one task ID is required'),
        status: TaskStatusSchema.optional(),
        priority: TaskPrioritySchema.optional(),
        assigneeId: z.string().uuid('Invalid assignee ID').optional().nullable(),
      })

      const body = await request.json()
      const { taskIds, status, priority, assigneeId } = bodySchema.parse(body)

      // Verify all tasks exist in this tenant
      const existingTasks = await prisma.task.findMany({
        where: {
          id: { in: taskIds },
          tenantId,
        },
      })

      if (existingTasks.length !== taskIds.length) {
        return respond.badRequest('Some tasks not found or do not belong to this organization')
      }

      // If assigning, verify assignee exists
      if (assigneeId) {
        const assignee = await prisma.user.findFirst({
          where: {
            id: assigneeId,
            tenantId,
          },
        })

        if (!assignee) {
          return respond.badRequest('Assignee not found in this organization')
        }
      }

      // Build update data
      const updateData: any = {}
      if (status) updateData.status = status
      if (priority) updateData.priority = priority
      if (assigneeId !== undefined) updateData.assigneeId = assigneeId

      // Update all tasks
      const result = await prisma.task.updateMany({
        where: {
          id: { in: taskIds },
          tenantId,
        },
        data: updateData,
      })

      return respond.ok({
        data: {
          updated: result.count,
          total: taskIds.length,
        },
        message: `Updated ${result.count} task(s)`,
      })
    } catch (error) {
      if (error instanceof z.ZodError) {
        return respond.badRequest('Invalid bulk update data', error.errors)
      }
      console.error('Bulk task update error:', error)
      return respond.serverError()
    }
  },
  { requireAuth: true, requireAdmin: true }
)
