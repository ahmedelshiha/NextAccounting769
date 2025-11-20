'use client'

import React from 'react'
import { TaskStatus } from '@/types/shared/entities/task'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { CheckCircle2, Clock, AlertCircle, Pause } from 'lucide-react'

interface TaskStatusSelectProps {
  /** Current status */
  value: TaskStatus
  /** Called when status changes */
  onChange: (status: TaskStatus) => void
  /** Is disabled */
  disabled?: boolean
  /** Show badge only (no dropdown) */
  readonly?: boolean
  /** Size variant */
  size?: 'sm' | 'md'
}

const statusIcons: Record<TaskStatus, React.ReactNode> = {
  OPEN: <Clock className="w-4 h-4" />,
  IN_PROGRESS: <Clock className="w-4 h-4" />,
  REVIEW: <AlertCircle className="w-4 h-4" />,
  COMPLETED: <CheckCircle2 className="w-4 h-4" />,
  BLOCKED: <Pause className="w-4 h-4" />,
}

const statusLabels: Record<TaskStatus, string> = {
  OPEN: 'Open',
  IN_PROGRESS: 'In Progress',
  REVIEW: 'Review',
  COMPLETED: 'Completed',
  BLOCKED: 'Blocked',
}

const statusColors: Record<TaskStatus, string> = {
  OPEN: 'bg-gray-100 text-gray-800',
  IN_PROGRESS: 'bg-blue-100 text-blue-800',
  REVIEW: 'bg-purple-100 text-purple-800',
  COMPLETED: 'bg-green-100 text-green-800',
  BLOCKED: 'bg-red-100 text-red-800',
}

/**
 * TaskStatusSelect Component
 *
 * Dropdown selector for task status with visual indicators.
 * Can display as read-only badge or interactive dropdown.
 *
 * @example
 * ```tsx
 * <TaskStatusSelect
 *   value={task.status}
 *   onChange={handleStatusChange}
 * />
 * ```
 */
export default function TaskStatusSelect({
  value,
  onChange,
  disabled = false,
  readonly = false,
  size = 'md',
}: TaskStatusSelectProps) {
  if (readonly) {
    return (
      <Badge className={statusColors[value]}>
        <span className="flex items-center gap-1">
          {statusIcons[value]}
          {statusLabels[value]}
        </span>
      </Badge>
    )
  }

  return (
    <Select value={value} onValueChange={onChange} disabled={disabled}>
      <SelectTrigger className={size === 'sm' ? 'h-8 text-sm' : ''}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {Object.entries(statusLabels).map(([status, label]) => (
          <SelectItem key={status} value={status}>
            <span className="flex items-center gap-2">
              {statusIcons[status as TaskStatus]}
              {label}
            </span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
