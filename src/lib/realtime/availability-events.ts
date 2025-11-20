/**
 * Real-time event publishing for availability updates
 * Used to notify portal and admin users of availability slot changes
 */

import { globalEventEmitter } from '@/lib/event-emitter'
import type { AvailabilityUpdatedPayload } from '@/lib/realtime-events'

export const AVAILABILITY_UPDATED_EVENT = 'availability:updated'

/**
 * Publish a real-time availability update event
 * This event is broadcast to all connected clients subscribed to availability updates
 * 
 * @param payload - The availability update payload
 * @example
 * ```ts
 * publishAvailabilityUpdated({
 *   serviceId: 'service-123',
 *   action: 'created',
 *   date: '2024-01-15'
 * })
 * ```
 */
export function publishAvailabilityUpdated(payload: AvailabilityUpdatedPayload) {
  // Emit to local event emitter for immediate effects
  globalEventEmitter.emit(AVAILABILITY_UPDATED_EVENT, payload)

  // In production, this would also broadcast to connected clients via WebSocket/SSE
  // For now, the event is handled by the realtime API endpoints
  console.log('[availability] Real-time event published:', payload)
}

/**
 * Publish availability slot created event
 * @param serviceId - The service ID
 * @param teamMemberId - Optional team member ID
 * @param date - The date of the availability slot (YYYY-MM-DD format)
 */
export function publishSlotCreated(serviceId: string, date?: string, teamMemberId?: string) {
  publishAvailabilityUpdated({
    serviceId,
    teamMemberId,
    date,
    action: 'created',
  })
}

/**
 * Publish availability slot updated event
 * @param serviceId - The service ID
 * @param teamMemberId - Optional team member ID
 * @param date - The date of the availability slot (YYYY-MM-DD format)
 */
export function publishSlotUpdated(serviceId: string, date?: string, teamMemberId?: string) {
  publishAvailabilityUpdated({
    serviceId,
    teamMemberId,
    date,
    action: 'updated',
  })
}

/**
 * Publish availability slot deleted event
 * @param serviceId - The service ID
 * @param teamMemberId - Optional team member ID
 * @param date - The date of the availability slot (YYYY-MM-DD format)
 */
export function publishSlotDeleted(serviceId: string, date?: string, teamMemberId?: string) {
  publishAvailabilityUpdated({
    serviceId,
    teamMemberId,
    date,
    action: 'deleted',
  })
}

/**
 * Subscribe to availability updates (for testing or internal use)
 * @param callback - Function to call when availability updates
 * @returns Unsubscribe function
 */
export function subscribeToAvailabilityUpdates(
  callback: (payload: AvailabilityUpdatedPayload) => void
): () => void {
  return globalEventEmitter.on(AVAILABILITY_UPDATED_EVENT, callback)
}
