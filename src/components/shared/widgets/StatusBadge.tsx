'use client'

import React from 'react'
import { Badge } from '@/components/ui/badge'
import {
  CheckCircle2,
  Clock,
  AlertCircle,
  XCircle,
  Pause,
  RotateCcw,
} from 'lucide-react'

type StatusType = 'booking' | 'task' | 'approval' | 'document' | 'invoice' | 'generic'

interface StatusBadgeProps {
  /** The status value to display */
  status: string
  /** Type of entity this status is for */
  type?: StatusType
  /** Size of the badge */
  size?: 'sm' | 'md' | 'lg'
  /** Whether to show an icon */
  showIcon?: boolean
  /** Custom className */
  className?: string
  /** Custom label override */
  label?: string
}

/**
 * StatusBadge Widget Component
 *
 * Displays status with appropriate color and icon based on status value and type.
 * Automatically maps status values to colors and icons.
 *
 * @example
 * ```tsx
 * <StatusBadge status="CONFIRMED" type="booking" showIcon />
 * <StatusBadge status="COMPLETED" type="task" size="lg" />
 * <StatusBadge status="SAFE" type="document" />
 * ```
 */
export default function StatusBadge({
  status,
  type = 'generic',
  size = 'md',
  showIcon = false,
  className = '',
  label,
}: StatusBadgeProps) {
  // Status color mapping
  const getStatusColor = (s: string, t: StatusType) => {
    const statusLower = s.toUpperCase()

    // Booking statuses
    if (t === 'booking') {
      switch (statusLower) {
        case 'PENDING':
          return 'bg-yellow-100 text-yellow-800'
        case 'CONFIRMED':
          return 'bg-green-100 text-green-800'
        case 'COMPLETED':
          return 'bg-blue-100 text-blue-800'
        case 'CANCELLED':
          return 'bg-red-100 text-red-800'
        case 'RESCHEDULED':
          return 'bg-purple-100 text-purple-800'
        case 'NO_SHOW':
          return 'bg-gray-100 text-gray-800'
        default:
          return 'bg-gray-100 text-gray-800'
      }
    }

    // Task statuses
    if (t === 'task') {
      switch (statusLower) {
        case 'OPEN':
          return 'bg-blue-100 text-blue-800'
        case 'IN_PROGRESS':
          return 'bg-yellow-100 text-yellow-800'
        case 'IN_REVIEW':
          return 'bg-purple-100 text-purple-800'
        case 'COMPLETED':
          return 'bg-green-100 text-green-800'
        case 'BLOCKED':
          return 'bg-red-100 text-red-800'
        case 'ON_HOLD':
          return 'bg-orange-100 text-orange-800'
        case 'CANCELLED':
          return 'bg-gray-100 text-gray-800'
        default:
          return 'bg-gray-100 text-gray-800'
      }
    }

    // Approval statuses
    if (t === 'approval') {
      switch (statusLower) {
        case 'PENDING':
          return 'bg-yellow-100 text-yellow-800'
        case 'APPROVED':
          return 'bg-green-100 text-green-800'
        case 'REJECTED':
          return 'bg-red-100 text-red-800'
        case 'EXPIRED':
          return 'bg-gray-100 text-gray-800'
        default:
          return 'bg-gray-100 text-gray-800'
      }
    }

    // Document statuses
    if (t === 'document') {
      switch (statusLower) {
        case 'PENDING':
          return 'bg-yellow-100 text-yellow-800'
        case 'SCANNING':
          return 'bg-blue-100 text-blue-800'
        case 'SAFE':
          return 'bg-green-100 text-green-800'
        case 'QUARANTINED':
          return 'bg-red-100 text-red-800'
        case 'ARCHIVED':
          return 'bg-gray-100 text-gray-800'
        default:
          return 'bg-gray-100 text-gray-800'
      }
    }

    // Invoice statuses
    if (t === 'invoice') {
      switch (statusLower) {
        case 'DRAFT':
          return 'bg-gray-100 text-gray-800'
        case 'SENT':
          return 'bg-blue-100 text-blue-800'
        case 'VIEWED':
          return 'bg-purple-100 text-purple-800'
        case 'PARTIALLY_PAID':
          return 'bg-yellow-100 text-yellow-800'
        case 'PAID':
          return 'bg-green-100 text-green-800'
        case 'REFUNDED':
          return 'bg-teal-100 text-teal-800'
        case 'OVERDUE':
          return 'bg-red-100 text-red-800'
        case 'CANCELLED':
          return 'bg-gray-100 text-gray-800'
        default:
          return 'bg-gray-100 text-gray-800'
      }
    }

    // Generic/default statuses
    switch (statusLower) {
      case 'ACTIVE':
      case 'APPROVED':
      case 'CONFIRMED':
      case 'COMPLETED':
      case 'SAFE':
      case 'PAID':
        return 'bg-green-100 text-green-800'
      case 'INACTIVE':
      case 'PENDING':
      case 'WAITING':
        return 'bg-yellow-100 text-yellow-800'
      case 'ERROR':
      case 'FAILED':
      case 'CANCELLED':
      case 'REJECTED':
      case 'QUARANTINED':
        return 'bg-red-100 text-red-800'
      case 'DRAFT':
      case 'ARCHIVED':
        return 'bg-gray-100 text-gray-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  // Icon mapping
  const getStatusIcon = (s: string) => {
    const statusLower = s.toUpperCase()
    const iconProps = { className: 'h-3 w-3 mr-1' }

    if (
      statusLower === 'COMPLETED' ||
      statusLower === 'APPROVED' ||
      statusLower === 'CONFIRMED' ||
      statusLower === 'SAFE' ||
      statusLower === 'PAID'
    ) {
      return <CheckCircle2 {...iconProps} />
    }

    if (
      statusLower === 'PENDING' ||
      statusLower === 'WAITING' ||
      statusLower === 'DRAFT' ||
      statusLower === 'SCANNING'
    ) {
      return <Clock {...iconProps} />
    }

    if (
      statusLower === 'ERROR' ||
      statusLower === 'FAILED' ||
      statusLower === 'CANCELLED' ||
      statusLower === 'REJECTED' ||
      statusLower === 'QUARANTINED' ||
      statusLower === 'BLOCKED' ||
      statusLower === 'OVERDUE'
    ) {
      return <XCircle {...iconProps} />
    }

    if (
      statusLower === 'IN_PROGRESS' ||
      statusLower === 'PARTIALLY_PAID'
    ) {
      return <RotateCcw {...iconProps} />
    }

    if (
      statusLower === 'IN_REVIEW' ||
      statusLower === 'VIEWED'
    ) {
      return <AlertCircle {...iconProps} />
    }

    if (statusLower === 'PAUSED') {
      return <Pause {...iconProps} />
    }

    return null
  }

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-2.5 py-1',
    lg: 'text-base px-3 py-1.5',
  }

  const colorClass = getStatusColor(status, type)
  const displayLabel = label || status.replace('_', ' ')
  const icon = showIcon ? getStatusIcon(status) : null

  return (
    <Badge className={`${colorClass} ${sizeClasses[size]} ${className}`}>
      {icon}
      {displayLabel}
    </Badge>
  )
}
