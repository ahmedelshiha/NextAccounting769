import { NextRequest, NextResponse } from 'next/server'
import { withTenantContext } from '@/lib/api-wrapper'
import { respond } from '@/lib/api-response'
import { TaskUpdateSchema } from '@/schemas/shared/entities/task'
import { prisma } from '@/lib/prisma'
import { logAudit } from '@/lib/audit'
import { z } from 'zod'

/**
 * GET /api/tasks/[id]
 * Get task details with comments
 */
export const GET = withTenantContext(
  async (request, { user, tenantId }, { params }) => {
    try {
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
            where: {
              parentId: null, // Only fetch top-level comments
            },
          },
        },
      })

      if (!task) {
        return respond.notFound('Task not found')
      }

      // Check authorization: non-admins can only view their own tasks
      if (!user.isAdmin && task.assigneeId !== user.id) {
        return respond.forbidden('You do not have access to this task')
      }

      return respond.ok({ data: task })
    } catch (error) {
      console.error('Task detail error:', error)
      return respond.serverError()
    }
  },
  { requireAuth: true }
)

/**
 * PUT /api/tasks/[id]
 * Update a task (admin or assignee)
 */
export const PUT = withTenantContext(
  async (request, { user, tenantId }, { params }) => {
    try {
      const taskId = (await params).id

      // Verify task exists and get current state
      const existingTask = await prisma.task.findFirst({
        where: {
          id: taskId,
          tenantId,
        },
      })

      if (!existingTask) {
        return respond.notFound('Task not found')
      }

      // Check authorization: only admins or assignees can update
      if (!user.isAdmin && existingTask.assigneeId !== user.id) {
        return respond.forbidden('You do not have permission to update this task')
      }

      const body = await request.json()
      const updates = TaskUpdateSchema.parse(body)

      // Store old values for audit log
      const oldValues = {
        status: existingTask.status,
        priority: existingTask.priority,
        assigneeId: existingTask.assigneeId,
        title: existingTask.title,
        dueAt: existingTask.dueAt,
      }

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

      // Log audit event with changes
      const changes: Record<string, any> = {}
      if (updates.status && updates.status !== oldValues.status) {
        changes.status = { from: oldValues.status, to: updates.status }
      }
      if (updates.priority && updates.priority !== oldValues.priority) {
        changes.priority = { from: oldValues.priority, to: updates.priority }
      }
      if (updates.assigneeId !== undefined && updates.assigneeId !== oldValues.assigneeId) {
        changes.assigneeId = { from: oldValues.assigneeId, to: updates.assigneeId }
      }
      if (updates.title && updates.title !== oldValues.title) {
        changes.title = { from: oldValues.title, to: updates.title }
      }
      if (updates.dueAt && updates.dueAt !== oldValues.dueAt) {
        changes.dueAt = { from: oldValues.dueAt, to: updates.dueAt }
      }

      if (Object.keys(changes).length > 0) {
        await logAudit({
          tenantId,
          userId: user.id,
          action: 'TASK_UPDATED',
          entity: 'Task',
          entityId: taskId,
          changes,
        })
      }

      return respond.ok({ data: updated })
    } catch (error) {
      if (error instanceof z.ZodError) {
        return respond.badRequest('Invalid task data', error.errors)
      }
      console.error('Task update error:', error)
      return respond.serverError()
    }
  },
  { requireAuth: true }
)

/**
 * DELETE /api/tasks/[id]
 * Delete a task (admin only)
 */
export const DELETE = withTenantContext(
  async (request, { user, tenantId }, { params }) => {
    try {
      // Only admins can delete tasks
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

      // Log audit event before deletion
      await logAudit({
        tenantId,
        userId: user.id,
        action: 'TASK_DELETED',
        entity: 'Task',
        entityId: taskId,
        changes: {
          title: task.title,
          status: task.status,
        },
      })

      // Delete the task (cascade will handle comments)
      await prisma.task.delete({
        where: { id: taskId },
      })

      return respond.ok({ success: true, message: 'Task deleted successfully' })
    } catch (error) {
      console.error('Task deletion error:', error)
      return respond.serverError()
    }
  },
  { requireAuth: true }
)
