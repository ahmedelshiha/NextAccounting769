'use client'

import useSWR, { mutate } from 'swr'
import { apiFetch } from '@/lib/api'
import type { NotificationListResponse, NotificationWithRelations } from '@/types/notifications'

interface UseNotificationsOptions {
  limit?: number
  offset?: number
  type?: string
  unreadOnly?: boolean
  autoRefresh?: boolean
}

/**
 * Hook for fetching and managing user notifications
 */
export function useNotifications(options: UseNotificationsOptions = {}) {
  const {
    limit = 20,
    offset = 0,
    type,
    unreadOnly = false,
    autoRefresh = true,
  } = options

  // Build query string
  const searchParams = new URLSearchParams()
  searchParams.append('limit', String(limit))
  searchParams.append('offset', String(offset))
  if (type) searchParams.append('type', type)
  if (unreadOnly) searchParams.append('unreadOnly', 'true')

  const url = `/api/notifications?${searchParams.toString()}`

  const { data, error, isLoading } = useSWR<NotificationListResponse>(
    url,
    apiFetch,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      dedupingInterval: 5000,
      focusThrottleInterval: 60000,
      refreshInterval: autoRefresh ? 30000 : 0, // Refresh every 30 seconds
    }
  )

  const markAsRead = async (notificationIds: string[]) => {
    try {
      const result = await apiFetch('/api/notifications', {
        method: 'POST',
        body: JSON.stringify({
          notificationIds,
          action: 'read',
        }),
      })

      // Refresh notifications
      await mutate(url)

      return result
    } catch (error) {
      console.error('Error marking notifications as read:', error)
      throw error
    }
  }

  const markAllAsRead = async () => {
    try {
      const result = await apiFetch('/api/notifications', {
        method: 'POST',
        body: JSON.stringify({
          action: 'read',
        }),
      })

      // Refresh notifications
      await mutate(url)

      return result
    } catch (error) {
      console.error('Error marking all notifications as read:', error)
      throw error
    }
  }

  const deleteNotification = async (notificationIds: string[]) => {
    try {
      const result = await apiFetch('/api/notifications', {
        method: 'POST',
        body: JSON.stringify({
          notificationIds,
          action: 'delete',
        }),
      })

      // Refresh notifications
      await mutate(url)

      return result
    } catch (error) {
      console.error('Error deleting notifications:', error)
      throw error
    }
  }

  return {
    notifications: data?.notifications || [],
    total: data?.total || 0,
    unreadCount: data?.unreadCount || 0,
    hasMore: data?.hasMore || false,
    isLoading,
    error,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    refresh: () => mutate(url),
  }
}

/**
 * Hook for managing notification preferences
 */
export function useNotificationPreferences() {
  const { data, error, isLoading, mutate: refresh } = useSWR(
    '/api/notifications/preferences',
    apiFetch,
    {
      revalidateOnFocus: false,
    }
  )

  const updatePreferences = async (preferences: any) => {
    try {
      const result = await apiFetch('/api/notifications/preferences', {
        method: 'PUT',
        body: JSON.stringify(preferences),
      })

      // Refresh preferences
      await refresh()

      return result
    } catch (error) {
      console.error('Error updating notification preferences:', error)
      throw error
    }
  }

  return {
    preferences: data?.data,
    isLoading,
    error,
    updatePreferences,
    refresh,
  }
}

/**
 * Hook for sending notifications (admin only)
 */
export function useSendNotification() {
  const send = async (userIds: string[], notification: any) => {
    try {
      const result = await apiFetch('/api/admin/notifications', {
        method: 'POST',
        body: JSON.stringify({
          userIds,
          ...notification,
        }),
      })

      return result
    } catch (error) {
      console.error('Error sending notification:', error)
      throw error
    }
  }

  return { send }
}
