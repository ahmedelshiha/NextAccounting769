import { useCallback, useMemo } from 'react'
import useSWR, { SWRConfiguration } from 'swr'
import { apiFetch } from '@/lib/api'

// TODO: Replace HookName with actual hook name (e.g., useServices, useBookings)
// TODO: Replace DATA_TYPE with actual data type
// TODO: Replace FILTER_INTERFACE with filter parameters interface

/**
 * Filter parameters for the hook
 */
interface Filters {
  limit?: number
  offset?: number
  search?: string
  // TODO: Add more filter fields specific to your data type
}

/**
 * Return type for the hook
 */
interface UseDataResponse<T> {
  data: T[]
  error?: Error
  isLoading: boolean
  isValidating: boolean
  mutate: (data?: T[], shouldRevalidate?: boolean) => Promise<T[] | undefined>
  hasMore: boolean
  total: number
  pageSize: number
  currentPage: number
}

/**
 * Hook to fetch and manage data from API
 *
 * This hook provides automatic caching, real-time updates, and filtering capabilities.
 * It uses SWR (stale-while-revalidate) pattern for optimal performance.
 *
 * Features:
 * - Automatic caching and deduplication
 * - Real-time updates via mutate
 * - Pagination support
 * - Filtering support
 * - Error handling
 * - Loading states
 *
 * @template T - Data type being fetched
 * @param filters - Filter parameters for the request
 * @param options - SWR configuration options
 * @returns Object with data, loading state, and control functions
 *
 * @example Basic usage
 * ```tsx
 * const { data, isLoading, error } = useData()
 * ```
 *
 * @example With filters
 * ```tsx
 * const { data, mutate } = useData({
 *   limit: 20,
 *   offset: 0,
 *   search: 'query'
 * })
 * ```
 *
 * @example Manual refresh
 * ```tsx
 * const { mutate } = useData()
 * await mutate() // Refetch data
 * ```
 */
export function useData<T = any>(
  filters: Filters = {},
  options?: SWRConfiguration
): UseDataResponse<T> {
  // Build query string from filters
  const queryString = useMemo(() => {
    const params = new URLSearchParams()

    if (filters.limit) params.append('limit', String(filters.limit))
    if (filters.offset) params.append('offset', String(filters.offset))
    if (filters.search) params.append('search', filters.search)

    // TODO: Add more filter parameters as needed
    // if (filters.customFilter) params.append('customFilter', filters.customFilter)

    return params.toString()
  }, [filters])

  // Build the full API endpoint
  const endpoint = useMemo(() => {
    const baseUrl = '/api/data' // TODO: Replace with actual endpoint
    return queryString ? `${baseUrl}?${queryString}` : baseUrl
  }, [queryString])

  // Fetch data using SWR
  const { data: response, error, isValidating, mutate } = useSWR(
    endpoint,
    (url) => apiFetch(url),
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      dedupingInterval: 30000, // 30 seconds
      focusThrottleInterval: 60000, // 1 minute
      ...options,
    }
  )

  // Determine pagination metadata
  const pageSize = filters.limit || 50
  const currentPage = Math.floor((filters.offset || 0) / pageSize) + 1
  const total = response?.meta?.total || 0
  const hasMore = (filters.offset || 0) + pageSize < total

  // Memoize return object to prevent unnecessary re-renders
  const returnValue = useMemo(
    () => ({
      data: response?.data || [],
      error,
      isLoading: !response && !error,
      isValidating,
      mutate,
      hasMore,
      total,
      pageSize,
      currentPage,
    }),
    [response, error, isValidating, mutate, hasMore, total, pageSize, currentPage]
  )

  return returnValue
}

/**
 * Hook to load more data in a paginated list
 *
 * @example
 * ```tsx
 * const { data, loadMore } = useData()
 * <button onClick={() => loadMore()}>Load More</button>
 * ```
 */
export function useLoadMore<T = any>(
  filters: Filters = {},
  options?: SWRConfiguration
) {
  const { data, mutate, hasMore, pageSize, currentPage } = useData<T>(filters, options)

  const loadMore = useCallback(async () => {
    const newOffset = currentPage * pageSize
    const newFilters = {
      ...filters,
      offset: newOffset,
    }
    // Mutate should be called with new data or undefined to refetch
    // The hook will re-run with new filters
    await mutate()
  }, [filters, currentPage, pageSize, mutate])

  return { data, hasMore, loadMore, currentPage }
}

/**
 * Hook to filter data with URL synchronization
 *
 * @example
 * ```tsx
 * const { filters, setFilter, clearFilters } = useFiltersWithSync()
 * ```
 */
export function useFiltersWithSync(initialFilters: Filters = {}) {
  const setFilter = useCallback((key: keyof Filters, value: any) => {
    // TODO: Sync filters to URL query parameters
    // This allows bookmarking and sharing filtered views
  }, [])

  const clearFilters = useCallback(() => {
    // TODO: Clear all filters and reset URL
  }, [])

  const resetFilter = useCallback((key: keyof Filters) => {
    // TODO: Reset specific filter
  }, [])

  return { filters: initialFilters, setFilter, clearFilters, resetFilter }
}

export default useData
