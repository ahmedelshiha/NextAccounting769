'use client'

import useSWR, { SWRConfiguration } from 'swr'
import { apiFetch } from '@/lib/api'
import { useMemo } from 'react'

export interface ServiceFilters {
  active?: boolean
  category?: string
  featured?: boolean
  limit?: number
  offset?: number
  search?: string
}

export interface UseServicesResponse {
  data: any[]
  error?: Error
  isLoading: boolean
  isValidating: boolean
  mutate: any
  refresh: () => void
  hasMore: boolean
  total: number
}

const fetcher = async (url: string) => {
  const res = await apiFetch(url)
  if (!res.ok) throw new Error('Failed to fetch services')
  return res.json()
}

/**
 * Fetch services with optional filters
 * 
 * @example
 * ```tsx
 * const { data, isLoading, error } = useServices({ active: true, limit: 20 })
 * ```
 */
export function useServices(
  filters: ServiceFilters = {},
  swrConfig?: SWRConfiguration
): UseServicesResponse {
  const params = useMemo(() => {
    const p = new URLSearchParams()
    if (filters.active !== undefined) p.append('active', String(filters.active))
    if (filters.category) p.append('category', filters.category)
    if (filters.featured !== undefined) p.append('featured', String(filters.featured))
    if (filters.limit) p.append('limit', String(filters.limit))
    if (filters.offset) p.append('offset', String(filters.offset))
    if (filters.search) p.append('search', filters.search)
    return p.toString()
  }, [filters])

  const key = `/api/services${params ? `?${params}` : ''}`

  const { data, error, isValidating, mutate } = useSWR(key, fetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 30000,
    ...swrConfig,
  })

  return {
    data: data?.data || [],
    error,
    isLoading: !data && !error,
    isValidating,
    mutate,
    refresh: () => mutate(),
    hasMore: data?.meta?.hasMore || false,
    total: data?.meta?.total || 0,
  }
}

export default useServices
