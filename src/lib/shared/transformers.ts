/**
 * Shared Transformer Utilities
 * Common data transformation functions for normalizing, sanitizing, converting data
 * Used across Portal and Admin for consistent data handling
 */

/**
 * Convert text to URL-friendly slug
 * @example slugify("My Service Name") => "my-service-name"
 */
export function slugify(text: string | null | undefined): string {
  if (!text) return '';

  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
    .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens
}

/**
 * Normalize email address (lowercase and trim)
 * @example normalizeEmail("  User@EXAMPLE.COM  ") => "user@example.com"
 */
export function normalizeEmail(email: string | null | undefined): string {
  if (!email) return '';

  return email.trim().toLowerCase();
}

/**
 * Normalize phone number (remove spaces, dashes, parentheses)
 * @example normalizePhoneNumber("(212) 555-1234") => "2125551234"
 */
export function normalizePhoneNumber(phone: string | null | undefined): string {
  if (!phone) return '';

  return phone.replace(/\D/g, '');
}

/**
 * Sanitize HTML to remove dangerous tags and attributes
 * Basic sanitization - for production use a library like DOMPurify
 * @example sanitizeHtml("<img src=x onerror=alert('xss')>") => "<img src=\"x\">"
 */
export function sanitizeHtml(html: string | null | undefined): string {
  if (!html) return '';

  // Remove script tags and event handlers
  let sanitized = html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/on\w+\s*=\s*["'][^"']*["']/gi, '')
    .replace(/on\w+\s*=\s*[^\s>]*/gi, '');

  return sanitized;
}

/**
 * Convert object to query string parameters
 * @example objectToQueryString({a: 1, b: "test"}) => "a=1&b=test"
 */
export function objectToQueryString(obj: Record<string, any>): string {
  const params = new URLSearchParams();

  Object.entries(obj).forEach(([key, value]) => {
    if (value !== null && value !== undefined && value !== '') {
      if (Array.isArray(value)) {
        value.forEach((v) => params.append(key, v));
      } else {
        params.append(key, String(value));
      }
    }
  });

  return params.toString();
}

/**
 * Parse query string to object
 * @example parseQueryString("a=1&b=test") => {a: "1", b: "test"}
 */
export function parseQueryString(queryString: string): Record<string, string | string[]> {
  const params = new URLSearchParams(queryString);
  const result: Record<string, string | string[]> = {};

  params.forEach((value, key) => {
    if (result[key]) {
      if (Array.isArray(result[key])) {
        (result[key] as string[]).push(value);
      } else {
        result[key] = [result[key] as string, value];
      }
    } else {
      result[key] = value;
    }
  });

  return result;
}

/**
 * Capitalize first letter of string
 * @example capitalize("hello") => "Hello"
 */
export function capitalize(str: string | null | undefined): string {
  if (!str) return '';

  return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Convert camelCase to kebab-case
 * @example camelToKebab("myServiceName") => "my-service-name"
 */
export function camelToKebab(str: string): string {
  return str.replace(/([a-z0-9]|(?=[A-Z]))([A-Z])/g, '$1-$2').toLowerCase();
}

/**
 * Convert kebab-case to camelCase
 * @example kebabToCamel("my-service-name") => "myServiceName"
 */
export function kebabToCamel(str: string): string {
  return str.replace(/-([a-z])/g, (g) => g[1].toUpperCase());
}

/**
 * Convert snake_case to camelCase
 * @example snakeToCamel("my_service_name") => "myServiceName"
 */
export function snakeToCamel(str: string): string {
  return str.replace(/_([a-z])/g, (g) => g[1].toUpperCase());
}

/**
 * Deep clone an object
 * @example deepClone({a: 1, b: {c: 2}}) => {a: 1, b: {c: 2}}
 */
export function deepClone<T>(obj: T): T {
  if (obj === null || typeof obj !== 'object') return obj;

  if (obj instanceof Date) {
    return new Date(obj.getTime()) as any;
  }

  if (Array.isArray(obj)) {
    return obj.map((item) => deepClone(item)) as any;
  }

  if (obj instanceof Object) {
    const cloned = {} as T;
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        cloned[key] = deepClone(obj[key]);
      }
    }
    return cloned;
  }

  return obj;
}

/**
 * Merge two objects deeply
 * @example deepMerge({a: 1}, {b: 2}) => {a: 1, b: 2}
 */
export function deepMerge<T extends Record<string, any>>(target: T, source: Partial<T>): T {
  const result = { ...target };

  for (const key in source) {
    if (source.hasOwnProperty(key)) {
      const sourceValue = source[key];
      const targetValue = result[key];

      if (
        sourceValue &&
        typeof sourceValue === 'object' &&
        !Array.isArray(sourceValue) &&
        targetValue &&
        typeof targetValue === 'object' &&
        !Array.isArray(targetValue)
      ) {
        result[key] = deepMerge(targetValue, sourceValue);
      } else {
        result[key] = sourceValue as any;
      }
    }
  }

  return result;
}

/**
 * Filter object by keys to include only specified keys
 * @example filterObject({a: 1, b: 2, c: 3}, ["a", "c"]) => {a: 1, c: 3}
 */
export function filterObject<T extends Record<string, any>>(obj: T, keys: (keyof T)[]): Partial<T> {
  const result = {} as Partial<T>;

  keys.forEach((key) => {
    if (key in obj) {
      result[key] = obj[key];
    }
  });

  return result;
}

/**
 * Omit keys from object
 * @example omitKeys({a: 1, b: 2, c: 3}, ["b"]) => {a: 1, c: 3}
 */
export function omitKeys<T extends Record<string, any>>(obj: T, keys: (keyof T)[]): Partial<T> {
  const result = { ...obj };

  keys.forEach((key) => {
    delete result[key];
  });

  return result;
}

/**
 * Group array of objects by a property
 * @example groupBy([{type: "a", val: 1}, {type: "b", val: 2}], "type") => {a: [...], b: [...]}
 */
export function groupBy<T>(arr: T[], key: keyof T): Record<string, T[]> {
  return arr.reduce(
    (acc, item) => {
      const groupKey = String(item[key]);
      if (!acc[groupKey]) {
        acc[groupKey] = [];
      }
      acc[groupKey].push(item);
      return acc;
    },
    {} as Record<string, T[]>
  );
}

/**
 * Flatten array of arrays
 * @example flatten([[1, 2], [3, 4]]) => [1, 2, 3, 4]
 */
export function flatten<T>(arr: T[][]): T[] {
  return arr.reduce((acc, val) => acc.concat(val), []);
}

/**
 * Remove duplicates from array
 * @example unique([1, 2, 2, 3]) => [1, 2, 3]
 */
export function unique<T>(arr: T[]): T[] {
  return [...new Set(arr)];
}

/**
 * Sort array of objects by property
 * @example sortBy([{name: "b"}, {name: "a"}], "name") => [{name: "a"}, {name: "b"}]
 */
export function sortBy<T>(arr: T[], key: keyof T, order: 'asc' | 'desc' = 'asc'): T[] {
  const sorted = [...arr].sort((a, b) => {
    const aVal = a[key];
    const bVal = b[key];

    if (aVal < bVal) return order === 'asc' ? -1 : 1;
    if (aVal > bVal) return order === 'asc' ? 1 : -1;
    return 0;
  });

  return sorted;
}
