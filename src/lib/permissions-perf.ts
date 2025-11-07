/**
 * Performance optimization utilities for permission management system
 * Includes debouncing, memoization helpers, and lazy loading strategies
 */

/**
 * Debounce function for search and input operations
 * @param func Function to debounce
 * @param wait Delay in milliseconds
 * @returns Debounced function
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null

  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null
      func(...args)
    }

    if (timeout) clearTimeout(timeout)
    timeout = setTimeout(later, wait)
  }
}

/**
 * Throttle function for frequently called operations
 * @param func Function to throttle
 * @param limit Delay in milliseconds
 * @returns Throttled function
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean = false

  return function executedFunction(...args: Parameters<T>) {
    if (!inThrottle) {
      func(...args)
      inThrottle = true
      setTimeout(() => (inThrottle = false), limit)
    }
  }
}

/**
 * Request debounce - only executes the most recent request after delay
 * Useful for API calls triggered by user input
 */
export function createRequestDebounce<T, R>(
  fn: (args: T) => Promise<R>,
  delay: number = 300
) {
  let timeoutId: NodeJS.Timeout | null = null
  let lastRequest: T | null = null
  let isRequestInProgress = false

  return {
    execute: async (args: T): Promise<R | null> => {
      lastRequest = args

      // Clear existing timeout
      if (timeoutId) clearTimeout(timeoutId)

      // If already executing, wait and retry with latest args
      if (isRequestInProgress) {
        return new Promise((resolve) => {
          timeoutId = setTimeout(async () => {
            if (lastRequest !== null) {
              resolve(await fn(lastRequest))
            } else {
              resolve(null)
            }
          }, delay)
        })
      }

      // Execute request
      isRequestInProgress = true
      try {
        return await new Promise((resolve) => {
          timeoutId = setTimeout(async () => {
            if (lastRequest !== null) {
              const result = await fn(lastRequest)
              resolve(result)
            }
            isRequestInProgress = false
          }, delay)
        })
      } catch (error) {
        isRequestInProgress = false
        throw error
      }
    },

    cancel: () => {
      if (timeoutId) clearTimeout(timeoutId)
      isRequestInProgress = false
      lastRequest = null
    },
  }
}

/**
 * Memoize function results based on arguments
 * @param fn Function to memoize
 * @param maxSize Maximum number of cached results (default: 10)
 * @returns Memoized function
 */
export function memoize<T extends (...args: any[]) => any>(
  fn: T,
  maxSize: number = 10
): T {
  const cache = new Map<string, any>()

  return ((...args: Parameters<T>) => {
    const key = JSON.stringify(args)

    if (cache.has(key)) {
      return cache.get(key)
    }

    const result = fn(...args)

    // Maintain cache size limit
    if (cache.size >= maxSize) {
      const firstKey = cache.keys().next().value
      if (firstKey !== undefined) {
        cache.delete(firstKey)
      }
    }

    cache.set(key, result)
    return result
  }) as T
}

/**
 * Batch debounce - collect multiple calls and execute once
 * Useful for batch permission updates
 */
export function createBatchDebounce<T>(
  fn: (items: T[]) => Promise<void>,
  delay: number = 500
) {
  let batch: T[] = []
  let timeoutId: NodeJS.Timeout | null = null

  return {
    add: (item: T) => {
      batch.push(item)

      if (timeoutId) clearTimeout(timeoutId)

      timeoutId = setTimeout(async () => {
        if (batch.length > 0) {
          const itemsToProcess = [...batch]
          batch = []
          await fn(itemsToProcess)
        }
      }, delay)
    },

    flush: async () => {
      if (timeoutId) clearTimeout(timeoutId)
      if (batch.length > 0) {
        const itemsToProcess = [...batch]
        batch = []
        await fn(itemsToProcess)
      }
    },

    cancel: () => {
      if (timeoutId) clearTimeout(timeoutId)
      batch = []
    },
  }
}

/**
 * Performance monitoring utility
 */
export class PerformanceMonitor {
  private metrics: Map<string, number[]> = new Map()

  /**
   * Mark the start of an operation
   */
  mark(label: string) {
    if (typeof performance === 'undefined') return

    performance.mark(label)
  }

  /**
   * Measure time between two marks
   */
  measure(label: string, startMark: string, endMark: string) {
    if (typeof performance === 'undefined') return

    try {
      performance.measure(label, startMark, endMark)
      const measure = performance.getEntriesByName(label)[0]

      if (measure) {
        if (!this.metrics.has(label)) {
          this.metrics.set(label, [])
        }
        this.metrics.get(label)!.push(measure.duration)
      }
    } catch (error) {
      // Silently fail if marks don't exist
    }
  }

  /**
   * Get average time for a metric
   */
  getAverage(label: string): number {
    const times = this.metrics.get(label) || []
    if (times.length === 0) return 0

    return times.reduce((a, b) => a + b, 0) / times.length
  }

  /**
   * Get all metrics
   */
  getMetrics() {
    const result: Record<string, { avg: number; count: number; max: number; min: number }> = {}

    this.metrics.forEach((times, label) => {
      if (times.length > 0) {
        result[label] = {
          avg: times.reduce((a, b) => a + b, 0) / times.length,
          count: times.length,
          max: Math.max(...times),
          min: Math.min(...times),
        }
      }
    })

    return result
  }

