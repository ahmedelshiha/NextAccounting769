/**
 * Notification types and interfaces
 */

export type NotificationType =
  | 'booking_created'
  | 'booking_confirmed'
  | 'booking_cancelled'
  | 'booking_rescheduled'
  | 'task_assigned'
  | 'task_status_changed'
  | 'task_due_soon'
  | 'task_overdue'
  | 'task_comment'
  | 'document_uploaded'
  | 'document_scanned'
  | 'document_approved'
  | 'document_rejected'
  | 'message_received'
  | 'mention'
  | 'approval_requested'
  | 'approval_approved'
  | 'approval_rejected'
  | 'user_invited'
  | 'user_added_to_team'
  | 'system_alert'

export type NotificationChannel = 'in_app' | 'email' | 'sms' | 'push'

export type NotificationPriority = 'low' | 'normal' | 'high' | 'urgent'

export type NotificationStatus = 'pending' | 'sent' | 'failed' | 'deleted'

export interface NotificationPayload {
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
  priority?: NotificationPriority
  metadata?: Record<string, any>
}

export interface NotificationPreferenceSettings {
  inAppEnabled: boolean
  emailEnabled: boolean
  smsEnabled: boolean
  emailDigest: 'instant' | 'daily' | 'weekly' | 'none'
  doNotDisturb: boolean
  doNotDisturbStart?: string // HH:mm
  doNotDisturbEnd?: string   // HH:mm
  types?: Record<
    NotificationType,
    {
      enabled: boolean
      channels: NotificationChannel[]
    }
  >
}

export interface NotificationWithRelations {
  id: string
  tenantId: string
  userId: string
  type: NotificationType
  title: string
  message: string
  description?: string
  link?: string
  entityType?: string
  entityId?: string
  relatedUserId?: string
  channels: NotificationChannel[]
  priority: NotificationPriority
  status: NotificationStatus
  metadata?: Record<string, any>
  readAt?: Date
  readBy?: string
  createdAt: Date
  updatedAt: Date
  sentAt?: Date
}

export interface NotificationQueryOptions {
  limit?: number
  offset?: number
  type?: NotificationType
  unreadOnly?: boolean
  sortBy?: 'createdAt' | 'readAt'
  sortOrder?: 'asc' | 'desc'
}

export interface NotificationListResponse {
  notifications: NotificationWithRelations[]
  total: number
  unreadCount: number
  hasMore: boolean
}
