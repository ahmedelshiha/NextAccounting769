'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Eye, ChevronDown, RotateCcw } from 'lucide-react'
import { ColumnConfig } from '../hooks/useColumnVisibility'

export interface ColumnVisibilityMenuProps {
  columns: ColumnConfig[]
  onToggleColumn: (columnId: string) => void
  onResetToDefaults: () => void
}

export function ColumnVisibilityMenu({
  columns,
  onToggleColumn,
  onResetToDefaults
}: ColumnVisibilityMenuProps) {
  const [open, setOpen] = useState(false)
  const visibleCount = columns.filter(col => col.visible).length

  return (
    <div className="relative">
      <Button
        onClick={() => setOpen(!open)}
        variant="outline"
        size="sm"
        className="text-xs"
        aria-label={`Column visibility settings (${visibleCount} visible)`}
        title={`${visibleCount} columns visible`}
      >
        <Eye className="w-3 h-3 mr-1" />
        Columns
        <ChevronDown className={`w-3 h-3 ml-1 transition-transform ${open ? 'rotate-180' : ''}`} />
      </Button>

      {open && (
        <>
          <div
            className="fixed inset-0 z-30"
            onClick={() => setOpen(false)}
          />

          <div className="absolute right-0 mt-1 bg-white border border-gray-300 rounded-md shadow-lg z-40 min-w-56">
            <div className="p-3 border-b border-gray-200 flex items-center justify-between">
              <p className="text-xs font-medium text-gray-900">
                Columns ({visibleCount})
              </p>
              <button
                onClick={onResetToDefaults}
                className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1"
                type="button"
                aria-label="Reset to default columns"
                title="Reset to default columns"
              >
                <RotateCcw className="w-3 h-3" />
                Reset
              </button>
            </div>

            <div className="max-h-64 overflow-y-auto p-2">
              {columns.map(column => (
                <label
                  key={column.id}
                  className="flex items-center gap-3 px-3 py-2 hover:bg-gray-100 rounded cursor-pointer transition-colors"
                >
                  <Checkbox
                    checked={column.visible}
                    onCheckedChange={() => onToggleColumn(column.id)}
                  />
                  <span className="text-sm text-gray-900">{column.label}</span>
                </label>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
