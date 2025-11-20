import { prisma } from '@/lib/prisma'
import { Notification, NotificationPreference } from '@prisma/client'
import { sendEmail } from '@/lib/email/send'
import type { NotificationType, NotificationChannel } from '@/types/notifications'

/**
 * Notification Hub - Centralized notification management service
 * Handles creation, delivery, and tracking of notifications across multiple channels
 */
export class NotificationHub {
  /**
   * Send notification to user via multiple channels
   */
  static async send(options: {
    userId: string
    tenantId: string
    type: NotificationType
    title: string
    message: string
    description?: string
    link?: string
    entityType?: string
    entityId?: string
    relatedUserId?: string
    channels?: NotificationChannel[]
    priority?: 'low' | 'normal' | 'high' | 'urgent'
    metadata?: Record<string, any>
  }): Promise<Notification> {
    const {
      userId,
      tenantId,
      type,
      title,
      message,
      description,
      link,
      entityType,
      entityId,
      relatedUserId,
      channels = ['in_app'],
      priority = 'normal',
      metadata = {},
    } = options

    // Create notification record
    const notification = await prisma.notification.create({
      data: {
        userId,
        tenantId,
        type,
        title,
        message,
        description,
        link,
        entityType,
        entityId,
        relatedUserId,
        channels,
        priority,
        metadata,
        status: 'pending',
      },
    })

    // Get user preferences
    const preferences = await prisma.notificationPreference.findUnique({
      where: { userId },
    })

    // Send via enabled channels
    if (preferences) {
      await this.sendViaChannels(userId, notification, channels, preferences)
    } else {
      // Default: send in-app only
      await this.markSent(notification.id)
    }

    return notification
  }

  /**
   * Send notification to multiple users
   */
  static async sendBatch(
    userIds: string[],
    options: Omit<Parameters<typeof this.send>[0], 'userId'>
  ): Promise<Notification[]> {
    const notifications = await Promise.all(
      userIds.map((userId) => this.send({ ...options, userId }))
    )
    return notifications
  }

  /**
   * Send via multiple channels
   */
  private static async sendViaChannels(
    userId: string,
    notification: Notification,
    channels: NotificationChannel[],
    preferences: NotificationPreference
  ): Promise<void> {
    const promises: Promise<void>[] = []

    for (const channel of channels) {
      if (channel === 'in_app' && preferences.inAppEnabled) {
        promises.push(this.markSent(notification.id))
      } else if (channel === 'email' && preferences.emailEnabled) {
        promises.push(this.sendEmail(userId, notification))
      } else if (channel === 'sms' && preferences.smsEnabled) {
        promises.push(this.sendSMS(userId, notification))
      }
    }

    await Promise.allSettled(promises)
  }

  /**
   * Send email notification
   */
  private static async sendEmail(
    userId: string,
    notification: Notification
  ): Promise<void> {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { email: true, name: true },
      })

      if (!user?.email) return

      // Build email content
      const emailContent = this.buildEmailContent(notification)

      // Send email via SendGrid or configured provider
      await sendEmail({
        to: user.email,
        subject: notification.title,
        html: emailContent,
      })

      // Update notification status
      await prisma.notification.update({
        where: { id: notification.id },
        data: {
          channels: Array.from(
            new Set([...(notification.channels || []), 'email'])
          ),
          status: 'sent',
          sentAt: new Date(),
        },
      })
    } catch (error) {
      console.error('Failed to send email notification:', error)
      await prisma.notification.update({
        where: { id: notification.id },
        data: { status: 'failed' },
      })
    }
  }

  /**
   * Send SMS notification
   */
  private static async sendSMS(
    userId: string,
    notification: Notification
  ): Promise<void> {
    try {
      // This would integrate with Twilio or similar SMS provider
      // Placeholder for implementation
      console.log(`[SMS] Sending to user ${userId}: ${notification.title}`)

      await prisma.notification.update({
        where: { id: notification.id },
        data: {
          channels: Array.from(
            new Set([...(notification.channels || []), 'sms'])
          ),
          status: 'sent',
          sentAt: new Date(),
        },
      })
    } catch (error) {
      console.error('Failed to send SMS notification:', error)
    }
  }

  /**
   * Mark notification as sent
   */
  private static async markSent(notificationId: string): Promise<void> {
    await prisma.notification.update({
      where: { id: notificationId },
      data: {
        status: 'sent',
        sentAt: new Date(),
      },
    })
  }

  /**
   * Mark notification as read
   */
  static async markAsRead(
    notificationId: string,
    userId: string
  ): Promise<Notification> {
    return prisma.notification.update({
      where: { id: notificationId },
      data: {
        readAt: new Date(),
        readBy: userId,
      },
    })
  }

  /**
   * Mark all notifications as read for user
   */
  static async markAllAsRead(userId: string): Promise<{ count: number }> {
    const result = await prisma.notification.updateMany({
      where: {
        userId,
        readAt: null,
      },
      data: {
        readAt: new Date(),
        readBy: userId,
      },
    })
    return { count: result.count }
  }

  /**
   * Delete notification
   */
  static async delete(notificationId: string): Promise<Notification> {
    return prisma.notification.update({
      where: { id: notificationId },
      data: { status: 'deleted' },
    })
  }

  /**
   * Get unread count for user
   */
  static async getUnreadCount(userId: string): Promise<number> {
    return prisma.notification.count({
      where: {
        userId,
        readAt: null,
        status: { not: 'deleted' },
      },
    })
  }

  /**
   * Get notifications for user with pagination
   */
  static async getNotifications(
    userId: string,
    options?: {
      limit?: number
      offset?: number
      type?: NotificationType
      unreadOnly?: boolean
    }
  ): Promise<{ notifications: Notification[]; total: number }> {
    const limit = Math.min(options?.limit || 20, 100)
    const offset = options?.offset || 0

    const where: any = { userId, status: { not: 'deleted' } }

    if (options?.type) {
      where.type = options.type
    }

    if (options?.unreadOnly) {
      where.readAt = null
    }

    const [notifications, total] = await Promise.all([
      prisma.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      prisma.notification.count({ where }),
    ])

    return { notifications, total }
  }

  /**
   * Update notification preferences for user
   */
  static async updatePreferences(
    userId: string,
    tenantId: string,
    preferences: Partial<NotificationPreference>
  ): Promise<NotificationPreference> {
    return prisma.notificationPreference.upsert({
      where: { userId },
      create: {
        userId,
        tenantId,
        ...preferences,
      },
      update: preferences,
    })
  }

  /**
   * Get notification preferences for user
   */
  static async getPreferences(
    userId: string
  ): Promise<NotificationPreference | null> {
    return prisma.notificationPreference.findUnique({
      where: { userId },
    })
  }

  /**
   * Build email HTML content from notification
   */
  private static buildEmailContent(notification: Notification): string {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #f5f5f5; padding: 20px; border-radius: 4px; }
            .content { padding: 20px 0; }
            .footer { border-top: 1px solid #ddd; padding: 20px 0; font-size: 12px; color: #666; }
            .cta { display: inline-block; background: #007bff; color: white; padding: 10px 20px; border-radius: 4px; text-decoration: none; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h2>${notification.title}</h2>
            </div>
            <div class="content">
              <p>${notification.message}</p>
              ${notification.description ? `<p>${notification.description}</p>` : ''}
              ${notification.link ? `<p><a href="${notification.link}" class="cta">View Details</a></p>` : ''}
            </div>
            <div class="footer">
              <p>This is an automated message. Please do not reply to this email.</p>
            </div>
          </div>
        </body>
      </html>
    `
  }
}

export type { NotificationType, NotificationChannel }
