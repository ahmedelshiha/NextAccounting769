'use client'

import useSWR from 'swr'
import { DashboardMetrics } from '@/services/dashboard-metrics.service'
import { Recommendation } from '@/services/recommendation-engine.service'

const fetcher = (url: string) => fetch(url).then(res => res.json())

export function useDashboardMetrics() {
  const { data, error, isLoading, mutate } = useSWR(
    '/api/admin/dashboard/metrics',
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      dedupingInterval: 60000, // 1 minute
      focusThrottleInterval: 300000 // 5 minutes
    }
  )

  return {
    data,
    isLoading,
    error,
    mutate
  }
}

export function useDashboardRecommendations() {
  const { data, error, isLoading, mutate } = useSWR(
    '/api/admin/dashboard/recommendations',
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      dedupingInterval: 600000, // 10 minutes
      focusThrottleInterval: 600000 // 10 minutes
    }
  )

  return {
    data: data?.recommendations as Recommendation[] | undefined,
    isLoading,
    error,
    mutate
  }
}

export function useDashboardAnalytics() {
  const { data, error, isLoading, mutate } = useSWR(
    '/api/admin/dashboard/analytics',
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      dedupingInterval: 600000, // 10 minutes
      focusThrottleInterval: 600000 // 10 minutes
    }
  )

  return {
    data: data?.analytics,
    isLoading,
    error,
    mutate
  }
}
