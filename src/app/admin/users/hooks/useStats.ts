'use client'

import { useState, useCallback, useEffect } from 'react'

export interface StatsData {
  totalUsers: number
  activeUsers: number
  pendingApprovals: number
  inProgressWorkflows: number
  systemHealth: number
  costPerUser: number
  roleDistribution?: Record<string, number>
  userGrowth?: {
    labels: string[]
    values: number[]
  }
}

interface UseStatsResult {
  stats: StatsData | null
  isLoading: boolean
  error: Error | null
  refetch: () => Promise<void>
}

/**
 * Hook for fetching dashboard statistics
 * 
 * Features:
 * - Fetches KPI metrics from API
 * - Includes role distribution and growth data
 * - Caches results with 5-minute stale time
 * - Automatic refetch capability
 * - Error handling and loading states
 * - Suitable for overview card displays
 */
export function useStats(): UseStatsResult {
  const [stats, setStats] = useState<StatsData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const [lastFetchTime, setLastFetchTime] = useState(0)

  const fetchStats = useCallback(async (force = false) => {
    // Use cache if less than 5 minutes old
    const now = Date.now()
    if (!force && lastFetchTime && now - lastFetchTime < 5 * 60 * 1000) {
      setIsLoading(false)
      return
    }

    try {
      setIsLoading(true)
      setError(null)

      const response = await fetch('/api/admin/users/stats', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      })

      if (!response.ok) {
        throw new Error(`Failed to fetch stats: ${response.statusText}`)
      }

      const data = await response.json()
      setStats(data)
      setLastFetchTime(now)
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'))
      console.error('Error fetching stats:', err)
    } finally {
      setIsLoading(false)
    }
  }, [lastFetchTime])

  // Fetch stats on mount
  useEffect(() => {
    fetchStats()
  }, [])

  const refetch = useCallback(async () => {
    await fetchStats(true)
  }, [fetchStats])

  // Provide default stats if fetch fails
  const displayStats = stats || {
    totalUsers: 0,
    activeUsers: 0,
    pendingApprovals: 0,
    inProgressWorkflows: 0,
    systemHealth: 0,
    costPerUser: 0
  }

  return {
    stats: displayStats,
    isLoading,
    error,
    refetch
  }
}
