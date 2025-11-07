'use client'

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'

interface Step {
  id: string
  stepNumber: number
  name: string
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED' | 'SKIPPED'
  completedAt?: string
  errorMessage?: string
}

interface WorkflowDetailsProps {
  isOpen: boolean
  onClose: () => void
  workflowId: string
  workflow?: {
    id: string
    userId: string
    type: string
    status: string
    progressPercent: number
    totalSteps: number
    completedSteps: number
    steps?: Step[]
    errorMessage?: string
  }
}

export function WorkflowDetails({ isOpen, onClose, workflow }: WorkflowDetailsProps) {
  const [loading, setLoading] = useState(false)
  const [actions, setActions] = useState<string[]>([])

  useEffect(() => {
    if (workflow) {
      const availableActions = []
      if (workflow.status === 'IN_PROGRESS') {
        availableActions.push('PAUSE', 'CANCEL')
      } else if (workflow.status === 'PAUSED') {
        availableActions.push('RESUME', 'CANCEL')
      }
      setActions(availableActions)
    }
  }, [workflow])

  const handleAction = async (action: string) => {
    setLoading(true)
    try {
      const response = await fetch(`/api/admin/workflows/${workflow?.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action })
      })
      if (response.ok) {
        console.log(`Action ${action} completed`)
      }
    } catch (err) {
      console.error('Action failed:', err)
    } finally {
      setLoading(false)
    }
  }

  if (!workflow) return null

  const statusColors: Record<string, string> = {
    DRAFT: 'bg-gray-100 text-gray-800',
    PENDING: 'bg-yellow-100 text-yellow-800',
    IN_PROGRESS: 'bg-blue-100 text-blue-800',
    PAUSED: 'bg-orange-100 text-orange-800',
    COMPLETED: 'bg-green-100 text-green-800',
    FAILED: 'bg-red-100 text-red-800',
    CANCELLED: 'bg-gray-100 text-gray-800'
  }

  const stepStatusIcons: Record<string, string> = {
    PENDING: '⏳',
    IN_PROGRESS: '⚙️',
    COMPLETED: '✅',
    FAILED: '❌',
    SKIPPED: '⊘'
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-96 overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Workflow Details</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Header */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-lg">{workflow.type}</h3>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusColors[workflow.status]}`}>
                {workflow.status}
              </span>
            </div>
            <p className="text-sm text-gray-600">Workflow ID: {workflow.id}</p>
          </div>

          {/* Progress */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span>Progress: {workflow.completedSteps} / {workflow.totalSteps}</span>
              <span className="font-medium">{workflow.progressPercent}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${workflow.progressPercent}%` }}
              />
            </div>
          </div>

          {/* Error message */}
          {workflow.errorMessage && (
            <div className="bg-red-50 border border-red-200 text-red-800 rounded-lg p-3 text-sm">
              <strong>Error:</strong> {workflow.errorMessage}
            </div>
          )}

          {/* Steps Timeline */}
          <div className="space-y-3">
            <h4 className="font-semibold">Steps</h4>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {workflow.steps?.map((step, index) => (
                <div
                  key={step.id}
                  className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg text-sm"
                >
                  <div className="text-lg w-6">{stepStatusIcons[step.status] || '○'}</div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium">{step.name}</div>
                    <div className="text-xs text-gray-600">Step {step.stepNumber} of {workflow.totalSteps}</div>
                    {step.completedAt && (
                      <div className="text-xs text-gray-500">Completed: {step.completedAt}</div>
                    )}
                    {step.errorMessage && (
                      <div className="text-xs text-red-600">Error: {step.errorMessage}</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Actions */}
          {actions.length > 0 && (
            <div className="flex gap-2">
              {actions.includes('PAUSE') && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleAction('PAUSE')}
                  disabled={loading}
                >
                  ⏸ Pause
                </Button>
              )}
              {actions.includes('RESUME') && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleAction('RESUME')}
                  disabled={loading}
                >
                  ▶ Resume
                </Button>
              )}
              {actions.includes('CANCEL') && (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => handleAction('CANCEL')}
                  disabled={loading}
                >
                  ✕ Cancel
                </Button>
              )}
            </div>
          )}
        </div>

        <div className="flex justify-end">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
