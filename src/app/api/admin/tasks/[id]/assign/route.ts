import { NextRequest, NextResponse } from 'next/server'
import { withTenantContext } from '@/lib/api-wrapper'
import { respond } from '@/lib/api-response'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

/**
 * POST /api/admin/tasks/[id]/assign
 * Assign a task to a user (admin only)
 */
export const POST = withTenantContext(
  async (request, { user, tenantId }, { params }) => {
    try {
      if (!user.isAdmin) {
        return respond.forbidden('Only administrators can assign tasks')
      }

      const taskId = (await params).id

      // Validate request body
      const bodySchema = z.object({
        assigneeId: z.string().uuid('Invalid assignee ID'),
      })

      const body = await request.json()
      const { assigneeId } = bodySchema.parse(body)

      // Verify task exists
      const task = await prisma.task.findFirst({
        where: {
          id: taskId,
          tenantId,
        },
      })

      if (!task) {
        return respond.notFound('Task not found')
      }

      // Verify assignee exists and is in same tenant
      const assignee = await prisma.user.findFirst({
        where: {
          id: assigneeId,
          tenantId,
        },
      })

      if (!assignee) {
        return respond.badRequest('Assignee not found in this organization')
      }

      // Assign the task
      const updated = await prisma.task.update({
        where: { id: taskId },
        data: { assigneeId },
        include: {
          assignee: {
            select: {
              id: true,
              name: true,
              email: true,
              image: true,
              department: true,
              position: true,
            },
          },
        },
      })

      return respond.ok({
        data: updated,
        message: `Task assigned to ${assignee.name || assignee.email}`,
      })
    } catch (error) {
      if (error instanceof z.ZodError) {
        return respond.badRequest('Invalid assignment data', error.errors)
      }
      console.error('Task assignment error:', error)
      return respond.serverError()
    }
  },
  { requireAuth: true, requireAdmin: true }
)
