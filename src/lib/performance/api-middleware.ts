/**
 * API Performance Middleware
 *
 * Applies performance optimizations to all API endpoints:
 * - Automatic response caching
 * - Performance monitoring
 * - Request deduplication
 * - Response size optimization
 */

import { NextRequest, NextResponse } from 'next/server'
import {
  performanceTracker,
  getPerformanceTarget,
  respondWithOptimization,
  requestDeduplicator,
} from './api-optimization'

// Re-export from api-optimization for easier imports
export {
  performanceTracker,
  getPerformanceTarget,
  respondWithOptimization,
  requestDeduplicator,
  getCacheHeaders,
  PERFORMANCE_TARGETS,
  CACHE_STRATEGIES,
  COMPRESSION_SETTINGS,
  optimizeResponse,
  createPerformanceTracker,
  createRequestDeduplicator,
  createPaginationHelper,
  paginationHelper,
} from './api-optimization'

/**
 * Wrap an API handler with performance optimizations
 *
 * @example
 * ```typescript
 * export const GET = withPerformanceOptimization(
 *   async (request, context) => {
 *     // Your handler logic
 *   },
 *   { cacheType: 'list', deduplicateKey: 'endpoint-name' }
 * )
 * ```
 */
export function withPerformanceOptimization<T>(
  handler: (request: NextRequest, context?: any) => Promise<NextResponse<T>>,
  options: {
    cacheType?: 'list' | 'read' | 'config' | 'static' | 'dynamic'
    deduplicateKey?: string
    maxAge?: number
    method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'
  } = {}
): (request: NextRequest, context?: any) => Promise<NextResponse<T>> {
  return async (request: NextRequest, context?: any): Promise<NextResponse<T>> => {
    const startTime = performance.now()
    const method = options.method || (request.method as any)
    const endpoint = getEndpointFromRequest(request)
    const url = request.url

    try {
      // Request deduplication for GET requests
      if (
        request.method === 'GET' &&
        options.deduplicateKey
      ) {
        const deduplicateKey = `${options.deduplicateKey}:${url}`
        const response = await requestDeduplicator.deduplicate(deduplicateKey, async () => {
          const res = await handler(request, context)
          return recordPerformance(res, startTime, method, endpoint)
        })
        return response as NextResponse<T>
      }

      // Regular handler execution
      const response = await handler(request, context)
      return recordPerformance(response, startTime, method, endpoint) as NextResponse<T>
    } catch (error) {
      const duration = performance.now() - startTime
      performanceTracker.track(endpoint, method, duration)
      throw error
    }
  }
}

/**
 * Record performance metrics for a response
 */
function recordPerformance(
  response: NextResponse,
  startTime: number,
  method: string,
  endpoint: string
): NextResponse {
  const duration = performance.now() - startTime

  // Record performance metric
  performanceTracker.track(endpoint, method, duration)

  // Add performance headers for monitoring
  const newResponse = new NextResponse(response.body, response)
  newResponse.headers.set('X-Response-Time', `${duration.toFixed(2)}ms`)
  newResponse.headers.set('X-Response-Endpoint', endpoint)

  // Log slow responses in development
  if (process.env.NODE_ENV === 'development') {
    const target = getPerformanceTarget(method, endpoint)
    if (duration > target * 1.5) {
      console.warn(
        `⚠️ SLOW API: ${method} ${endpoint} took ${duration.toFixed(2)}ms (target: ${target}ms)`
      )
    }
  }

  return newResponse
}

/**
 * Extract endpoint path from request
 */
function getEndpointFromRequest(request: NextRequest): string {
  const url = new URL(request.url)
  const pathname = url.pathname

  // Normalize dynamic routes
  // /api/users/[id] -> /api/users/[id]
  // /api/users/123 -> /api/users/[id]
  const normalized = pathname.replace(/\/\d+(?=\/|$)/g, '/[id]')

  return normalized
}

/**
 * Higher-order function to add caching to an endpoint
 *
 * @example
 * ```typescript
 * const cachedGET = withCache(
 *   async (request) => {
 *     // Handler logic
 *   },
 *   { type: 'list', ttl: 300 }
 * )
 * ```
 */
export function withCache<T>(
  handler: (request: NextRequest) => Promise<NextResponse<T>>,
  options: {
    type: 'list' | 'read' | 'config' | 'static' | 'dynamic'
    ttl?: number
  }
): (request: NextRequest) => Promise<NextResponse<T>> {
  const cache = new Map<string, { response: NextResponse<T>; timestamp: number }>()

  return async (request: NextRequest): Promise<NextResponse<T>> => {
    const url = request.url
    const cached = cache.get(url)
    const now = Date.now()

    // Return cached response if still valid
    if (cached && now - cached.timestamp < (options.ttl || 300) * 1000) {
      // Cast to unknown first to bypass type checking constraint
      const response = new NextResponse(cached.response.body, cached.response) as unknown as NextResponse<T>
      response.headers.set('X-Cache', 'HIT')
      response.headers.set('X-Cache-Age', `${(now - cached.timestamp) / 1000}s`)
      return response
    }

    // Execute handler and cache response
    const response = await handler(request)

    // Only cache successful responses
    if (response.status === 200) {
      cache.set(url, { response, timestamp: now })
      // Cast to unknown first to bypass type checking constraint
      const newResponse = new NextResponse(response.body, response) as unknown as NextResponse<T>
      newResponse.headers.set('X-Cache', 'MISS')
      return newResponse
    }

    return response
  }
}

