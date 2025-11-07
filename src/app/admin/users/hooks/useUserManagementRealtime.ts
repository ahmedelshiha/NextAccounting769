'use client'

import { useEffect, useRef, useCallback } from 'react'

export interface RealtimeOptions {
  debounceMs?: number
  autoRefresh?: boolean
  refreshUsers?: () => Promise<void>
}

/**
 * Hook for subscribing to user management real-time events
 * Automatically refreshes user list when changes occur
 *
 * Supports:
 * - User CRUD operations (create, update, delete)
 * - Role changes
 * - Permission updates
 * - Settings changes
 *
 * Note: refreshUsers callback must be provided as a parameter
 * to avoid circular dependency with UserDataContextProvider
 */
export function useUserManagementRealtime(options: RealtimeOptions = {}) {
  const { debounceMs = 500, autoRefresh = true, refreshUsers } = options
  
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null)
  const eventSourceRef = useRef<EventSource | null>(null)
  const isConnectedRef = useRef(false)

  const handleRealtimeEvent = useCallback((event: MessageEvent) => {
    try {
      const message = JSON.parse(event.data)

      // Filter for user management events
      const userManagementEventTypes = [
        'user-created',
        'user-updated',
        'user-deleted',
        'role-updated',
        'permission-changed',
        'user-management-settings-updated'
      ]

      if (userManagementEventTypes.includes(message.type) && autoRefresh && refreshUsers) {
        // Debounce rapid successive refreshes
        if (debounceTimerRef.current) {
          clearTimeout(debounceTimerRef.current)
        }

        debounceTimerRef.current = setTimeout(() => {
          refreshUsers().catch(err => {
            console.error('Failed to refresh users after real-time event:', err)
          })
        }, debounceMs)
      }
    } catch (err) {
      console.error('Failed to parse realtime event:', err)
    }
  }, [debounceMs, autoRefresh, refreshUsers])

  const handleConnectionChange = useCallback((isConnected: boolean) => {
    isConnectedRef.current = isConnected
  }, [])

  useEffect(() => {
    if (!autoRefresh) return

    try {
      // Connect to admin realtime endpoint
      const eventSource = new EventSource(
        '/api/admin/realtime?events=user-created,user-updated,user-deleted,role-updated,permission-changed,user-management-settings-updated'
      )

      eventSourceRef.current = eventSource

      eventSource.addEventListener('message', handleRealtimeEvent)
      
      eventSource.addEventListener('open', () => {
        handleConnectionChange(true)
      })

      eventSource.addEventListener('error', () => {
        handleConnectionChange(false)
        // EventSource will auto-reconnect after 1s
      })

      return () => {
        eventSource.removeEventListener('message', handleRealtimeEvent)
        eventSource.close()
        if (debounceTimerRef.current) {
          clearTimeout(debounceTimerRef.current)
        }
      }
    } catch (err) {
      console.error('Failed to connect to realtime service:', err)
    }
  }, [autoRefresh, handleRealtimeEvent, handleConnectionChange])

  return {
    isConnected: isConnectedRef.current,
    eventSource: eventSourceRef.current
  }
}
