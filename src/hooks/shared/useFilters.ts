'use client'

import { useState, useCallback, useEffect } from 'react'

export interface FilterValue {
  [key: string]: string | number | boolean | string[] | undefined | null
}

interface UseFiltersOptions {
  storageKey?: string
}

/**
 * Manage filter state with optional localStorage persistence
 * 
 * @example
 * ```tsx
 * const { filters, addFilter, removeFilter, clearFilters } = useFilters(
 *   { status: 'ACTIVE' },
 *   { storageKey: 'serviceFilters' }
 * )
 * ```
 */
export function useFilters(
  defaultFilters: FilterValue = {},
  options: UseFiltersOptions = {}
) {
  const { storageKey } = options
  const [filters, setFilters] = useState<FilterValue>(defaultFilters)
  const [isLoaded, setIsLoaded] = useState(false)

  // Load from localStorage on mount
  useEffect(() => {
    if (storageKey && typeof window !== 'undefined') {
      const saved = localStorage.getItem(storageKey)
      if (saved) {
        try {
          setFilters(JSON.parse(saved))
        } catch (e) {
          console.error('Failed to parse stored filters:', e)
        }
      }
    }
    setIsLoaded(true)
  }, [storageKey])

  // Save to localStorage when filters change (after initial load)
  useEffect(() => {
    if (storageKey && isLoaded && typeof window !== 'undefined') {
      localStorage.setItem(storageKey, JSON.stringify(filters))
    }
  }, [filters, storageKey, isLoaded])

  const addFilter = useCallback((key: string, value: any) => {
    setFilters((prev) => ({ ...prev, [key]: value }))
  }, [])

  const removeFilter = useCallback((key: string) => {
    setFilters((prev) => {
      const { [key]: _, ...rest } = prev
      return rest
    })
  }, [])

  const clearFilters = useCallback(() => {
    setFilters(defaultFilters)
  }, [defaultFilters])

  const updateFilters = useCallback((newFilters: FilterValue) => {
    setFilters((prev) => ({ ...prev, ...newFilters }))
  }, [])

  return {
    filters,
    setFilters,
    addFilter,
    removeFilter,
    clearFilters,
    updateFilters,
    hasFilters: Object.keys(filters).length > 0,
  }
}

export default useFilters
