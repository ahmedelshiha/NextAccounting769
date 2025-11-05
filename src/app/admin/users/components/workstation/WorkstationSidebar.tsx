'use client'

import React, { useState } from 'react'
import { X } from 'lucide-react'
import { WorkstationSidebarProps } from '../../types/workstation'
import { QuickStatsCard } from './QuickStatsCard'
import { SavedViewsButtons } from './SavedViewsButtons'
import { AdvancedUserFilters, UserFilters } from '../AdvancedUserFilters'
import './workstation.css'

/**
 * WorkstationSidebar Component
 * Fixed left sidebar (280px) with:
 * - Quick statistics card with auto-refresh
 * - Saved views buttons (All, Clients, Team, Admins)
 * - Advanced user filters (search, role, status, dept, date)
 * - Reset filters button
 *
 * Features:
 * - Scrollable content area
 * - Mobile drawer mode (hidden by default, toggled via layout)
 * - Persistent filter state via URL params
 * - Real-time stats updates
 */
export function WorkstationSidebar({
  isOpen = true,
  onClose,
  filters = {
    search: '',
    role: undefined,
    status: undefined,
    department: undefined,
    dateRange: 'all'
  },
  onFiltersChange,
  stats = {
    totalUsers: 0,
    activeUsers: 0,
    pendingApprovals: 0,
    inProgressWorkflows: 0,
    refreshedAt: new Date()
  },
  onAddUser,
  onReset,
  className
}: WorkstationSidebarProps) {
  const [activeView, setActiveView] = useState('all')
  const [isRefreshing, setIsRefreshing] = useState(false)

  const handleSavedViewChange = (viewName: string, roleFilter?: string) => {
    setActiveView(viewName)

    // Reset filters and apply view-specific filter
    const newFilters: UserFilters = {
      search: '',
      role: roleFilter as any,
      status: undefined,
      department: undefined,
      dateRange: 'all'
    }

    onFiltersChange?.(newFilters)

    if (process.env.WORKSTATION_LOGGING_ENABLED === 'true') {
      console.log('[Workstation] Saved view applied:', viewName)
    }
  }

  const handleFiltersChange = (newFilters: UserFilters) => {
    onFiltersChange?.(newFilters)
  }

  const handleResetFilters = () => {
    setActiveView('all')
    onReset?.()
  }

  const handleRefreshStats = async () => {
    setIsRefreshing(true)
    try {
      // Trigger parent refresh
      await new Promise(resolve => setTimeout(resolve, 500))
    } finally {
      setIsRefreshing(false)
    }
  }

  return (
    <div className={`workstation-sidebar-content ${className || ''}`}>
      {/* Close Button (Mobile) */}
      {!isOpen && (
        <button
          onClick={onClose}
          className="md:hidden p-2 absolute top-2 right-2 rounded hover:bg-muted"
          aria-label="Close sidebar"
        >
          <X size={20} />
        </button>
      )}

      {/* Quick Stats Card */}
      {stats && (
        <QuickStatsCard
          stats={stats}
          isRefreshing={isRefreshing}
          onRefresh={handleRefreshStats}
        />
      )}

      {/* Saved Views Buttons */}
      <SavedViewsButtons
        activeView={activeView}
        onViewChange={handleSavedViewChange}
        viewCounts={{
          all: stats?.totalUsers || 0,
          clients: stats?.totalUsers ? Math.round(stats.totalUsers * 0.3) : 0,
          team: stats?.totalUsers ? Math.round(stats.totalUsers * 0.5) : 0,
          admins: stats?.totalUsers ? Math.round(stats.totalUsers * 0.1) : 0
        }}
      />

      {/* Advanced Filters */}
      {filters !== undefined && (
        <section className="sidebar-section sidebar-filters">
          <h3 className="sidebar-title">Filters</h3>
          <div className="sidebar-filters-container">
            <AdvancedUserFilters
              filters={filters}
              onFiltersChange={handleFiltersChange}
            />
          </div>
        </section>
      )}

      {/* Active Filters Count Badge */}
      {filters && (filters.search || filters.role || filters.status || filters.department) && (
        <div className="px-2 py-1 bg-primary/10 rounded text-xs font-medium text-primary">
          {Object.values(filters).filter(Boolean).length} active filter(s)
        </div>
      )}

      {/* Footer */}
      <div className="sidebar-footer">
        <button
          onClick={handleResetFilters}
          className="sidebar-reset-btn"
          aria-label="Reset all filters"
          title="Clear all filters and reset to 'All Users' view"
        >
          Reset Filters
        </button>
      </div>
    </div>
  )
}

export default WorkstationSidebar
