import { NextRequest, NextResponse } from 'next/server'
import { redis } from '@/lib/redis'

/**
 * Rate limiting configuration by endpoint type
 */
export const RATE_LIMIT_CONFIG = {
  // Auth endpoints (strict)
  auth: {
    requests: 5,
    windowSeconds: 300, // 5 minutes
  },

  // Login attempts (very strict)
  login: {
    requests: 3,
    windowSeconds: 900, // 15 minutes
  },

  // Read endpoints (permissive)
  read: {
    requests: 100,
    windowSeconds: 60, // 1 minute
  },

  // List endpoints (moderate)
  list: {
    requests: 50,
    windowSeconds: 60, // 1 minute
  },

  // Write endpoints (moderate)
  write: {
    requests: 20,
    windowSeconds: 60, // 1 minute
  },

  // Delete endpoints (strict)
  delete: {
    requests: 10,
    windowSeconds: 60, // 1 minute
  },

  // Export endpoints (very permissive)
  export: {
    requests: 5,
    windowSeconds: 3600, // 1 hour
  },

  // Search endpoints (permissive)
  search: {
    requests: 100,
    windowSeconds: 60, // 1 minute
  },

  // Bulk operations (strict)
  bulk: {
    requests: 10,
    windowSeconds: 60, // 1 minute
  },

  // Admin endpoints (moderate)
  admin: {
    requests: 50,
    windowSeconds: 60, // 1 minute
  },

  // Public endpoints (permissive)
  public: {
    requests: 1000,
    windowSeconds: 60, // 1 minute
  },
}

/**
 * Rate limit key builder
 */
export function buildRateLimitKey(
  identifier: string,
  endpoint: string,
  type?: string
): string {
  const key = `ratelimit:${identifier}:${endpoint}`
  if (type) return `${key}:${type}`
  return key
}

/**
 * Check if request exceeds rate limit
 */
export async function checkRateLimit(
  identifier: string,
  endpoint: string,
  config: (typeof RATE_LIMIT_CONFIG)[keyof typeof RATE_LIMIT_CONFIG]
): Promise<{ allowed: boolean; remaining: number; resetAt: number }> {
  if (!redis) {
    // No Redis, allow all requests
    return { allowed: true, remaining: config.requests, resetAt: Date.now() }
  }

  const key = buildRateLimitKey(identifier, endpoint)

  try {
    const current = await redis.get(key)
    // Handle potentially unknown return type from redis.get
    const currentVal = current !== null && current !== undefined ? String(current) : null
    const count = currentVal ? parseInt(currentVal) + 1 : 1
    const now = Date.now()
    const resetAt = now + config.windowSeconds * 1000

    // Increment counter
    await redis.setex(key, config.windowSeconds, count.toString())

    const allowed = count <= config.requests
    const remaining = Math.max(0, config.requests - count)

    return {
      allowed,
      remaining,
      resetAt,
    }
  } catch (error) {
    console.error('Rate limit check failed:', error)
    // If Redis fails, allow request (fail open)
    return { allowed: true, remaining: config.requests, resetAt: Date.now() }
  }
}

/**
 * Create rate limit response
 */
export function rateLimitResponse(remaining: number, resetAt: number) {
  const resetDate = new Date(resetAt)
  const retryAfter = Math.ceil((resetAt - Date.now()) / 1000)

  return NextResponse.json(
    {
      success: false,
      error: {
        code: 'RATE_LIMIT_EXCEEDED',
        message: 'Too many requests. Please try again later.',
        retryAfter,
      },
    },
    {
      status: 429,
      headers: {
        'Retry-After': retryAfter.toString(),
        'X-RateLimit-Limit': '0',
        'X-RateLimit-Remaining': '0',
        'X-RateLimit-Reset': resetDate.toISOString(),
      },
    }
  )
}

/**
 * Rate limiting middleware
 */
export async function withRateLimit(
  request: NextRequest,
  identifier: string,
  endpoint: string,
  config: (typeof RATE_LIMIT_CONFIG)[keyof typeof RATE_LIMIT_CONFIG]
) {
  const { allowed, remaining, resetAt } = await checkRateLimit(
    identifier,
    endpoint,
    config
  )

  // Add rate limit headers to response
  const headers = {
    'X-RateLimit-Limit': config.requests.toString(),
    'X-RateLimit-Remaining': remaining.toString(),
    'X-RateLimit-Reset': new Date(resetAt).toISOString(),
  }

  if (!allowed) {
    const response = rateLimitResponse(remaining, resetAt)
    Object.entries(headers).forEach(([key, value]) => {
      response.headers.set(key, value)
    })
    return response
  }

  // Return headers to be added to success response
  return headers
}

