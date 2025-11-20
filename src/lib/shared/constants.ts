/**
 * Shared Constants and Enums
 * Global constants used across Portal and Admin
 */

/**
 * Pagination default values
 */
export const PAGINATION_LIMITS = {
  MIN: 1,
  MAX: 100,
  DEFAULT: 50,
  SMALL: 10,
  MEDIUM: 25,
  LARGE: 100,
} as const;

/**
 * Standard date format strings
 */
export const DATE_FORMATS = {
  ISO: 'YYYY-MM-DD',
  ISO_TIME: 'YYYY-MM-DDTHH:mm:ss',
  SHORT: 'MMM DD, YYYY',
  LONG: 'MMMM DD, YYYY',
  FULL: 'DDDD, MMMM DD, YYYY',
  TIME: 'HH:mm',
  TIME_WITH_SECONDS: 'HH:mm:ss',
  DATETIME_SHORT: 'MMM DD, YYYY HH:mm',
  DATETIME_LONG: 'MMMM DD, YYYY HH:mm:ss',
} as const;

/**
 * Common timezones
 */
export const TIMEZONES = [
  'UTC',
  'America/New_York',
  'America/Chicago',
  'America/Denver',
  'America/Los_Angeles',
  'Europe/London',
  'Europe/Paris',
  'Europe/Berlin',
  'Asia/Tokyo',
  'Asia/Shanghai',
  'Asia/Hong_Kong',
  'Asia/Singapore',
  'Australia/Sydney',
  'Australia/Melbourne',
] as const;

/**
 * User role hierarchy (0 = least privileged, higher = more privileged)
 */
export const ROLE_HIERARCHY = {
  CLIENT: 0,
  TEAM_MEMBER: 10,
  ADMIN: 20,
  SUPER_ADMIN: 30,
} as const;

/**
 * HTTP status codes
 */
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  INTERNAL_SERVER_ERROR: 500,
  SERVICE_UNAVAILABLE: 503,
} as const;

/**
 * Error codes
 */
export const ERROR_CODES = {
  // Authentication
  INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  SESSION_EXPIRED: 'SESSION_EXPIRED',

  // Validation
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  INVALID_REQUEST: 'INVALID_REQUEST',
  MISSING_REQUIRED_FIELD: 'MISSING_REQUIRED_FIELD',

  // Resource
  NOT_FOUND: 'NOT_FOUND',
  ALREADY_EXISTS: 'ALREADY_EXISTS',
  RESOURCE_CONFLICT: 'RESOURCE_CONFLICT',

  // Business logic
  INVALID_OPERATION: 'INVALID_OPERATION',
  STATE_ERROR: 'STATE_ERROR',
  PERMISSION_DENIED: 'PERMISSION_DENIED',

  // External
  EXTERNAL_SERVICE_ERROR: 'EXTERNAL_SERVICE_ERROR',
  PAYMENT_FAILED: 'PAYMENT_FAILED',
  EMAIL_SEND_FAILED: 'EMAIL_SEND_FAILED',

  // System
  INTERNAL_SERVER_ERROR: 'INTERNAL_SERVER_ERROR',
  DATABASE_ERROR: 'DATABASE_ERROR',
  SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE',
} as const;

/**
 * Document visibility options
 */
export const DOCUMENT_VISIBILITY_OPTIONS = ['PRIVATE', 'INTERNAL', 'SHARED', 'PUBLIC'] as const;

/**
 * Service status options
 */
export const SERVICE_STATUS_OPTIONS = ['DRAFT', 'ACTIVE', 'INACTIVE', 'DEPRECATED', 'RETIRED'] as const;

/**
 * Booking status options
 */
export const BOOKING_STATUS_OPTIONS = [
  'DRAFT',
  'PENDING',
  'CONFIRMED',
  'IN_PROGRESS',
  'COMPLETED',
  'CANCELLED',
  'NO_SHOW',
  'RESCHEDULED',
] as const;

/**
 * Task status options
 */
export const TASK_STATUS_OPTIONS = ['OPEN', 'IN_PROGRESS', 'IN_REVIEW', 'BLOCKED', 'COMPLETED', 'CANCELLED', 'ON_HOLD'] as const;

