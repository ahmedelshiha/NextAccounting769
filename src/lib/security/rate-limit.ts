/**
 * Rate Limiting Utility
 * Implements sliding window rate limiting for API endpoints
 */

interface RateLimitEntry {
  count: number
  resetTime: number
}

export class RateLimiter {
  private static store = new Map<string, RateLimitEntry>()
  private static readonly CLEANUP_INTERVAL = 60 * 60 * 1000 // 1 hour

  /**
   * Initialize cleanup of expired entries
   */
  static initialize() {
    setInterval(() => {
      const now = Date.now()
      for (const [key, entry] of this.store.entries()) {
        if (entry.resetTime < now) {
          this.store.delete(key)
        }
      }
    }, this.CLEANUP_INTERVAL)
  }

  /**
   * Check if request is within rate limit
   * @param identifier - Unique identifier (IP, user ID, etc.)
   * @param limit - Max requests allowed
   * @param windowMs - Time window in milliseconds
   * @returns Object with allowed status and remaining quota
   */
  static checkLimit(
    identifier: string,
    limit: number = 100,
    windowMs: number = 60 * 1000 // 1 minute
  ): { allowed: boolean; remaining: number; resetTime: number } {
    const now = Date.now()
    const key = `ratelimit:${identifier}`

    let entry = this.store.get(key)

    // Create new entry if doesn't exist or has expired
    if (!entry || entry.resetTime < now) {
      entry = {
        count: 0,
        resetTime: now + windowMs
      }
      this.store.set(key, entry)
    }

    const allowed = entry.count < limit
    const remaining = Math.max(0, limit - entry.count - 1)
    const resetTime = entry.resetTime

    if (allowed) {
      entry.count++
    }

    return { allowed, remaining, resetTime }
  }

  /**
   * Reset rate limit for an identifier
   */
  static reset(identifier: string) {
    this.store.delete(`ratelimit:${identifier}`)
  }

  /**
   * Get current usage stats
   */
  static getStats(identifier: string): RateLimitEntry | null {
    return this.store.get(`ratelimit:${identifier}`) || null
  }

  /**
   * Clear all rate limit entries (for testing)
   */
  static clear() {
    this.store.clear()
  }
}

/**
 * Common rate limit configurations
 */
export const RATE_LIMITS = {
  // Strict limits for sensitive endpoints
  STRICT: {
    limit: 10,
    windowMs: 60 * 1000 // 10 requests per minute
  },

  // Standard limits for most endpoints
  STANDARD: {
    limit: 100,
    windowMs: 60 * 1000 // 100 requests per minute
  },

  // Relaxed limits for less critical endpoints
  RELAXED: {
    limit: 1000,
    windowMs: 60 * 1000 // 1000 requests per minute
  },

  // Very strict for exports/heavy operations
  EXPORT: {
    limit: 5,
    windowMs: 60 * 1000 // 5 exports per minute
  },

  // For login attempts
  LOGIN: {
    limit: 5,
    windowMs: 15 * 60 * 1000 // 5 attempts per 15 minutes
  },

  // For password reset
  PASSWORD_RESET: {
    limit: 3,
    windowMs: 60 * 60 * 1000 // 3 attempts per hour
  }
}

// Initialize cleanup on module load
RateLimiter.initialize()

export default RateLimiter