  /**
   * Clear all metrics
   */
  clear() {
    this.metrics.clear()
  }

  /**
   * Log all metrics to console
   */
  log() {
    console.table(this.getMetrics())
  }
}

/**
 * Create a debounced search function optimized for permission searches
 */
export function createPermissionSearchDebounce(
  searchFn: (query: string) => any[],
  delay: number = 300
) {
  let timeoutId: NodeJS.Timeout | null = null
  let lastQuery = ''
  let lastResults: any[] = []

  return {
    search: (query: string): any[] => {
      lastQuery = query

      // Return cached results immediately if available
      if (lastResults.length > 0 && query === lastQuery) {
        return lastResults
      }

      // Clear existing timeout
      if (timeoutId) clearTimeout(timeoutId)

      // Execute search after delay
      timeoutId = setTimeout(() => {
        lastResults = searchFn(query)
      }, delay)

      return lastResults
    },

    cancel: () => {
      if (timeoutId) clearTimeout(timeoutId)
      lastQuery = ''
      lastResults = []
    },
  }
}

/**
 * Intersection Observer wrapper for lazy loading
 */
export class LazyLoadObserver {
  private observer: IntersectionObserver | null = null
  private callbacks: Map<Element, () => void> = new Map()

  /**
   * Create intersection observer
   */
  create(options: IntersectionObserverInit = {}) {
    if (typeof window === 'undefined' || !('IntersectionObserver' in window)) {
      return null
    }

    this.observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const callback = this.callbacks.get(entry.target)
          if (callback) {
            callback()
            // Unobserve after loading
            this.observer?.unobserve(entry.target)
          }
        }
      })
    }, {
      rootMargin: '50px', // Start loading 50px before element enters viewport
      ...options,
    })

    return this.observer
  }

  /**
   * Observe an element and execute callback when visible
   */
  observe(element: Element, callback: () => void) {
    if (!this.observer) {
      this.create()
    }

    if (this.observer) {
      this.callbacks.set(element, callback)
      this.observer.observe(element)
    }
  }

  /**
   * Unobserve element
   */
  unobserve(element: Element) {
    if (this.observer) {
      this.observer.unobserve(element)
      this.callbacks.delete(element)
    }
  }

  /**
   * Disconnect observer
   */
  disconnect() {
    if (this.observer) {
      this.observer.disconnect()
      this.callbacks.clear()
    }
  }
}

/**
 * Virtual scroll handler for large permission lists
 * Renders only visible items to improve performance
 */
export interface VirtualScrollState {
  visibleStart: number
  visibleEnd: number
  itemHeight: number
  containerHeight: number
  totalItems: number
}

export class VirtualScrollManager {
  private itemHeight: number = 60
  private containerHeight: number = 0
  private scrollTop: number = 0
  private totalItems: number = 0

  constructor(itemHeight: number = 60) {
    this.itemHeight = itemHeight
  }

  /**
   * Calculate visible range based on scroll position
   */
  getVisibleRange(
    scrollTop: number,
    containerHeight: number,
    totalItems: number
  ): { start: number; end: number } {
    this.scrollTop = scrollTop
    this.containerHeight = containerHeight
    this.totalItems = totalItems

    const visibleStart = Math.max(
      0,
      Math.floor(scrollTop / this.itemHeight) - 1 // Buffer of 1 item
    )
    const visibleEnd = Math.min(
      totalItems,
      Math.ceil((scrollTop + containerHeight) / this.itemHeight) + 1 // Buffer of 1 item
    )

    return { start: visibleStart, end: visibleEnd }
  }

  /**
   * Get total height of all items
   */
  getTotalHeight(): number {
    return this.totalItems * this.itemHeight
  }

  /**
   * Get offset for visible items
   */
  getOffsetY(visibleStart: number): number {
    return visibleStart * this.itemHeight
  }
}

/**
 * Request animation frame debounce for smooth scrolling
 */
export function createRAFDebounce<T extends (...args: any[]) => void>(
  callback: T
): (...args: Parameters<T>) => void {
  let rafId: number | null = null

  return (...args: Parameters<T>) => {
    if (rafId !== null) {
      cancelAnimationFrame(rafId)
    }

    rafId = requestAnimationFrame(() => {
      callback(...args)
      rafId = null
    })
  }
}

/**
 * Memory-efficient cache with TTL (time-to-live)
 */
export class TTLCache<K, V> {
  private cache: Map<K, { value: V; expiresAt: number }> = new Map()
  private ttl: number

  constructor(ttlMs: number = 5 * 60 * 1000) { // 5 minutes default
    this.ttl = ttlMs
  }

  /**
   * Set value with expiration
   */
  set(key: K, value: V) {
    this.cache.set(key, {
      value,
      expiresAt: Date.now() + this.ttl,
    })
  }

  /**
   * Get value if not expired
   */
  get(key: K): V | undefined {
    const item = this.cache.get(key)

    if (!item) return undefined

    if (Date.now() > item.expiresAt) {
      this.cache.delete(key)
      return undefined
    }

    return item.value
  }

  /**
   * Clear expired entries
   */
  cleanup() {
    const now = Date.now()
    for (const [key, item] of this.cache.entries()) {
      if (now > item.expiresAt) {
        this.cache.delete(key)
      }
    }
  }

  /**
   * Clear all entries
   */
  clear() {
    this.cache.clear()
  }
}
