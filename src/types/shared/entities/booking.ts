/**
 * Shared Booking Entity Type Definitions
 * Used by both Admin and Portal for booking management
 * 
 * [PORTAL] = visible to portal users
 * [ADMIN] = visible only to admins
 */

/**
 * Booking status enumeration
 */
export enum BookingStatus {
  DRAFT = 'DRAFT',
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
  NO_SHOW = 'NO_SHOW',
  RESCHEDULED = 'RESCHEDULED',
}

/**
 * Core Booking entity
 */
export interface Booking {
  // Core identification
  id: string; // [PORTAL] [ADMIN]
  tenantId: string; // [ADMIN]
  
  // Reference fields
  serviceId: string; // [PORTAL] [ADMIN]
  clientId: string; // [PORTAL] [ADMIN]
  assignedTeamMemberId?: string | null; // [ADMIN]
  
  // Scheduling
  scheduledAt: string; // ISO-8601 datetime [PORTAL] [ADMIN]
  duration: number; // Minutes [PORTAL] [ADMIN]
  timezone?: string | null; // [PORTAL] [ADMIN]
  
  // Status and tracking
  status: BookingStatus; // [PORTAL] [ADMIN]
  confirmedAt?: string | null; // ISO-8601 datetime [ADMIN]
  completedAt?: string | null; // ISO-8601 datetime [ADMIN]
  cancelledAt?: string | null; // ISO-8601 datetime [ADMIN]
  
  // Cancellation information
  cancellationReason?: string | null; // [ADMIN]
  cancellationRequestedBy?: string | null; // [ADMIN]
  
  // Notes and metadata
  notes?: string | null; // [PORTAL] [ADMIN]
  internalNotes?: string | null; // [ADMIN]
  metadata?: Record<string, unknown> | null; // [ADMIN]
  
  // Admin-only operational fields
  reminderSentAt?: string | null; // [ADMIN]
  confirmationSentAt?: string | null; // [ADMIN]
  followUpSentAt?: string | null; // [ADMIN]
  
  // Pricing information (if different from service default)
  price?: number | null; // [PORTAL] [ADMIN]
  discountApplied?: number | null; // [ADMIN]
  finalPrice?: number | null; // [ADMIN]
  
  // Timestamps
  createdAt: string; // ISO-8601 datetime
  updatedAt: string; // ISO-8601 datetime
  
  // Relations (optional, depends on usage context)
  service?: {
    id: string;
    name: string;
    slug: string;
    shortDesc?: string | null;
    price?: number | null;
  };
  
  client?: {
    id: string;
    name: string | null;
    email: string;
  };
  
  assignedTeamMember?: {
    id: string;
    name: string | null;
    email: string;
  } | null;
}

/**
 * Booking form data for create/update
 */
export interface BookingFormData {
  serviceId: string;
  scheduledAt: string;
  duration?: number;
  timezone?: string | null;
  notes?: string | null;
  internalNotes?: string | null;
  status?: BookingStatus;
  assignedTeamMemberId?: string | null;
  price?: number | null;
  discountApplied?: number | null;
}

/**
 * Booking filters for list queries
 */
export interface BookingFilters {
  status?: BookingStatus | 'all';
  serviceId?: string;
  clientId?: string;
  assignedTeamMemberId?: string;
  fromDate?: string;
  toDate?: string;
  search?: string;
}

/**
 * Booking list request parameters
 */
export interface BookingListParams extends BookingFilters {
  limit?: number;
  offset?: number;
  sortBy?: 'scheduledAt' | 'createdAt' | 'status';
  sortOrder?: 'asc' | 'desc';
}

/**
 * Booking availability slot (admin-only)
 */
export interface AvailabilitySlot {
  id: string;
  serviceId: string;
  date: string; // ISO-8601 date (YYYY-MM-DD)
  startTime: string; // HH:MM format
  endTime: string; // HH:MM format
  isAvailable: boolean;
  maxBookings: number;
  currentBookings: number;
  createdAt: string;
  updatedAt: string;
}

/**
 * Booking calendar view (admin)
 */
export interface BookingCalendarView {
  serviceId: string;
  month: number;
  year: number;
  days: Array<{
    date: string;
    slots: AvailabilitySlot[];
    totalBookings: number;
  }>;
}

/**
 * Portal-safe booking view (excludes admin-only fields)
 */
export type BookingPortalView = Omit<
  Booking,
  | 'assignedTeamMemberId'
  | 'confirmedAt'
  | 'completedAt'
  | 'cancelledAt'
  | 'cancellationReason'
  | 'cancellationRequestedBy'
  | 'internalNotes'
  | 'reminderSentAt'
  | 'confirmationSentAt'
  | 'followUpSentAt'
  | 'discountApplied'
  | 'finalPrice'
  | 'metadata'
>;

/**
 * Booking list API response
 */
export interface BookingListResponse {
  bookings: Booking[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

/**
 * Booking statistics (admin-only)
 */
export interface BookingStats {
  total: number;
  confirmed: number;
  pending: number;
  completed: number;
  cancelled: number;
  noShow: number;
  conversionRate: number;
  averageLeadTime: number; // in days
  totalRevenue: number;
  cancellationRate: number;
}

/**
 * Booking confirmation data
 */
export interface BookingConfirmation {
  bookingId: string;
  clientEmail: string;
  serviceName: string;
  scheduledAt: string;
  duration: number;
  teamMemberName?: string;
  notes?: string;
  confirmationCode: string;
  reschedulingUrl: string;
  cancellationUrl: string;
}

/**
 * Booking reschedule request
 */
export interface BookingRescheduleRequest {
  bookingId: string;
  newScheduledAt: string;
  reason?: string;
}

/**
 * Booking cancellation request
 */
export interface BookingCancellationRequest {
  bookingId: string;
  reason?: string;
  refundPercentage?: number;
}
