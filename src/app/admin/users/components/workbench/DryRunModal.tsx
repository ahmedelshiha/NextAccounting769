'use client'

import React from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { AlertCircle, CheckCircle } from 'lucide-react'

interface DryRunModalProps {
  isOpen: boolean
  onClose: () => void
  onApply: () => void | Promise<void>
  isLoading?: boolean
  userCount: number
  action: string
  actionValue: string
  affectedRecords?: number
  estimatedTime?: number
  warnings?: string[]
}

/**
 * DryRunModal - Preview bulk action before applying
 * 
 * Features:
 * - Shows preview of action to be applied
 * - Displays affected user count
 * - Shows estimated time
 * - Lists any warnings or side effects
 * - Confirm/cancel buttons
 */
export default function DryRunModal({
  isOpen,
  onClose,
  onApply,
  isLoading = false,
  userCount,
  action,
  actionValue,
  affectedRecords = 0,
  estimatedTime = 0,
  warnings = []
}: DryRunModalProps) {
  const handleApply = async () => {
    try {
      await onApply()
    } catch (error) {
      console.error('Error applying bulk action:', error)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-blue-600" />
            Preview Bulk Action
          </DialogTitle>
          <DialogDescription>
            Review the changes before applying them to your users
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Action Summary */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <p className="font-semibold text-blue-900">Action Summary</p>
                <p className="text-sm text-blue-800 mt-1">
                  {userCount} users will be updated:
                </p>
                <p className="text-sm text-blue-700 mt-2 font-mono bg-white p-2 rounded border border-blue-100">
                  {action} → {actionValue}
                </p>
              </div>
            </div>
          </div>

          {/* Impact Information */}
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Affected Users:</span>
              <span className="font-semibold text-gray-900">{userCount}</span>
            </div>
            {affectedRecords > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Records to Update:</span>
                <span className="font-semibold text-gray-900">{affectedRecords}</span>
              </div>
            )}
            {estimatedTime > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Estimated Time:</span>
                <span className="font-semibold text-gray-900">
                  {estimatedTime < 60
                    ? `${estimatedTime}s`
                    : `${Math.round(estimatedTime / 60)}m`}
                </span>
              </div>
            )}
          </div>

          {/* Warnings */}
          {warnings.length > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <p className="font-semibold text-amber-900 text-sm mb-2">⚠️ Warnings</p>
              <ul className="space-y-1">
                {warnings.map((warning, i) => (
                  <li key={i} className="text-sm text-amber-800">
                    • {warning}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Information */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
            <p className="text-xs text-gray-600">
              💡 This action can be undone for 24 hours after applying. You&apos;ll receive an
              undo prompt after the changes are applied.
            </p>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button onClick={handleApply} disabled={isLoading}>
            {isLoading ? 'Applying...' : 'Apply Changes'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
