import prisma from '@/lib/prisma'
import { NotificationHub } from '@/lib/notifications/hub'
import type { NotificationType, NotificationChannel } from '@/types/notifications'

/**
 * System events that trigger across the application
 */
export type SystemEvent =
  | 'service:created'
  | 'service:updated'
  | 'service:deleted'
  | 'booking:created'
  | 'booking:confirmed'
  | 'booking:cancelled'
  | 'booking:rescheduled'
  | 'task:created'
  | 'task:assigned'
  | 'task:status:changed'
  | 'task:completed'
  | 'task:due-soon'
  | 'task:overdue'
  | 'task:comment:added'
  | 'document:uploaded'
  | 'document:scanned'
  | 'document:approved'
  | 'document:rejected'
  | 'message:sent'
  | 'user:invited'
  | 'user:joined'
  | 'approval:requested'
  | 'approval:approved'
  | 'approval:rejected'
  | 'approval:expired'
  | 'workflow:triggered'
  | 'workflow:completed'

/**
 * Event payload types
 */
export interface EventPayload {
  event: SystemEvent
  tenantId: string
  userId?: string
  entityType?: string
  entityId?: string
  data?: Record<string, any>
  timestamp?: Date
}

/**
 * Event handler callback
 */
export type EventHandler = (payload: EventPayload) => Promise<void> | void

/**
 * Event Emitter - Centralized event system for application-wide events
 */
export class EventEmitter {
  private static handlers: Map<SystemEvent, Set<EventHandler>> = new Map()
  private static history: EventPayload[] = []
  private static maxHistory = 1000

  /**
   * Subscribe to an event type
   */
  static subscribe(event: SystemEvent, handler: EventHandler): () => void {
    if (!this.handlers.has(event)) {
      this.handlers.set(event, new Set())
    }

    this.handlers.get(event)!.add(handler)

    // Return unsubscribe function
    return () => {
      this.handlers.get(event)?.delete(handler)
    }
  }

  /**
   * Emit an event to all subscribers
   */
  static async emit(payload: EventPayload): Promise<void> {
    const { event, tenantId, userId, entityType, entityId, data } = payload

    // Store in history
    this.storeHistory(payload)

    // Store in database for audit trail
    try {
      await prisma.auditEvent.create({
        data: {
          tenantId,
          userId,
          type: event,
          resource: entityType,
          details: { ...data, entityId },
        },
      })
    } catch (error) {
      console.error('Failed to store audit event:', error)
    }

    // Execute all handlers for this event
    const handlers = this.handlers.get(event)
    if (handlers) {
      const promises = Array.from(handlers).map((handler) =>
        Promise.resolve()
          .then(() => handler(payload))
          .catch((error) => {
            console.error(`Error in event handler for ${event}:`, error)
          })
      )

      await Promise.allSettled(promises)
    }

    // Handle event-specific workflows
    await this.handleEventWorkflows(payload)
  }

