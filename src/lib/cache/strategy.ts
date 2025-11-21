import { redis } from '@/lib/redis'

/**
 * Cache TTL (Time-to-Live) settings in seconds
 */
export const CACHE_TTL = {
  SERVICES_LIST: 5 * 60, // 5 minutes
  SERVICE_DETAIL: 10 * 60, // 10 minutes
  AVAILABILITY_SLOTS: 1 * 60, // 1 minute (highly volatile)
  USER_PROFILE: 10 * 60, // 10 minutes
  PERMISSIONS: 60 * 60, // 1 hour
  BOOKINGS_LIST: 2 * 60, // 2 minutes
  TASKS_LIST: 5 * 60, // 5 minutes
  ANALYTICS: 15 * 60, // 15 minutes
  DOCUMENTS_LIST: 5 * 60, // 5 minutes
  MESSAGES: 1 * 60, // 1 minute
  TEAM_MEMBERS: 30 * 60, // 30 minutes
}

/**
 * Cache key builder
 */
export const cacheKey = {
  services: (tenantId: string) => `cache:services:${tenantId}`,
  service: (tenantId: string, id: string) => `cache:service:${tenantId}:${id}`,
  availability: (serviceId: string, date: string) =>
    `cache:availability:${serviceId}:${date}`,
  userProfile: (userId: string) => `cache:user:${userId}`,
  userPermissions: (userId: string) => `cache:permissions:${userId}`,
  bookings: (tenantId: string, clientId?: string) =>
    clientId
      ? `cache:bookings:${tenantId}:${clientId}`
      : `cache:bookings:${tenantId}`,
  booking: (id: string) => `cache:booking:${id}`,
  tasks: (tenantId: string) => `cache:tasks:${tenantId}`,
  task: (id: string) => `cache:task:${id}`,
  analytics: (tenantId: string, type: string) =>
    `cache:analytics:${tenantId}:${type}`,
  documents: (tenantId: string) => `cache:documents:${tenantId}`,
  messages: (threadId: string) => `cache:messages:${threadId}`,
  teamMembers: (tenantId: string) => `cache:team:${tenantId}`,
  search: (tenantId: string, query: string, type: string) =>
    `cache:search:${tenantId}:${type}:${query}`,
}

/**
 * Get cached data or fetch from source
 */
export async function getCachedData<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttlSeconds: number = CACHE_TTL.SERVICES_LIST
): Promise<T> {
  try {
    // Try to get from cache
    if (redis) {
      const cached = await redis.get(key)
      if (cached) {
        try {
          // Ensure we handle both string and object returns from Redis client
          const cachedString = typeof cached === 'string' ? cached : JSON.stringify(cached)
          return JSON.parse(cachedString) as T
        } catch {
          // Invalid JSON, skip cache
        }
      }
    }
  } catch (error) {
    // Redis error, fallback to fetch
    console.warn(`Cache read error for ${key}:`, error)
  }

  // Fetch data
  const data = await fetcher()

  // Cache result
  try {
    if (redis && ttlSeconds > 0) {
      await redis.setex(key, ttlSeconds, JSON.stringify(data))
    }
  } catch (error) {
    console.warn(`Cache write error for ${key}:`, error)
  }

  return data
}

/**
 * Set cache value
 */
export async function setCacheData<T>(
  key: string,
  data: T,
  ttlSeconds: number = CACHE_TTL.SERVICES_LIST
): Promise<void> {
  try {
    if (redis && ttlSeconds > 0) {
      await redis.setex(key, ttlSeconds, JSON.stringify(data))
    }
  } catch (error) {
    console.warn(`Cache write error for ${key}:`, error)
  }
}

/**
 * Invalidate cache by key pattern
 */
export async function invalidateCache(pattern: string): Promise<void> {
  try {
    if (!redis) return

    const keys = await redis.keys(pattern)
    if (keys.length > 0) {
      await redis.del(...keys)
    }
  } catch (error) {
    console.warn(`Cache invalidation error for pattern ${pattern}:`, error)
  }
}

/**
 * Invalidate specific cache key
 */
export async function invalidateCacheKey(key: string): Promise<void> {
  try {
    if (redis) {
      await redis.del(key)
    }
  } catch (error) {
    console.warn(`Cache invalidation error for ${key}:`, error)
  }
}

/**
 * Clear all cache
 */
export async function clearAllCache(): Promise<void> {
  try {
    if (redis) {
      await redis.flushdb()
    }
  } catch (error) {
    console.warn(`Cache flush error:`, error)
  }
}

/**
 * Cache invalidation helpers for common mutations
 */
export const invalidateOn = {
  serviceCreated: (tenantId: string) =>
    invalidateCache(`cache:services:${tenantId}*`),

  serviceUpdated: (tenantId: string, serviceId: string) =>
    Promise.all([
      invalidateCacheKey(cacheKey.service(tenantId, serviceId)),
      invalidateCache(`cache:services:${tenantId}*`),
      invalidateCache(`cache:availability:${serviceId}*`),
    ]),

  availabilityUpdated: (serviceId: string) =>
    invalidateCache(`cache:availability:${serviceId}*`),

  bookingCreated: (tenantId: string, clientId: string) =>
    Promise.all([
      invalidateCache(`cache:bookings:${tenantId}*`),
      invalidateCache(`cache:availability:*`),
    ]),

  bookingUpdated: (tenantId: string, bookingId: string, clientId: string) =>
    Promise.all([
      invalidateCacheKey(cacheKey.booking(bookingId)),
      invalidateCache(`cache:bookings:${tenantId}*`),
    ]),

  userUpdated: (userId: string) =>
    Promise.all([
      invalidateCacheKey(cacheKey.userProfile(userId)),
      invalidateCacheKey(cacheKey.userPermissions(userId)),
    ]),

  permissionsChanged: (userId: string) =>
    invalidateCacheKey(cacheKey.userPermissions(userId)),

  taskCreated: (tenantId: string) =>
    invalidateCache(`cache:tasks:${tenantId}*`),

  taskUpdated: (tenantId: string, taskId: string) =>
    Promise.all([
      invalidateCacheKey(cacheKey.task(taskId)),
      invalidateCache(`cache:tasks:${tenantId}*`),
    ]),

  documentUploaded: (tenantId: string) =>
    invalidateCache(`cache:documents:${tenantId}*`),

  messagePosted: (threadId: string) =>
    invalidateCacheKey(cacheKey.messages(threadId)),

  analyticsUpdated: (tenantId: string) =>
    invalidateCache(`cache:analytics:${tenantId}*`),
}
