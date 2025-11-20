'use client'

import { useCallback, useEffect, useState } from 'react'
import {
  FilterAnalyticsService,
  FilterUsageStats,
  PresetAdoptionMetrics,
  FilterCombinationMetrics,
  UserEngagementMetrics
} from '@/app/admin/users/services/filter-analytics.service'

export interface UseFilterAnalyticsOptions {
  tenantId: string
  autoRefresh?: boolean
  refreshInterval?: number
}

export interface FilterAnalyticsData {
  filterUsageStats: FilterUsageStats[]
  presetAdoptionMetrics: PresetAdoptionMetrics
  filterCombinations: FilterCombinationMetrics[]
  userEngagementMetrics: UserEngagementMetrics[]
  performanceMetrics: {
    averageFilterTime: number
    p95FilterTime: number
    p99FilterTime: number
    slowFilterCount: number
  }
}

/**
 * Hook for fetching and managing filter analytics data
 */
export function useFilterAnalytics({
  tenantId,
  autoRefresh = true,
  refreshInterval = 60000 // 1 minute
}: UseFilterAnalyticsOptions) {
  const [data, setData] = useState<FilterAnalyticsData | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Fetch analytics data
  const fetchData = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      // Get all analytics in parallel
      const [filterStats, presetMetrics, combinations, engagement, performance] = await Promise.all([
        FilterAnalyticsService.getFilterUsageStats(
          tenantId,
          new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
          new Date()
        ),
        FilterAnalyticsService.getPresetAdoptionMetrics(tenantId),
        FilterAnalyticsService.getFilterCombinations(tenantId, 10),
        FilterAnalyticsService.getUserEngagementMetrics(tenantId),
        FilterAnalyticsService.getFilterPerformanceMetrics(tenantId, 60)
      ])

      setData({
        filterUsageStats: filterStats,
        presetAdoptionMetrics: presetMetrics,
        filterCombinations: combinations,
        userEngagementMetrics: engagement,
        performanceMetrics: performance
      })
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch analytics'
      setError(message)
    } finally {
      setIsLoading(false)
    }
  }, [tenantId])

  // Auto-refresh effect
  useEffect(() => {
    if (!autoRefresh || !tenantId) return

    // Initial fetch
    fetchData()

    // Set up periodic refresh
    const interval = setInterval(fetchData, refreshInterval)

    return () => clearInterval(interval)
  }, [tenantId, autoRefresh, refreshInterval, fetchData])

  // Record filter event (for client-side usage tracking)
  const recordFilterEvent = useCallback(async (
    filterType: string,
    filterValue?: string,
    resultCount?: number,
    duration?: number
  ) => {
    // This would be called from filter components
    await FilterAnalyticsService.recordFilterEvent({
      userId: 'current-user', // Get from context
      tenantId,
      filterType,
      filterValue,
      resultCount,
      duration
    })
  }, [tenantId])

  return {
    // Data
    data,
    filterUsageStats: data?.filterUsageStats ?? [],
    presetAdoptionMetrics: data?.presetAdoptionMetrics,
    filterCombinations: data?.filterCombinations ?? [],
    userEngagementMetrics: data?.userEngagementMetrics ?? [],
    performanceMetrics: data?.performanceMetrics,

    // Loading states
    isLoading,
    error,

    // Methods
    refetch: fetchData,
    recordFilterEvent
  }
}

/**
 * Hook for most-used filters chart
 */
export function useMostUsedFilters(
  tenantId: string
) {
  const { filterUsageStats, isLoading } = useFilterAnalytics({ tenantId })

  return {
    filters: filterUsageStats
      .sort((a, b) => b.usageCount - a.usageCount)
      .slice(0, 10),
    isLoading
  }
}

/**
 * Hook for preset adoption metrics
 */
export function usePresetAdoptionMetrics(tenantId: string) {
  const { presetAdoptionMetrics, isLoading } = useFilterAnalytics({ tenantId })

  return {
    metrics: presetAdoptionMetrics,
    isLoading,
    adoptionRate: presetAdoptionMetrics?.adoptionRate ?? 0,
    topPresets: presetAdoptionMetrics?.topPresets ?? []
  }
}

/**
 * Hook for user engagement by role
 */
export function useUserEngagementByRole(tenantId: string) {
  const { userEngagementMetrics, isLoading } = useFilterAnalytics({ tenantId })

  return {
    metrics: userEngagementMetrics,
    isLoading,
    mostEngagedRole: userEngagementMetrics?.[0],
    totalEngagement: userEngagementMetrics?.reduce((sum, m) => sum + m.filterUsageCount, 0) ?? 0
  }
}

/**
 * Hook for filter combination analysis
 */
export function useFilterCombinations(tenantId: string) {
  const { filterCombinations, isLoading } = useFilterAnalytics({ tenantId })

  return {
    combinations: filterCombinations,
    isLoading,
    topCombination: filterCombinations?.[0],
    totalCombinations: filterCombinations?.length ?? 0
  }
}

/**
 * Hook for performance metrics
 */
export function useFilterPerformanceMetrics(tenantId: string) {
  const { performanceMetrics, isLoading } = useFilterAnalytics({ tenantId })

  return {
    metrics: performanceMetrics,
    isLoading,
    isPerformanceOptimal: (performanceMetrics?.averageFilterTime ?? 0) < 500, // < 500ms is good
    hasSlowFilters: (performanceMetrics?.slowFilterCount ?? 0) > 0
  }
}
