/**
 * Notifications API
 * GET /api/notifications - List user's notifications
 * POST /api/notifications/mark-as-read - Mark notification(s) as read
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { prisma } from '@/lib/prisma'
import { respond } from '@/lib/api-response'
import { NotificationHub } from '@/lib/notifications/hub'
import type { NotificationQueryOptions } from '@/types/notifications'
import { z } from 'zod'

// GET - List notifications for current user
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession()

    if (!session?.user) {
      return respond.unauthorized()
    }

    const userId = session.user.id
    if (!userId) {
      return respond.unauthorized()
    }

    // Parse query parameters
    const searchParams = request.nextUrl.searchParams
    const options: NotificationQueryOptions = {
      limit: Math.min(parseInt(searchParams.get('limit') || '20'), 100),
      offset: parseInt(searchParams.get('offset') || '0'),
      type: (searchParams.get('type') as any) || undefined,
      unreadOnly: searchParams.get('unreadOnly') === 'true',
      sortBy: (searchParams.get('sortBy') as any) || 'createdAt',
      sortOrder: (searchParams.get('sortOrder') as any) || 'desc',
    }

    // Get notifications
    const { notifications, total } = await NotificationHub.getNotifications(
      userId,
      options
    )

    // Get unread count
    const unreadCount = await NotificationHub.getUnreadCount(userId)

    return respond.ok({
      data: notifications,
      meta: {
        total,
        unreadCount,
        limit: options.limit,
        offset: options.offset,
        hasMore: options.offset + options.limit < total,
      },
    })
  } catch (error) {
    console.error('Error fetching notifications:', error)
    return respond.serverError()
  }
}

// POST - Mark notifications as read
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession()

    if (!session?.user) {
      return respond.unauthorized()
    }

    const userId = session.user.id
    if (!userId) {
      return respond.unauthorized()
    }

    const body = await request.json()
    const schema = z.object({
      notificationIds: z.array(z.string()).optional(),
      action: z.enum(['read', 'unread', 'delete']),
    })

    const { notificationIds, action } = schema.parse(body)

    if (action === 'read' && notificationIds) {
      // Mark specific notifications as read
      await Promise.all(
        notificationIds.map((id) =>
          NotificationHub.markAsRead(id, userId).catch(() => null)
        )
      )
    } else if (action === 'read' && !notificationIds) {
      // Mark all as read
      await NotificationHub.markAllAsRead(userId)
    } else if (action === 'delete' && notificationIds) {
      // Delete specific notifications
      await Promise.all(
        notificationIds.map((id) =>
          NotificationHub.delete(id).catch(() => null)
        )
      )
    }

    // Return updated unread count
    const unreadCount = await NotificationHub.getUnreadCount(userId)

    return respond.ok({
      data: { success: true, unreadCount },
      meta: { action },
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return respond.badRequest(error.errors)
    }
    console.error('Error updating notifications:', error)
    return respond.serverError()
  }
}
