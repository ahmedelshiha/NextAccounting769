'use client'

import React from 'react'
import { Badge } from '@/components/ui/badge'
import { AlertCircle, AlertTriangle, Flag, Circle } from 'lucide-react'

type PriorityLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'

interface PriorityBadgeProps {
  /** The priority level */
  priority: PriorityLevel | string
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
 * PriorityBadge Widget Component
 *
 * Displays priority level with appropriate color and icon.
 * Maps priority levels to visual indicators.
 *
 * @example
 * ```tsx
 * <PriorityBadge priority="HIGH" showIcon />
 * <PriorityBadge priority="URGENT" size="lg" />
 * <PriorityBadge priority="LOW" />
 * ```
 */
export default function PriorityBadge({
  priority,
  size = 'md',
  showIcon = false,
  className = '',
  label,
}: PriorityBadgeProps) {
  const priorityUpper = String(priority).toUpperCase() as PriorityLevel

  // Priority color mapping
  const getPriorityColor = (p: PriorityLevel | string) => {
    const pUpper = String(p).toUpperCase()
    switch (pUpper) {
      case 'LOW':
        return 'bg-green-50 text-green-700 border border-green-200'
      case 'MEDIUM':
        return 'bg-yellow-50 text-yellow-700 border border-yellow-200'
      case 'HIGH':
        return 'bg-orange-50 text-orange-700 border border-orange-200'
      case 'URGENT':
        return 'bg-red-50 text-red-700 border border-red-200'
      default:
        return 'bg-gray-50 text-gray-700 border border-gray-200'
    }
  }

  // Icon mapping
  const getPriorityIcon = (p: PriorityLevel | string) => {
    const pUpper = String(p).toUpperCase()
    const iconProps = { className: 'h-3 w-3 mr-1' }

    switch (pUpper) {
      case 'LOW':
        return <Circle {...iconProps} />
      case 'MEDIUM':
        return <Flag {...iconProps} />
      case 'HIGH':
        return <AlertTriangle {...iconProps} />
      case 'URGENT':
        return <AlertCircle {...iconProps} />
      default:
        return null
    }
  }

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-2.5 py-1',
    lg: 'text-base px-3 py-1.5',
  }

  const colorClass = getPriorityColor(priorityUpper)
  const displayLabel = label || priorityUpper
  const icon = showIcon ? getPriorityIcon(priorityUpper) : null

  return (
    <Badge className={`${colorClass} ${sizeClasses[size]} ${className} flex items-center w-fit`}>
      {icon}
      {displayLabel}
    </Badge>
  )
}
