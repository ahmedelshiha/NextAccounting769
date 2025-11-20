/**
 * Shared Utilities - Central Hub
 * Re-exports all shared utility functions and constants
 * Used across Portal and Admin for consistent operations
 */

// Formatters
export {
  formatCurrency,
  formatDate,
  formatRelativeTime,
  formatFileSize,
  formatDuration,
  formatPercentage,
  formatPhoneNumber,
  truncateText,
  formatStatus,
} from './formatters';

// Validators
export {
  isValidEmail,
  isValidPhoneNumber,
  isValidURL,
  isValidSlug,
  isValidUUID,
  isValidCUID,
  isDateInPast,
  isDateInFuture,
  isValidDate,
  isNumberInRange,
  isValidLength,
  isValidCharacters,
  isValidTaxID,
  isValidPercentage,
  hasAtLeastOne,
  isValidEmailDomain,
  isStrongPassword,
} from './validators';

// Transformers
export {
  slugify,
  normalizeEmail,
  normalizePhoneNumber,
  sanitizeHtml,
  objectToQueryString,
  parseQueryString,
  capitalize,
  camelToKebab,
  kebabToCamel,
  snakeToCamel,
  deepClone,
  deepMerge,
  filterObject,
  omitKeys,
  groupBy,
  flatten,
  unique,
  sortBy,
} from './transformers';

// Constants
export {
  PAGINATION_LIMITS,
  DATE_FORMATS,
  TIMEZONES,
  ROLE_HIERARCHY,
  HTTP_STATUS,
  ERROR_CODES,
  DOCUMENT_VISIBILITY_OPTIONS,
  SERVICE_STATUS_OPTIONS,
  BOOKING_STATUS_OPTIONS,
  TASK_STATUS_OPTIONS,
  TASK_PRIORITY_OPTIONS,
  INVOICE_STATUS_OPTIONS,
  PAYMENT_STATUS_OPTIONS,
  APPROVAL_STATUS_OPTIONS,
  APPROVAL_PRIORITY_OPTIONS,
  ENTITY_TYPE_OPTIONS,
  KYC_STEP_OPTIONS,
  DEFAULT_CURRENCY,
  SUPPORTED_CURRENCIES,
  FILE_UPLOAD_CONSTRAINTS,
  RATE_LIMITING,
  CACHE_DURATIONS,
  PAGE_SIZES,
  FEATURES,
} from './constants';
