'use client'

import React, { useState } from 'react'
import { Bell, X } from 'lucide-react'
import { useNotifications } from '@/hooks/shared/useNotifications'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { NotificationCenter } from './NotificationCenter'

interface NotificationBellProps {
  className?: string
  showLabel?: boolean
}

/**
 * Notification Bell - Displays unread count and opens notification center
 */
export function NotificationBell({
  className,
  showLabel = false,
}: NotificationBellProps) {
  const [isOpen, setIsOpen] = useState(false)
  const { unreadCount } = useNotifications({ limit: 50, unreadOnly: false })

  return (
    <div className={cn('relative', className)}>
      {/* Bell Button */}
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setIsOpen(!isOpen)}
        className="relative"
        title="Notifications"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span
            className={cn(
              'absolute top-0 right-0 h-5 w-5 bg-red-500 text-white',
              'text-xs font-bold flex items-center justify-center rounded-full',
              'transform translate-x-1/4 -translate-y-1/4'
            )}
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
        {showLabel && <span className="ml-2 text-sm">Notifications</span>}
      </Button>

      {/* Notification Center Dropdown */}
      {isOpen && (
        <div
          className={cn(
            'absolute right-0 top-full mt-2 w-96 max-h-96 rounded-lg border border-gray-200',
            'bg-white shadow-lg z-50 overflow-hidden flex flex-col'
          )}
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-gray-200 p-4 bg-gray-50">
            <h3 className="font-semibold text-gray-900">Notifications</h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsOpen(false)}
              className="h-6 w-6 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Content */}
          <NotificationCenter compact onClose={() => setIsOpen(false)} />
        </div>
      )}
    </div>
  )
}
