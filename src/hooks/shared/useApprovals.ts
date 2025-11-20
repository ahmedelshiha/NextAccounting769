'use client'

import useSWR, { SWRConfiguration } from 'swr'
import { apiFetch } from '@/lib/api'
import { useMemo } from 'react'

export interface ApprovalFilters {
  status?: string
  requestedBy?: string
  limit?: number
  offset?: number
  search?: string
  pendingOnly?: boolean
}

export interface UseApprovalsResponse {
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
  if (!res.ok) throw new Error('Failed to fetch approvals')
  return res.json()
}

/**
 * Fetch approval requests with optional filters
 * For portal users, returns only approval requests they need to respond to
 * For admin users, returns all approval requests
 * 
 * @example
 * ```tsx
 * const { data, isLoading } = useApprovals({ pendingOnly: true })
 * ```
 */
export function useApprovals(
  filters: ApprovalFilters = {},
  swrConfig?: SWRConfiguration
): UseApprovalsResponse {
  const params = useMemo(() => {
    const p = new URLSearchParams()
    if (filters.status) p.append('status', filters.status)
    if (filters.requestedBy) p.append('requestedBy', filters.requestedBy)
    if (filters.limit) p.append('limit', String(filters.limit))
    if (filters.offset) p.append('offset', String(filters.offset))
    if (filters.search) p.append('search', filters.search)
    if (filters.pendingOnly !== undefined) p.append('pendingOnly', String(filters.pendingOnly))
    return p.toString()
  }, [filters])

  const key = `/api/approvals${params ? `?${params}` : ''}`

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

export default useApprovals
