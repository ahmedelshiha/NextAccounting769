'use client'

import React from 'react'
import { Button } from '@/components/ui/button'

interface WorkflowCardProps {
  id: string
  title: string
  type: string
  status: 'DRAFT' | 'PENDING' | 'IN_PROGRESS' | 'PAUSED' | 'COMPLETED' | 'FAILED' | 'CANCELLED'
  progressPercent: number
  currentStep?: string
  dueDate?: string
  onViewDetails?: () => void
  onResume?: () => void
  onPause?: () => void
  onCancel?: () => void
}

export function WorkflowCard({
  id,
  title,
  type,
  status,
  progressPercent,
  currentStep,
  dueDate,
  onViewDetails,
  onResume,
  onPause,
  onCancel
}: WorkflowCardProps) {
  const statusColors: Record<string, string> = {
    DRAFT: 'bg-gray-100 text-gray-700',
    PENDING: 'bg-yellow-100 text-yellow-700',
    IN_PROGRESS: 'bg-blue-100 text-blue-700',
    PAUSED: 'bg-orange-100 text-orange-700',
    COMPLETED: 'bg-green-100 text-green-700',
    FAILED: 'bg-red-100 text-red-700',
    CANCELLED: 'bg-gray-100 text-gray-700'
  }

  const urgency = dueDate ? new Date(dueDate) < new Date(Date.now() + 24 * 60 * 60 * 1000) ? 'urgent' : 'normal' : 'normal'
  const urgencyClass = urgency === 'urgent' ? 'border-red-300 bg-red-50' : 'border-gray-200'

  return (
    <div className={`border rounded-lg p-4 ${urgencyClass} hover:shadow-md transition-shadow`}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <h3 className="font-semibold text-base">{title}</h3>
          <p className="text-sm text-gray-600">{type}</p>
        </div>
        <span className={`px-2 py-1 rounded text-xs font-medium ${statusColors[status]}`}>
          {status}
        </span>
      </div>

      {currentStep && (
        <p className="text-sm text-gray-600 mb-2">Current: {currentStep}</p>
      )}

      <div className="mb-3">
        <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
          <span>Progress</span>
          <span className="font-medium">{progressPercent}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-1.5">
          <div
            className="bg-blue-600 h-1.5 rounded-full transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {dueDate && (
        <p className={`text-xs mb-3 ${urgency === 'urgent' ? 'text-red-600 font-medium' : 'text-gray-500'}`}>
          Due: {new Date(dueDate).toLocaleDateString()}
        </p>
      )}

      <div className="flex gap-2 flex-wrap">
        <Button
          variant="outline"
          size="sm"
          className="text-xs h-7"
          onClick={onViewDetails}
        >
          View
        </Button>

        {status === 'IN_PROGRESS' && onPause && (
          <Button
            variant="outline"
            size="sm"
            className="text-xs h-7"
            onClick={onPause}
          >
            Pause
          </Button>
        )}

        {status === 'PAUSED' && onResume && (
          <Button
            variant="outline"
            size="sm"
            className="text-xs h-7"
            onClick={onResume}
          >
            Resume
          </Button>
        )}

        {(status === 'IN_PROGRESS' || status === 'PAUSED') && onCancel && (
          <Button
            variant="outline"
            size="sm"
            className="text-xs h-7 text-red-600 hover:bg-red-50"
            onClick={onCancel}
          >
            Cancel
          </Button>
        )}
      </div>
    </div>
  )
}