  /**
   * Handle event-triggered workflows
   */
  private static async handleEventWorkflows(
    payload: EventPayload
  ): Promise<void> {
    const { event, tenantId, userId, entityId } = payload

    // Map events to notification types
    const eventToNotification: Record<SystemEvent, NotificationType | null> = {
      'service:created': null,
      'service:updated': null,
      'service:deleted': null,
      'booking:created': 'booking_created',
      'booking:confirmed': 'booking_confirmed',
      'booking:cancelled': 'booking_cancelled',
      'booking:rescheduled': 'booking_rescheduled',
      'task:created': 'task_assigned',
      'task:assigned': 'task_assigned',
      'task:status:changed': 'task_status_changed',
      'task:completed': 'task_status_changed',
      'task:due-soon': 'task_due_soon',
      'task:overdue': 'task_overdue',
      'task:comment:added': 'task_comment',
      'document:uploaded': 'document_uploaded',
      'document:scanned': null,
      'document:approved': 'document_approved',
      'document:rejected': 'document_rejected',
      'message:sent': 'message_received',
      'user:invited': 'user_invited',
      'user:joined': 'user_added_to_team',
      'approval:requested': 'approval_requested',
      'approval:approved': 'approval_approved',
      'approval:rejected': 'approval_rejected',
      'approval:expired': null,
      'workflow:triggered': null,
      'workflow:completed': null,
    }

    const notificationType = eventToNotification[event]
    if (!notificationType) return

    // Handle specific event types
    switch (event) {
      case 'task:assigned': {
        const task = await prisma.task.findUnique({
          where: { id: entityId },
          include: { assignee: true },
        })

        if (task?.assignee) {
          await NotificationHub.send({
            userId: task.assignee.id,
            tenantId,
            type: notificationType,
            title: 'Task Assigned',
            message: `You have been assigned a new task: ${task.title}`,
            link: `/portal/tasks/${entityId}`,
            entityType: 'task',
            entityId,
            relatedUserId: userId,
            priority: 'high',
          })
        }
        break
      }

      case 'booking:created': {
        // Notify admin of new booking
        const adminUsers = await prisma.user.findMany({
          where: { tenantId, role: 'ADMIN' },
          select: { id: true },
        })

        for (const admin of adminUsers) {
          await NotificationHub.send({
            userId: admin.id,
            tenantId,
            type: notificationType,
            title: 'New Booking',
            message: 'A new booking has been made',
            link: `/admin/bookings/${entityId}`,
            entityType: 'booking',
            entityId,
            relatedUserId: userId,
          })
        }
        break
      }

      case 'document:approved': {
        // Notify uploader
        const document = await prisma.attachment.findUnique({
          where: { id: entityId },
        })

        if (document && document.uploaderId) {
          await NotificationHub.send({
            userId: document.uploaderId,
            tenantId,
            type: notificationType,
            title: 'Document Approved',
            message: 'Your document has been approved',
            link: `/portal/documents/${entityId}`,
            entityType: 'document',
            entityId,
            relatedUserId: userId,
          })
        }
        break
      }

      case 'approval:requested': {
        // Notify approver
        const approval = await prisma.approval.findUnique({
          where: { id: entityId },
          include: { approver: true },
        })

        if (approval?.approver) {
          await NotificationHub.send({
            userId: approval.approver.id,
            tenantId,
            type: notificationType,
            title: 'Approval Request',
            message: `An item requires your approval: ${approval.itemType}`,
            link: `/portal/approvals/${entityId}`,
            entityType: 'approval',
            entityId,
            relatedUserId: userId,
            priority: 'high',
          })
        }
        break
      }
    }
  }

  /**
   * Store event in history
   */
  private static storeHistory(payload: EventPayload): void {
    this.history.push({
      ...payload,
      timestamp: new Date(),
    })

    // Keep history size manageable
    if (this.history.length > this.maxHistory) {
      this.history = this.history.slice(-this.maxHistory)
    }
  }

  /**
   * Get event history
   */
  static getHistory(filter?: {
    event?: SystemEvent
    tenantId?: string
    limit?: number
  }): EventPayload[] {
    let result = [...this.history]

    if (filter?.event) {
      result = result.filter((e) => e.event === filter.event)
    }

    if (filter?.tenantId) {
      result = result.filter((e) => e.tenantId === filter.tenantId)
    }

    if (filter?.limit) {
      result = result.slice(-filter.limit)
    }

    return result
  }

  /**
   * Clear event history
   */
  static clearHistory(): void {
    this.history = []
  }

  /**
   * Get all registered event types
   */
  static getEventTypes(): SystemEvent[] {
    return Array.from(this.handlers.keys())
  }

  /**
   * Get handler count for an event
   */
  static getHandlerCount(event: SystemEvent): number {
    return this.handlers.get(event)?.size || 0
  }
}

export default EventEmitter
