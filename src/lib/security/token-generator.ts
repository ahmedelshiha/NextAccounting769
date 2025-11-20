import { randomBytes } from 'crypto';

/**
 * Generates a cryptographically secure random token of the specified length.
 * 
 * @param length - The number of bytes to generate (default: 32)
 * @returns A hexadecimal string representation of the random bytes
 * 
 * @example
 * const token = generateToken(32); // 64-character hex string
 * const shortToken = generateToken(16); // 32-character hex string
 */
export function generateToken(length: number = 32): string {
  if (length < 1 || length > 1024) {
    throw new Error('Token length must be between 1 and 1024 bytes');
  }
  
  return randomBytes(length).toString('hex');
}

/**
 * Generates a URL-safe token using base64url encoding.
 * Useful for tokens that will be included in URLs or emails.
 * 
 * @param length - The number of bytes to generate (default: 32)
 * @returns A base64url-encoded string
 * 
 * @example
 * const token = generateUrlSafeToken(32);
 */
export function generateUrlSafeToken(length: number = 32): string {
  if (length < 1 || length > 1024) {
    throw new Error('Token length must be between 1 and 1024 bytes');
  }
  
  return randomBytes(length)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

/**
 * Generates a numeric token (PIN-like).
 * Useful for verification codes and short tokens.
 * 
 * @param length - The number of digits (default: 6)
 * @returns A numeric string of the specified length
 * 
 * @example
 * const pin = generateNumericToken(6); // "123456"
 */
export function generateNumericToken(length: number = 6): string {
  if (length < 1 || length > 20) {
    throw new Error('Token length must be between 1 and 20 digits');
  }
  
  let token = '';
  for (let i = 0; i < length; i++) {
    token += Math.floor(Math.random() * 10).toString();
  }
  return token;
}

/**
 * Generates a human-readable token with alphanumeric characters (excluding ambiguous characters).
 * Useful for tokens that users need to type or read.
 * 
 * @param length - The number of characters (default: 12)
 * @returns An alphanumeric string excluding ambiguous characters (0, O, l, 1, I)
 * 
 * @example
 * const token = generateReadableToken(12);
 */
export function generateReadableToken(length: number = 12): string {
  if (length < 1 || length > 256) {
    throw new Error('Token length must be between 1 and 256 characters');
  }
  
  // Exclude ambiguous characters: 0, O, l, 1, I
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789abcdefghjkmnpqrstuvwxyz';
  let token = '';
  
  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * chars.length);
    token += chars[randomIndex];
  }
  
  return token;
}