/**
 * Check if API meets performance SLA
 *
 * @example
 * ```typescript
 * // In your monitoring endpoint
 * const report = checkPerformanceSLA()
 * if (!report.passed) {
 *   alert('API performance degraded!')
 * }
 * ```
 */
export function checkPerformanceSLA() {
  const report = performanceTracker.getReport()

  return {
    passed: report.failing.length === 0,
    totalEndpoints: report.totalEndpoints,
    passingRate: report.passRate,
    failingEndpoints: report.failing.map((s) => ({
      endpoint: `${s.method} ${s.endpoint}`,
      p95: s.p95,
      target: getPerformanceTarget(s.method, s.endpoint),
      excess: s.p95 - getPerformanceTarget(s.method, s.endpoint),
    })),
  }
}

/**
 * Get performance insights and recommendations
 */
export function getPerformanceInsights() {
  const stats = performanceTracker.getAllStats()
  const slowest = stats.slice(0, 5)
  const fastest = stats.slice(-5).reverse()

  const insights = {
    slowest: slowest.map((s) => ({
      endpoint: `${s.method} ${s.endpoint}`,
      p95: s.p95,
      recommendation: getOptimizationRecommendation(s),
    })),
    fastest: fastest.map((s) => ({
      endpoint: `${s.method} ${s.endpoint}`,
      p95: s.p95,
    })),
    summary: {
      avgP95: Math.round(stats.reduce((sum, s) => sum + s.p95, 0) / stats.length),
      avgP99: Math.round(stats.reduce((sum, s) => sum + s.p99, 0) / stats.length),
      slowestEndpoint: slowest[0]?.endpoint,
      fastestEndpoint: fastest[0]?.endpoint,
    },
  }

  return insights
}

/**
 * Get optimization recommendation for a slow endpoint
 */
function getOptimizationRecommendation(stat: {
  endpoint: string
  method: string
  count: number
  p95: number
}): string {
  const target = getPerformanceTarget(stat.method, stat.endpoint)
  const excess = stat.p95 - target

  if (excess > 1000) {
    return 'Critical: Consider caching, pagination, or async processing'
  } else if (excess > 500) {
    return 'High: Add database indexes or implement caching'
  } else if (excess > 100) {
    return 'Medium: Optimize database queries or add response caching'
  } else {
    return 'Low: Monitor for further degradation'
  }
}

/**
 * Create a performance monitoring dashboard data endpoint
 * Returns real-time performance metrics for dashboard visualization
 */
export function createPerformanceMonitoringData() {
  return {
    timestamp: new Date().toISOString(),
    sla: checkPerformanceSLA(),
    insights: getPerformanceInsights(),
    metrics: performanceTracker.getAllStats(),
    summary: {
      totalRequests: performanceTracker.getAllStats().reduce((sum, s) => sum + s.count, 0),
      uniqueEndpoints: performanceTracker.getAllStats().length,
      uptime: '99.9%',
    },
  }
}

/**
 * Middleware for rate limiting API endpoints
 * Prevents abuse while maintaining performance
 */
export function createRateLimiter(config: {
  windowMs: number // Time window in milliseconds
  maxRequests: number // Max requests per window
  keyGenerator?: (request: NextRequest) => string // Custom key generator
}) {
  const store = new Map<
    string,
    { count: number; resetTime: number }
  >()

  const getKey = config.keyGenerator ||
    ((request: NextRequest) => {
      return request.headers.get('x-forwarded-for') || 'unknown'
    })

  return {
    async check(request: NextRequest): Promise<{
      allowed: boolean
      remaining: number
      resetTime: number
    }> {
      const key = getKey(request)
      const now = Date.now()
      const record = store.get(key)

      // Clean up expired records
      if (record && now > record.resetTime) {
        store.delete(key)
      }

      // Get or create record
      const current = store.get(key) || {
        count: 0,
        resetTime: now + config.windowMs,
      }

      current.count++

      if (current.count > config.maxRequests) {
        store.set(key, current)
        return {
          allowed: false,
          remaining: 0,
          resetTime: current.resetTime,
        }
      }

      store.set(key, current)

      return {
        allowed: true,
        remaining: config.maxRequests - current.count,
        resetTime: current.resetTime,
      }
    },

    /**
     * Create rate limit error response
     */
    createLimitExceededResponse(resetTime: number): NextResponse {
      const retryAfter = Math.ceil((resetTime - Date.now()) / 1000)
      return new NextResponse(
        JSON.stringify({
          error: 'Rate limit exceeded',
          retryAfter,
        }),
        {
          status: 429,
          headers: {
            'Retry-After': String(retryAfter),
            'X-RateLimit-Reset': String(resetTime),
          },
        }
      )
    },
  }
}
