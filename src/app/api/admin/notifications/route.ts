/**
 * Admin Notifications API
 * GET /api/admin/notifications - List all notifications (admin only)
 * POST /api/admin/notifications/send - Send notification to user(s)
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { prisma } from '@/lib/prisma'
import { respond } from '@/lib/api-response'
import { NotificationHub } from '@/lib/notifications/hub'
import { z } from 'zod'

// Verify admin access
async function requireAdmin(userId: string, tenantId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true, tenantId: true },
  })

  if (!user || user.role !== 'ADMIN' || user.tenantId !== tenantId) {
    return null
  }

  return user
}

// GET - List all notifications (admin view)
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession()

    if (!session?.user) {
      return respond.unauthorized()
    }

    const userId = session.user.id
    const tenantId = session.user.tenantId
    if (!userId || !tenantId) {
      return respond.unauthorized()
    }

    const admin = await requireAdmin(userId, tenantId)
    if (!admin) {
      return respond.forbidden('Admin access required')
    }

    // Parse query parameters
    const searchParams = request.nextUrl.searchParams
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100)
    const offset = parseInt(searchParams.get('offset') || '0')
    const userId_filter = searchParams.get('userId')
    const type = searchParams.get('type')
    const status = searchParams.get('status')

    // Build where clause
    const where: any = { tenantId }
    if (userId_filter) where.userId = userId_filter
    if (type) where.type = type
    if (status) where.status = status

    const [notifications, total] = await Promise.all([
      prisma.notification.findMany({
        where,
        include: {
          user: { select: { id: true, name: true, email: true } },
          relatedUser: { select: { id: true, name: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      prisma.notification.count({ where }),
    ])

    return respond.ok({
      data: notifications,
      meta: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total,
      },
    })
  } catch (error) {
    console.error('Error fetching notifications:', error)
    return respond.serverError()
  }
}

// POST - Send notification to user(s)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession()

    if (!session?.user) {
      return respond.unauthorized()
    }

    const userId = session.user.id
    const tenantId = session.user.tenantId
    if (!userId || !tenantId) {
      return respond.unauthorized()
    }

    const admin = await requireAdmin(userId, tenantId)
    if (!admin) {
      return respond.forbidden('Admin access required')
    }

    // Validate request body
    const schema = z.object({
      userIds: z.array(z.string()).min(1),
      type: z.string(),
      title: z.string().min(1).max(255),
      message: z.string().min(1),
      description: z.string().optional(),
      link: z.string().url().optional(),
      entityType: z.string().optional(),
      entityId: z.string().optional(),
      channels: z.array(z.enum(['in_app', 'email', 'sms', 'push'])).optional(),
      priority: z.enum(['low', 'normal', 'high', 'urgent']).optional(),
      metadata: z.record(z.any()).optional(),
    })

    const payload = schema.parse(await request.json())

    // Send notifications
    const notifications = await NotificationHub.sendBatch(payload.userIds, {
      tenantId,
      type: payload.type as any,
      title: payload.title,
      message: payload.message,
      description: payload.description,
      link: payload.link,
      entityType: payload.entityType,
      entityId: payload.entityId,
      relatedUserId: userId, // Admin who sent the notification
      channels: payload.channels,
      priority: payload.priority,
      metadata: payload.metadata,
    })

    return respond.ok(
      {
        data: {
          sent: notifications.length,
          notificationIds: notifications.map((n) => n.id),
        },
      },
      { status: 201 }
    )
  } catch (error) {
    if (error instanceof z.ZodError) {
      return respond.badRequest(error.errors)
    }
    console.error('Error sending notifications:', error)
    return respond.serverError()
  }
}
