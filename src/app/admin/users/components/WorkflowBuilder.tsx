'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'

interface WorkflowBuilderProps {
  isOpen: boolean
  onClose: () => void
  onConfirm?: (workflow: any) => void
}

export function WorkflowBuilder({ isOpen, onClose, onConfirm }: WorkflowBuilderProps) {
  const [step, setStep] = useState(1)
  const [workflowType, setWorkflowType] = useState<'ONBOARDING' | 'OFFBOARDING' | 'ROLE_CHANGE'>('ONBOARDING')
  const [selectedUsers, setSelectedUsers] = useState<string[]>([])
  const [scheduleNow, setScheduleNow] = useState(true)
  const [scheduledDate, setScheduledDate] = useState<string>('')

  const handleNext = () => {
    if (step < 6) setStep(step + 1)
  }

  const handleBack = () => {
    if (step > 1) setStep(step - 1)
  }

  const handleConfirm = async () => {
    const workflow = {
      type: workflowType,
      users: selectedUsers,
      scheduledFor: scheduleNow ? null : scheduledDate
    }
    if (onConfirm) {
      await onConfirm(workflow)
    }
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Create New Workflow - Step {step} of 6</DialogTitle>
        </DialogHeader>

        <div className="min-h-96">
          {step === 1 && (
            <div className="space-y-4">
              <h3 className="font-semibold">Select Workflow Type</h3>
              <div className="space-y-2">
                <label className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                  <input
                    type="radio"
                    name="workflow-type"
                    value="ONBOARDING"
                    checked={workflowType === 'ONBOARDING'}
                    onChange={(e) => setWorkflowType(e.target.value as any)}
                  />
                  <div>
                    <div className="font-medium">Onboarding</div>
                    <div className="text-sm text-gray-600">Create account, assign role, provision access</div>
                  </div>
                </label>
                <label className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                  <input
                    type="radio"
                    name="workflow-type"
                    value="OFFBOARDING"
                    checked={workflowType === 'OFFBOARDING'}
                    onChange={(e) => setWorkflowType(e.target.value as any)}
                  />
                  <div>
                    <div className="font-medium">Offboarding</div>
                    <div className="text-sm text-gray-600">Disable account, revoke access, archive data</div>
                  </div>
                </label>
                <label className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                  <input
                    type="radio"
                    name="workflow-type"
                    value="ROLE_CHANGE"
                    checked={workflowType === 'ROLE_CHANGE'}
                    onChange={(e) => setWorkflowType(e.target.value as any)}
                  />
                  <div>
                    <div className="font-medium">Role Change</div>
                    <div className="text-sm text-gray-600">Update role, sync permissions, request approval</div>
                  </div>
                </label>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <h3 className="font-semibold">Select Users</h3>
              <div className="space-y-2">
                <div className="text-sm text-gray-600">Selected users: {selectedUsers.length}</div>
                <Button variant="outline" className="w-full" onClick={() => setSelectedUsers(['user-1', 'user-2'])}>
                  + Add Users
                </Button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <h3 className="font-semibold">Configure Steps</h3>
              <p className="text-sm text-gray-600">Using default steps for {workflowType}</p>
              <div className="bg-gray-50 p-3 rounded-lg space-y-2 text-sm">
                <div>✓ Step 1: Placeholder</div>
                <div>✓ Step 2: Placeholder</div>
                <div>✓ Step 3: Placeholder</div>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-4">
              <h3 className="font-semibold">Approval Settings</h3>
              <label className="flex items-center gap-3">
                <input type="checkbox" defaultChecked className="rounded" />
                <span>Requires approval</span>
              </label>
            </div>
          )}

          {step === 5 && (
            <div className="space-y-4">
              <h3 className="font-semibold">Schedule</h3>
              <div className="space-y-3">
                <label className="flex items-center gap-3">
                  <input
                    type="radio"
                    name="schedule"
                    checked={scheduleNow}
                    onChange={() => setScheduleNow(true)}
                  />
                  <span>Start now</span>
                </label>
                <label className="flex items-center gap-3">
                  <input
                    type="radio"
                    name="schedule"
                    checked={!scheduleNow}
                    onChange={() => setScheduleNow(false)}
                  />
                  <span>Schedule for later</span>
                </label>
                {!scheduleNow && (
                  <input
                    type="datetime-local"
                    value={scheduledDate}
                    onChange={(e) => setScheduledDate(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                )}
              </div>
            </div>
          )}

          {step === 6 && (
            <div className="space-y-4">
              <h3 className="font-semibold">Review & Confirm</h3>
              <div className="bg-gray-50 p-4 rounded-lg space-y-2 text-sm">
                <div>
                  <span className="font-medium">Type:</span> {workflowType}
                </div>
                <div>
                  <span className="font-medium">Users:</span> {selectedUsers.length}
                </div>
                <div>
                  <span className="font-medium">Schedule:</span> {scheduleNow ? 'Now' : scheduledDate}
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="flex gap-2 justify-end">
          {step > 1 && (
            <Button variant="outline" onClick={handleBack}>
              ← Back
            </Button>
          )}
          {step < 6 && (
            <Button onClick={handleNext}>
              Next →
            </Button>
          )}
          {step === 6 && (
            <Button onClick={handleConfirm} className="bg-blue-600 hover:bg-blue-700">
              Create Workflow
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
