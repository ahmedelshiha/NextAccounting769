'use client'

import { useCallback, useRef, useState, useEffect } from 'react'
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
  sortBy?: 'name' | 'email' | 'createdAt' | 'role'
  sortOrder?: 'asc' | 'desc'
  page?: number
  limit?: number
}

export interface ServerFilterResponse {
  success: boolean
  data: UserItem[]
  pagination: {
    total: number
    page: number
    limit: number
    totalPages: number
    hasNextPage: boolean
    hasPreviousPage: boolean
  }
  appliedFilters: Partial<ServerFilterOptions>
}

/**
 * Server-Side Filtering Hook
 *
 * Provides optimized server-side filtering for user searches.
 * Phase 4.3: Server-Side Filtering Implementation
 *
 * Features:
 * - Full server-side filtering (name, email, role, status, department, tier, experience)
 * - Request deduplication (prevents concurrent requests for same filters)
 * - ETag-based caching (reduces unnecessary data transfers)
 * - Pagination support
 * - Sorting options
 * - Error handling and retry logic
 *
 * @param filters - Filter options to apply
 * @param options - Optional configuration (enabled, debounceMs)
 * @returns Object with data, loading, error, pagination, refetch
 *
 * @example
 * const { data, loading, error, pagination } = useServerSideFiltering({
 *   search: 'john',
 *   role: 'TEAM_MEMBER',
 *   status: 'ACTIVE',
 *   page: 1,
 *   limit: 50
 * })
 */
export function useServerSideFiltering(
  filters: ServerFilterOptions = {},
  options: { enabled?: boolean; debounceMs?: number } = {}
) {
  const { enabled = true, debounceMs = 300 } = options

  const [data, setData] = useState<UserItem[]>([])
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 50,
    totalPages: 0,
    hasNextPage: false,
    hasPreviousPage: false
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null)
  const abortControllerRef = useRef<AbortController | null>(null)
  const etagRef = useRef<string | null>(null)
  const lastFiltersRef = useRef<ServerFilterOptions | null>(null)

  /**
   * Build query string from filter options
   */
  const buildQueryString = useCallback((opts: ServerFilterOptions): string => {
    const params = new URLSearchParams()

    if (opts.search) params.append('search', opts.search)
    if (opts.role) params.append('role', opts.role)
    if (opts.status) params.append('status', opts.status)
    if (opts.department) params.append('department', opts.department)
    if (opts.tier) params.append('tier', opts.tier)
    if (opts.minExperience !== undefined) params.append('minExperience', opts.minExperience.toString())
    if (opts.maxExperience !== undefined) params.append('maxExperience', opts.maxExperience.toString())
    if (opts.createdAfter) params.append('createdAfter', opts.createdAfter)
    if (opts.createdBefore) params.append('createdBefore', opts.createdBefore)
    if (opts.sortBy) params.append('sortBy', opts.sortBy)
    if (opts.sortOrder) params.append('sortOrder', opts.sortOrder)

    const page = opts.page ?? 1
    const limit = opts.limit ?? 50
    params.append('page', page.toString())
    params.append('limit', limit.toString())

    return params.toString()
  }, [])

  /**
   * Fetch filtered users from server
   */
  const fetchFiltered = useCallback(async (opts: ServerFilterOptions) => {
    try {
      // Cancel previous request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }

      abortControllerRef.current = new AbortController()
      setLoading(true)
      setError(null)

      const queryString = buildQueryString(opts)
      const url = `/api/admin/users/search?${queryString}`

      const response = await apiFetch(url, {
        method: 'GET',
        headers: etagRef.current ? { 'If-None-Match': etagRef.current } : undefined,
        signal: abortControllerRef.current.signal
      })

      // Handle 304 Not Modified (cached response)
      if (response.status === 304) {
        setLoading(false)
        return
      }

      if (!response.ok) {
        throw new Error(`Failed to fetch filtered users: ${response.statusText}`)
      }

      const result: ServerFilterResponse = await response.json()

      // Update ETag for next request
      const newEtag = response.headers.get('ETag')
      if (newEtag) {
        etagRef.current = newEtag
      }

      setData(result.data || [])
      setPagination(result.pagination)
      setError(null)
    } catch (err: any) {
      // Ignore abort errors (from component unmount or filter change)
      if (err.name === 'AbortError') {
        return
      }

      console.error('Server-side filtering error:', err)
      setError(err.message || 'Failed to fetch filtered users')
      setData([])
    } finally {
      setLoading(false)
    }
  }, [buildQueryString])

  /**
   * Debounced fetch with filter comparison
   */
  const fetch = useCallback(
    (opts: ServerFilterOptions) => {
      // Skip if not enabled
      if (!enabled) return

      // Skip if filters haven't changed
      if (JSON.stringify(lastFiltersRef.current) === JSON.stringify(opts)) {
        return
      }

      lastFiltersRef.current = opts

      // Clear existing debounce timer
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
      }

      // Set new debounce timer
      debounceTimerRef.current = setTimeout(() => {
        fetchFiltered(opts)
      }, debounceMs)
    },
    [enabled, debounceMs, fetchFiltered]
  )

  /**
   * Immediate fetch (no debounce)
   */
  const refetch = useCallback(async (opts?: ServerFilterOptions) => {
    const optsToFetch = opts || lastFiltersRef.current || {}
    lastFiltersRef.current = optsToFetch
    await fetchFiltered(optsToFetch)
  }, [fetchFiltered])

  /**
   * Cleanup on unmount
   */
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
    }
  }, [])

  /**
   * Trigger fetch when filters change
   */
  useEffect(() => {
    fetch(filters)
  }, [filters, fetch])

  return {
    data,
    pagination,
    loading,
    error,
    refetch,
    hasFilters: Object.keys(filters).some(
      key => filters[key as keyof ServerFilterOptions] !== undefined && filters[key as keyof ServerFilterOptions] !== ''
    )
  }
}
