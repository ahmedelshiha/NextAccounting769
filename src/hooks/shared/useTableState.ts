'use client'

import { useState, useCallback } from 'react'

export interface SortState {
  column?: string
  order: 'asc' | 'desc'
}

export interface TableState {
  page: number
  limit: number
  sort: SortState
}

interface UseTableStateOptions {
  initialPage?: number
  initialLimit?: number
  initialSort?: SortState
}

/**
 * Manage table pagination and sorting state
 * 
 * @example
 * ```tsx
 * const { page, limit, sort, setSortBy, goToPage, setLimit } = useTableState({
 *   initialLimit: 25,
 * })
 * ```
 */
export function useTableState(options: UseTableStateOptions = {}) {
  const {
    initialPage = 1,
    initialLimit = 10,
    initialSort = { order: 'asc' },
  } = options

  const [page, setPage] = useState(initialPage)
  const [limit, setLimitState] = useState(initialLimit)
  const [sort, setSort] = useState<SortState>(initialSort)

  const goToPage = useCallback((newPage: number) => {
    setPage(Math.max(1, newPage))
  }, [])

  const nextPage = useCallback(() => {
    setPage((prev) => prev + 1)
  }, [])

  const prevPage = useCallback(() => {
    setPage((prev) => Math.max(1, prev - 1))
  }, [])

  const setLimit = useCallback((newLimit: number) => {
    setLimitState(newLimit)
    setPage(1) // Reset to first page when changing limit
  }, [])

  const setSortBy = useCallback((column: string) => {
    setSort((prev) => ({
      column,
      order:
        prev.column === column && prev.order === 'asc' ? 'desc' : 'asc',
    }))
    setPage(1) // Reset to first page when changing sort
  }, [])

  const reset = useCallback(() => {
    setPage(initialPage)
    setLimitState(initialLimit)
    setSort(initialSort)
  }, [initialPage, initialLimit, initialSort])

  const offset = (page - 1) * limit

  return {
    // State
    page,
    limit,
    sort,
    offset,

    // Pagination actions
    goToPage,
    nextPage,
    prevPage,
    setLimit,

    // Sorting
    setSortBy,
    isSortedBy: (column: string) => sort.column === column,

    // Reset
    reset,

    // Computed
    tableState: { page, limit, sort } as TableState,
  }
}

export default useTableState
