'use client'

import { useState, useCallback, useMemo } from 'react'

export interface AdminFilters {
  search: string
  role: string | null
  status: string | null
  department: string | null
  dateRange: 'all' | '7d' | '30d' | '90d'
}

interface UseAdminFiltersResult {
  filters: AdminFilters
  setSearch: (search: string) => void
  setRole: (role: string | null) => void
  setStatus: (status: string | null) => void
  setDepartment: (department: string | null) => void
  setDateRange: (range: '7d' | '30d' | '90d' | 'all') => void
  clearFilters: () => void
  hasActiveFilters: boolean
  filterCount: number
}

/**
 * Hook for managing admin dashboard filters
 * 
 * Provides:
 * - Filter state management
 * - Individual setters for each filter
 * - Clear all filters function
 * - Computed properties (hasActiveFilters, filterCount)
 * - Memoized to prevent unnecessary re-renders
 */
export function useAdminFilters(
  initialFilters?: Partial<AdminFilters>
): UseAdminFiltersResult {
  const [filters, setFilters] = useState<AdminFilters>({
    search: initialFilters?.search || '',
    role: initialFilters?.role || null,
    status: initialFilters?.status || null,
    department: initialFilters?.department || null,
    dateRange: initialFilters?.dateRange || 'all'
  })

  const setSearch = useCallback((search: string) => {
    setFilters((prev) => ({ ...prev, search }))
  }, [])

  const setRole = useCallback((role: string | null) => {
    setFilters((prev) => ({ ...prev, role }))
  }, [])

  const setStatus = useCallback((status: string | null) => {
    setFilters((prev) => ({ ...prev, status }))
  }, [])

  const setDepartment = useCallback((department: string | null) => {
    setFilters((prev) => ({ ...prev, department }))
  }, [])

  const setDateRange = useCallback(
    (range: '7d' | '30d' | '90d' | 'all') => {
      setFilters((prev) => ({ ...prev, dateRange: range }))
    },
    []
  )

  const clearFilters = useCallback(() => {
    setFilters({
      search: '',
      role: null,
      status: null,
      department: null,
      dateRange: 'all'
    })
  }, [])

  // Compute if any filters are active
  const hasActiveFilters = useMemo(() => {
    return (
      filters.search !== '' ||
      filters.role !== null ||
      filters.status !== null ||
      filters.department !== null ||
      filters.dateRange !== 'all'
    )
  }, [filters])

  // Count active filters
  const filterCount = useMemo(() => {
    let count = 0
    if (filters.search) count++
    if (filters.role) count++
    if (filters.status) count++
    if (filters.department) count++
    if (filters.dateRange !== 'all') count++
    return count
  }, [filters])

  return {
    filters,
    setSearch,
    setRole,
    setStatus,
    setDepartment,
    setDateRange,
    clearFilters,
    hasActiveFilters,
    filterCount
  }
}
