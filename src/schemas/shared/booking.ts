/**
 * Booking Entity Validation Schemas
 * Using Zod for runtime validation of Booking data
 */

import { z } from 'zod';
import { BookingStatus } from '@/types/shared';

/**
 * Base booking schema
 */
export const BookingBaseSchema = z.object({
  serviceId: z.string().cuid('Invalid service ID'),
  scheduledAt: z.string().datetime('Invalid date format'),
  duration: z.number().int().positive('Duration must be positive').optional(),
  timezone: z.string().optional().nullable(),
  notes: z.string().max(2000).optional().nullable(),
  status: z.nativeEnum(BookingStatus).default(BookingStatus.PENDING),
});

/**
 * Create booking schema (client/portal)
 */
export const BookingCreateSchema = BookingBaseSchema.extend({
  clientId: z.string().cuid().optional(), // Will use current user if not provided
});

/**
 * Update booking schema (admin)
 */
export const BookingUpdateAdminSchema = BookingBaseSchema.extend({
  internalNotes: z.string().max(2000).optional().nullable(),
  assignedTeamMemberId: z.string().cuid().optional().nullable(),
  price: z.number().positive().optional().nullable(),
  discountApplied: z.number().min(0).optional().nullable(),
}).partial();

/**
 * Update booking schema (alias for forms)
 */
export const BookingUpdateSchema = BookingUpdateAdminSchema;

/**
 * Booking list filters schema
 */
export const BookingFiltersSchema = z.object({
  status: z.string().optional(),
  serviceId: z.string().optional(),
  clientId: z.string().optional(),
  assignedTeamMemberId: z.string().optional(),
  fromDate: z.string().optional(),
  toDate: z.string().optional(),
  search: z.string().optional(),
  limit: z.number().int().min(1).max(100).default(50),
  offset: z.number().int().min(0).default(0),
  sortBy: z.enum(['scheduledAt', 'createdAt', 'status']).optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
});

/**
 * Booking reschedule schema
 */
export const BookingRescheduleSchema = z.object({
  bookingId: z.string().cuid(),
  newScheduledAt: z.string().datetime('Invalid date format'),
  reason: z.string().max(500).optional(),
});

/**
 * Booking cancellation schema
 */
export const BookingCancellationSchema = z.object({
  bookingId: z.string().cuid(),
  reason: z.string().max(500).optional(),
  refundPercentage: z.number().min(0).max(100).optional(),
});

/**
 * Booking confirmation reminder schema
 */
export const BookingConfirmationSchema = z.object({
  bookingId: z.string().cuid(),
  method: z.enum(['email', 'sms', 'both']).default('email'),
  sendToClient: z.boolean().default(true),
  sendToTeam: z.boolean().default(true),
});

/**
 * Availability slot schema
 */
export const AvailabilitySlotSchema = z.object({
  serviceId: z.string().cuid(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (YYYY-MM-DD)'),
  startTime: z.string().regex(/^\d{2}:\d{2}$/, 'Invalid time format (HH:MM)'),
  endTime: z.string().regex(/^\d{2}:\d{2}$/, 'Invalid time format (HH:MM)'),
  maxBookings: z.number().int().positive().default(1),
});

/**
 * Bulk booking operation schema
 */
export const BookingBulkActionSchema = z.object({
  action: z.enum(['confirm', 'cancel', 'reschedule', 'send-reminder']),
  bookingIds: z.array(z.string().cuid()).min(1),
  value: z.union([z.string(), z.number()]).optional(),
});

/**
 * Infer TypeScript types from schemas
 */
export type BookingCreate = z.infer<typeof BookingCreateSchema>;
export type BookingUpdate = z.infer<typeof BookingUpdateSchema>;
export type BookingUpdateAdmin = z.infer<typeof BookingUpdateAdminSchema>;
export type BookingFilters = z.infer<typeof BookingFiltersSchema>;
export type BookingReschedule = z.infer<typeof BookingRescheduleSchema>;
export type BookingCancellation = z.infer<typeof BookingCancellationSchema>;
export type BookingConfirmation = z.infer<typeof BookingConfirmationSchema>;
export type AvailabilitySlot = z.infer<typeof AvailabilitySlotSchema>;
export type BookingBulkAction = z.infer<typeof BookingBulkActionSchema>;

/**
 * Helper validation functions
 */
export function validateBookingCreate(data: unknown) {
  return BookingCreateSchema.parse(data);
}

export function safeParseBookingCreate(data: unknown) {
  return BookingCreateSchema.safeParse(data);
}

export function validateBookingReschedule(data: unknown) {
  return BookingRescheduleSchema.parse(data);
}
