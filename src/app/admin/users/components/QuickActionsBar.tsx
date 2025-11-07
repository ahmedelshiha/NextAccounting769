'use client'

import React from 'react'
import { Button } from '@/components/ui/button'

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
 * Provides fast access to common user management operations:
 * - Add User (trigger onboarding workflow)
 * - Import CSV (bulk import users)
 * - Bulk Update (trigger bulk operations wizard)
 * - Export (download user list)
 * - Refresh (reload data)
 * 
 * Features:
 * - Responsive button layout
 * - Loading state support
 * - Accessibility-compliant
 * - Icon-based visual communication
 */
export function QuickActionsBar({
  onAddUser,
  onImport,
  onBulkOperation,
  onExport,
  onRefresh,
  isLoading = false
}: QuickActionsBarProps) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2 p-3 sm:p-4 bg-gray-50 border-b border-gray-200">
      <Button
        onClick={onAddUser}
        disabled={isLoading}
        className="bg-blue-600 hover:bg-blue-700 text-xs sm:text-sm"
        size="sm"
        title="Add new user"
      >
        <span className="mr-1 sm:mr-2">➕</span>
        <span className="hidden sm:inline">Add User</span>
        <span className="sm:hidden">Add</span>
      </Button>

      <Button
        onClick={onImport}
        disabled={isLoading}
        variant="outline"
        size="sm"
        className="text-xs sm:text-sm"
        title="Import CSV file"
      >
        <span className="mr-1 sm:mr-2">📥</span>
        <span className="hidden sm:inline">Import CSV</span>
        <span className="sm:hidden">Import</span>
      </Button>

      <Button
        onClick={onBulkOperation}
        disabled={isLoading}
        variant="outline"
        size="sm"
        className="text-xs sm:text-sm"
        title="Bulk update users"
      >
        <span className="mr-1 sm:mr-2">⚙️</span>
        <span className="hidden md:inline">Bulk Update</span>
        <span className="md:hidden">Bulk</span>
      </Button>

      <Button
        onClick={onExport}
        disabled={isLoading}
        variant="outline"
        size="sm"
        className="text-xs sm:text-sm"
        title="Export user list"
      >
        <span className="mr-1 sm:mr-2">📤</span>
        <span className="hidden sm:inline">Export</span>
        <span className="sm:hidden">Export</span>
      </Button>

      <Button
        onClick={onRefresh}
        disabled={isLoading}
        variant="outline"
        size="sm"
        className="text-xs sm:text-sm"
        title="Refresh data"
      >
        <span className="mr-1 sm:mr-2">🔄</span>
        <span className="hidden md:inline">Refresh</span>
        <span className="md:hidden">Refresh</span>
      </Button>
    </div>
  )
}
