'use client'

import useSWR, { SWRConfiguration } from 'swr'
import { apiFetch } from '@/lib/api'
import { useMemo } from 'react'

export interface MessageFilters {
  threadId: string
  limit?: number
  offset?: number
}

export interface UseMessagesResponse {
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
  if (!res.ok) throw new Error('Failed to fetch messages')
  return res.json()
}

/**
 * Fetch messages in a thread with optional pagination
 * Messages are automatically subscribed to realtime updates
 * 
 * @example
 * ```tsx
 * const { data, isLoading } = useMessages({ threadId: 'thread-123' })
 * ```
 */
export function useMessages(
  filters: MessageFilters,
  swrConfig?: SWRConfiguration
): UseMessagesResponse {
  const params = useMemo(() => {
    const p = new URLSearchParams()
    p.append('threadId', filters.threadId)
    if (filters.limit) p.append('limit', String(filters.limit))
    if (filters.offset) p.append('offset', String(filters.offset))
    return p.toString()
  }, [filters.threadId, filters.limit, filters.offset])

  const key = `/api/messages?${params}`

  const { data, error, isValidating, mutate } = useSWR(key, fetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 5000,
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

export default useMessages
