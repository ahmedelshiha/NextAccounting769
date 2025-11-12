/**
 * useSystemHealth Hook
 * 
 * SWR-based hook for polling system health with error handling,
 * status change callbacks, and configurable polling intervals.
 * 
 * @module @/hooks/admin/useSystemHealth
 */

import { useEffect, useRef } from 'react'
import useSWR from 'swr'
import type {
  SystemHealth,
  UseSystemHealthOptions,
  UseSystemHealthReturn,
} from '@/components/admin/layout/Footer/types'
import { HEALTH_CHECK_CONFIG, STATUS_MESSAGES } from '@/components/admin/layout/Footer/constants'

/**
 * Default system health response when no data is available
 */
const DEFAULT_HEALTH: SystemHealth = {
  status: 'unknown',
  message: STATUS_MESSAGES.unknown.full,
  checks: {
    database: {
      status: 'unknown',
      latency: 0,
      lastChecked: new Date().toISOString(),
    },
    api: {
      status: 'unknown',
      latency: 0,
      lastChecked: new Date().toISOString(),
    },
  },
  timestamp: new Date().toISOString(),
}

/**
 * Hook for monitoring system health with real-time polling
 * 
 * Features:
 * - Automatic polling with configurable interval
 * - Error handling and retry logic
 * - Status change callbacks
 * - Manual refetch capability
 * - Graceful degradation when API unavailable
 * 
 * @param options Configuration options
 * @returns Health data, loading/error states, and control functions
 * 
 * @example
 * ```tsx
 * const { health, status, isLoading, error } = useSystemHealth({
 *   interval: 30000,
 *   onStatusChange: (newStatus, oldStatus) => {
 *     console.log(`Status changed from ${oldStatus} to ${newStatus}`)
 *   },
 * })
 * ```
 */
export function useSystemHealth(
  options: UseSystemHealthOptions = {}
): UseSystemHealthReturn {
  const {
    interval = HEALTH_CHECK_CONFIG.pollInterval,
    enabled = true,
    onStatusChange,
  } = options

  // Track previous status to detect changes
  const previousStatusRef = useRef<string | null>(null)

  // Fetch configuration for SWR
  const fetcher = async (url: string): Promise<SystemHealth> => {
    const controller = new AbortController()
    const timeoutId = setTimeout(
      () => controller.abort(),
      HEALTH_CHECK_CONFIG.timeout
    )

    try {
      const response = await fetch(url, {
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
        },
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        throw new Error(`Health check failed: ${response.statusText}`)
      }

      const data = await response.json() as SystemHealth
      return data
    } catch (error) {
      clearTimeout(timeoutId)

      // Return degraded state on error instead of throwing
      console.warn('[useSystemHealth] Health check failed:', error)

      return {
        ...DEFAULT_HEALTH,
        status: 'unavailable',
        message: 'Unable to check system status',
      }
    }
  }

  // SWR configuration
  const endpoint = HEALTH_CHECK_CONFIG.endpoint
  const { data, error, mutate, isLoading } = useSWR<SystemHealth>(
    enabled ? endpoint : null,
    fetcher,
    {
      // Polling configuration (SWR v2 uses refreshInterval)
      refreshInterval: enabled ? interval : 0,
      revalidateOnFocus: false,
      revalidateOnReconnect: true,

      // Deduplication and retry
      dedupingInterval: 5000,
      errorRetryInterval: HEALTH_CHECK_CONFIG.retryDelay,
      errorRetryCount: HEALTH_CHECK_CONFIG.retryAttempts,

      // Cache and comparison
      compare: (a, b) => {
        // Consider data equal if status hasn't changed
        return a?.status === b?.status
      },

      // Fallback data
      fallbackData: DEFAULT_HEALTH,
    }
  )

  // Handle status changes
  useEffect(() => {
    if (!data) return

    const currentStatus = data.status
    const previousStatus = previousStatusRef.current

    // Fire callback if status changed
    if (
      previousStatus !== null &&
      currentStatus !== previousStatus &&
      onStatusChange
    ) {
      onStatusChange(currentStatus, previousStatus)
    }

    // Update previous status ref
    previousStatusRef.current = currentStatus
  }, [data?.status, onStatusChange])

  // Return normalized response
  return {
    health: data || DEFAULT_HEALTH,
    error: error instanceof Error ? error : null,
    isLoading: isLoading && !data,
    mutate,
    status: data?.status || 'unknown',
    message: data?.message || STATUS_MESSAGES.unknown.full,
    timestamp: data?.timestamp,
  }
}

/**
 * Hook for checking only if system is healthy
 * Useful for simple yes/no healthy checks
 *
 * @param options Configuration options
 * @returns true if system is healthy, false otherwise
 */
export function useSystemOperational(
  options: Omit<UseSystemHealthOptions, 'onStatusChange'> = {}
): boolean {
  const { health } = useSystemHealth(options)
  return health.status === 'healthy'
}

/**
 * Hook for checking if system has any issues
 * Returns true if status is degraded or unavailable
 *
 * @param options Configuration options
 * @returns true if system has issues, false otherwise
 */
export function useSystemHasIssues(
  options: Omit<UseSystemHealthOptions, 'onStatusChange'> = {}
): boolean {
  const { health } = useSystemHealth(options)
  return health.status === 'degraded' || health.status === 'unavailable'
}
