'use client'

import React, { useState } from 'react'
import {
  Check,
  Trash2,
  CheckCheck,
  Mail,
  MessageCircle,
  AlertCircle,
  FileText,
  Clock,
} from 'lucide-react'
import { useNotifications } from '@/hooks/shared/useNotifications'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import type { NotificationWithRelations } from '@/types/notifications'
import { formatDistanceToNow } from 'date-fns'

interface NotificationCenterProps {
  compact?: boolean
  onClose?: () => void
}

/**
 * Notification Center - Display and manage notifications
 */
export function NotificationCenter({
  compact = false,
  onClose,
}: NotificationCenterProps) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [filter, setFilter] = useState<'all' | 'unread'>('all')

  const {
    notifications,
    total,
    unreadCount,
    isLoading,
    error,
    markAsRead,
    markAllAsRead,
    deleteNotification,
  } = useNotifications({
    limit: compact ? 5 : 20,
    unreadOnly: filter === 'unread',
    autoRefresh: true,
  })

  const filteredNotifications =
    filter === 'unread' ? notifications.filter((n) => !n.readAt) : notifications

  const toggleSelect = (id: string) => {
    const newSelected = new Set(selectedIds)
    if (newSelected.has(id)) {
      newSelected.delete(id)
    } else {
      newSelected.add(id)
    }
    setSelectedIds(newSelected)
  }

  const handleMarkAsRead = async () => {
    if (selectedIds.size === 0) return
    await markAsRead(Array.from(selectedIds))
    setSelectedIds(new Set())
  }

  const handleDelete = async () => {
    if (selectedIds.size === 0) return
    await deleteNotification(Array.from(selectedIds))
    setSelectedIds(new Set())
  }

  const getNotificationIcon = (type: string) => {
    if (type.includes('message') || type.includes('comment'))
      return <MessageCircle className="h-4 w-4" />
    if (type.includes('document'))
      return <FileText className="h-4 w-4" />
    if (type.includes('task'))
      return <CheckCheck className="h-4 w-4" />
    if (type.includes('alert'))
      return <AlertCircle className="h-4 w-4" />
    if (type.includes('approval'))
      return <Clock className="h-4 w-4" />
    return <Mail className="h-4 w-4" />
  }

  const getPriorityClass = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'border-l-4 border-red-500 bg-red-50'
      case 'high':
        return 'border-l-4 border-orange-500 bg-orange-50'
      case 'normal':
        return 'border-l-4 border-blue-500 bg-blue-50'
      default:
        return 'border-l-4 border-gray-300 bg-gray-50'
    }
  }

  if (error) {
    return (
      <div className="p-4 text-center">
        <p className="text-red-600">Failed to load notifications</p>
      </div>
    )
  }

  if (isLoading && notifications.length === 0) {
    return (
      <div className="p-8 text-center">
        <div className="animate-spin h-6 w-6 border-2 border-gray-300 border-t-gray-900 rounded-full mx-auto" />
        <p className="mt-2 text-sm text-gray-600">Loading notifications...</p>
      </div>
    )
  }

  if (notifications.length === 0) {
    return (
      <div className="p-8 text-center">
        <Mail className="h-8 w-8 text-gray-400 mx-auto mb-2" />
        <p className="text-gray-600">No notifications</p>
      </div>
    )
  }

  return (
    <div className={cn('flex flex-col h-full', { 'max-h-96': compact })}>
      {/* Toolbar */}
      <div className="border-b border-gray-200 p-3 bg-gray-50 space-y-2">
        {/* Filter Tabs */}
        <div className="flex gap-2">
          <Button
            variant={filter === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('all')}
          >
            All ({total})
          </Button>
          <Button
            variant={filter === 'unread' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('unread')}
          >
            Unread ({unreadCount})
          </Button>
        </div>

        {/* Actions */}
        {selectedIds.size > 0 && (
          <div className="flex gap-2 pt-2 border-t border-gray-200">
            <Button
              variant="outline"
              size="sm"
              onClick={handleMarkAsRead}
              disabled={selectedIds.size === 0}
            >
              <Check className="h-4 w-4 mr-1" />
              Mark Read
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleDelete}
              disabled={selectedIds.size === 0}
            >
              <Trash2 className="h-4 w-4 mr-1" />
              Delete
            </Button>
            {selectedIds.size > 0 && (
              <div className="ml-auto text-sm text-gray-600 py-1">
                {selectedIds.size} selected
              </div>
            )}
          </div>
        )}

        {/* Mark all as read */}
        {unreadCount > 0 && selectedIds.size === 0 && (
          <Button
            variant="outline"
            size="sm"
            className="w-full"
            onClick={markAllAsRead}
          >
            <CheckCheck className="h-4 w-4 mr-2" />
            Mark All as Read
          </Button>
        )}
      </div>

      {/* Notifications List */}
      <div className={cn('flex-1 overflow-y-auto', { 'max-h-64': compact })}>
        {filteredNotifications.map((notification) => (
          <NotificationItem
            key={notification.id}
            notification={notification}
            isSelected={selectedIds.has(notification.id)}
            onSelect={() => toggleSelect(notification.id)}
            icon={getNotificationIcon(notification.type)}
            priorityClass={getPriorityClass(notification.priority)}
          />
        ))}
      </div>

      {/* Footer */}
      {!compact && (
        <div className="border-t border-gray-200 p-3 bg-gray-50 text-center">
          <Button variant="outline" size="sm" className="w-full">
            View All Notifications
          </Button>
        </div>
      )}
    </div>
  )
}

/**
 * Individual notification item
 */
interface NotificationItemProps {
  notification: NotificationWithRelations
  isSelected: boolean
  onSelect: () => void
  icon: React.ReactNode
  priorityClass: string
}

function NotificationItem({
  notification,
  isSelected,
  onSelect,
  icon,
  priorityClass,
}: NotificationItemProps) {
  return (
    <div
      className={cn(
        'p-3 border-b border-gray-200 hover:bg-gray-100 transition-colors cursor-pointer',
        priorityClass,
        { 'bg-blue-100': isSelected }
      )}
      onClick={onSelect}
    >
      <div className="flex gap-3 items-start">
        {/* Checkbox */}
        <input
          type="checkbox"
          checked={isSelected}
          onChange={onSelect}
          className="mt-1"
          onClick={(e) => e.stopPropagation()}
        />

        {/* Icon */}
        <div className="text-gray-500 mt-0.5">{icon}</div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <h4
              className={cn('text-sm font-semibold truncate', {
                'font-normal text-gray-600': notification.readAt,
              })}
            >
              {notification.title}
            </h4>
            {!notification.readAt && (
              <span className="h-2 w-2 bg-blue-600 rounded-full flex-shrink-0 mt-1" />
            )}
          </div>
          <p className="text-xs text-gray-600 mt-1 line-clamp-2">
            {notification.message}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            {formatDistanceToNow(new Date(notification.createdAt), {
              addSuffix: true,
            })}
          </p>
        </div>
      </div>
    </div>
  )
}

export { NotificationItem }
