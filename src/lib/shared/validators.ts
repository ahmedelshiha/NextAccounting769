/**
 * Shared Validation Utilities
 * Common validation functions for emails, URLs, slugs, dates, etc.
 * Used across Portal and Admin for consistent data validation
 */

/**
 * Validate email address format
 * @example isValidEmail("user@example.com") => true
 */
export function isValidEmail(email: string | null | undefined): boolean {
  if (!email) return false;

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate phone number (basic validation)
 * @example isValidPhoneNumber("+12125551234") => true
 */
export function isValidPhoneNumber(phone: string | null | undefined): boolean {
  if (!phone) return false;

  // Remove non-digit characters except leading +
  const cleaned = phone.replace(/[^\d+]/g, '');

  // Check if it has between 10 and 15 digits (E.164 standard)
  return cleaned.length >= 10 && cleaned.length <= 15;
}

/**
 * Validate URL format
 * @example isValidURL("https://example.com") => true
 */
export function isValidURL(url: string | null | undefined): boolean {
  if (!url) return false;

  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * Validate slug format (lowercase, hyphens, numbers, no spaces)
 * @example isValidSlug("my-service-name") => true
 */
export function isValidSlug(slug: string | null | undefined): boolean {
  if (!slug) return false;

  const slugRegex = /^[a-z0-9-]+$/;
  return slugRegex.test(slug);
}

/**
 * Validate UUID format (v4)
 * @example isValidUUID("550e8400-e29b-41d4-a716-446655440000") => true
 */
export function isValidUUID(uuid: string | null | undefined): boolean {
  if (!uuid) return false;

  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}

/**
 * Validate CUID format
 * @example isValidCUID("clhx1a3d0000008l5g8d0d9p") => true
 */
export function isValidCUID(cuid: string | null | undefined): boolean {
  if (!cuid) return false;

  // CUID format: starts with 'c' followed by 24 alphanumeric characters
  return /^c[0-9a-z]{24}$/i.test(cuid);
}

/**
 * Validate date is in the past
 * @example isDateInPast(new Date(Date.now() - 1000)) => true
 */
export function isDateInPast(date: Date | string | null | undefined): boolean {
  if (!date) return false;

  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return dateObj.getTime() < Date.now();
}

/**
 * Validate date is in the future
 * @example isDateInFuture(new Date(Date.now() + 1000)) => true
 */
export function isDateInFuture(date: Date | string | null | undefined): boolean {
  if (!date) return false;

  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return dateObj.getTime() > Date.now();
}

/**
 * Validate date is valid (not invalid date)
 * @example isValidDate(new Date()) => true
 */
export function isValidDate(date: Date | string | null | undefined): boolean {
  if (!date) return false;

  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return !isNaN(dateObj.getTime());
}

/**
 * Validate that number is within range
 * @example isNumberInRange(5, 0, 10) => true
 */
export function isNumberInRange(value: number, min: number, max: number): boolean {
  return value >= min && value <= max;
}

/**
 * Validate string length
 * @example isValidLength("hello", 3, 10) => true
 */
export function isValidLength(value: string | null | undefined, minLength: number, maxLength: number): boolean {
  if (!value) return false;

  return value.length >= minLength && value.length <= maxLength;
}

/**
 * Validate that string contains only allowed characters
 * @example isValidCharacters("hello123", /^[a-z0-9]+$/) => true
 */
export function isValidCharacters(value: string | null | undefined, pattern: RegExp): boolean {
  if (!value) return false;

  return pattern.test(value);
}

/**
 * Validate tax ID format (very basic - actual validation depends on country)
 * @example isValidTaxID("12-3456789") => true (basic format only)
 */
export function isValidTaxID(taxId: string | null | undefined): boolean {
  if (!taxId) return false;

  // Basic validation - can be customized per country
  return taxId.length >= 5 && taxId.length <= 20;
}

/**
 * Validate percentage value (0-100)
 * @example isValidPercentage(50) => true
 */
export function isValidPercentage(value: number | null | undefined): boolean {
  if (value === null || value === undefined) return false;

  return value >= 0 && value <= 100;
}

/**
 * Validate that at least one value in array is provided
 * @example hasAtLeastOne(["", null, "value"]) => true
 */
export function hasAtLeastOne(values: any[]): boolean {
  return values.some((v) => v != null && v !== '' && v !== false);
}

/**
 * Validate email domain is allowed
 * @example isValidEmailDomain("user@example.com", ["example.com"]) => true
 */
export function isValidEmailDomain(email: string | null | undefined, allowedDomains: string[]): boolean {
  if (!email || !isValidEmail(email)) return false;

  const domain = email.split('@')[1];
  return allowedDomains.includes(domain);
}

/**
 * Validate password strength
 * Requirements: min 8 chars, 1 uppercase, 1 lowercase, 1 number, 1 special char
 * @example isStrongPassword("SecurePass123!") => true
 */
export function isStrongPassword(password: string | null | undefined): boolean {
  if (!password || password.length < 8) return false;

  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const hasNumber = /\d/.test(password);
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

  return hasUppercase && hasLowercase && hasNumber && hasSpecialChar;
}
