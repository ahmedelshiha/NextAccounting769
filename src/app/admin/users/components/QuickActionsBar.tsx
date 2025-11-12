'use client'

import React from 'react'
import { Button } from '@/components/ui/button'
import { Plus, Upload, Download, RefreshCw, Loader2 } from 'lucide-react'

export interface QuickActionsBarProps {
  onAddUser?: () => void
  onImport?: () => void
  onBulkOperation?: () => void
  onExport?: () => void
  onRefresh?: () => void
  isLoading?: boolean
  isRefreshing?: boolean
}

/**
 * Quick Actions Bar for operations dashboard
 *
 * Blue header with "Admin" title and action buttons
 *
 * Provides fast access to common user management operations:
 * - Add User (trigger onboarding workflow)
 * - Import (bulk import users)
 * - Export (download user list)
 * - Refresh (reload data)
 *
 * Features:
 * - Sticky positioning
 * - Responsive button layout
 * - Loading state support
 * - Accessibility-compliant
 */
export function QuickActionsBar({
  onAddUser,
  onImport,
  onExport,
  onRefresh,
  isLoading = false,
  isRefreshing = false
}: QuickActionsBarProps) {
  return (
    <div className="sticky top-0 z-40 bg-white border-b border-gray-200 shadow-sm">
      <div className="flex items-center justify-end px-6 py-4">
        {/* Right: Action Buttons */}
        <div className="flex items-center gap-2">
          <Button
            onClick={onAddUser}
            disabled={isLoading}
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm h-10 px-4"
            title="Add new user"
            aria-label="Add new user"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add User
          </Button>

          <Button
            onClick={onImport}
            disabled={isLoading}
            className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium h-10 px-4"
            title="Import users"
            aria-label="Import users"
          >
            <Upload className="w-4 h-4 mr-2" />
            Import
          </Button>

          <Button
            onClick={onExport}
            disabled={isLoading}
            className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium h-10 px-4"
            title="Export user list"
            aria-label="Export user list"
          >
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>

          <Button
            onClick={onRefresh}
            disabled={isLoading || isRefreshing}
            variant="ghost"
            className="text-gray-700 hover:bg-gray-100 h-10 w-10 p-0 transition-transform"
            title={isRefreshing ? 'Refreshing data...' : 'Refresh data'}
            aria-label={isRefreshing ? 'Refreshing data...' : 'Refresh data'}
          >
            {isRefreshing ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <RefreshCw className="w-5 h-5" />
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}
