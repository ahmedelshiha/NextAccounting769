'use client'

import useSWR, { SWRConfiguration } from 'swr'
import { apiFetch } from '@/lib/api'
import { useMemo } from 'react'

export interface InvoiceFilters {
  status?: string
  dateFrom?: string
  dateTo?: string
  paymentStatus?: string
  limit?: number
  offset?: number
  search?: string
}

export interface UseInvoicesResponse {
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
  if (!res.ok) throw new Error('Failed to fetch invoices')
  return res.json()
}

/**
 * Fetch invoices with optional filters
 * For portal users, returns only their invoices
 * For admin users, returns all invoices
 * 
 * @example
 * ```tsx
 * const { data, isLoading } = useInvoices({ status: 'SENT', paymentStatus: 'UNPAID' })
 * ```
 */
export function useInvoices(
  filters: InvoiceFilters = {},
  swrConfig?: SWRConfiguration
): UseInvoicesResponse {
  const params = useMemo(() => {
    const p = new URLSearchParams()
    if (filters.status) p.append('status', filters.status)
    if (filters.dateFrom) p.append('dateFrom', filters.dateFrom)
    if (filters.dateTo) p.append('dateTo', filters.dateTo)
    if (filters.paymentStatus) p.append('paymentStatus', filters.paymentStatus)
    if (filters.limit) p.append('limit', String(filters.limit))
    if (filters.offset) p.append('offset', String(filters.offset))
    if (filters.search) p.append('search', filters.search)
    return p.toString()
  }, [filters])

  const key = `/api/invoices${params ? `?${params}` : ''}`

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

export default useInvoices
