'use client'

import useSWR, { useSWRConfig } from 'swr'
import { getUsers, GetUsersParams, GetUsersResponse } from '../api/users'
import { getStats, StatsResponse } from '../api/stats'
import { applyBulkAction, previewBulkAction, undoBulkAction, BulkActionPayload, BulkActionResponse, DryRunResponse } from '../api/bulkActions'
import { useState, useCallback } from 'react'

const fetcher = async (url: string) => {
  const res = await fetch(url)
  if (!res.ok) {
    throw new Error('Failed to fetch')
  }
  return res.json()
}

/**
 * Hook to fetch users with caching and filtering
 *
 * @param params - Query parameters for filtering, sorting, pagination
 * @returns SWR result with users data and loading/error states
 */
export function useUsers(params: GetUsersParams = {}) {
  const query = new URLSearchParams()
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      query.append(key, String(value))
    }
  })
  const url = `/api/admin/users${query.toString() ? `?${query.toString()}` : ''}`

  const { data, error, isLoading, mutate } = useSWR<GetUsersResponse, Error>(
    url,
    fetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 1000 * 60 * 5 // 5 minutes
    }
  )

  return {
    data,
    error,
    isLoading,
    mutate
  }
}

/**
 * Hook to fetch dashboard statistics
 *
 * @returns SWR result with stats data and loading/error states
 */
export function useStats() {
  const { data, error, isLoading, mutate } = useSWR<StatsResponse, Error>(
    '/api/admin/users/stats',
    fetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 1000 * 60 * 5 // 5 minutes
    }
  )

  return {
    data,
    error,
    isLoading,
    mutate
  }
}

/**
 * Hook to apply bulk actions
 *
 * @returns Function to apply bulk action and state
 */
export function useBulkAction() {
  const { mutate: mutateUsers } = useSWR('/api/admin/users')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const mutate = useCallback(
    async (payload: BulkActionPayload) => {
      setIsLoading(true)
      setError(null)
      try {
        const result = await applyBulkAction(payload)
        // Invalidate users cache
        mutateUsers()
        return result
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Unknown error')
        setError(error)
        throw error
      } finally {
        setIsLoading(false)
      }
    },
    [mutateUsers]
  )

  return {
    mutate,
    isLoading,
    error
  }
}

/**
 * Hook to preview bulk actions
 *
 * Does not modify data, only previews changes
 *
 * @returns Function to preview bulk action and state
 */
export function useBulkActionPreview() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const mutate = useCallback(async (payload: BulkActionPayload) => {
    setIsLoading(true)
    setError(null)
    try {
      const result = await previewBulkAction(payload)
      return result
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error')
      setError(error)
      throw error
    } finally {
      setIsLoading(false)
    }
  }, [])

  return {
    mutate,
    isLoading,
    error
  }
}

/**
 * Hook to undo bulk actions
 *
 * Invalidates users cache after successful undo
 *
 * @returns Function to undo bulk action and state
 */
export function useUndoBulkAction() {
  const { mutate: mutateUsers } = useSWR('/api/admin/users')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const mutate = useCallback(
    async (operationId: string) => {
      setIsLoading(true)
      setError(null)
      try {
        const result = await undoBulkAction(operationId)
        // Invalidate users cache
        mutateUsers()
        return result
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Unknown error')
        setError(error)
        throw error
      } finally {
        setIsLoading(false)
      }
    },
    [mutateUsers]
  )

  return {
    mutate,
    isLoading,
    error
  }
}
