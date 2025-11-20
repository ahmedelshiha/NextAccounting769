'use client'

import React from 'react'
import { Task, TaskPriority, TaskStatus } from '@/types/shared/entities/task'
import { usePermissions } from '@/lib/use-permissions'
import { PERMISSIONS } from '@/lib/permissions'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Edit2, Trash2, CheckCircle2, Clock, AlertCircle, User } from 'lucide-react'
import { ComponentVariant, CardComponentProps } from '../types'
import { formatDate, formatRelativeTime } from '@/lib/shared/formatters'

interface TaskCardProps extends CardComponentProps<Task> {
  /** The task to display */
  data: Task
  /** Display variant */
  variant?: ComponentVariant
  /** Called when card is clicked */
  onClick?: () => void
  /** Called to edit task */
  onEdit?: (id: string) => void
  /** Called to delete task (admin) */
  onDelete?: (id: string) => void
  /** Called to change status */
  onStatusChange?: (id: string, status: TaskStatus) => void
  /** Is loading */
  loading?: boolean
  /** Show action buttons */
  showActions?: boolean
  /** Compact display (no description) */
  compact?: boolean
}

/**
 * TaskCard Component
 *
 * Displays task information in a card format with status tracking.
 * Portal variant: View and manage assigned tasks
 * Admin variant: Full management of all tasks
 * Compact variant: Minimal display for lists
 *
 * @example
 * ```tsx
 * // Portal usage
 * <TaskCard task={task} variant="portal" onStatusChange={handleStatusChange} />
 *
 * // Admin usage
 * <TaskCard task={task} variant="admin" onEdit={handleEdit} onDelete={handleDelete} />
 * ```
 */
export default function TaskCard({
  data: task,
  variant = 'portal',
  onClick,
  onEdit,
  onDelete,
  onStatusChange,
  loading = false,
  showActions = true,
  compact = false,
  className = '',
}: TaskCardProps) {
  const { has } = usePermissions()
  const canEditTask = has(PERMISSIONS.TASKS_EDIT)
  const canDeleteTask = has(PERMISSIONS.TASKS_DELETE)

  if (!task) return null

  const priorityColors: Record<TaskPriority, string> = {
    LOW: 'bg-blue-100 text-blue-800',
    MEDIUM: 'bg-yellow-100 text-yellow-800',
    HIGH: 'bg-red-100 text-red-800',
  }

  const statusColors: Record<TaskStatus, string> = {
    OPEN: 'bg-gray-100 text-gray-700',
    IN_PROGRESS: 'bg-blue-100 text-blue-800',
    REVIEW: 'bg-purple-100 text-purple-800',
    COMPLETED: 'bg-green-100 text-green-800',
    BLOCKED: 'bg-red-100 text-red-800',
  }

  const statusIcons: Record<TaskStatus, React.ReactNode> = {
    OPEN: <Clock className="w-4 h-4" />,
    IN_PROGRESS: <Clock className="w-4 h-4" />,
    REVIEW: <AlertCircle className="w-4 h-4" />,
    COMPLETED: <CheckCircle2 className="w-4 h-4" />,
    BLOCKED: <AlertCircle className="w-4 h-4" />,
  }

  const isOverdue = task.dueAt && new Date(task.dueAt) < new Date() && task.status !== TaskStatus.COMPLETED
  const isDueSoon = task.dueAt && !isOverdue && (new Date(task.dueAt).getTime() - new Date().getTime()) < 86400000 * 3

  if (compact) {
    return (
      <div
        onClick={onClick}
        className={`flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 cursor-pointer transition ${className}`}
      >
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h4 className="font-medium text-sm">{task.title}</h4>
            <Badge variant="outline" className={priorityColors[task.priority]}>
              {task.priority}
            </Badge>
          </div>
          {task.assignee && (
            <p className="text-xs text-gray-600 mt-1 flex items-center gap-1">
              <User className="w-3 h-3" />
              {task.assignee.name || task.assignee.email}
            </p>
          )}
        </div>
        <Badge className={statusColors[task.status]}>
          {task.status}
        </Badge>
      </div>
    )
  }

  return (
    <Card className={`hover:shadow-md transition ${className}`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1">
            <CardTitle className="text-lg">{task.title}</CardTitle>
            {!compact && task.description && (
              <CardDescription className="mt-2 line-clamp-2">{task.description}</CardDescription>
            )}
          </div>
          {showActions && variant === 'admin' && canDeleteTask && (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => onDelete?.(task.id)}
              disabled={loading}
              className="text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {/* Task Meta */}
        <div className="flex flex-wrap gap-2">
          <Badge variant="outline" className={priorityColors[task.priority]}>
            {task.priority} Priority
          </Badge>
          <Badge
            className={`${statusColors[task.status]} ${isOverdue ? 'animate-pulse' : ''}`}
          >
            <span className="flex items-center gap-1">
              {statusIcons[task.status]}
              {task.status}
            </span>
          </Badge>
          {isOverdue && (
            <Badge variant="destructive">
              Overdue
            </Badge>
          )}
          {isDueSoon && !isOverdue && (
            <Badge variant="secondary">
              Due Soon
            </Badge>
          )}
        </div>

        {/* Due Date */}
        {task.dueAt && (
          <div className="text-sm text-gray-600 flex items-center gap-2">
            <Clock className="w-4 h-4" />
            Due {formatDate(new Date(task.dueAt))}
            {' '}
            <span className="text-xs text-gray-500">
              ({formatRelativeTime(new Date(task.dueAt))})
            </span>
          </div>
        )}

        {/* Assignee */}
        {task.assignee && (
          <div className="text-sm text-gray-600 flex items-center gap-2">
            <User className="w-4 h-4" />
            <span>
              Assigned to{' '}
              <strong>
                {task.assignee.name || task.assignee.email}
              </strong>
            </span>
            {task.assignee.department && (
              <span className="text-xs text-gray-500">
                ({task.assignee.department})
              </span>
            )}
          </div>
        )}

        {/* Compliance Badge */}
        {task.complianceRequired && (
          <div className="p-2 bg-yellow-50 border border-yellow-200 rounded flex items-center gap-2 text-sm">
            <AlertCircle className="w-4 h-4 text-yellow-600" />
            <span className="text-yellow-800">
              Compliance Required
              {task.complianceDeadline && (
                <>
                  {' '}
                  by {formatDate(new Date(task.complianceDeadline))}
                </>
              )}
            </span>
          </div>
        )}

        {/* Actions */}
        {showActions && variant === 'admin' && canEditTask && (
          <div className="flex gap-2 pt-2 border-t">
            <Button
              size="sm"
              variant="outline"
              onClick={() => onEdit?.(task.id)}
              disabled={loading}
              className="flex-1"
            >
              <Edit2 className="w-4 h-4 mr-2" />
              Edit
            </Button>
          </div>
        )}

        {/* Portal User Actions */}
        {showActions && variant === 'portal' && task.status !== TaskStatus.COMPLETED && (
          <div className="flex gap-2 pt-2 border-t">
            {task.status !== TaskStatus.IN_PROGRESS && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => onStatusChange?.(task.id, TaskStatus.IN_PROGRESS)}
                disabled={loading}
                className="flex-1"
              >
                Start
              </Button>
            )}
            {task.status === TaskStatus.IN_PROGRESS && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => onStatusChange?.(task.id, TaskStatus.COMPLETED)}
                disabled={loading}
                className="flex-1"
              >
                Mark Complete
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
