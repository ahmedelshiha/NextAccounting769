import { useCallback, useRef } from 'react'
import { apiFetch } from '@/lib/api'
import { UserItem } from '../contexts/UserDataContext'

export interface ServerFilterOptions {
  search?: string
  role?: string
  status?: string
  department?: string
  tier?: string
  minExperience?: number
  maxExperience?: number
  createdAfter?: string
  createdBefore?: string
  sortBy?: 'name' | 'email' | 'createdAt' | 'role' | 'department' | 'tier'
  sortOrder?: 'asc' | 'desc'
  page?: number
  limit?: number
}

interface FetchOptions extends ServerFilterOptions {
  page?: number
  limit?: number
  signal?: AbortSignal
}

interface ServiceCache {
  data: UserItem[] | null
  timestamp: number
  ttl: number
  filters?: ServerFilterOptions
}

// Global cache for user service
const userServiceCache: ServiceCache = {
  data: null,
  timestamp: 0,
  ttl: 30000, // 30 seconds
  filters: {}
}

/**
 * Unified User Service Hook - Phase 4.3
 *
 * Consolidates data fetching logic with:
 * - Automatic server-side filtering detection (uses /api/admin/users/search when filters provided)
 * - Fallback to basic endpoint for simple pagination
 * - Request deduplication (prevents concurrent API calls for same filters)
 * - Exponential backoff retry logic (3 attempts with backoff)
 * - 30s timeout with abort controller
 * - Response caching (30s TTL)
 * - Clean error handling
 * - Support for all filter types: search, role, status, department, tier, experience range, date range
 *
 * Replaces duplicated logic in:
 * - useUsersList hook
 * - UserDataContext.refreshUsers()
 * - SelectUsersStep component
 * - ClientFormModal
 * - Individual component filter logic
 *
 * @returns {Object} Service with fetchUsers, invalidateCache, abort, isCacheValid, getFromCache methods
 */
