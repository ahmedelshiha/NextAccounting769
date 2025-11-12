'use client'

import { useCallback, useMemo, useState } from 'react'

export interface PaginationParams {
  page: number
  limit: number
  offset: number
}

export interface PaginationState {
  page: number
  limit: number
  total: number
  isLoading: boolean
  error: string | null
}

export interface PaginationMeta {
  page: number
  limit: number
  total: number
  totalPages: number
  hasNext: boolean
  hasPrev: boolean
  offset: number
}

/**
 * Hook for managing server-side pagination
 * Handles page tracking, offset calculation, and pagination metadata
 */
export function usePagination(initialPage = 1, initialLimit = 50) {
  const [page, setPage] = useState(initialPage)
  const [limit, setLimit] = useState(initialLimit)
  const [total, setTotal] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Calculate pagination metadata
  const meta = useMemo(() => {
    const totalPages = Math.ceil(total / limit)
    const offset = (page - 1) * limit
    const hasNext = page < totalPages
    const hasPrev = page > 1

    return {
      page,
      limit,
      total,
      totalPages,
      hasNext,
      hasPrev,
      offset
    } as PaginationMeta
  }, [page, limit, total])

  // Get API parameters for current page
  const params = useMemo(() => ({
    page,
    limit,
    offset: meta.offset
  } as PaginationParams), [page, limit, meta.offset])

  // Navigate to specific page
  const goToPage = useCallback((newPage: number) => {
    if (newPage >= 1 && newPage <= meta.totalPages) {
      setPage(newPage)
      setError(null)
    }
  }, [meta.totalPages])

  // Navigate to next page
  const nextPage = useCallback(() => {
    if (meta.hasNext) {
      setPage(prev => prev + 1)
      setError(null)
    }
  }, [meta.hasNext])

  // Navigate to previous page
  const prevPage = useCallback(() => {
    if (meta.hasPrev) {
      setPage(prev => prev - 1)
      setError(null)
    }
  }, [meta.hasPrev])

  // Change page size
  const changeLimit = useCallback((newLimit: number) => {
    if (newLimit > 0) {
      setLimit(newLimit)
      setPage(1) // Reset to first page when changing limit
      setError(null)
    }
  }, [])

  // Reset pagination to initial state
  const reset = useCallback(() => {
    setPage(initialPage)
    setLimit(initialLimit)
    setTotal(0)
    setError(null)
  }, [initialPage, initialLimit])

  // Update total items count (call this when fetching data)
  const setTotalItems = useCallback((count: number) => {
    setTotal(count)
    // Ensure current page is still valid
    const totalPages = Math.ceil(count / limit)
    if (page > totalPages && totalPages > 0) {
      setPage(totalPages)
    }
  }, [limit, page])

  return {
    // State
    page,
    limit,
    total,
    isLoading,
    error,
    
    // Navigation
    goToPage,
    nextPage,
    prevPage,
    changeLimit,
    reset,
    setTotalItems,
    setIsLoading,
    setError,
    
    // Metadata
    meta,
    params
  }
}

/**
 * Hook for managing pagination with SWR data fetching
 */
export function usePaginationWithFetch<T>(
  fetchFn: (params: PaginationParams) => Promise<{ data: T[]; total: number }>,
  options: {
    initialPage?: number
    initialLimit?: number
    autoFetch?: boolean
    deps?: any[]
  } = {}
) {
  const {
    initialPage = 1,
    initialLimit = 50,
    autoFetch = true,
    deps = []
  } = options

  const pagination = usePagination(initialPage, initialLimit)
  const [data, setData] = useState<T[]>([])
  const [isFetching, setIsFetching] = useState(false)

  const fetchData = useCallback(async () => {
    setIsFetching(true)
    pagination.setIsLoading(true)
    
    try {
      const result = await fetchFn(pagination.params)
      setData(result.data)
      pagination.setTotalItems(result.total)
      pagination.setError(null)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch data'
      pagination.setError(message)
      setData([])
    } finally {
      setIsFetching(false)
      pagination.setIsLoading(false)
    }
  }, [fetchFn, pagination])

  // Auto-fetch when pagination changes
  React.useEffect(() => {
    if (autoFetch) {
      fetchData()
    }
  }, [pagination.params, autoFetch, ...deps])

  return {
    ...pagination,
    data,
    isFetching,
    fetchData,
    refresh: fetchData
  }
}

// Export React for useEffect usage
import React from 'react'
