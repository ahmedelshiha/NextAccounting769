'use client'

import React from 'react'
import { Button } from '@/components/ui/button'
import { ChevronLeft, Settings } from 'lucide-react'

interface DirectoryHeaderProps {
  selectedCount?: number
  onClearSelection?: () => void
  onSidebarToggle?: () => void
  onColumnSettings?: () => void
}

/**
 * Header for the user directory table section
 * 
 * Features:
 * - Directory title and info
 * - Column settings button
 * - Sidebar toggle (on tablet/mobile)
 * - Clear selection button (when users selected)
 */
export default function DirectoryHeader({
  selectedCount = 0,
  onClearSelection,
  onSidebarToggle,
  onColumnSettings
}: DirectoryHeaderProps) {
  return (
    <div className="flex items-center justify-between px-4 py-3 border-b bg-gray-50 rounded-t-lg" data-testid="directory-header">
      <div className="flex items-center gap-2">
        {/* Sidebar toggle for tablet/mobile */}
        <Button
          variant="ghost"
          size="sm"
          onClick={onSidebarToggle}
          className="hidden sm:inline-flex lg:hidden"
          aria-label="Toggle sidebar"
          title="Toggle sidebar"
        >
          <ChevronLeft className="w-4 h-4" />
        </Button>

        {/* Directory title */}
        <div className="flex-1">
          <h2 className="text-lg font-semibold text-gray-900">User Directory</h2>
          {selectedCount > 0 && (
            <p className="text-sm text-gray-600">
              {selectedCount} {selectedCount === 1 ? 'user' : 'users'} selected
            </p>
          )}
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex items-center gap-2">
        {selectedCount > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={onClearSelection}
            aria-label="Clear selection"
            title="Clear selection"
          >
            Clear ({selectedCount})
          </Button>
        )}

        <Button
          variant="ghost"
          size="sm"
          onClick={onColumnSettings}
          aria-label="Column settings"
          title="Configure visible columns"
        >
          <Settings className="w-4 h-4" />
        </Button>
      </div>
    </div>
  )
}
