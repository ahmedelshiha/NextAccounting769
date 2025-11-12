'use client'

import { useEffect, useRef, useCallback, useState } from 'react'

export type EntityType = 'user' | 'client' | 'team-member' | 'role'

interface ModalRealtimeOptions {
  entityId: string | number
  entityType: EntityType
  onEntityDeleted?: () => void
  onEntityUpdated?: (data: any) => void
}

/**
 * Hook for entity-specific real-time updates in modals
 * 
 * Features:
 * - Detects when entity is deleted by another user
 * - Auto-closes modal on deletion
 * - Notifies when entity data is updated by another user
 * - Shows "stale data" warning if user edits deleted entity
 */
export function useModalRealtime({
  entityId,
  entityType,
  onEntityDeleted,
  onEntityUpdated
}: ModalRealtimeOptions) {
  const [isStale, setIsStale] = useState(false)
  const [isDeleted, setIsDeleted] = useState(false)
  const [updatedData, setUpdatedData] = useState<any>(null)
  const eventSourceRef = useRef<EventSource | null>(null)

  const handleRealtimeEvent = useCallback((event: MessageEvent) => {
    try {
      const message = JSON.parse(event.data)

      // Check if this event affects our entity
      const affectsOurEntity = 
        (message.data?.userId === entityId && ['user-updated', 'user-deleted'].includes(message.type)) ||
        (message.data?.id === entityId && ['user-updated', 'user-deleted'].includes(message.type))

      if (!affectsOurEntity) return

      // Handle deletion
      if (message.type === 'user-deleted') {
        setIsDeleted(true)
        setIsStale(true)
        onEntityDeleted?.()
        return
      }

      // Handle update
      if (message.type === 'user-updated') {
        setUpdatedData(message.data)
        onEntityUpdated?.(message.data)
      }
    } catch (err) {
      console.error('Failed to parse modal realtime event:', err)
    }
  }, [entityId, onEntityDeleted, onEntityUpdated])

  useEffect(() => {
    try {
      const eventSource = new EventSource(
        `/api/admin/realtime?events=user-updated,user-deleted,role-updated,permission-changed`
      )

      eventSourceRef.current = eventSource
      eventSource.addEventListener('message', handleRealtimeEvent)

      return () => {
        eventSource.removeEventListener('message', handleRealtimeEvent)
        eventSource.close()
      }
    } catch (err) {
      console.error('Failed to connect to modal realtime service:', err)
    }
  }, [handleRealtimeEvent])

  return {
    isStale,
    isDeleted,
    updatedData,
    setIsStale
  }
}
