'use client'

import React from 'react'
import { Approval } from '@/types/shared/entities/approval'
import { usePermissions } from '@/lib/use-permissions'
import { PERMISSIONS } from '@/lib/permissions'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Check, X, Clock, User, MessageSquare } from 'lucide-react'
import { ComponentVariant, CardComponentProps } from '../types'
import { formatDate, formatRelativeTime } from '@/lib/shared/formatters'

interface ApprovalCardProps extends CardComponentProps<Approval> {
  /** The approval to display */
  data: Approval
  /** Display variant */
  variant?: ComponentVariant
  /** Called when card is clicked */
  onClick?: () => void
  /** Called to approve (portal: respond) */
  onApprove?: (id: string) => void
  /** Called to reject (portal: respond with rejection) */
  onReject?: (id: string) => void
  /** Called to delete (admin only) */
  onDelete?: (id: string) => void
  /** Is loading */
  loading?: boolean
  /** Show action buttons */
  showActions?: boolean
}

/**
 * ApprovalCard Component
 *
 * Displays approval request information in a card format.
 * Portal variant: View and respond to approval requests
 * Admin variant: Full management of approvals
 * Compact variant: Minimal display for lists
 *
 * @example
 * ```tsx
 * // Portal usage
 * <ApprovalCard approval={approval} variant="portal" onApprove={handleApprove} />
 *
 * // Admin usage
 * <ApprovalCard approval={approval} variant="admin" onDelete={handleDelete} />
 * ```
 */
