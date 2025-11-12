import { useState, useEffect } from 'react'
import { PendingOperation, OperationsMetrics } from '@/services/pending-operations.service'
import {
  fetchPendingOperations,
  fetchOperationsMetrics
} from '@/services/pending-operations.service'

interface UsePendingOperationsOptions {
  tenantId?: string
  userCount?: number
  enabled?: boolean
}

interface UsePendingOperationsResult {
  operations: PendingOperation[]
  metrics: OperationsMetrics | null
  isLoading: boolean
  error: Error | null
  refetch: () => Promise<void>
}

/**
 * Hook to fetch and manage pending operations
 * 
 * Provides:
 * - List of pending operations/workflows
 * - Operation metrics (pending, in-progress, due this week)
 * - Loading and error states
 * - Refetch capability
 */
export function usePendingOperations({
  tenantId,
  userCount = 0,
  enabled = true
}: UsePendingOperationsOptions = {}): UsePendingOperationsResult {
  const [operations, setOperations] = useState<PendingOperation[]>([])
  const [metrics, setMetrics] = useState<OperationsMetrics | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const fetchData = async () => {
    if (!enabled) {
      setIsLoading(false)
      return
    }

    try {
      setIsLoading(true)
      setError(null)

      // Fetch both operations and metrics in parallel
      const [opsData, metricsData] = await Promise.all([
        fetchPendingOperations(tenantId || ''),
        fetchOperationsMetrics(tenantId || '', userCount)
      ])

      setOperations(opsData)
      setMetrics(metricsData)
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to fetch pending operations')
      setError(error)
      console.error('Error fetching pending operations:', error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [tenantId, userCount, enabled])

  const refetch = async () => {
    await fetchData()
  }

  return {
    operations,
    metrics,
    isLoading,
    error,
    refetch
  }
}
