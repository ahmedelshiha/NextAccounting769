'use client'

import useSWR, { SWRConfiguration } from 'swr'
import { apiFetch } from '@/lib/api'
import { useMemo } from 'react'

export interface BookingFilters {
  status?: string
  serviceId?: string
  clientId?: string
  dateFrom?: string
  dateTo?: string
  limit?: number
  offset?: number
  search?: string
}

export interface UseBookingsResponse {
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
  if (!res.ok) throw new Error('Failed to fetch bookings')
  return res.json()
}

/**
 * Fetch bookings with optional filters
 * For portal users, returns only their bookings
 * For admin users, returns all bookings with optional client filter
 * 
 * @example
 * ```tsx
 * const { data, isLoading } = useBookings({ status: 'CONFIRMED', limit: 10 })
 * ```
 */
export function useBookings(
  filters: BookingFilters = {},
  swrConfig?: SWRConfiguration
): UseBookingsResponse {
  const params = useMemo(() => {
    const p = new URLSearchParams()
    if (filters.status) p.append('status', filters.status)
    if (filters.serviceId) p.append('serviceId', filters.serviceId)
    if (filters.clientId) p.append('clientId', filters.clientId)
    if (filters.dateFrom) p.append('dateFrom', filters.dateFrom)
    if (filters.dateTo) p.append('dateTo', filters.dateTo)
    if (filters.limit) p.append('limit', String(filters.limit))
    if (filters.offset) p.append('offset', String(filters.offset))
    if (filters.search) p.append('search', filters.search)
    return p.toString()
  }, [filters])

  const key = `/api/bookings${params ? `?${params}` : ''}`

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

export default useBookings