export function useUnifiedUserService() {
  const abortControllerRef = useRef<AbortController | null>(null)
  const pendingRequestRef = useRef<Promise<UserItem[]> | null>(null)

  /**
   * Check if cache is still valid based on TTL
   */
  const isCacheValid = useCallback((filters?: ServerFilterOptions) => {
    return (
      userServiceCache.data !== null &&
      Date.now() - userServiceCache.timestamp < userServiceCache.ttl &&
      (!filters || JSON.stringify(userServiceCache.filters) === JSON.stringify(filters))
    )
  }, [])

  /**
   * Get cached users if available and filters match
   */
  const getFromCache = useCallback((filters?: ServerFilterOptions): UserItem[] | null => {
    if (isCacheValid(filters)) {
      return userServiceCache.data
    }
    userServiceCache.data = null
    userServiceCache.filters = {}
    return null
  }, [isCacheValid])

  /**
   * Cache users with associated filters
   */
  const setCache = useCallback((data: UserItem[], filters?: ServerFilterOptions) => {
    userServiceCache.data = data
    userServiceCache.filters = filters || {}
    userServiceCache.timestamp = Date.now()
  }, [])

  /**
   * Determine if filters are provided
   */
  const hasFilters = useCallback((options: FetchOptions): boolean => {
    return !!(
      options.search ||
      options.role ||
      options.status ||
      options.department ||
      options.tier ||
      options.minExperience !== undefined ||
      options.maxExperience !== undefined ||
      options.createdAfter ||
      options.createdBefore
    )
  }, [])

  /**
   * Build query string for search endpoint
   */
  const buildSearchQuery = useCallback((options: FetchOptions): string => {
    const params = new URLSearchParams()

    if (options.search) params.append('search', options.search)
    if (options.role) params.append('role', options.role)
    if (options.status) params.append('status', options.status)
    if (options.department) params.append('department', options.department)
    if (options.tier) params.append('tier', options.tier)
    if (options.minExperience !== undefined) params.append('minExperience', options.minExperience.toString())
    if (options.maxExperience !== undefined) params.append('maxExperience', options.maxExperience.toString())
    if (options.createdAfter) params.append('createdAfter', options.createdAfter)
    if (options.createdBefore) params.append('createdBefore', options.createdBefore)
    if (options.sortBy) params.append('sortBy', options.sortBy)
    if (options.sortOrder) params.append('sortOrder', options.sortOrder)

    const page = options.page ?? 1
    const limit = options.limit ?? 50
    params.append('page', page.toString())
    params.append('limit', limit.toString())

    return params.toString()
  }, [])

  /**
   * Fetch users with optional filters (uses search endpoint automatically)
   */
  const fetchUsers = useCallback(
    async (options: FetchOptions = {}) => {
      const { page = 1, limit = 50, signal } = options

      // Check cache first
      const cached = getFromCache(options)
      if (cached) {
        return cached
      }

      // Deduplicate: If request already in-flight, return existing promise
      if (pendingRequestRef.current) {
        return pendingRequestRef.current
      }

      // Cancel previous request if still in-flight
      abortControllerRef.current?.abort()
      abortControllerRef.current = new AbortController()

      const doFetch = async (): Promise<UserItem[]> => {
        const maxRetries = 3
        let lastErr: Error | null = null

        for (let attempt = 0; attempt < maxRetries; attempt++) {
          try {
            const controller = abortControllerRef.current || new AbortController()
            const abortSignal = signal || controller.signal

            // 30 second timeout per attempt
            const timeoutId = setTimeout(() => controller.abort(), 30000)

            try {
              // Determine which endpoint to use based on filters
              const useSearch = hasFilters(options)
              const endpoint = useSearch
                ? `/api/admin/users/search?${buildSearchQuery(options)}`
                : `/api/admin/users?page=${page}&limit=${limit}`

              const res = await apiFetch(endpoint, { signal: abortSignal } as any)

              clearTimeout(timeoutId)

              // Handle rate limiting with exponential backoff
              if (res.status === 429) {
                const waitMs = Math.min(1000 * Math.pow(2, attempt), 10000)
                console.warn(
                  `Rate limited, retrying after ${waitMs}ms (attempt ${attempt + 1}/${maxRetries})`
                )
                lastErr = new Error('Rate limit exceeded')
                if (attempt < maxRetries - 1) {
                  await new Promise((resolve) => setTimeout(resolve, waitMs))
                  continue
                }
                throw lastErr
              }

              if (!res.ok) {
                throw new Error(`Failed to load users (${res.status})`)
              }

              const data = await res.json()

              // Handle both response formats (basic endpoint vs search endpoint)
              let users: UserItem[] = []
              if (useSearch && data?.data) {
                // Search endpoint response format
                users = Array.isArray(data.data) ? (data.data as UserItem[]) : []
              } else if (!useSearch && data?.users) {
                // Basic endpoint response format
                users = Array.isArray(data.users) ? (data.users as UserItem[]) : []
              }

              // Cache the result with filters
              setCache(users, options)

              return users
            } catch (fetchErr) {
              clearTimeout(timeoutId)
              throw fetchErr
            }
          } catch (err) {
            // Ignore abort errors (from cancellation)
            if (err instanceof DOMException && err.name === 'AbortError') {
              console.debug('Users fetch cancelled')
              throw err
            }

            lastErr = err instanceof Error ? err : new Error('Unable to load users')

            if (attempt === maxRetries - 1) {
              console.error('Failed to fetch users after retries:', err)
              throw lastErr
            }

            // Wait before retry with exponential backoff
            const waitMs = Math.min(1000 * Math.pow(2, attempt), 5000)
            await new Promise((resolve) => setTimeout(resolve, waitMs))
          }
        }

        throw lastErr || new Error('Failed to fetch users')
      }

      // Store promise for deduplication
      pendingRequestRef.current = doFetch()

      try {
        const result = await pendingRequestRef.current
        return result
      } finally {
        pendingRequestRef.current = null
      }
    },
    [getFromCache, setCache, hasFilters, buildSearchQuery]
  )

  /**
   * Invalidate cache (clears all cached users)
   */
  const invalidateCache = useCallback(() => {
    userServiceCache.data = null
    userServiceCache.timestamp = 0
    userServiceCache.filters = {}
  }, [])

  /**
   * Abort any pending requests
   */
  const abort = useCallback(() => {
    abortControllerRef.current?.abort()
  }, [])

  return {
    fetchUsers,
    invalidateCache,
    abort,
    isCacheValid,
    getFromCache
  }
}
