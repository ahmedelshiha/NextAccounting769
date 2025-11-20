/**
 * Real-time event publishing for booking updates
 * Used to notify portal and admin users of booking changes
 */

import { globalEventEmitter } from '@/lib/event-emitter'
import type { BookingEventPayload } from '@/lib/realtime-events'

export const BOOKING_CREATED_EVENT = 'booking-created'
export const BOOKING_UPDATED_EVENT = 'booking-updated'
export const BOOKING_DELETED_EVENT = 'booking-deleted'

/**
 * Publish a booking created event
 * Notifies both admin and portal of new bookings
 *
 * @param payload - The booking event payload
 * @example
 * ```ts
 * publishBookingCreated({
 *   id: 'booking-123',
 *   serviceId: 'service-456',
 *   action: 'created',
 * })
 * ```
 */
export function publishBookingCreated(payload: BookingEventPayload) {
  globalEventEmitter.emit(BOOKING_CREATED_EVENT, payload)
  console.log('[booking] Created event published:', payload)
}

/**
 * Publish a booking updated event
 * Notifies about status changes, team assignments, etc.
 *
 * @param payload - The booking event payload
 * @example
 * ```ts
 * publishBookingUpdated({
 *   id: 'booking-123',
 *   action: 'updated',
 * })
 * ```
 */
export function publishBookingUpdated(payload: BookingEventPayload) {
  globalEventEmitter.emit(BOOKING_UPDATED_EVENT, payload)
  console.log('[booking] Updated event published:', payload)
}

/**
 * Publish a booking deleted event
 * Notifies about booking cancellations/deletions
 *
 * @param payload - The booking event payload
 * @example
 * ```ts
 * publishBookingDeleted({
 *   id: 'booking-123',
 *   action: 'deleted',
 * })
 * ```
 */
export function publishBookingDeleted(payload: BookingEventPayload) {
  globalEventEmitter.emit(BOOKING_DELETED_EVENT, payload)
  console.log('[booking] Deleted event published:', payload)
}

/**
 * Subscribe to booking creation events (for testing or internal use)
 */
export function subscribeToBookingCreated(
  callback: (payload: BookingEventPayload) => void
): () => void {
  return globalEventEmitter.on(BOOKING_CREATED_EVENT, callback)
}

/**
 * Subscribe to booking update events (for testing or internal use)
 */
export function subscribeToBookingUpdated(
  callback: (payload: BookingEventPayload) => void
): () => void {
  return globalEventEmitter.on(BOOKING_UPDATED_EVENT, callback)
}

/**
 * Subscribe to booking deletion events (for testing or internal use)
 */
export function subscribeToBookingDeleted(
  callback: (payload: BookingEventPayload) => void
): () => void {
  return globalEventEmitter.on(BOOKING_DELETED_EVENT, callback)
}
