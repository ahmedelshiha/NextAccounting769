'use client'

import React from 'react'
import { Button } from '@/components/ui/button'
import { Plus, Upload, Download, RefreshCw, Settings } from 'lucide-react'

interface QuickActionsBarProps {
  onAddUser?: () => void
  onImport?: () => void
  onBulkOperation?: () => void
  onExport?: () => void
  onRefresh?: () => void
  isLoading?: boolean
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
 * - Audit Trail (settings/gear icon)
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
  isLoading = false
}: QuickActionsBarProps) {
  return (
    <div className="sticky top-0 z-40 bg-blue-500 text-white shadow-md">
      <div className="flex items-center justify-between px-6 py-4">
        {/* Left: Admin Title */}
        <h1 className="text-xl font-semibold text-white">Admin</h1>

        {/* Right: Action Buttons */}
        <div className="flex items-center gap-2">
          <Button
            onClick={onAddUser}
            disabled={isLoading}
            className="bg-blue-500 hover:bg-blue-600 text-white border border-white text-sm font-medium h-10 px-4"
            title="Add new user"
            aria-label="Add new user"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add User
          </Button>

          <Button
            onClick={onImport}
            disabled={isLoading}
            variant="outline"
            className="border-white text-white hover:bg-blue-600 text-sm font-medium h-10 px-4"
            title="Import users"
            aria-label="Import users"
          >
            <Upload className="w-4 h-4 mr-2" />
            Import
          </Button>

          <Button
            onClick={onExport}
            disabled={isLoading}
            variant="outline"
            className="border-white text-white hover:bg-blue-600 text-sm font-medium h-10 px-4"
            title="Export user list"
            aria-label="Export user list"
          >
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>

          <Button
            onClick={onRefresh}
            disabled={isLoading}
            variant="ghost"
            className="text-white hover:bg-blue-600 h-10 w-10 p-0"
            title="Refresh data"
            aria-label="Refresh data"
          >
            <RefreshCw className="w-5 h-5" />
          </Button>

          <Button
            disabled={isLoading}
            variant="ghost"
            className="text-white hover:bg-blue-600 h-10 w-10 p-0"
            title="Audit trail"
            aria-label="Audit trail"
          >
            <Settings className="w-5 h-5" />
          </Button>
        </div>
      </div>
    </div>
  )
}
