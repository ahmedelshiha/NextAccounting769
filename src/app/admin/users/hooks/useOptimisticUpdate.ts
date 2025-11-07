'use client'

import { useCallback, useRef, useState } from 'react'
import { UserItem } from '../contexts/UserDataContext'

export interface OptimisticUpdateOptions<T> {
  onSuccess?: (data: T) => void
  onError?: (error: Error, previousData: T) => void
}

/**
 * Hook for optimistic UI updates with rollback on error
 * 
 * Pattern:
 * 1. Update UI immediately (optimistic)
 * 2. Make API call in background
 * 3. On error, rollback to previous state
 * 4. Show error message to user
 */
export function useOptimisticUpdate<T extends { id: string | number }>(
  options: OptimisticUpdateOptions<T> = {}
) {
  const { onSuccess, onError } = options
  const [optimisticData, setOptimisticData] = useState<T | null>(null)
  const [error, setError] = useState<Error | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const previousDataRef = useRef<T | null>(null)
  const abortControllerRef = useRef<AbortController | null>(null)

  const executeOptimistic = useCallback(
    async (
      newData: T,
      apiCall: () => Promise<T>,
      rollbackOnError = true
    ) => {
      // Store previous data for rollback
      previousDataRef.current = optimisticData || newData

      // Update UI immediately
      setOptimisticData(newData)
      setError(null)
      setIsLoading(true)

      try {
        // Cancel previous request
        abortControllerRef.current?.abort()
        abortControllerRef.current = new AbortController()

        // Make API call
        const result = await apiCall()

        // Success - confirm the optimistic update
        setOptimisticData(result)
        setIsLoading(false)
        onSuccess?.(result)

        return result
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Unknown error')

        // Rollback on error
        if (rollbackOnError && previousDataRef.current) {
          setOptimisticData(previousDataRef.current)
          onError?.(error, previousDataRef.current)
        }

        setError(error)
        setIsLoading(false)

        throw error
      }
    },
    [optimisticData, onSuccess, onError]
  )

  const reset = useCallback(() => {
    setOptimisticData(null)
    setError(null)
    setIsLoading(false)
    previousDataRef.current = null
    abortControllerRef.current?.abort()
  }, [])

  return {
    optimisticData,
    error,
    isLoading,
    executeOptimistic,
    reset
  }
}

/**
 * Batch optimistic updates for multiple entities
 */
export function useBatchOptimisticUpdate() {
  const [optimisticUpdates, setOptimisticUpdates] = useState<Map<string | number, any>>(new Map())
  const [error, setError] = useState<Error | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const executeBatch = useCallback(
    async (
      updates: Array<{ id: string | number; data: any }>,
      apiCalls: Array<() => Promise<any>>
    ) => {
      const newOptimistic = new Map(optimisticUpdates)

      // Apply optimistic updates
      updates.forEach(({ id, data }) => {
        newOptimistic.set(id, data)
      })
      setOptimisticUpdates(newOptimistic)
      setError(null)
      setIsLoading(true)

      try {
        // Execute all API calls in parallel
        const results = await Promise.all(apiCalls.map(call => call()))

        // Update optimistic data with actual server response
        results.forEach((result, index) => {
          if (result?.id) {
            newOptimistic.set(result.id, result)
          }
        })
        setOptimisticUpdates(newOptimistic)
        setIsLoading(false)

        return results
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Batch update failed')

        // Rollback all updates
        setOptimisticUpdates(new Map(optimisticUpdates))
        setError(error)
        setIsLoading(false)

        throw error
      }
    },
    [optimisticUpdates]
  )

  const reset = useCallback(() => {
    setOptimisticUpdates(new Map())
    setError(null)
    setIsLoading(false)
  }, [])

  return {
    optimisticUpdates,
    error,
    isLoading,
    executeBatch,
    reset
  }
}
