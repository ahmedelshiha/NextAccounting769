'use client'

import { useState, useCallback, ReactNode, useEffect } from 'react'
import { WorkstationContext } from './WorkstationContext'
import type { WorkstationContextType, QuickStatsData, UserFilters } from '../types/workstation'

interface WorkstationProviderProps {
  children: ReactNode
}

const defaultQuickStats: QuickStatsData = {
  totalUsers: 0,
  activeUsers: 0,
  pendingApprovals: 0,
  inProgressWorkflows: 0,
  refreshedAt: new Date(),
}

export function WorkstationProvider({ children }: WorkstationProviderProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [insightsPanelOpen, setInsightsPanelOpen] = useState(true)
  const [filters, setFilters] = useState<UserFilters>({})
  const [quickStats, setQuickStats] = useState<QuickStatsData>(defaultQuickStats)
  const [quickStatsRefreshing, setQuickStatsRefreshing] = useState(false)
  const [selectedUserIds, setSelectedUserIds] = useState<Set<string>>(new Set())
  const [bulkActionType, setBulkActionType] = useState('')
  const [bulkActionValue, setBulkActionValue] = useState('')
  const [isApplyingBulkAction, setIsApplyingBulkAction] = useState(false)

  // Load state from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem('workstation-layout-prefs')
      if (stored) {
        const prefs = JSON.parse(stored)
        if (typeof prefs.sidebarOpen === 'boolean') setSidebarOpen(prefs.sidebarOpen)
        if (typeof prefs.insightsPanelOpen === 'boolean') setInsightsPanelOpen(prefs.insightsPanelOpen)
      }
    } catch (e) {
      console.warn('Failed to load workstation preferences:', e)
    }
  }, [])

  // Save layout preferences to localStorage
  const handleSetSidebarOpen = useCallback((open: boolean) => {
    setSidebarOpen(open)
    try {
      const current = JSON.parse(localStorage.getItem('workstation-layout-prefs') || '{}')
      localStorage.setItem('workstation-layout-prefs', JSON.stringify({
        ...current,
        sidebarOpen: open,
      }))
    } catch (e) {
      console.warn('Failed to save workstation preferences:', e)
    }
  }, [])

  const handleSetInsightsPanelOpen = useCallback((open: boolean) => {
    setInsightsPanelOpen(open)
    try {
      const current = JSON.parse(localStorage.getItem('workstation-layout-prefs') || '{}')
      localStorage.setItem('workstation-layout-prefs', JSON.stringify({
        ...current,
        insightsPanelOpen: open,
      }))
    } catch (e) {
      console.warn('Failed to save workstation preferences:', e)
    }
  }, [])

  const refreshQuickStats = useCallback(async () => {
    setQuickStatsRefreshing(true)
    try {
      // TODO: Fetch quick stats from API
      setQuickStats({
        ...defaultQuickStats,
        refreshedAt: new Date(),
      })
    } catch (error) {
      console.error('Failed to refresh quick stats:', error)
    } finally {
      setQuickStatsRefreshing(false)
    }
  }, [])

  const applyBulkAction = useCallback(async () => {
    if (!bulkActionType || selectedUserIds.size === 0) {
      console.warn('Bulk action requires action type and selected users')
      return
    }

    setIsApplyingBulkAction(true)
    try {
      // TODO: Call API to apply bulk action
      console.log('Applying bulk action:', {
        action: bulkActionType,
        value: bulkActionValue,
        users: Array.from(selectedUserIds),
      })
    } catch (error) {
      console.error('Failed to apply bulk action:', error)
    } finally {
      setIsApplyingBulkAction(false)
    }
  }, [bulkActionType, bulkActionValue, selectedUserIds])

  const value: WorkstationContextType = {
    sidebarOpen,
    insightsPanelOpen,
    setSidebarOpen: handleSetSidebarOpen,
    setInsightsPanelOpen: handleSetInsightsPanelOpen,
    filters,
    setFilters,
    quickStats,
    quickStatsRefreshing,
    refreshQuickStats,
    selectedUserIds,
    setSelectedUserIds,
    bulkActionType,
    setBulkActionType,
    bulkActionValue,
    setBulkActionValue,
    applyBulkAction,
    isApplyingBulkAction,
  }

  return (
    <WorkstationContext.Provider value={value}>
      {children}
    </WorkstationContext.Provider>
  )
}
