'use client'

import useSWR, { SWRConfiguration } from 'swr'
import { apiFetch } from '@/lib/api'
import { useMemo } from 'react'

export interface TaskFilters {
  status?: string
  assigneeId?: string
  priority?: string
  dateFrom?: string
  dateTo?: string
  limit?: number
  offset?: number
  search?: string
  assignedToMe?: boolean
}

export interface UseTasksResponse {
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
  if (!res.ok) throw new Error('Failed to fetch tasks')
  return res.json()
}

/**
 * Fetch tasks with optional filters
 * For portal users with assignedToMe=true, returns only assigned tasks
 * For admin users, returns all tasks with optional filters
 * 
 * @example
 * ```tsx
 * const { data, isLoading } = useTasks({ assignedToMe: true, status: 'OPEN' })
 * ```
 */
export function useTasks(
  filters: TaskFilters = {},
  swrConfig?: SWRConfiguration
): UseTasksResponse {
  const params = useMemo(() => {
    const p = new URLSearchParams()
    if (filters.status) p.append('status', filters.status)
    if (filters.assigneeId) p.append('assigneeId', filters.assigneeId)
    if (filters.priority) p.append('priority', filters.priority)
    if (filters.dateFrom) p.append('dateFrom', filters.dateFrom)
    if (filters.dateTo) p.append('dateTo', filters.dateTo)
    if (filters.limit) p.append('limit', String(filters.limit))
    if (filters.offset) p.append('offset', String(filters.offset))
    if (filters.search) p.append('search', filters.search)
    if (filters.assignedToMe !== undefined) p.append('assignedToMe', String(filters.assignedToMe))
    return p.toString()
  }, [filters])

  const key = `/api/tasks${params ? `?${params}` : ''}`

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

export default useTasks
