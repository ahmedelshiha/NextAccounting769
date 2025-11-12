'use client'

import { useState, useCallback, useMemo, useEffect } from 'react'
import { UserItem } from '../contexts/UsersContextProvider'

export interface UseUsersParams {
  limit?: number
  offset?: number
  search?: string
  role?: string
  status?: string
  sort?: string
  sortOrder?: 'asc' | 'desc'
}

interface UseUsersResult {
  users: UserItem[]
  total: number
  isLoading: boolean
  error: Error | null
  refetch: () => Promise<void>
  hasMore: boolean
  loadMore: () => Promise<void>
}

/**
 * Hook for fetching users with pagination and filtering
 * 
 * Features:
 * - Fetches users from API with query parameters
 * - Handles pagination and filtering
 * - Caches results to avoid unnecessary API calls
 * - Automatic refetch on parameter changes
 * - Error handling and loading states
 * - Support for infinite loading (hasMore + loadMore)
 */
export function useUsers(params: UseUsersParams = {}): UseUsersResult {
  const [users, setUsers] = useState<UserItem[]>([])
  const [total, setTotal] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const [offset, setOffset] = useState(params.offset || 0)

  const fetchUsers = useCallback(async (loadMore = false) => {
    try {
      setIsLoading(true)
      setError(null)

      const query = new URLSearchParams()
      Object.entries({
        limit: params.limit || 50,
        offset: loadMore ? offset : params.offset || 0,
        search: params.search,
        role: params.role,
        status: params.status,
        sort: params.sort,
        sortOrder: params.sortOrder
      }).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          query.append(key, String(value))
        }
      })

      const response = await fetch(`/api/admin/users?${query.toString()}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      })

      if (!response.ok) {
        throw new Error(`Failed to fetch users: ${response.statusText}`)
      }

      const data = await response.json()
      setTotal(data.total || 0)

      if (loadMore && offset > 0) {
        setUsers((prev) => [...prev, ...(data.users || [])])
      } else {
        setUsers(data.users || [])
      }

      if (loadMore && offset > 0) {
        setOffset((prev) => prev + (params.limit || 50))
      }
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'))
      console.error('Error fetching users:', err)
    } finally {
      setIsLoading(false)
    }
  }, [params, offset])

  // Refetch when params change
  useEffect(() => {
    setOffset(0)
    fetchUsers(false)
  }, [params.search, params.role, params.status, params.sort])

  const refetch = useCallback(async () => {
    setOffset(0)
    await fetchUsers(false)
  }, [fetchUsers])

  const hasMore = useMemo(() => {
    return users.length > 0 && offset + (params.limit || 50) < total
  }, [users.length, offset, params.limit, total])

  const loadMore = useCallback(async () => {
    if (!hasMore) return
    await fetchUsers(true)
  }, [hasMore, fetchUsers])

  return {
    users,
    total,
    isLoading,
    error,
    refetch,
    hasMore,
    loadMore
  }
}
