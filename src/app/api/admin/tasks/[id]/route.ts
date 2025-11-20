import { NextRequest, NextResponse } from 'next/server'
import { withTenantContext } from '@/lib/api-wrapper'
import { respond } from '@/lib/api-response'
import { TaskUpdateSchema } from '@/schemas/shared/entities/task'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

/**
 * GET /api/admin/tasks/[id]
 * Get detailed task information (admin only)
 */
export const GET = withTenantContext(
  async (request, { user, tenantId }, { params }) => {
    try {
      if (!user.isAdmin) {
        return respond.forbidden('Only administrators can access this endpoint')
      }

      const taskId = (await params).id

      const task = await prisma.task.findFirst({
        where: {
          id: taskId,
          tenantId,
        },
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
          comments: {
            include: {
              author: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  image: true,
                },
              },
              replies: {
                include: {
                  author: {
                    select: {
                      id: true,
                      name: true,
                      email: true,
                      image: true,
                    },
                  },
                },
              },
            },
            where: { parentId: null },
          },
        },
      })

      if (!task) {
        return respond.notFound('Task not found')
      }

      return respond.ok({ data: task })
    } catch (error) {
      console.error('Admin task detail error:', error)
      return respond.serverError()
    }
  },
  { requireAuth: true, requireAdmin: true }
)

/**
 * PUT /api/admin/tasks/[id]
 * Update a task (admin only)
 */
export const PUT = withTenantContext(
  async (request, { user, tenantId }, { params }) => {
    try {
      if (!user.isAdmin) {
        return respond.forbidden('Only administrators can update tasks')
      }

      const taskId = (await params).id

      // Verify task exists
      const existingTask = await prisma.task.findFirst({
        where: {
          id: taskId,
          tenantId,
        },
      })

      if (!existingTask) {
        return respond.notFound('Task not found')
      }

      const body = await request.json()
      const updates = TaskUpdateSchema.parse(body)

      // Update the task
      const updated = await prisma.task.update({
        where: { id: taskId },
        data: updates,
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

      return respond.ok({ data: updated })
    } catch (error) {
      if (error instanceof z.ZodError) {
        return respond.badRequest('Invalid task data', error.errors)
      }
      console.error('Admin task update error:', error)
      return respond.serverError()
    }
  },
  { requireAuth: true, requireAdmin: true }
)

/**
 * DELETE /api/admin/tasks/[id]
 * Delete a task (admin only)
 */
export const DELETE = withTenantContext(
  async (request, { user, tenantId }, { params }) => {
    try {
      if (!user.isAdmin) {
        return respond.forbidden('Only administrators can delete tasks')
      }

      const taskId = (await params).id

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

      // Delete the task (cascade handles comments)
      await prisma.task.delete({
        where: { id: taskId },
      })

      return respond.ok({ success: true, message: 'Task deleted successfully' })
    } catch (error) {
      console.error('Admin task deletion error:', error)
      return respond.serverError()
    }
  },
  { requireAuth: true, requireAdmin: true }
)
