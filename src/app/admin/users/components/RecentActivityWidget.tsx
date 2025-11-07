'use client'

import React, { memo, useMemo } from 'react'
import { formatDistanceToNow } from 'date-fns'
import {
  User,
  Edit,
  Trash2,
  Shield,
  LogIn,
  LogOut,
  CheckCircle
} from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'

interface ActivityEvent {
  id: string
  userId: string
  userName: string
  action: 'created' | 'updated' | 'deleted' | 'role_changed' | 'login' | 'logout' | 'verified'
  timestamp: string
  details?: string
}

interface RecentActivityWidgetProps {
  activities?: ActivityEvent[]
  loading?: boolean
  maxItems?: number
}

/**
 * Recent Activity Widget
 * 
 * Features:
 * - Displays recent user management activities
 * - Icon-coded by action type
 * - Time ago format (e.g., "2 minutes ago")
 * - Scrollable list
 * - Loading state with skeleton
 * - Responsive design
 */
const RecentActivityWidget = memo(function RecentActivityWidget({
  activities = [],
  loading = false,
  maxItems = 8
}: RecentActivityWidgetProps) {
  // Default sample activities if none provided
  const defaultActivities: ActivityEvent[] = [
    {
      id: '1',
      userId: 'user-1',
      userName: 'John Doe',
      action: 'created',
      timestamp: new Date(Date.now() - 2 * 60 * 1000).toISOString(),
      details: 'New user created'
    },
    {
      id: '2',
      userId: 'user-2',
      userName: 'Jane Smith',
      action: 'role_changed',
      timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
      details: 'Role changed to Admin'
    },
    {
      id: '3',
      userId: 'user-3',
      userName: 'Bob Johnson',
      action: 'verified',
      timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
      details: 'Email verified'
    },
    {
      id: '4',
      userId: 'user-4',
      userName: 'Alice Williams',
      action: 'login',
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      details: 'User logged in'
    }
  ]

  const displayActivities = useMemo(() => {
    const items = activities.length > 0 ? activities : defaultActivities
    return items.slice(0, maxItems)
  }, [activities, maxItems])

  const getActionIcon = (action: string) => {
    const iconProps = { className: 'w-4 h-4' }
    switch (action) {
      case 'created':
        return <User {...iconProps} className="w-4 h-4 text-green-600" />
      case 'updated':
        return <Edit {...iconProps} className="w-4 h-4 text-blue-600" />
      case 'deleted':
        return <Trash2 {...iconProps} className="w-4 h-4 text-red-600" />
      case 'role_changed':
        return <Shield {...iconProps} className="w-4 h-4 text-purple-600" />
      case 'login':
        return <LogIn {...iconProps} className="w-4 h-4 text-green-600" />
      case 'logout':
        return <LogOut {...iconProps} className="w-4 h-4 text-gray-600" />
      case 'verified':
        return <CheckCircle {...iconProps} className="w-4 h-4 text-green-600" />
      default:
        return <User {...iconProps} className="w-4 h-4 text-gray-400" />
    }
  }

  const getActionText = (action: string): string => {
    const actionMap: Record<string, string> = {
      created: 'Created',
      updated: 'Updated',
      deleted: 'Deleted',
      role_changed: 'Role changed',
      login: 'Logged in',
      logout: 'Logged out',
      verified: 'Verified'
    }
    return actionMap[action] || 'Activity'
  }

  if (loading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full rounded" />
        ))}
      </div>
    )
  }

  return (
    <div className="recent-activity-widget-container">
      <div className="space-y-2">
        {displayActivities.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-4">
            No recent activity
          </p>
        ) : (
          displayActivities.map((activity) => (
            <div
              key={activity.id}
              className="recent-activity-item"
            >
              <div className="flex items-center gap-3">
                <div className="flex-shrink-0">
                  {getActionIcon(activity.action)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {activity.userName}
                  </p>
                  <p className="text-xs text-gray-600">
                    {getActionText(activity.action)}
                    {activity.details && ` - ${activity.details}`}
                  </p>
                </div>
                <div className="flex-shrink-0 text-xs text-gray-400">
                  {formatDistanceToNow(new Date(activity.timestamp), {
                    addSuffix: true
                  })}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
})

export default RecentActivityWidget
