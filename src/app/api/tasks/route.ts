import { NextRequest, NextResponse } from 'next/server'
import { withTenantContext } from '@/lib/api-wrapper'
import { requireTenantContext } from '@/lib/tenant-utils'
import { respond } from '@/lib/api-response'
import { TaskFilterSchema, TaskCreateSchema } from '@/schemas/shared/entities/task'
import { TaskStatus } from '@/types/shared/entities/task'
import { prisma } from '@/lib/prisma'
import { logAudit } from '@/lib/audit'
import { z } from 'zod'

/**
 * GET /api/tasks
 * List tasks for the current user (own tasks or assigned tasks)
 * Supports filtering by status, priority, assignee, and date range
 */
export const GET = withTenantContext(
  async (request, { params }) => {
    try {
      const ctx = requireTenantContext()
      const { userId: userId_, tenantId } = ctx

      const { searchParams } = new URL(request.url)

      // Parse and validate filters
      const filterInput = {
        status: searchParams.getAll('status'),
        priority: searchParams.getAll('priority'),
        assigneeId: searchParams.get('assigneeId'),
        search: searchParams.get('search'),
        dueBefore: searchParams.get('dueBefore'),
        dueAfter: searchParams.get('dueAfter'),
        limit: parseInt(searchParams.get('limit') || '20'),
        offset: parseInt(searchParams.get('offset') || '0'),
        sortBy: searchParams.get('sortBy') || 'createdAt',
        sortOrder: searchParams.get('sortOrder') || 'desc',
      }

      // Clean up arrays
      if (filterInput.status.length === 0) delete (filterInput as any).status
      if (filterInput.status.length === 1) filterInput.status = filterInput.status[0] as any
      if (filterInput.priority.length === 0) delete (filterInput as any).priority
      if (filterInput.priority.length === 1) filterInput.priority = filterInput.priority[0] as any

      const filters = TaskFilterSchema.parse(filterInput)

      // Build query
      const where: any = { tenantId }

      // Filter by status
      if (filters.status) {
        if (Array.isArray(filters.status)) {
          where.status = { in: filters.status }
        } else {
          where.status = filters.status
        }
      }

      // Filter by priority
      if (filters.priority) {
        if (Array.isArray(filters.priority)) {
          where.priority = { in: filters.priority }
        } else {
          where.priority = filters.priority
        }
      }

      // Filter by assignee
      if (filters.assigneeId) {
        where.assigneeId = filters.assigneeId
      } else if (ctx.role !== 'SUPER_ADMIN' && !ctx.tenantRole?.includes('ADMIN')) {
        // Non-admin users only see their own tasks
        where.OR = [{ assigneeId: userId_ }, { assigneeId: null }]
      }

      // Search in title and description
      if (filters.search) {
        where.OR = [
          { title: { contains: filters.search, mode: 'insensitive' } },
          { description: { contains: filters.search, mode: 'insensitive' } },
        ]
      }

      // Filter by due date
      if (filters.dueAfter) {
        where.dueAt = { gte: new Date(filters.dueAfter) }
      }
      if (filters.dueBefore) {
        where.dueAt = {
          ...(where.dueAt || {}),
          lte: new Date(filters.dueBefore),
        }
      }

      // Get total count
      const total = await prisma.task.count({ where })

      // Get paginated results
      const data = await prisma.task.findMany({
        where,
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
        orderBy: {
          [filters.sortBy]: filters.sortOrder === 'asc' ? 'asc' : 'desc',
        },
        skip: filters.offset,
        take: filters.limit,
      })

      return respond.ok({
        data,
        meta: {
          total,
          limit: filters.limit,
          offset: filters.offset,
          hasMore: filters.offset + filters.limit < total,
        },
      })
    } catch (error) {
      if (error instanceof z.ZodError) {
        return respond.badRequest('Invalid filter parameters', error.errors)
      }
      console.error('Task list error:', error)
      return respond.serverError()
    }
  },
  { requireAuth: true }
)

/**
 * POST /api/tasks
 * Create a new task (admin only)
 */
export const POST = withTenantContext(
  async (request, { user, tenantId }) => {
    try {
      // Only admins can create tasks
      if (!user.isAdmin) {
        return respond.forbidden('Only administrators can create tasks')
      }

      const body = await request.json()
      const input = TaskCreateSchema.parse(body)

      // Create the task
      const task = await prisma.task.create({
        data: {
          ...input,
          tenantId,
          createdById: user.id,
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
        },
      })

      // Log audit event
      await logAudit({
        tenantId,
        userId: user.id,
        action: 'TASK_CREATED',
        resource: 'Task',
        details: {
          taskId: task.id,
          title: task.title,
          priority: task.priority,
          assigneeId: task.assigneeId,
          dueAt: task.dueAt,
        },
      })

      return respond.created({
        data: task,
      })
    } catch (error) {
      if (error instanceof z.ZodError) {
        return respond.badRequest('Invalid task data', error.errors)
      }
      console.error('Task creation error:', error)
      return respond.serverError()
    }
  },
  { requireAuth: true }
)
