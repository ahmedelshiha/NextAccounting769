'use client'

import React, { memo, useEffect, useCallback } from 'react'
import { Loader2 } from 'lucide-react'
import { useUsersContext } from '../../contexts/UsersContextProvider'
import { apiFetch } from '@/lib/api'

interface ActivityTabProps {
  userId: string
}

const formatActivityDate = (iso?: string) => {
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

export const ActivityTab = memo(function ActivityTab({ userId }: ActivityTabProps) {
  const { activity, setActivity, activityLoading, setActivityLoading, activityError, setActivityError } =
    useUsersContext()

  const loadActivity = useCallback(async () => {
    if (activity.length > 0) return // Already loaded

    setActivityLoading(true)
    setActivityError(null)

    try {
      let res = await apiFetch(`/api/admin/activity?userId=${encodeURIComponent(userId)}&limit=20`)
      if (!res.ok) {
        res = await apiFetch('/api/admin/activity?type=AUDIT&limit=20')
      }
      if (!res.ok) throw new Error(`Failed to load activity (${res.status})`)

      const list = await res.json()
      setActivity(Array.isArray(list) ? list : [])
    } catch (err) {
      console.error('Failed to load activity:', err)
      setActivity([])
      setActivityError('Unable to load activity')
    } finally {
      setActivityLoading(false)
    }
  }, [userId, activity.length, setActivity, setActivityLoading, setActivityError])

  // Load activity on mount
  useEffect(() => {
    loadActivity().catch(console.error)
  }, [loadActivity])

  if (activityLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
        <span className="ml-2 text-gray-500">Loading activity...</span>
      </div>
    )
  }

  if (activityError) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-md p-4 text-sm text-red-700">
        {activityError}
      </div>
    )
  }

  if (activity.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">No activity recorded yet.</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {activity.map((log, idx) => (
        <div key={log.id || idx} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900">
                {log.message || 'System activity'}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {formatActivityDate(log.checkedAt)}
              </p>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
})

ActivityTab.displayName = 'ActivityTab'
