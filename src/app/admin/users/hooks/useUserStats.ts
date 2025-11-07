import { useCallback, useState, useEffect } from 'react'
import { apiFetch } from '@/lib/api'
import { UserStats } from '../contexts/UsersContextProvider'

const STATS_CACHE_TTL = 5 * 60 * 1000 // 5 minutes in milliseconds

interface UseUserStatsOptions {
  onError?: (error: string) => void
}

interface UseUserStatsReturn {
  stats: UserStats
  isLoading: boolean
  error: string | null
  refetch: () => Promise<void>
}

// Default empty stats object
const DEFAULT_STATS: UserStats = {
  total: 0,
  clients: 0,
  staff: 0,
  admins: 0,
  newThisMonth: 0,
  newLastMonth: 0,
  growth: 0,
  activeUsers: 0,
  registrationTrends: [],
  topUsers: []
}

let cachedStats: UserStats = DEFAULT_STATS
let cacheTimestamp: number = 0

export function useUserStats(options?: UseUserStatsOptions): UseUserStatsReturn {
  const [stats, setStats] = useState<UserStats>(DEFAULT_STATS)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refetch = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      // Check if cache is still valid
      const now = Date.now()
      if (cachedStats && now - cacheTimestamp < STATS_CACHE_TTL) {
        setStats(cachedStats)
        setIsLoading(false)
        return
      }

      const res = await apiFetch('/api/admin/stats/users')
      if (!res.ok) {
        throw new Error(`Failed to load stats (${res.status})`)
      }

      const data = (await res.json()) as UserStats
      // Ensure all required properties exist
      const validatedData: UserStats = {
        total: data.total ?? 0,
        clients: data.clients ?? 0,
        staff: data.staff ?? 0,
        admins: data.admins ?? 0,
        newThisMonth: data.newThisMonth ?? 0,
        newLastMonth: data.newLastMonth ?? 0,
        growth: data.growth ?? 0,
        activeUsers: data.activeUsers ?? 0,
        registrationTrends: Array.isArray(data.registrationTrends) ? data.registrationTrends : [],
        topUsers: Array.isArray(data.topUsers) ? data.topUsers : [],
        range: data.range
      }
      cachedStats = validatedData
      cacheTimestamp = now
      setStats(validatedData)
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Unable to load user statistics'
      console.error('Failed to fetch stats:', err)
      setError(errorMsg)
      options?.onError?.(errorMsg)
      // Always set to default stats, never null
      setStats(DEFAULT_STATS)
    } finally {
      setIsLoading(false)
    }
  }, [options])

  // Auto-fetch on mount
  useEffect(() => {
    refetch().catch(console.error)
  }, [refetch])

  return {
    stats,
    isLoading,
    error,
    refetch
  }
}

// Utility to invalidate stats cache
export function invalidateStatsCache() {
  cachedStats = DEFAULT_STATS
  cacheTimestamp = 0
}
