/**
 * Centralized admin realtime event contracts used across the dashboard.
 * These types and constants help ensure consistent event names and payload shapes.
 */

// Event name constants
export const ADMIN_REALTIME_EVENTS = [
  'service-request-updated',
  'task-updated',
  'availability-updated',
  'booking-updated',
  'booking-created',
  'booking-deleted',
  'system_alert',
  'heartbeat',
  'ready',
  'user-created',
  'user-updated',
  'user-deleted',
  'role-updated',
  'permission-changed',
  'user-management-settings-updated'
] as const

export type AdminRealtimeEventType = typeof ADMIN_REALTIME_EVENTS[number] | 'all'

// Payload contracts for common events
export type ServiceRequestUpdatedPayload = {
  serviceRequestId: string | number
  action?: 'created' | 'updated' | 'deleted' | 'rescheduled' | 'task-created'
  status?: string
  taskId?: string | number
}

export type TaskUpdatedPayload = {
  taskId: string | number
  serviceRequestId?: string | number
  action?: 'created' | 'updated' | 'deleted' | 'completed'
}

export type AvailabilityUpdatedPayload = {
  serviceId: string | number
  teamMemberId?: string | number
  date?: string
  action?: 'created' | 'updated' | 'deleted'
}

export type BookingEventPayload = {
  id: string | number
  serviceId?: string | number
  action?: 'created' | 'updated' | 'deleted'
}

export type SystemAlertPayload = {
  level: 'info' | 'warn' | 'error'
  message: string
  code?: string
}

export type HeartbeatPayload = { at: string }

export type UserEventPayload = {
  userId: string | number
  action?: 'created' | 'updated' | 'deleted'
  userEmail?: string
  userName?: string
  userRole?: string
  changedFields?: string[]
}

export type RoleEventPayload = {
  roleId: string | number
  roleName?: string
  action?: 'created' | 'updated' | 'deleted'
  permissions?: string[]
}

export type PermissionEventPayload = {
  permissionId: string | number
  action?: 'created' | 'updated' | 'deleted'
  affectedRoles?: string[]
  permissionName?: string
}

export type UserManagementSettingsPayload = {
  settingKey: string
  action?: 'updated' | 'deleted'
  value?: any
}

// Discriminated union for strongly typed admin realtime event messages
export type AdminRealtimeEventMessage =
  | { type: 'service-request-updated'; data: ServiceRequestUpdatedPayload; timestamp: string; userId?: string }
  | { type: 'task-updated'; data: TaskUpdatedPayload; timestamp: string; userId?: string }
  | { type: 'availability-updated'; data: AvailabilityUpdatedPayload; timestamp: string; userId?: string }
  | { type: 'booking-updated' | 'booking-created' | 'booking-deleted'; data: BookingEventPayload; timestamp: string; userId?: string }
  | { type: 'system_alert'; data: SystemAlertPayload; timestamp: string; userId?: string }
  | { type: 'heartbeat' | 'ready'; data: HeartbeatPayload | Record<string, never>; timestamp: string; userId?: string }
  | { type: 'user-created' | 'user-updated' | 'user-deleted'; data: UserEventPayload; timestamp: string; userId?: string }
  | { type: 'role-updated'; data: RoleEventPayload; timestamp: string; userId?: string }
  | { type: 'permission-changed'; data: PermissionEventPayload; timestamp: string; userId?: string }
  | { type: 'user-management-settings-updated'; data: UserManagementSettingsPayload; timestamp: string; userId?: string }

// Type guard helper
export function isAdminRealtimeEventMessage(input: any): input is AdminRealtimeEventMessage {
  return input && typeof input === 'object' && typeof input.type === 'string' && typeof input.timestamp === 'string'
}
