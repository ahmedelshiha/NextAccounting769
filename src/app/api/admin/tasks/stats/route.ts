import { NextRequest, NextResponse } from 'next/server'
import { withTenantContext } from '@/lib/api-wrapper'
import { respond } from '@/lib/api-response'
import { prisma } from '@/lib/prisma'
import { TaskStatus, TaskPriority } from '@/types/shared/entities/task'

/**
 * GET /api/admin/tasks/stats
 * Get task statistics for dashboard (admin only)
 */
export const GET = withTenantContext(
  async (request, { user, tenantId }) => {
    try {
      if (!user.isAdmin) {
        return respond.forbidden('Only administrators can access this endpoint')
      }

      // Count tasks by status
      const byStatus = await Promise.all(
        Object.values(TaskStatus).map(async (status) => ({
          status,
          count: await prisma.task.count({
            where: { tenantId, status },
          }),
        }))
      )

      // Count tasks by priority
      const byPriority = await Promise.all(
        Object.values(TaskPriority).map(async (priority) => ({
          priority,
          count: await prisma.task.count({
            where: { tenantId, priority },
          }),
        }))
      )

      // Count overdue tasks
      const overdue = await prisma.task.count({
        where: {
          tenantId,
          dueAt: { lt: new Date() },
          status: { not: TaskStatus.COMPLETED },
        },
      })

      // Count tasks due this week
      const now = new Date()
      const weekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
      const dueSoon = await prisma.task.count({
        where: {
          tenantId,
          dueAt: { gte: now, lte: weekFromNow },
          status: { not: TaskStatus.COMPLETED },
        },
      })

      // Get total tasks
      const total = await prisma.task.count({ where: { tenantId } })

      // Get completion rate
      const completed = await prisma.task.count({
        where: { tenantId, status: TaskStatus.COMPLETED },
      })

      const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0

      // Get average tasks per assignee
      const tasksByAssignee = await prisma.task.groupBy({
        by: ['assigneeId'],
        where: { tenantId, assigneeId: { not: null } },
        _count: true,
      })

      const averageTasksPerAssignee =
        tasksByAssignee.length > 0
          ? Math.round(tasksByAssignee.reduce((sum, t) => sum + t._count, 0) / tasksByAssignee.length)
          : 0

      // Get most overdue task
      const mostOverdue = await prisma.task.findFirst({
        where: {
          tenantId,
          dueAt: { lt: new Date() },
          status: { not: TaskStatus.COMPLETED },
        },
        orderBy: { dueAt: 'asc' },
        select: {
          id: true,
          title: true,
          dueAt: true,
          assignee: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      })

      return respond.ok({
        data: {
          summary: {
            total,
            completed,
            completionRate,
            overdue,
            dueSoon,
            averageTasksPerAssignee,
          },
          byStatus: Object.fromEntries(byStatus.map(({ status, count }) => [status, count])),
          byPriority: Object.fromEntries(byPriority.map(({ priority, count }) => [priority, count])),
          mostOverdue,
        },
      })
    } catch (error) {
      console.error('Task stats error:', error)
      return respond.serverError()
    }
  },
  { requireAuth: true, requireAdmin: true }
)
