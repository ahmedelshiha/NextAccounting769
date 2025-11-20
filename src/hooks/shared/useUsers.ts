'use client'

import useSWR, { SWRConfiguration } from 'swr'
import { apiFetch } from '@/lib/api'
import { useMemo } from 'react'

export interface UserFilters {
  role?: string
  department?: string
  search?: string
  active?: boolean
  limit?: number
  offset?: number
}

export interface UseUsersResponse {
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
  if (!res.ok) throw new Error('Failed to fetch users')
  return res.json()
}

/**
 * Fetch users with optional filters (admin only)
 * 
 * @example
 * ```tsx
 * const { data, isLoading } = useUsers({ role: 'TEAM_MEMBER', limit: 25 })
 * ```
 */
export function useUsers(
  filters: UserFilters = {},
  swrConfig?: SWRConfiguration
): UseUsersResponse {
  const params = useMemo(() => {
    const p = new URLSearchParams()
    if (filters.role) p.append('role', filters.role)
    if (filters.department) p.append('department', filters.department)
    if (filters.search) p.append('search', filters.search)
    if (filters.active !== undefined) p.append('active', String(filters.active))
    if (filters.limit) p.append('limit', String(filters.limit))
    if (filters.offset) p.append('offset', String(filters.offset))
    return p.toString()
  }, [filters])

  const key = `/api/users${params ? `?${params}` : ''}`

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

export default useUsers
