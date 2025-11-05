'use client'

import React, { useState, useEffect } from 'react'
import { RefreshCw, TrendingUp, TrendingDown } from 'lucide-react'
import { QuickStatsCardProps } from '../../types/workstation'
import './workstation.css'

/**
 * QuickStatsCard Component
 * Displays real-time statistics in the workstation sidebar
 * Shows: Total Users, Active Users, Pending Approvals, In Progress Workflows
 *
 * Features:
 * - Real-time updates (5-minute auto-refresh)
 * - Manual refresh button
 * - Trend indicators (up/down/stable)
 * - Color-coded status
 * - Loading skeleton
 */
export function QuickStatsCard({
  stats,
  isRefreshing = false,
  onRefresh,
  className
}: QuickStatsCardProps) {
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date())
  const [localRefreshing, setLocalRefreshing] = useState(false)

  const refreshing = isRefreshing || localRefreshing

  const handleRefresh = async () => {
    setLocalRefreshing(true)
    try {
      await onRefresh?.()
    } finally {
      setLocalRefreshing(false)
      setLastUpdated(new Date())
    }
  }

  // Auto-refresh every 5 minutes
  useEffect(() => {
    const interval = setInterval(() => {
      handleRefresh()
    }, 5 * 60 * 1000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className={`quick-stats-card ${className || ''}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-foreground">Quick Stats</h3>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="p-1 hover:bg-muted rounded transition-colors disabled:opacity-50"
          aria-label="Refresh statistics"
          title="Refresh statistics"
        >
          <RefreshCw
            size={14}
            className={refreshing ? 'animate-spin' : ''}
          />
        </button>
      </div>

      {/* Stats Grid */}
      <div className="space-y-2">
        {/* Total Users */}
        <div className="stat-item">
          <div className="flex items-center justify-between">
            <span className="stat-label">Total Users</span>
            <span className="text-xs text-muted-foreground">{stats.totalUsers}</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="stat-value text-lg">{stats.totalUsers}</span>
          </div>
        </div>

        {/* Active Users */}
        <div className="stat-item">
          <div className="flex items-center justify-between">
            <span className="stat-label">Active</span>
            <span className="text-xs text-green-600">✓</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="stat-value text-lg text-green-600">{stats.activeUsers}</span>
            <span className="text-xs text-muted-foreground">
              ({Math.round((stats.activeUsers / (stats.totalUsers || 1)) * 100)}%)
            </span>
          </div>
        </div>

        {/* Pending Approvals */}
        <div className="stat-item">
          <div className="flex items-center justify-between">
            <span className="stat-label">Pending</span>
            {stats.pendingApprovals > 0 && (
              <span className="inline-flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-yellow-500 rounded-full">
                {stats.pendingApprovals}
              </span>
            )}
          </div>
          <span className="text-sm text-yellow-600 font-medium">
            {stats.pendingApprovals} awaiting approval
          </span>
        </div>

        {/* In Progress Workflows */}
        <div className="stat-item">
          <div className="flex items-center justify-between">
            <span className="stat-label">In Progress</span>
            {stats.inProgressWorkflows > 0 && (
              <span className="inline-flex items-center gap-1">
                <span className="inline-block w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                <span className="text-xs font-semibold text-blue-600">{stats.inProgressWorkflows}</span>
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-3 pt-2 border-t border-border">
        <p className="text-xs text-muted-foreground">
          Updated {lastUpdated.toLocaleTimeString()}
        </p>
      </div>

      {/* Loading State */}
      {refreshing && (
        <div className="absolute inset-0 bg-background/50 rounded flex items-center justify-center">
          <RefreshCw size={16} className="animate-spin text-muted-foreground" />
        </div>
      )}
    </div>
  )
}

export default QuickStatsCard
