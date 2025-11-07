'use client'

import React, { useState, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { X } from 'lucide-react'
import {
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent
} from '@/components/ui/collapsible'

interface AdminSidebarProps {
  onFilterChange?: (filters: Record<string, any>) => void
  onClose?: () => void
}

/**
 * Left sidebar with filters, analytics, and widgets
 * 
 * Features:
 * - Collapsible filter sections
 * - Role and status filters
 * - Analytics widgets (charts, stats)
 * - Recent activity list
 * - Responsive drawer on mobile/tablet
 */
export default function AdminSidebar({
  onFilterChange,
  onClose
}: AdminSidebarProps) {
  const [expandedSections, setExpandedSections] = useState({
    filters: true,
    analytics: true,
    activity: false
  })

  const [filters, setFilters] = useState({
    search: '',
    role: undefined,
    status: undefined,
    department: undefined,
    dateRange: 'all'
  })

  const toggleSection = useCallback((section: keyof typeof expandedSections) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section]
    }))
  }, [])

  const handleFilterChange = useCallback(
    (key: string, value: any) => {
      const newFilters = { ...filters, [key]: value }
      setFilters(newFilters)
      onFilterChange?.(newFilters)
    },
    [filters, onFilterChange]
  )

  return (
    <div className="admin-sidebar-wrapper">
      {/* Header with close button (mobile) */}
      <div className="admin-sidebar-header">
        <h3 className="text-lg font-semibold text-gray-900">Filters & Analytics</h3>
        <Button
          variant="ghost"
          size="sm"
          onClick={onClose}
          className="lg:hidden"
          aria-label="Close sidebar"
        >
          <X className="w-5 h-5" />
        </Button>
      </div>

      {/* Sidebar content */}
      <div className="admin-sidebar-content">
        {/* Filters Section */}
        <Collapsible open={expandedSections.filters}>
          <CollapsibleTrigger
            onClick={() => toggleSection('filters')}
            className="admin-sidebar-trigger"
          >
            <h3 className="text-sm font-semibold text-gray-900">Filters</h3>
            <svg
              className={`admin-sidebar-trigger-icon ${expandedSections.filters ? 'rotate-180' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 14l-7 7m0 0l-7-7m7 7V3"
              />
            </svg>
          </CollapsibleTrigger>

          <CollapsibleContent className="admin-sidebar-content-inner">
            {/* Role filter */}
            <div className="admin-sidebar-filter-group">
              <label className="admin-sidebar-filter-label">Role</label>
              <select
                value={filters.role || ''}
                onChange={(e) => handleFilterChange('role', e.target.value || undefined)}
                className="admin-sidebar-filter-select"
                aria-label="Filter by role"
              >
                <option value="">All Roles</option>
                <option value="ADMIN">Admin</option>
                <option value="EDITOR">Editor</option>
                <option value="VIEWER">Viewer</option>
                <option value="TEAM_LEAD">Team Lead</option>
                <option value="TEAM_MEMBER">Team Member</option>
              </select>
            </div>

            {/* Status filter */}
            <div className="admin-sidebar-filter-group">
              <label className="admin-sidebar-filter-label">Status</label>
              <select
                value={filters.status || ''}
                onChange={(e) => handleFilterChange('status', e.target.value || undefined)}
                className="admin-sidebar-filter-select"
                aria-label="Filter by status"
              >
                <option value="">All Statuses</option>
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
                <option value="SUSPENDED">Suspended</option>
                <option value="PENDING">Pending</option>
              </select>
            </div>

            {/* Department filter */}
            <div className="admin-sidebar-filter-group">
              <label className="admin-sidebar-filter-label">Department</label>
              <select
                value={filters.department || ''}
                onChange={(e) => handleFilterChange('department', e.target.value || undefined)}
                className="admin-sidebar-filter-select"
                aria-label="Filter by department"
              >
                <option value="">All Departments</option>
                <option value="ENGINEERING">Engineering</option>
                <option value="SALES">Sales</option>
                <option value="MARKETING">Marketing</option>
                <option value="OPERATIONS">Operations</option>
                <option value="HR">HR</option>
              </select>
            </div>

            {/* Date range filter */}
            <div className="admin-sidebar-filter-group">
              <label className="admin-sidebar-filter-label">Date Range</label>
              <select
                value={filters.dateRange || 'all'}
                onChange={(e) => handleFilterChange('dateRange', e.target.value)}
                className="admin-sidebar-filter-select"
                aria-label="Filter by date range"
              >
                <option value="all">All Time</option>
                <option value="this-month">This Month</option>
                <option value="last-30">Last 30 Days</option>
                <option value="last-90">Last 90 Days</option>
                <option value="this-year">This Year</option>
              </select>
            </div>

            {/* Clear filters button */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setFilters({
                  search: '',
                  role: undefined,
                  status: undefined,
                  department: undefined,
                  dateRange: 'all'
                })
                onFilterChange?.({
                  search: '',
                  role: undefined,
                  status: undefined,
                  department: undefined,
                  dateRange: 'all'
                })
              }}
              className="w-full mt-2"
              aria-label="Clear all filters"
            >
              Clear Filters
            </Button>
          </CollapsibleContent>
        </Collapsible>

        {/* Analytics Section */}
        <Collapsible open={expandedSections.analytics}>
          <CollapsibleTrigger
            onClick={() => toggleSection('analytics')}
            className="admin-sidebar-trigger"
          >
            <h3 className="text-sm font-semibold text-gray-900">Analytics</h3>
            <svg
              className={`admin-sidebar-trigger-icon ${expandedSections.analytics ? 'rotate-180' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 14l-7 7m0 0l-7-7m7 7V3"
              />
            </svg>
          </CollapsibleTrigger>

          <CollapsibleContent className="admin-sidebar-content-inner">
            <div className="text-sm text-gray-600 p-3 bg-gray-50 rounded">
              <p className="font-medium mb-2">📊 Charts coming soon</p>
              <p className="text-xs">Role distribution, user growth, and activity insights will appear here.</p>
            </div>
          </CollapsibleContent>
        </Collapsible>

        {/* Activity Section */}
        <Collapsible open={expandedSections.activity}>
          <CollapsibleTrigger
            onClick={() => toggleSection('activity')}
            className="admin-sidebar-trigger"
          >
            <h3 className="text-sm font-semibold text-gray-900">Recent Activity</h3>
            <svg
              className={`admin-sidebar-trigger-icon ${expandedSections.activity ? 'rotate-180' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 14l-7 7m0 0l-7-7m7 7V3"
              />
            </svg>
          </CollapsibleTrigger>

          <CollapsibleContent className="admin-sidebar-content-inner">
            <div className="text-sm text-gray-600 p-3 bg-gray-50 rounded">
              <p className="font-medium mb-2">⏰ Activity feed coming soon</p>
              <p className="text-xs">Recent user actions and system events will appear here.</p>
            </div>
          </CollapsibleContent>
        </Collapsible>
      </div>

      <style jsx>{`
        .admin-sidebar-wrapper {
          display: flex;
          flex-direction: column;
          height: 100%;
          padding: 1rem;
          gap: 0.5rem;
        }

        .admin-sidebar-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding-bottom: 0.75rem;
          border-bottom: 1px solid var(--color-border, #e2e8f0);
          gap: 0.5rem;
        }

        .admin-sidebar-content {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
          flex: 1;
          overflow-y: auto;
        }

        .admin-sidebar-trigger {
          display: flex;
          align-items: center;
          justify-content: space-between;
          width: 100%;
          padding: 0.5rem 0;
          cursor: pointer;
          transition: background-color 0.2s;
        }

        .admin-sidebar-trigger:hover {
          background-color: var(--color-hover, rgba(0, 0, 0, 0.05));
          border-radius: 0.375rem;
          padding-left: 0.25rem;
          padding-right: 0.25rem;
        }

        .admin-sidebar-trigger-icon {
          width: 1rem;
          height: 1rem;
          transition: transform 0.3s ease;
        }

        .admin-sidebar-content-inner {
          display: flex;
          flex-direction: column;
          gap: 1rem;
          margin-top: 0.75rem;
          padding: 0.75rem;
          background-color: var(--color-bg-subtle, #f8fafc);
          border-radius: 0.375rem;
        }

        .admin-sidebar-filter-group {
          display: flex;
          flex-direction: column;
          gap: 0.375rem;
        }

        .admin-sidebar-filter-label {
          font-size: 0.75rem;
          font-weight: 600;
          color: var(--color-text-secondary, #64748b);
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .admin-sidebar-filter-select {
          padding: 0.5rem 0.75rem;
          font-size: 0.875rem;
          border: 1px solid var(--color-border, #e2e8f0);
          border-radius: 0.375rem;
          background-color: white;
          color: var(--color-text, #1e293b);
          transition: border-color 0.2s, box-shadow 0.2s;
        }

        .admin-sidebar-filter-select:hover {
          border-color: var(--color-border-hover, #cbd5e1);
        }

        .admin-sidebar-filter-select:focus {
          outline: none;
          border-color: var(--color-focus, #3b82f6);
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
        }

        @media (prefers-color-scheme: dark) {
          .admin-sidebar-filter-select {
            background-color: var(--color-surface-dark, #1e293b);
            color: var(--color-text-dark, #f1f5f9);
            border-color: var(--color-border-dark, #334155);
          }

          .admin-sidebar-content-inner {
            background-color: var(--color-bg-dark-subtle, rgba(15, 23, 42, 0.5));
          }
        }

        /* Scrollbar styling */
        .admin-sidebar-content::-webkit-scrollbar {
          width: 4px;
        }

        .admin-sidebar-content::-webkit-scrollbar-track {
          background: transparent;
        }

        .admin-sidebar-content::-webkit-scrollbar-thumb {
          background-color: var(--color-scroll-thumb, #cbd5e1);
          border-radius: 2px;
        }
      `}</style>
    </div>
  )
}