export default function ApprovalCard({
  data: approval,
  variant = 'portal',
  onClick,
  onApprove,
  onReject,
  onDelete,
  loading = false,
  showActions = true,
  className = '',
}: ApprovalCardProps) {
  const { has } = usePermissions()
  const canDeleteApproval = has(PERMISSIONS.APPROVALS_DELETE)

  if (!approval) return null

  const statusColors: Record<string, string> = {
    PENDING: 'bg-yellow-100 text-yellow-800',
    APPROVED: 'bg-green-100 text-green-800',
    REJECTED: 'bg-red-100 text-red-800',
    DELEGATED: 'bg-blue-100 text-blue-800',
    ESCALATED: 'bg-orange-100 text-orange-800',
    EXPIRED: 'bg-gray-100 text-gray-800',
  }

  const isPending = approval.status === 'PENDING'
  const expiresAt = approval.expiresAt ? new Date(approval.expiresAt) : null
  const isExpired = expiresAt && expiresAt < new Date()

  // Compact variant
  if (variant === 'compact') {
    const requestedDate = approval.requestedAt ? new Date(approval.requestedAt) : null
    const title = `${approval.itemType} Approval` + (approval.requesterName ? ` by ${approval.requesterName}` : '')
    return (
      <div
        className={`flex items-center justify-between p-3 border rounded-md hover:bg-gray-50 transition-colors cursor-pointer ${className}`}
        onClick={onClick}
        role="button"
        tabIndex={0}
        aria-label={title}
      >
        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm truncate">{title}</p>
          {requestedDate && (
            <p className="text-xs text-gray-500">
              Requested {formatRelativeTime(requestedDate)}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2 ml-2">
          <Badge
            className={statusColors[approval.status] || 'bg-gray-100 text-gray-800'}
          >
            {approval.status}
          </Badge>
        </div>
      </div>
    )
  }

  const handleApprove = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (onApprove && !loading && isPending) {
      onApprove(approval.id)
    }
  }

  const handleReject = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (onReject && !loading && isPending) {
      onReject(approval.id)
    }
  }

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (onDelete && canDeleteApproval && !loading) {
      onDelete(approval.id)
    }
  }

  const requestedDate = approval.requestedAt ? new Date(approval.requestedAt) : null
  const decisionDate = approval.decisionAt ? new Date(approval.decisionAt) : null
  const itemTypeLabel = approval.itemType.replace(/_/g, ' ')
  const titleText = `${itemTypeLabel} Approval` + (approval.requesterName ? ` - ${approval.requesterName}` : '')

  return (
    <Card
      className={`overflow-hidden transition-all hover:shadow-md cursor-pointer ${className}`}
      onClick={onClick}
      role="article"
      aria-label={titleText}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <CardTitle className="truncate">{itemTypeLabel}</CardTitle>
            {approval.reason && (
              <CardDescription className="text-sm line-clamp-2">
                {approval.reason}
              </CardDescription>
            )}
          </div>
          <Badge
            className={statusColors[approval.status] || 'bg-gray-100 text-gray-800'}
          >
            {approval.status === 'PENDING' && <Clock className="h-3 w-3 mr-1" />}
            {approval.status === 'APPROVED' && <Check className="h-3 w-3 mr-1" />}
            {approval.status === 'REJECTED' && <X className="h-3 w-3 mr-1" />}
            {approval.status}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {/* Requester Info */}
        {approval.requesterName && (
          <div className="flex items-center gap-2 text-sm text-gray-700 pt-2 border-t">
            <User className="h-4 w-4 flex-shrink-0" />
            <div>
              <p className="font-medium">{approval.requesterName}</p>
              <p className="text-xs text-gray-500">Requested</p>
            </div>
          </div>
        )}

        {/* Approver Info */}
        {approval.approverName && (
          <div className="flex items-center gap-2 text-sm text-gray-700 pt-2 border-t">
            <User className="h-4 w-4 flex-shrink-0" />
            <div>
              <p className="font-medium">{approval.approverName}</p>
              <p className="text-xs text-gray-500">Approver</p>
            </div>
          </div>
        )}

        {/* Dates */}
        <div className="grid grid-cols-1 gap-2 text-sm pt-2 border-t">
          {requestedDate && (
            <div>
              <p className="text-xs font-medium text-gray-600">Requested</p>
              <p className="text-gray-700">{formatDate(requestedDate, 'short')}</p>
            </div>
          )}
          {expiresAt && (
            <div>
              <p className={`text-xs font-medium ${isExpired ? 'text-red-600' : 'text-gray-600'}`}>
                {isExpired ? 'Expired' : 'Expires'}
              </p>
              <p className={isExpired ? 'text-red-700 font-medium' : 'text-gray-700'}>
                {formatDate(expiresAt, 'short')}
              </p>
            </div>
          )}
        </div>

        {/* Notes */}
        {approval.notes && (
          <div className="pt-2 border-t">
            <div className="flex items-start gap-2 text-sm">
              <MessageSquare className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-xs font-medium text-gray-600 mb-1">Notes</p>
                <p className="text-gray-700 line-clamp-3">{approval.notes}</p>
              </div>
            </div>
          </div>
        )}

        {/* Decision Notes (if approved/rejected) */}
        {approval.decisionNotes && !isPending && (
          <div className="pt-2 border-t">
            <div className="flex items-start gap-2 text-sm">
              <MessageSquare className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-xs font-medium text-gray-600 mb-1">Decision Notes</p>
                <p className="text-gray-700 line-clamp-3">{approval.decisionNotes}</p>
              </div>
            </div>
          </div>
        )}

        {/* Priority Badge */}
        {approval.priority && (
          <div className="flex gap-2 pt-2 border-t">
            <Badge
              variant="outline"
              className={
                approval.priority === 'URGENT'
                  ? 'bg-red-50 text-red-700'
                  : approval.priority === 'HIGH'
                    ? 'bg-orange-50 text-orange-700'
                    : approval.priority === 'NORMAL'
                      ? 'bg-blue-50 text-blue-700'
                      : 'bg-gray-50 text-gray-700'
              }
            >
              {approval.priority} Priority
            </Badge>
          </div>
        )}

        {/* Actions */}
        {showActions && (
          <div className="pt-2 border-t space-y-2">
            {isPending ? (
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={handleApprove}
                  disabled={loading}
                  className="flex-1 bg-green-600 hover:bg-green-700"
                  aria-label={`Approve ${itemTypeLabel}`}
                >
                  <Check className="h-4 w-4 mr-1" />
                  Approve
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleReject}
                  disabled={loading}
                  className="flex-1 text-red-600 hover:text-red-700 hover:bg-red-50"
                  aria-label={`Reject ${itemTypeLabel}`}
                >
                  <X className="h-4 w-4 mr-1" />
                  Reject
                </Button>
              </div>
            ) : (
              <div className="text-center text-sm text-gray-600 py-2">
                <p>
                  {approval.status === 'APPROVED' && '✓ Approved'}
                  {approval.status === 'REJECTED' && '✗ Rejected'}
                  {approval.status === 'EXPIRED' && '⏱ Expired'}
                </p>
              </div>
            )}

            {variant === 'admin' && (
              <Button
                size="sm"
                variant="outline"
                onClick={handleDelete}
                disabled={!canDeleteApproval || loading}
                className="w-full text-red-600 hover:text-red-700 hover:bg-red-50"
                aria-label={`Delete approval ${approval.id.slice(0, 8)}`}
              >
                <X className="h-4 w-4 mr-1" />
                Delete
              </Button>
            )}
          </div>
        )}

        {/* Footer - Decision info */}
        {!isPending && decisionDate && (
          <div className="text-xs text-gray-500 text-right pt-1">
            {formatRelativeTime(decisionDate)}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