/**
 * Get identifier from request (IP, user ID, or combination)
 */
export function getIdentifier(request: NextRequest, userId?: string): string {
  // Prefer user ID if available (more accurate for authenticated endpoints)
  if (userId) return userId

  // Fall back to IP address for public endpoints
  const forwarded = request.headers.get('x-forwarded-for')
  const ip = forwarded?.split(',')[0] || request.headers.get('x-real-ip') || 'unknown'

  return ip
}

/**
 * Recommended rate limit configuration by endpoint pattern
 */
export const endpointPatterns = {
  // Authentication
  '/api/auth/*': RATE_LIMIT_CONFIG.auth,
  '/api/auth/login': RATE_LIMIT_CONFIG.login,

  // User endpoints
  '/api/users/:id': RATE_LIMIT_CONFIG.read,
  '/api/users': RATE_LIMIT_CONFIG.list,
  '/api/users/:id/update': RATE_LIMIT_CONFIG.write,
  '/api/users/:id/delete': RATE_LIMIT_CONFIG.delete,

  // Booking endpoints
  '/api/bookings': RATE_LIMIT_CONFIG.list,
  '/api/bookings/:id': RATE_LIMIT_CONFIG.read,
  '/api/bookings/:id/update': RATE_LIMIT_CONFIG.write,
  '/api/bookings/:id/cancel': RATE_LIMIT_CONFIG.delete,

  // Service endpoints
  '/api/services': RATE_LIMIT_CONFIG.list,
  '/api/services/:id': RATE_LIMIT_CONFIG.read,
  '/api/admin/services': RATE_LIMIT_CONFIG.admin,
  '/api/admin/services/:id': RATE_LIMIT_CONFIG.admin,

  // Search
  '/api/search': RATE_LIMIT_CONFIG.search,
  '/api/*/search': RATE_LIMIT_CONFIG.search,

  // Export
  '/api/*/export': RATE_LIMIT_CONFIG.export,

  // Bulk operations
  '/api/*/bulk': RATE_LIMIT_CONFIG.bulk,

  // Admin
  '/api/admin/*': RATE_LIMIT_CONFIG.admin,

  // Public
  '/api/public/*': RATE_LIMIT_CONFIG.public,
}

/**
 * Strategy for rate limiting:
 * 1. Use Redis for distributed rate limiting
 * 2. Fail open (allow) if Redis unavailable
 * 3. Include Retry-After header in 429 responses
 * 4. Use user ID for auth endpoints (more fair)
 * 5. Use IP address for public endpoints
 * 6. Log rate limit violations for monitoring
 */

export const bestPractices = {
  implementation: `
    // In API route
    import { withRateLimit, getIdentifier, RATE_LIMIT_CONFIG } from '@/lib/performance/rate-limiting'

    export async function POST(request: NextRequest) {
      const userId = session?.user?.id
      const identifier = getIdentifier(request, userId)
      const rateLimitHeaders = await withRateLimit(
        request,
        identifier,
        '/api/endpoint',
        RATE_LIMIT_CONFIG.write
      )

      if ('status' in rateLimitHeaders) {
        return rateLimitHeaders // 429 response
      }

      // Process request...

      const response = NextResponse.json({ success: true })
      Object.entries(rateLimitHeaders).forEach(([key, value]) => {
        response.headers.set(key, value)
      })

      return response
    }
  `,

  monitoring: `
    // Track rate limit violations
    if (!allowed) {
      console.warn('Rate limit exceeded', {
        identifier,
        endpoint,
        timestamp: new Date(),
        remaining,
      })

      // Send to monitoring service
      await sendToMonitoring({
        type: 'rate_limit',
        identifier,
        endpoint,
      })
    }
  `,

  testing: `
    // Test rate limiting
    for (let i = 0; i < 25; i++) {
      const res = await fetch('/api/endpoint', { method: 'POST' })
      if (res.status === 429) {
        console.log('Rate limit hit after', i, 'requests')
        break
      }
    }
  `,
}
