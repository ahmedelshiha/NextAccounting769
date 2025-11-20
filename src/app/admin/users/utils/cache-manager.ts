/**
 * Cache Manager for Filter Bar Performance Optimization
 * Implements SWR (Stale-While-Revalidate) strategy with persistence
 */

export interface CacheEntry<T> {
  data: T
  timestamp: number
  expiresAt: number
  eTag?: string
}

export interface CacheConfig {
  ttl?: number // Time to live in milliseconds (default: 5 minutes)
  persistent?: boolean // Use localStorage for persistence
  maxSize?: number // Max items in cache (default: 100)
  key?: string // Cache key prefix
}

/**
 * In-memory cache manager with optional persistence
 */
export class CacheManager {
  private cache = new Map<string, CacheEntry<any>>()
  private config: Required<CacheConfig>
  private persistKey: string

  constructor(config: CacheConfig = {}) {
    this.config = {
      ttl: config.ttl ?? 5 * 60 * 1000, // 5 minutes default
      persistent: config.persistent ?? false,
      maxSize: config.maxSize ?? 100,
      key: config.key ?? 'app-cache'
    }
    this.persistKey = `${this.config.key}:items`
    
    if (this.config.persistent) {
      this.loadFromStorage()
    }
  }

  /**
   * Get value from cache
   * Returns null if expired or not found
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key)
    
    if (!entry) {
      return null
    }

    // Check if expired
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key)
      return null
    }

    return entry.data as T
  }

  /**
   * Get value from cache with staleness info
   * Useful for SWR (Stale-While-Revalidate) pattern
   */
  getWithStale<T>(key: string): { data: T | null; isStale: boolean } {
    const entry = this.cache.get(key)
    
    if (!entry) {
      return { data: null, isStale: false }
    }

    const now = Date.now()
    const isStale = now > entry.expiresAt
    
    // Still return data even if stale for SWR
    return { data: entry.data as T, isStale }
  }

  /**
   * Set value in cache
   */
  set<T>(key: string, data: T, config?: Partial<CacheConfig>): void {
    const ttl = config?.ttl ?? this.config.ttl
    const expiresAt = Date.now() + ttl

    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      expiresAt
    })

    // Enforce max cache size (FIFO eviction)
    if (this.cache.size > this.config.maxSize) {
      const firstKey = this.cache.keys().next().value
      if (firstKey !== undefined) {
        this.cache.delete(firstKey)
      }
    }

    // Persist if configured
    if (this.config.persistent) {
      this.saveToStorage()
    }
  }

  /**
   * Set with ETag for conditional requests
   */
  setWithETag<T>(key: string, data: T, eTag: string, config?: Partial<CacheConfig>): void {
    const ttl = config?.ttl ?? this.config.ttl
    const expiresAt = Date.now() + ttl

    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      expiresAt,
      eTag
    })

    if (this.config.persistent) {
      this.saveToStorage()
    }
  }

  /**
   * Get ETag for conditional request
   */
  getETag(key: string): string | null {
    return this.cache.get(key)?.eTag ?? null
  }

  /**
   * Check if cache entry exists and is not expired
   */
  has(key: string): boolean {
    const entry = this.cache.get(key)
    if (!entry) return false
    return Date.now() <= entry.expiresAt
  }

  /**
   * Invalidate specific cache entry
   */
  invalidate(key: string): void {
    this.cache.delete(key)
    if (this.config.persistent) {
      this.saveToStorage()
    }
  }

  /**
   * Invalidate all entries matching pattern
   */
  invalidatePattern(pattern: string | RegExp): void {
    const regex = typeof pattern === 'string' 
      ? new RegExp(pattern) 
      : pattern

    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        this.cache.delete(key)
      }
    }

    if (this.config.persistent) {
      this.saveToStorage()
    }
  }

  /**
   * Clear all cache
   */
  clear(): void {
    this.cache.clear()
    if (this.config.persistent) {
      try {
        localStorage.removeItem(this.persistKey)
      } catch (e) {
        console.warn('Failed to clear persistent cache')
      }
    }
  }

  /**
   * Get cache statistics
   */
  getStats(): {
    size: number
    maxSize: number
    ttl: number
    persistent: boolean
  } {
    return {
      size: this.cache.size,
      maxSize: this.config.maxSize,
      ttl: this.config.ttl,
      persistent: this.config.persistent
    }
  }

  /**
   * Save cache to localStorage
   */
  private saveToStorage(): void {
    if (typeof window === 'undefined') return

    try {
      const serializable = Array.from(this.cache.entries())
        .filter(([, entry]) => Date.now() <= entry.expiresAt)
        .slice(-50) // Only persist last 50 entries

      localStorage.setItem(this.persistKey, JSON.stringify(serializable))
    } catch (e) {
      console.warn('Failed to persist cache:', e)
    }
  }

  /**
   * Load cache from localStorage
   */
  private loadFromStorage(): void {
    if (typeof window === 'undefined') return

    try {
      const data = localStorage.getItem(this.persistKey)
      if (!data) return

      const entries = JSON.parse(data) as Array<[string, CacheEntry<any>]>
      const now = Date.now()

      for (const [key, entry] of entries) {
        // Only restore non-expired entries
        if (now <= entry.expiresAt) {
          this.cache.set(key, entry)
        }
      }
    } catch (e) {
      console.warn('Failed to restore cache from storage:', e)
    }
  }
}

/**
 * Global cache instance for filter results
 */
export const filterResultsCache = new CacheManager({
  ttl: 5 * 60 * 1000, // 5 minutes
  persistent: true,
  maxSize: 50,
  key: 'filter-results'
})

/**
 * Global cache instance for user data
 */
export const userDataCache = new CacheManager({
  ttl: 10 * 60 * 1000, // 10 minutes
  persistent: true,
  maxSize: 100,
  key: 'user-data'
})

/**
 * Global cache instance for preset data
 */
export const presetCache = new CacheManager({
  ttl: 15 * 60 * 1000, // 15 minutes
  persistent: true,
  maxSize: 50,
  key: 'presets'
})

/**
 * Generate cache key from parameters
 */
export function generateCacheKey(namespace: string, params: Record<string, any>): string {
  const sorted = Object.keys(params)
    .sort()
    .map(key => `${key}=${JSON.stringify(params[key])}`)
    .join('&')
  
  return `${namespace}:${sorted}`
}

/**
 * Create cache key for filter results
 */
export function createFilterCacheKey(
  filters: Record<string, any>,
  page?: number,
  limit?: number
): string {
  return generateCacheKey('filters', {
    ...filters,
    ...(page && { page }),
    ...(limit && { limit })
  })
}

/**
 * Create cache key for user data
 */
export function createUserDataCacheKey(
  userId: string,
  includeDetails?: boolean
): string {
  return generateCacheKey('user', {
    id: userId,
    ...(includeDetails && { details: true })
  })
}

/**
 * Create cache key for presets
 */
export function createPresetCacheKey(
  tenantId: string,
  userId?: string
): string {
  return generateCacheKey('presets', {
    tenant: tenantId,
    ...(userId && { user: userId })
  })
}
