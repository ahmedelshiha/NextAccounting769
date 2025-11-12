'use client'

import React, { useEffect, useMemo } from 'react'
import { useAuditLogs, AuditLogEntry } from '../hooks/useAuditLogs'
import { Skeleton } from '@/components/ui/skeleton'
import {
  UserPlus,
  UserCheck,
  UserX,
  Shield,
  Download,
  Upload,
  Eye,
  Edit2,
  Trash2,
  Clock
} from 'lucide-react'

interface RecentActivityFeedProps {
  limit?: number
  showViewAll?: boolean
  onViewAll?: () => void
}

/**
 * Recent Activity Feed
 * 
 * Displays recent user actions and system events in chronological order.
 * Features:
 * - Real-time activity from audit logs
 * - Icons for different action types
 * - User avatars with initials
 * - Timestamps with relative time
 * - Expandable to show more details
 */
export default function RecentActivityFeed({
  limit = 5,
  showViewAll = true,
  onViewAll
}: RecentActivityFeedProps) {
  const { logs, isLoading } = useAuditLogs({ limit, offset: 0 })

  // Filter out system actions to show only user-relevant activities
  const recentActivity = useMemo(() => {
    return logs
      .filter(log => 
        log.action && 
        ['USER_CREATED', 'USER_UPDATED', 'USER_DELETED', 'USER_LOGIN', 'ROLE_CHANGED', 'EXPORT_REQUESTED', 'IMPORT_COMPLETED'].includes(log.action)
      )
      .slice(0, limit)
  }, [logs, limit])

  // Get icon for action type
  const getActionIcon = (action: string) => {
    const iconClass = 'w-4 h-4'
    switch (action) {
      case 'USER_CREATED':
        return <UserPlus className={iconClass} />
      case 'USER_UPDATED':
        return <Edit2 className={iconClass} />
      case 'USER_DELETED':
        return <UserX className={iconClass} />
      case 'USER_LOGIN':
        return <UserCheck className={iconClass} />
      case 'ROLE_CHANGED':
        return <Shield className={iconClass} />
      case 'EXPORT_REQUESTED':
        return <Download className={iconClass} />
      case 'IMPORT_COMPLETED':
        return <Upload className={iconClass} />
      default:
        return <Eye className={iconClass} />
    }
  }

  // Get action label
  const getActionLabel = (log: AuditLogEntry) => {
    const actor = log.user?.name || log.user?.email || 'System'
    const resource = log.resource || 'Item'

    switch (log.action) {
      case 'USER_CREATED':
        return `${actor} created a new user`
      case 'USER_UPDATED':
        return `${actor} updated ${resource}`
      case 'USER_DELETED':
        return `${actor} deleted ${resource}`
      case 'USER_LOGIN':
        return `${actor} logged in`
      case 'ROLE_CHANGED':
        return `${actor} changed role for ${resource}`
      case 'EXPORT_REQUESTED':
        return `${actor} exported user data`
      case 'IMPORT_COMPLETED':
        return `${actor} imported user data`
      default:
        return `${actor} performed ${log.action.toLowerCase()}`
    }
  }

  // Get color for action type
  const getActionColor = (action: string) => {
    switch (action) {
      case 'USER_CREATED':
        return 'bg-green-100 text-green-700'
      case 'USER_UPDATED':
        return 'bg-blue-100 text-blue-700'
      case 'USER_DELETED':
        return 'bg-red-100 text-red-700'
      case 'USER_LOGIN':
        return 'bg-purple-100 text-purple-700'
      case 'ROLE_CHANGED':
        return 'bg-amber-100 text-amber-700'
      case 'EXPORT_REQUESTED':
        return 'bg-cyan-100 text-cyan-700'
      case 'IMPORT_COMPLETED':
        return 'bg-teal-100 text-teal-700'
      default:
        return 'bg-gray-100 text-gray-700'
    }
  }

  // Format timestamp
  const formatTime = (dateString: string) => {
    try {
      const date = new Date(dateString)
      const now = new Date()
      const diffMs = now.getTime() - date.getTime()
      const diffMins = Math.floor(diffMs / 60000)
      const diffHours = Math.floor(diffMs / 3600000)
      const diffDays = Math.floor(diffMs / 86400000)

      if (diffMins < 1) return 'Just now'
      if (diffMins < 60) return `${diffMins}m ago`
      if (diffHours < 24) return `${diffHours}h ago`
      if (diffDays < 7) return `${diffDays}d ago`

      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    } catch {
      return 'Recently'
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex gap-3 p-2">
            <Skeleton className="h-8 w-8 rounded-full flex-shrink-0" />
            <div className="flex-1 space-y-1">
              <Skeleton className="h-3 w-3/4" />
              <Skeleton className="h-2 w-1/2" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (recentActivity.length === 0) {
    return (
      <div className="text-center py-6 px-3">
        <Clock className="w-8 h-8 text-gray-300 mx-auto mb-2" />
        <p className="text-sm text-gray-600">No recent activity</p>
      </div>
    )
  }

  return (
    <div className="space-y-0">
      {recentActivity.map((log) => (
        <div key={log.id} className="flex gap-3 p-2.5 hover:bg-gray-50 rounded transition-colors text-sm">
          {/* Action icon */}
          <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${getActionColor(log.action)}`}>
            {getActionIcon(log.action)}
          </div>

          {/* Activity details */}
          <div className="flex-1 min-w-0">
            <p className="text-gray-900 font-medium text-xs truncate">
              {getActionLabel(log)}
            </p>
            <p className="text-gray-500 text-xs mt-0.5">
              {formatTime(log.createdAt)}
            </p>
          </div>
        </div>
      ))}

      {/* View All link */}
      {showViewAll && logs.length > limit && (
        <button
          onClick={onViewAll}
          className="w-full px-3 py-2 text-xs font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded transition-colors mt-2"
        >
          View all activity →
        </button>
      )}
    </div>
  )
}