/**
 * Task priority options
 */
export const TASK_PRIORITY_OPTIONS = ['LOW', 'NORMAL', 'HIGH', 'URGENT', 'CRITICAL'] as const;

/**
 * Invoice status options
 */
export const INVOICE_STATUS_OPTIONS = [
  'DRAFT',
  'SENT',
  'VIEWED',
  'OVERDUE',
  'PAID',
  'PARTIALLY_PAID',
  'CANCELLED',
  'REFUNDED',
] as const;

/**
 * Payment status options
 */
export const PAYMENT_STATUS_OPTIONS = ['NOT_STARTED', 'IN_PROGRESS', 'COMPLETED', 'FAILED', 'REFUNDED'] as const;

/**
 * Approval status options
 */
export const APPROVAL_STATUS_OPTIONS = ['PENDING', 'APPROVED', 'REJECTED', 'DELEGATED', 'ESCALATED', 'EXPIRED'] as const;

/**
 * Approval priority options
 */
export const APPROVAL_PRIORITY_OPTIONS = ['LOW', 'NORMAL', 'HIGH', 'URGENT'] as const;

/**
 * Entity type options
 */
export const ENTITY_TYPE_OPTIONS = [
  'SOLE_PROPRIETOR',
  'PARTNERSHIP',
  'LLC',
  'CORPORATION',
  'NONPROFIT',
  'GOVERNMENT',
  'OTHER',
] as const;

/**
 * KYC step options
 */
export const KYC_STEP_OPTIONS = [
  'BASIC_INFO',
  'BUSINESS_INFO',
  'OWNERSHIP_INFO',
  'TAX_INFO',
  'BANKING_INFO',
  'DOCUMENT_UPLOAD',
  'IDENTITY_VERIFICATION',
  'FINAL_REVIEW',
] as const;

/**
 * Default currency
 */
export const DEFAULT_CURRENCY = 'USD' as const;

/**
 * Supported currencies
 */
export const SUPPORTED_CURRENCIES = [
  'USD', // US Dollar
  'EUR', // Euro
  'GBP', // British Pound
  'JPY', // Japanese Yen
  'AUD', // Australian Dollar
  'CAD', // Canadian Dollar
  'CHF', // Swiss Franc
  'CNY', // Chinese Yuan
  'INR', // Indian Rupee
  'MXN', // Mexican Peso
] as const;

/**
 * File upload constraints
 */
export const FILE_UPLOAD_CONSTRAINTS = {
  MAX_FILE_SIZE_MB: 50,
  MAX_FILES_PER_UPLOAD: 10,
  ALLOWED_DOCUMENT_TYPES: [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'image/jpeg',
    'image/png',
    'image/gif',
    'text/plain',
  ],
} as const;

/**
 * API rate limiting defaults
 */
export const RATE_LIMITING = {
  DEFAULT_REQUESTS_PER_MINUTE: 60,
  DEFAULT_REQUESTS_PER_HOUR: 1000,
  AUTH_REQUESTS_PER_MINUTE: 5,
  API_REQUESTS_PER_MINUTE: 100,
} as const;

/**
 * Cache duration defaults (in seconds)
 */
export const CACHE_DURATIONS = {
  SHORT: 5 * 60, // 5 minutes
  MEDIUM: 30 * 60, // 30 minutes
  LONG: 60 * 60, // 1 hour
  VERY_LONG: 24 * 60 * 60, // 1 day
} as const;

/**
 * Default page size for different views
 */
export const PAGE_SIZES = {
  COMPACT: 5,
  SMALL: 10,
  MEDIUM: 25,
  LARGE: 50,
  EXTRA_LARGE: 100,
} as const;

/**
 * Feature flags (managed separately)
 */
export const FEATURES = {
  ENABLE_BOOKING: true,
  ENABLE_TASKS: true,
  ENABLE_INVOICING: true,
  ENABLE_APPROVALS: true,
  ENABLE_MESSAGING: true,
  ENABLE_DOCUMENTS: true,
  ENABLE_KYC: true,
  ENABLE_COMPLIANCE: true,
  ENABLE_REALTIME_SYNC: true,
} as const;
