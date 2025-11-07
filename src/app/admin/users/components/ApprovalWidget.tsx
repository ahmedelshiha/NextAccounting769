'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'

interface ApprovalWidgetProps {
  isOpen: boolean
  onClose: () => void
  stepId: string
  stepName: string
  workflowId: string
  requiredApprovers: string[]
  approvedBy?: string[]
  dueDate?: string
  onApprove?: (stepId: string, notes: string) => Promise<void>
  onReject?: (stepId: string, reason: string) => Promise<void>
}

export function ApprovalWidget({
  isOpen,
  onClose,
  stepId,
  stepName,
  workflowId,
  requiredApprovers,
  approvedBy = [],
  dueDate,
  onApprove,
  onReject
}: ApprovalWidgetProps) {
  const [notes, setNotes] = useState('')
  const [rejectReason, setRejectReason] = useState('')
  const [mode, setMode] = useState<'view' | 'approve' | 'reject'>('view')
  const [loading, setLoading] = useState(false)

  const handleApprove = async () => {
    setLoading(true)
    try {
      if (onApprove) {
        await onApprove(stepId, notes)
        onClose()
      }
    } catch (err) {
      console.error('Approval failed:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleReject = async () => {
    setLoading(true)
    try {
      if (onReject) {
        await onReject(stepId, rejectReason)
        onClose()
      }
    } catch (err) {
      console.error('Rejection failed:', err)
    } finally {
      setLoading(false)
    }
  }

  const pendingApprovers = requiredApprovers.filter(a => !approvedBy.includes(a))
  const urgencyClass = dueDate && new Date(dueDate) < new Date(Date.now() + 24 * 60 * 60 * 1000) ? 'border-red-300 bg-red-50' : ''

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {mode === 'view' && 'Approval Request'}
            {mode === 'approve' && 'Approve Step'}
            {mode === 'reject' && 'Reject Step'}
          </DialogTitle>
        </DialogHeader>

        {mode === 'view' && (
          <div className={`space-y-4 p-4 rounded-lg ${urgencyClass}`}>
            <div className="space-y-2">
              <div>
                <span className="font-medium">Step:</span> {stepName}
              </div>
              <div>
                <span className="font-medium">Workflow ID:</span> {workflowId}
              </div>
              {dueDate && (
                <div>
                  <span className="font-medium">Due:</span> {new Date(dueDate).toLocaleDateString()}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <h4 className="font-medium">Required Approvers</h4>
              <div className="space-y-1 text-sm">
                {requiredApprovers.map(approver => (
                  <div key={approver} className="flex items-center gap-2">
                    <span className={approvedBy.includes(approver) ? '✓ text-green-600' : '◯ text-gray-400'}>
                      {approvedBy.includes(approver) ? '✓' : '○'}
                    </span>
                    <span>{approver}</span>
                  </div>
                ))}
              </div>
            </div>

            {pendingApprovers.length > 0 && (
              <div className="bg-blue-50 border border-blue-200 rounded p-3 text-sm text-blue-800">
                Waiting for approval from {pendingApprovers.length} approver(s)
              </div>
            )}

            <div className="flex gap-2 pt-4">
              <Button
                variant="default"
                onClick={() => setMode('approve')}
                disabled={pendingApprovers.length === 0}
              >
                Approve
              </Button>
              <Button
                variant="destructive"
                onClick={() => setMode('reject')}
              >
                Reject
              </Button>
              <Button
                variant="outline"
                onClick={onClose}
              >
                Close
              </Button>
            </div>
          </div>
        )}

        {mode === 'approve' && (
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="font-medium text-sm">Approval Notes (optional)</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add any notes for the record..."
                className="w-full px-3 py-2 border rounded-lg text-sm"
                rows={4}
              />
            </div>

            <div className="bg-green-50 border border-green-200 rounded p-3 text-sm text-green-800">
              By approving, you confirm this step meets all requirements.
            </div>

            <div className="flex gap-2 justify-end">
              <Button
                variant="outline"
                onClick={() => setMode('view')}
              >
                Back
              </Button>
              <Button
                onClick={handleApprove}
                disabled={loading}
                className="bg-green-600 hover:bg-green-700"
              >
                {loading ? 'Approving...' : 'Confirm Approval'}
              </Button>
            </div>
          </div>
        )}

        {mode === 'reject' && (
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="font-medium text-sm">Reason for Rejection *</label>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Please provide the reason for rejection..."
                className="w-full px-3 py-2 border rounded-lg text-sm"
                rows={4}
                required
              />
            </div>

            <div className="bg-red-50 border border-red-200 rounded p-3 text-sm text-red-800">
              The step will be returned to pending status. The workflow owner will be notified.
            </div>

            <div className="flex gap-2 justify-end">
              <Button
                variant="outline"
                onClick={() => setMode('view')}
              >
                Back
              </Button>
              <Button
                onClick={handleReject}
                disabled={loading || !rejectReason.trim()}
                variant="destructive"
              >
                {loading ? 'Rejecting...' : 'Confirm Rejection'}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
