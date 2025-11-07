'use client'

import { useEffect, useState, useCallback, useMemo } from 'react'
import { useSession } from 'next-auth/react'

export interface AuditLogEntry {
  id: string
  tenantId: string | null
  userId: string | null
  action: string
  resource: string | null
  metadata: any
  ipAddress: string | null
  userAgent: string | null
  createdAt: string
  user?: {
    id: string
    name: string | null
    email: string
  } | null
}

export interface AuditLogsResult {
  logs: AuditLogEntry[]
  total: number
  limit: number
  offset: number
  hasMore: boolean
}

export interface AuditLogsFilters {
  action?: string
  userId?: string
  resource?: string
  startDate?: Date
  endDate?: Date
  search?: string
  limit?: number
  offset?: number
}

export function useAuditLogs(initialFilters?: AuditLogsFilters) {
  const { data: session } = useSession()
  const [data, setData] = useState<AuditLogsResult | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const [filters, setFilters] = useState<AuditLogsFilters>(
    initialFilters || { limit: 50, offset: 0 }
  )
  const [actions, setActions] = useState<string[]>([])
  const [stats, setStats] = useState<any>(null)

  // Fetch audit logs
  const fetchLogs = useCallback(async (appliedFilters?: AuditLogsFilters) => {
    const currentFilters = appliedFilters || filters

    if (!session?.user) {
      return
    }

    try {
      setIsLoading(true)
      setError(null)

      const params = new URLSearchParams()

      if (currentFilters.action) params.append('action', currentFilters.action)
      if (currentFilters.userId) params.append('userId', currentFilters.userId)
      if (currentFilters.resource) params.append('resource', currentFilters.resource)
      if (currentFilters.search) params.append('search', currentFilters.search)
      if (currentFilters.startDate) {
        params.append('startDate', currentFilters.startDate.toISOString())
      }
      if (currentFilters.endDate) {
        params.append('endDate', currentFilters.endDate.toISOString())
      }
      if (currentFilters.limit) params.append('limit', String(currentFilters.limit))
      if (currentFilters.offset !== undefined) {
        params.append('offset', String(currentFilters.offset))
      }

      const response = await fetch(`/api/admin/audit-logs?${params.toString()}`)

      if (!response.ok) {
        throw new Error(`Failed to fetch audit logs: ${response.statusText}`)
      }

      const result = await response.json()
      setData(result)
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'))
    } finally {
      setIsLoading(false)
    }
  }, [session, filters])

  // Fetch available actions
  const fetchActions = useCallback(async () => {
    if (!session?.user) {
      return
    }

    try {
      const response = await fetch('/api/admin/audit-logs/metadata?type=actions')

      if (!response.ok) {
        throw new Error('Failed to fetch actions')
      }

      const result = await response.json()
      setActions(result.actions || [])
    } catch (err) {
      console.error('Error fetching actions:', err)
    }
  }, [session])

  // Fetch audit stats
  const fetchStats = useCallback(async (days: number = 30) => {
    if (!session?.user) {
      return
    }

    try {
      const response = await fetch(`/api/admin/audit-logs/metadata?type=stats&days=${days}`)

      if (!response.ok) {
        throw new Error('Failed to fetch stats')
      }

      const result = await response.json()
      setStats(result)
    } catch (err) {
      console.error('Error fetching stats:', err)
    }
  }, [session])

  // Fetch logs on filter change
  useEffect(() => {
    fetchLogs()
  }, [filters, fetchLogs])

  // Fetch actions and stats on mount
  useEffect(() => {
    fetchActions()
    fetchStats()
  }, [fetchActions, fetchStats])

  // Update filters
  const updateFilters = useCallback((newFilters: Partial<AuditLogsFilters>) => {
    setFilters(prev => ({
      ...prev,
      ...newFilters,
      offset: 0 // Reset to first page when filter changes
    }))
  }, [])

  // Export logs
  const exportLogs = useCallback(async () => {
    if (!session?.user) {
      return
    }

    try {
      const response = await fetch('/api/admin/audit-logs/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: filters.action,
          userId: filters.userId,
          resource: filters.resource,
          search: filters.search,
          startDate: filters.startDate?.toISOString(),
          endDate: filters.endDate?.toISOString()
        })
      })

      if (!response.ok) {
        throw new Error('Failed to export logs')
      }

      // Get filename from headers
      const contentDisposition = response.headers.get('content-disposition')
      const filename = contentDisposition?.split('filename=')[1]?.replace(/"/g, '') ||
        `audit-logs-${new Date().toISOString().split('T')[0]}.csv`

      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = filename
      a.click()
      URL.revokeObjectURL(url)
    } catch (err) {
      console.error('Error exporting logs:', err)
    }
  }, [session, filters])

  // Pagination helpers
  const goToNextPage = useCallback(() => {
    if (data?.hasMore) {
      updateFilters({
        offset: (filters.offset || 0) + (filters.limit || 50)
      })
    }
  }, [data, filters, updateFilters])

  const goToPreviousPage = useCallback(() => {
    if ((filters.offset || 0) > 0) {
      updateFilters({
        offset: Math.max(0, (filters.offset || 0) - (filters.limit || 50))
      })
    }
  }, [filters, updateFilters])

  return {
    logs: data?.logs || [],
    total: data?.total || 0,
    limit: data?.limit || 50,
    offset: data?.offset || 0,
    hasMore: data?.hasMore || false,
    isLoading,
    error,
    filters,
    actions,
    stats,
    updateFilters,
    refetch: fetchLogs,
    exportLogs,
    goToNextPage,
    goToPreviousPage
  }
}
