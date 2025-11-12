'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { X } from 'lucide-react'

interface BulkActionsPanelProps {
  selectedCount: number
  selectedUserIds: Set<string>
  onClear: () => void
}

/**
 * Sticky bottom panel for bulk operations
 * 
 * Features:
 * - Shows selected user count
 * - Action type dropdown
 * - Action value selector
 * - Preview (dry-run) button
 * - Apply Changes button
 * - Clear selection button
 */
export default function BulkActionsPanel({
  selectedCount,
  selectedUserIds,
  onClear
}: BulkActionsPanelProps) {
  const [actionType, setActionType] = useState('set-status')
  const [actionValue, setActionValue] = useState('INACTIVE')
  const [isApplying, setIsApplying] = useState(false)
  const [showPreview, setShowPreview] = useState(false)

  const handlePreview = () => {
    setShowPreview(true)
    console.log({
      action: 'preview',
      userIds: Array.from(selectedUserIds),
      actionType,
      actionValue
    })
  }

  const handleApply = async () => {
    setIsApplying(true)
    try {
      // Bulk action API call
      const response = await fetch('/api/admin/users/bulk-action', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          userIds: Array.from(selectedUserIds),
          action: actionType,
          value: actionValue
        })
      })

      if (!response.ok) {
        throw new Error('Failed to apply bulk action')
      }

      console.log('Bulk action applied successfully')
      // After successful application, clear selection
      onClear()
    } catch (error) {
      console.error('Error applying bulk action:', error)
    } finally {
      setIsApplying(false)
    }
  }

  return (
    <div className="admin-bulk-actions-panel" data-testid="bulk-actions-panel">
      <div className="admin-bulk-actions-content">
        {/* Left: Selected count and action selector */}
        <div className="admin-bulk-actions-left">
          <span className="admin-bulk-actions-count">
            {selectedCount} {selectedCount === 1 ? 'user' : 'users'} selected
          </span>

          {/* Action type selector */}
          <select
            value={actionType}
            onChange={(e) => setActionType(e.target.value)}
            className="admin-bulk-actions-select"
            aria-label="Bulk action type"
          >
            <option value="set-status">Set Status</option>
            <option value="set-role">Set Role</option>
            <option value="set-department">Set Department</option>
            <option value="send-email">Send Email</option>
            <option value="export-data">Export Data</option>
            <option value="reset-password">Reset Password</option>
          </select>

          {/* Action value selector */}
          <select
            value={actionValue}
            onChange={(e) => setActionValue(e.target.value)}
            className="admin-bulk-actions-select"
            aria-label="Action value"
          >
            {actionType === 'set-status' && (
              <>
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
                <option value="SUSPENDED">Suspended</option>
                <option value="PENDING">Pending</option>
              </>
            )}
            {actionType === 'set-role' && (
              <>
                <option value="ADMIN">Admin</option>
                <option value="EDITOR">Editor</option>
                <option value="VIEWER">Viewer</option>
                <option value="TEAM_LEAD">Team Lead</option>
                <option value="TEAM_MEMBER">Team Member</option>
              </>
            )}
            {actionType === 'set-department' && (
              <>
                <option value="ENGINEERING">Engineering</option>
                <option value="SALES">Sales</option>
                <option value="MARKETING">Marketing</option>
                <option value="OPERATIONS">Operations</option>
                <option value="HR">HR</option>
              </>
            )}
            {actionType === 'send-email' && (
              <>
                <option value="welcome">Welcome Email</option>
                <option value="password-reset">Password Reset</option>
                <option value="notification">Notification</option>
              </>
            )}
            {actionType === 'export-data' && (
              <>
                <option value="csv">CSV Format</option>
                <option value="json">JSON Format</option>
                <option value="pdf">PDF Report</option>
              </>
            )}
          </select>
        </div>

        {/* Right: Action buttons */}
        <div className="admin-bulk-actions-right">
          <Button
            variant="outline"
            size="sm"
            disabled={isApplying}
            onClick={handlePreview}
            aria-label="Preview bulk action"
            data-testid="preview-button"
          >
            Preview
          </Button>

          <Button
            onClick={handleApply}
            disabled={isApplying}
            size="sm"
            aria-label="Apply bulk action to selected users"
            data-testid="apply-button"
          >
            {isApplying ? 'Applying...' : 'Apply Changes'}
          </Button>

          <button
            onClick={onClear}
            className="admin-bulk-actions-clear"
            aria-label="Clear selection"
            title="Clear selection"
            data-testid="clear-button"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      <style jsx>{`
        .admin-bulk-actions-panel {
          padding: 1rem 1.5rem;
          background-color: #ffffff;
          border-top: 1px solid #e5e7eb;
          display: flex;
          align-items: center;
          box-shadow: 0 -4px 6px -1px rgba(0, 0, 0, 0.1);
        }

        .admin-bulk-actions-content {
          display: flex;
          align-items: center;
          justify-content: space-between;
          width: 100%;
          gap: 1rem;
        }

        .admin-bulk-actions-left {
          display: flex;
          align-items: center;
          gap: 1rem;
          flex: 1;
          min-width: 0;
        }

        .admin-bulk-actions-count {
          font-size: 0.875rem;
          font-weight: 500;
          color: #6b7280;
          white-space: nowrap;
        }

        .admin-bulk-actions-select {
          padding: 0.5rem 0.75rem;
          font-size: 0.875rem;
          border: 1px solid #d1d5db;
          border-radius: 0.375rem;
          background-color: #ffffff;
          color: #111827;
          cursor: pointer;
          transition: border-color 0.2s, box-shadow 0.2s;
          flex-shrink: 0;
        }

        .admin-bulk-actions-select:hover {
          border-color: #9ca3af;
          background-color: #f9fafb;
        }

        .admin-bulk-actions-select:focus {
          outline: none;
          border-color: #1f55d4;
          box-shadow: 0 0 0 3px rgba(31, 85, 212, 0.1);
        }

        .admin-bulk-actions-right {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          flex-shrink: 0;
        }

        .admin-bulk-actions-clear {
          padding: 0.375rem;
          border-radius: 0.375rem;
          background-color: transparent;
          color: #6b7280;
          cursor: pointer;
          transition: background-color 0.2s, color 0.2s;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .admin-bulk-actions-clear:hover {
          background-color: #f3f4f6;
          color: #111827;
        }

        .admin-bulk-actions-clear:focus-visible {
          outline: 2px solid #1f55d4;
          outline-offset: 2px;
        }

        @media (max-width: 768px) {
          .admin-bulk-actions-content {
            flex-direction: column;
            gap: 0.75rem;
          }

          .admin-bulk-actions-left {
            width: 100%;
            flex-direction: column;
          }

          .admin-bulk-actions-select {
            width: 100%;
          }

          .admin-bulk-actions-right {
            width: 100%;
            justify-content: flex-end;
          }
        }
      `}</style>
    </div>
  )
}
