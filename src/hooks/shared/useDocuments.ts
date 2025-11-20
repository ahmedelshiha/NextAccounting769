'use client'

import useSWR, { SWRConfiguration } from 'swr'
import { apiFetch } from '@/lib/api'
import { useMemo } from 'react'

export interface DocumentFilters {
  category?: string
  status?: string
  uploadedBy?: string
  limit?: number
  offset?: number
  search?: string
}

export interface UseDocumentsResponse {
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
  if (!res.ok) throw new Error('Failed to fetch documents')
  return res.json()
}

/**
 * Fetch documents with optional filters
 * For portal users, returns only their documents
 * For admin users, returns all documents with optional filters
 * 
 * @example
 * ```tsx
 * const { data, isLoading } = useDocuments({ category: 'INVOICE', limit: 50 })
 * ```
 */
export function useDocuments(
  filters: DocumentFilters = {},
  swrConfig?: SWRConfiguration
): UseDocumentsResponse {
  const params = useMemo(() => {
    const p = new URLSearchParams()
    if (filters.category) p.append('category', filters.category)
    if (filters.status) p.append('status', filters.status)
    if (filters.uploadedBy) p.append('uploadedBy', filters.uploadedBy)
    if (filters.limit) p.append('limit', String(filters.limit))
    if (filters.offset) p.append('offset', String(filters.offset))
    if (filters.search) p.append('search', filters.search)
    return p.toString()
  }, [filters])

  const key = `/api/documents${params ? `?${params}` : ''}`

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

export default useDocuments
