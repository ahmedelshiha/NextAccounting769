'use client'

import React, { memo, useEffect, useCallback, useState } from 'react'
import { Loader2, Clock, AlertCircle, RefreshCw, ChevronDown } from 'lucide-react'
import { useUsersContext } from '../../contexts/UsersContextProvider'
import { apiFetch } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

interface ActivityTabProps {
  userId: string
}

interface ActivityLog {
  id: string
  action: string
  resource: string
  timestamp: string
  actor?: {
    id: string
    name: string
    email: string
    avatar?: string
  }
  details: any
  message: string
}

interface PaginationInfo {
  offset: number
  limit: number
  total: number
  hasMore: boolean
}

const getActionIcon = (action: string): string => {
  const iconMap: Record<string, string> = {
    'CREATE': '➕',
    'UPDATE': '✏️',
    'DELETE': '🗑️',
    'LOGIN': '🔓',
    'LOGOUT': '����',
    'EXPORT': '📤',
    'IMPORT': '📥',
    'PERMISSION_GRANTED': '✅',
    'PERMISSION_REVOKED': '❌',
    'PASSWORD_CHANGED': '🔑',
    'EMAIL_VERIFIED': '📧',
    'ROLE_CHANGED': '��',
    'STATUS_CHANGED': '⚙️',
    'MFA_ENABLED': '🛡️',
    'MFA_DISABLED': '⚠️'
  }
  return iconMap[action] || '📝'
}

const formatRelativeTime = (iso?: string): string => {
  if (!iso) return 'Unknown time'
  const d = new Date(iso)
  if (isNaN(d.getTime())) return 'Invalid date'
  const now = new Date()
  const diffMs = now.getTime() - d.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 7) return `${diffDays}d ago`

  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
}

const formatFullDateTime = (iso?: string): string => {
  if (!iso) return ''
  const d = new Date(iso)
  if (isNaN(d.getTime())) return ''
  return d.toLocaleString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' })
}

export const ActivityTab = memo(function ActivityTab({ userId }: ActivityTabProps) {
  const { activity, setActivity, activityLoading, setActivityLoading, activityError, setActivityError } = useUsersContext()
  const [pagination, setPagination] = useState<PaginationInfo>({ offset: 0, limit: 50, total: 0, hasMore: false })
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set())
  const [isLoadingMore, setIsLoadingMore] = useState(false)

  const loadActivity = useCallback(
    async (offset = 0, isLoadMore = false) => {
      if (!isLoadMore) {
        setActivityLoading(true)
        setActivityError(null)
      } else {
        setIsLoadingMore(true)
      }

      try {
        const res = await apiFetch(`/api/admin/users/${encodeURIComponent(userId)}/activity?limit=50&offset=${offset}`)
        if (!res.ok) throw new Error(`Failed to load activity (${res.status})`)

        const { data, pagination: paginationData } = await res.json()

        if (isLoadMore) {
          setActivity([...activity, ...data])
        } else {
          setActivity(Array.isArray(data) ? data : [])
        }

        setPagination(paginationData)
      } catch (err) {
        console.error('Failed to load activity:', err)
        if (!isLoadMore) {
          setActivity([])
          setActivityError('Unable to load activity logs')
        } else {
          toast.error('Failed to load more activity')
        }
      } finally {
        if (!isLoadMore) {
          setActivityLoading(false)
        } else {
          setIsLoadingMore(false)
        }
      }
    },
    [userId, setActivity, setActivityLoading, setActivityError]
  )

  useEffect(() => {
    loadActivity(0, false).catch(console.error)
  }, [userId])

  const toggleDetails = (id: string) => {
    const newExpanded = new Set(expandedItems)
    if (newExpanded.has(id)) {
      newExpanded.delete(id)
    } else {
      newExpanded.add(id)
    }
    setExpandedItems(newExpanded)
  }

  const handleLoadMore = () => {
    loadActivity(pagination.offset + pagination.limit, true)
  }

  if (activityLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600 mb-3" />
        <span className="text-slate-600 font-medium">Loading activity history...</span>
      </div>
    )
  }

  if (activityError) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-semibold text-red-900">Error loading activity</p>
          <p className="text-sm text-red-700 mt-1">{activityError}</p>
          <Button onClick={() => loadActivity(0, false)} className="mt-3 bg-red-600 hover:bg-red-700 text-white">
            Try Again
          </Button>
        </div>
      </div>
    )
  }

  if (activity.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <Clock className="h-12 w-12 text-slate-300 mb-3" />
        <p className="text-slate-600 font-medium">No activity recorded</p>
        <p className="text-sm text-slate-500 mt-1">User activity history will appear here</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-slate-600">Showing {activity.length} of {pagination.total} entries</p>
        <Button
          onClick={() => loadActivity(0, false)}
          variant="outline"
          size="sm"
          className="gap-2"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </Button>
      </div>

      {(activity as unknown as ActivityLog[]).map((log: ActivityLog) => (
        <div
          key={log.id}
          className="border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors hover:shadow-sm overflow-hidden"
        >
          <button
            onClick={() => toggleDetails(log.id)}
            className="w-full text-left p-4 flex items-start justify-between gap-4"
          >
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3">
                <span className="text-lg">{getActionIcon(log.action)}</span>
                <div>
                  <p className="text-sm font-medium text-slate-900">{log.message}</p>
                  {log.actor && (
                    <p className="text-xs text-slate-600 mt-1">
                      by {log.actor.name || 'Unknown'} ({log.actor.email})
                    </p>
                  )}
                </div>
              </div>
              <div className="mt-2 flex items-center gap-4">
                <p className="text-xs text-slate-500">{formatFullDateTime(log.timestamp)}</p>
                <p className="text-xs font-medium text-slate-600">{formatRelativeTime(log.timestamp)}</p>
              </div>
            </div>
            <ChevronDown
              className={`w-5 h-5 text-slate-400 flex-shrink-0 transition-transform ${
                expandedItems.has(log.id) ? 'rotate-180' : ''
              }`}
            />
          </button>

          {expandedItems.has(log.id) && (
            <div className="border-t border-slate-200 bg-slate-50 p-4 space-y-3">
              <div>
                <p className="text-xs font-semibold text-slate-600 uppercase mb-1">Action</p>
                <p className="text-sm text-slate-900">{log.action}</p>
              </div>
              {log.resource && (
                <div>
                  <p className="text-xs font-semibold text-slate-600 uppercase mb-1">Resource</p>
                  <p className="text-sm text-slate-900 break-all">{log.resource}</p>
                </div>
              )}
              {Object.keys(log.details || {}).length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-slate-600 uppercase mb-1">Details</p>
                  <pre className="text-xs bg-white border border-slate-200 rounded p-2 overflow-auto max-h-48 text-slate-700">
                    {JSON.stringify(log.details, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          )}
        </div>
      ))}

      {pagination.hasMore && (
        <div className="flex justify-center pt-4">
          <Button
            onClick={handleLoadMore}
            disabled={isLoadingMore}
            variant="outline"
            className="gap-2"
          >
            {isLoadingMore ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Loading...
              </>
            ) : (
              `Load More (${pagination.total - activity.length} remaining)`
            )}
          </Button>
        </div>
      )}
    </div>
  )
})

ActivityTab.displayName = 'ActivityTab'
