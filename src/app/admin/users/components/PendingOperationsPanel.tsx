'use client'

import React from 'react'
import { Button } from '@/components/ui/button'

export interface PendingOperation {
  id: string
  title: string
  description: string
  progress: number
  dueDate?: string
  assignee?: string
  status: 'pending' | 'in-progress' | 'completed'
  actions?: Array<{ label: string; onClick: () => void }>
}

interface PendingOperationsPanelProps {
  operations: PendingOperation[]
  isLoading?: boolean
  onViewAll?: () => void
}

function getStatusColor(status: string): string {
  switch (status) {
    case 'completed':
      return 'bg-green-100 text-green-800'
    case 'in-progress':
      return 'bg-blue-100 text-blue-800'
    case 'pending':
      return 'bg-yellow-100 text-yellow-800'
    default:
      return 'bg-gray-100 text-gray-800'
  }
}

function getStatusLabel(status: string): string {
  switch (status) {
    case 'completed':
      return '✓ Completed'
    case 'in-progress':
      return '⏳ In Progress'
    case 'pending':
      return '⏸️ Pending'
    default:
      return status
  }
}

/**
 * Pending Operations Panel
 * 
 * Displays active workflows and operations with:
 * - Progress tracking
 * - Due dates
 * - Assignees
 * - Quick actions (View, Resume, Cancel)
 * 
 * Features:
 * - Real-time progress indication
 * - Status badges
 * - Action buttons per operation
 * - Empty state handling
 * - Responsive layout
 */
export function PendingOperationsPanel({
  operations,
  isLoading,
  onViewAll
}: PendingOperationsPanelProps) {
  if (isLoading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="animate-pulse space-y-3">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="h-24 bg-gray-200 rounded" />
          ))}
        </div>
      </div>
    )
  }

  if (operations.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6 text-center text-gray-500">
        <div className="text-2xl mb-2">✓</div>
        <p>No pending operations</p>
        <p className="text-sm text-gray-400 mt-1">All operations are up to date</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      <div className="p-6 border-b border-gray-200 bg-gray-50">
        <h3 className="text-lg font-semibold text-gray-900">
          ⏳ Pending Operations ({operations.length})
        </h3>
      </div>

      <div className="divide-y divide-gray-200">
        {operations.map((op) => (
          <div key={op.id} className="p-4 hover:bg-gray-50 transition-colors">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <h4 className="font-medium text-gray-900">{op.title}</h4>
                <p className="text-sm text-gray-600 mt-1">{op.description}</p>

                {/* Progress Bar */}
                <div className="mt-3">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs text-gray-500">Progress</span>
                    <span className="text-xs font-medium text-gray-900">{op.progress}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all"
                      style={{ width: `${op.progress}%` }}
                    />
                  </div>
                </div>

                {/* Metadata */}
                <div className="flex flex-wrap gap-4 mt-3 text-xs">
                  <span className={`px-2 py-1 rounded ${getStatusColor(op.status)}`}>
                    {getStatusLabel(op.status)}
                  </span>
                  {op.dueDate && (
                    <span className="text-gray-600">
                      Due: {new Date(op.dueDate).toLocaleDateString()}
                    </span>
                  )}
                  {op.assignee && (
                    <span className="text-gray-600">Assigned to: {op.assignee}</span>
                  )}
                </div>
              </div>

              {/* Actions */}
              {op.actions && op.actions.length > 0 && (
                <div className="flex gap-2">
                  {op.actions.map((action, idx) => (
                    <Button
                      key={idx}
                      onClick={action.onClick}
                      variant="outline"
                      size="sm"
                      className="whitespace-nowrap"
                    >
                      {action.label}
                    </Button>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {onViewAll && (
        <div className="p-4 bg-gray-50 border-t border-gray-200">
          <Button onClick={onViewAll} variant="ghost" size="sm" className="w-full">
            View All Operations
          </Button>
        </div>
      )}
    </div>
  )
}
