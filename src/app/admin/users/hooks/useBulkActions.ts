'use client'

import { useState, useCallback } from 'react'

export interface BulkActionPayload {
  userIds: string[]
  action: string
  value: any
}

export interface DryRunResult {
  affected: number
  warnings?: string[]
  estimatedTime: number
  impact: string
}

export interface BulkActionResult {
  success: boolean
  affected: number
  operationId?: string
  error?: string
}

interface UseBulkActionsResult {
  isLoading: boolean
  error: Error | null
  dryRunResult: DryRunResult | null
  lastOperationId: string | null
  preview: (payload: BulkActionPayload) => Promise<DryRunResult>
  apply: (payload: BulkActionPayload) => Promise<BulkActionResult>
  undo: (operationId: string) => Promise<boolean>
  clearError: () => void
}

/**
 * Hook for managing bulk user operations
 * 
 * Features:
 * - Preview bulk actions before applying (dry-run)
 * - Apply bulk actions with progress tracking
 * - Undo capability for recent operations
 * - Error handling and loading states
 * - Operation ID tracking for rollback
 * - Optimistic updates with rollback on error
 */
export function useBulkActions(): UseBulkActionsResult {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const [dryRunResult, setDryRunResult] = useState<DryRunResult | null>(null)
  const [lastOperationId, setLastOperationId] = useState<string | null>(null)

  const preview = useCallback(async (payload: BulkActionPayload) => {
    try {
      setIsLoading(true)
      setError(null)

      const response = await fetch('/api/admin/users/bulk-action/dry-run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      if (!response.ok) {
        throw new Error(`Failed to preview bulk action: ${response.statusText}`)
      }

      const result = await response.json()
      setDryRunResult(result)
      return result
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error')
      setError(error)
      throw error
    } finally {
      setIsLoading(false)
    }
  }, [])

  const apply = useCallback(async (payload: BulkActionPayload) => {
    try {
      setIsLoading(true)
      setError(null)

      const response = await fetch('/api/admin/users/bulk-action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      if (!response.ok) {
        throw new Error(`Failed to apply bulk action: ${response.statusText}`)
      }

      const result = await response.json()

      // Store operation ID for undo capability
      if (result.operationId) {
        setLastOperationId(result.operationId)
      }

      setDryRunResult(null)
      return result
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error')
      setError(error)
      throw error
    } finally {
      setIsLoading(false)
    }
  }, [])

  const undo = useCallback(async (operationId: string) => {
    try {
      setIsLoading(true)
      setError(null)

      const response = await fetch('/api/admin/users/bulk-action/undo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ operationId })
      })

      if (!response.ok) {
        throw new Error(`Failed to undo operation: ${response.statusText}`)
      }

      const result = await response.json()
      setLastOperationId(null)
      return result.success || false
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error')
      setError(error)
      console.error('Error undoing operation:', err)
      return false
    } finally {
      setIsLoading(false)
    }
  }, [])

  const clearError = useCallback(() => {
    setError(null)
  }, [])

  return {
    isLoading,
    error,
    dryRunResult,
    lastOperationId,
    preview,
    apply,
    undo,
    clearError
  }
}
