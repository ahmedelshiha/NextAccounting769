/**
 * Shared Formatter Utilities
 * Common formatting functions for dates, currency, file sizes, durations, etc.
 * Used across Portal and Admin for consistent data presentation
 */

/**
 * Format currency value with locale-aware formatting
 * @example formatCurrency(1000, 'USD') => "$1,000.00"
 */
export function formatCurrency(
  amount: number | null | undefined,
  currency: string = 'USD',
  locale: string = 'en-US'
): string {
  if (amount === null || amount === undefined) {
    return '-';
  }

  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    return `${currency} ${amount.toFixed(2)}`;
  }
}

/**
 * Format date to ISO string or custom format
 * @example formatDate(new Date(), 'short') => "Nov 18, 2024"
 */
export function formatDate(
  date: Date | string | null | undefined,
  format: 'short' | 'long' | 'iso' | 'time' = 'short'
): string {
  if (!date) {
    return '-';
  }

  const dateObj = typeof date === 'string' ? new Date(date) : date;

  if (isNaN(dateObj.getTime())) {
    return '-';
  }

  switch (format) {
    case 'short':
      return new Intl.DateTimeFormat('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      }).format(dateObj);

    case 'long':
      return new Intl.DateTimeFormat('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      }).format(dateObj);

    case 'time':
      return new Intl.DateTimeFormat('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }).format(dateObj);

    case 'iso':
      return dateObj.toISOString();

    default:
      return dateObj.toLocaleDateString();
  }
}

/**
 * Format date time relative to now (e.g., "2 hours ago")
 * @example formatRelativeTime(new Date(Date.now() - 3600000)) => "1 hour ago"
 */
export function formatRelativeTime(date: Date | string | null | undefined): string {
  if (!date) {
    return '-';
  }

  const dateObj = typeof date === 'string' ? new Date(date) : date;

  if (isNaN(dateObj.getTime())) {
    return '-';
  }

  const now = new Date();
  const seconds = Math.floor((now.getTime() - dateObj.getTime()) / 1000);

  if (seconds < 0) {
    const absSeconds = Math.abs(seconds);
    if (absSeconds < 60) return 'in a moment';
    if (absSeconds < 3600) return `in ${Math.floor(absSeconds / 60)} minute${Math.floor(absSeconds / 60) > 1 ? 's' : ''}`;
    if (absSeconds < 86400) return `in ${Math.floor(absSeconds / 3600)} hour${Math.floor(absSeconds / 3600) > 1 ? 's' : ''}`;
    return `in ${Math.floor(absSeconds / 86400)} day${Math.floor(absSeconds / 86400) > 1 ? 's' : ''}`;
  }

  if (seconds < 60) return 'just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)} minute${Math.floor(seconds / 60) > 1 ? 's' : ''} ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)} hour${Math.floor(seconds / 3600) > 1 ? 's' : ''} ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)} day${Math.floor(seconds / 86400) > 1 ? 's' : ''} ago`;
  if (seconds < 2592000) return `${Math.floor(seconds / 604800)} week${Math.floor(seconds / 604800) > 1 ? 's' : ''} ago`;
  if (seconds < 31536000) return `${Math.floor(seconds / 2592000)} month${Math.floor(seconds / 2592000) > 1 ? 's' : ''} ago`;

  return `${Math.floor(seconds / 31536000)} year${Math.floor(seconds / 31536000) > 1 ? 's' : ''} ago`;
}

/**
 * Format file size (bytes) to human readable format
 * @example formatFileSize(1536) => "1.5 KB"
 */
export function formatFileSize(bytes: number | null | undefined): string {
  if (bytes === null || bytes === undefined) {
    return '-';
  }

  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Format duration (minutes) to human readable format
 * @example formatDuration(150) => "2 hours 30 mins"
 */
export function formatDuration(minutes: number | null | undefined): string {
  if (minutes === null || minutes === undefined) {
    return '-';
  }

  if (minutes < 1) return 'Less than a minute';

  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;

  if (hours === 0) {
    return `${mins} minute${mins > 1 ? 's' : ''}`;
  }

  if (mins === 0) {
    return `${hours} hour${hours > 1 ? 's' : ''}`;
  }

  return `${hours} hour${hours > 1 ? 's' : ''} ${mins} minute${mins > 1 ? 's' : ''}`;
}

/**
 * Format percentage with symbol
 * @example formatPercentage(0.75) => "75%"
 */
export function formatPercentage(value: number | null | undefined, decimals: number = 0): string {
  if (value === null || value === undefined) {
    return '-';
  }

  return `${(value * 100).toFixed(decimals)}%`;
}

/**
 * Format phone number
 * @example formatPhoneNumber("12125551234") => "(212) 555-1234"
 */
export function formatPhoneNumber(phone: string | null | undefined): string {
  if (!phone) return '-';

  const cleaned = phone.replace(/\D/g, '');

  if (cleaned.length === 10) {
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
  }

  if (cleaned.length === 11 && cleaned[0] === '1') {
    return `+1 (${cleaned.slice(1, 4)}) ${cleaned.slice(4, 7)}-${cleaned.slice(7)}`;
  }

  return phone;
}

/**
 * Truncate text to maximum length with ellipsis
 * @example truncateText("Hello World", 8) => "Hello..."
 */
export function truncateText(text: string | null | undefined, maxLength: number = 50): string {
  if (!text) return '';

  if (text.length <= maxLength) return text;

  return text.slice(0, maxLength - 3) + '...';
}

/**
 * Format status as readable label
 * @example formatStatus("IN_PROGRESS") => "In Progress"
 */
export function formatStatus(status: string | null | undefined): string {
  if (!status) return '-';

  return status
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}
