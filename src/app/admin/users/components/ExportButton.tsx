'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Download, Loader2 } from 'lucide-react'
import { UserItem } from '../contexts/UserDataContext'
import { useExportUsers } from '../hooks/useExportUsers'

export interface ExportButtonProps {
  users: UserItem[]
  selectedUserIds?: Set<string>
  filteredCount?: number
  totalCount?: number
  variant?: 'default' | 'outline'
  size?: 'default' | 'icon' | 'sm' | 'lg'
}

export function ExportButton({
  users,
  selectedUserIds,
  filteredCount,
  totalCount,
  variant = 'outline',
  size = 'sm'
}: ExportButtonProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  const { exportToCSV, exportToExcel } = useExportUsers()

  const handleExportCSV = async () => {
    setIsExporting(true)
    try {
      const usersToExport = selectedUserIds && selectedUserIds.size > 0
        ? users.filter(u => selectedUserIds.has(u.id))
        : users

      const timestamp = new Date().toISOString().split('T')[0]
      const suffix = selectedUserIds && selectedUserIds.size > 0
        ? `-selected-${selectedUserIds.size}`
        : filteredCount && filteredCount < totalCount!
          ? `-filtered-${filteredCount}`
          : ''

      exportToCSV(usersToExport, `users-${timestamp}${suffix}`)
      setIsOpen(false)
    } finally {
      setIsExporting(false)
    }
  }

  const handleExportExcel = async () => {
    setIsExporting(true)
    try {
      const usersToExport = selectedUserIds && selectedUserIds.size > 0
        ? users.filter(u => selectedUserIds.has(u.id))
        : users

      const timestamp = new Date().toISOString().split('T')[0]
      const suffix = selectedUserIds && selectedUserIds.size > 0
        ? `-selected-${selectedUserIds.size}`
        : filteredCount && filteredCount < totalCount!
          ? `-filtered-${filteredCount}`
          : ''

      exportToExcel(usersToExport, `users-${timestamp}${suffix}`)
      setIsOpen(false)
    } finally {
      setIsExporting(false)
    }
  }

  const exportCount = selectedUserIds && selectedUserIds.size > 0
    ? selectedUserIds.size
    : filteredCount || users.length

  return (
    <div className="relative">
      <Button
        onClick={() => setIsOpen(!isOpen)}
        variant={variant}
        size={size}
        disabled={isExporting || users.length === 0}
        aria-label="Export users"
        className="text-xs"
        title={`Export ${exportCount} user${exportCount !== 1 ? 's' : ''}`}
      >
        {isExporting ? (
          <Loader2 className="w-3 h-3 mr-1 animate-spin" />
        ) : (
          <Download className="w-3 h-3 mr-1" />
        )}
        Export
      </Button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-30"
            onClick={() => setIsOpen(false)}
          />

          <div className="absolute right-0 mt-1 bg-white border border-gray-300 rounded-md shadow-lg z-40 min-w-48">
            <div className="p-3 border-b border-gray-200">
              <p className="text-xs font-medium text-gray-900">
                Export {exportCount} user{exportCount !== 1 ? 's' : ''}
              </p>
            </div>

            <div className="p-2 space-y-1">
              <button
                onClick={handleExportCSV}
                disabled={isExporting}
                className="w-full px-3 py-2 text-left text-sm text-gray-900 hover:bg-gray-100 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                type="button"
              >
                📄 Export as CSV
              </button>
              <button
                onClick={handleExportExcel}
                disabled={isExporting}
                className="w-full px-3 py-2 text-left text-sm text-gray-900 hover:bg-gray-100 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                type="button"
              >
                📊 Export as Excel
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
