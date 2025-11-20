'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import type { AvailabilityUpdatedPayload } from '@/lib/realtime-events'

export interface AvailabilitySlot {
  id: string
  serviceId: string
  teamMemberId?: string | null
  date: Date | string
  startTime: string
  endTime: string
  available: boolean
  reason?: string | null
  maxBookings?: number
}

interface AvailabilityRealtimeOptions {
  serviceId?: string
  teamMemberId?: string
  autoConnect?: boolean
  onSlotUpdated?: (slot: AvailabilitySlot) => void
  onSlotCreated?: (slot: AvailabilitySlot) => void
  onSlotDeleted?: (slotId: string) => void
  onError?: (error: Error) => void
}

/**
 * Hook for subscribing to real-time availability updates
 * Uses WebSocket or EventSource to sync availability slot changes
 * across admin and portal users
 * 
 * @example
 * ```tsx
 * const { connected, subscribe, unsubscribe } = useAvailabilityRealtime({
 *   serviceId: 'service-1',
 *   onSlotUpdated: (slot) => console.log('Slot updated:', slot),
 * })
 * 
 * useEffect(() => {
 *   subscribe(['created', 'updated', 'deleted'])
 * }, [])
 * ```
 */
export function useAvailabilityRealtime(options: AvailabilityRealtimeOptions = {}) {
  const [connected, setConnected] = useState(false)
  const [isConnecting, setIsConnecting] = useState(false)
  const wsRef = useRef<WebSocket | EventSource | null>(null)
  const subscriptionsRef = useRef<Set<string>>(new Set())

  const handleAvailabilityUpdate = useCallback((data: AvailabilityUpdatedPayload) => {
    if (options.serviceId && data.serviceId !== options.serviceId) {
      return // Not relevant to this subscription
    }

    if (options.teamMemberId && data.teamMemberId !== options.teamMemberId) {
      return // Not relevant to this subscription
    }

    // Handle different action types
    switch (data.action) {
      case 'created': {
        // Fetch the slot details and notify
        if (data.serviceId) {
          fetchAndNotifySlot(String(data.serviceId), 'created')
        }
        break
      }
      case 'updated': {
        if (data.serviceId) {
          fetchAndNotifySlot(String(data.serviceId), 'updated')
        }
        break
      }
      case 'deleted': {
        // Notify of deletion
        if (options.onSlotDeleted) {
          options.onSlotDeleted(String(data.serviceId))
        }
        break
      }
    }
  }, [options])

  const fetchAndNotifySlot = useCallback(async (serviceId: string, action: 'created' | 'updated') => {
    try {
      const params = new URLSearchParams()
      params.append('serviceId', serviceId)
      if (options.teamMemberId) {
        params.append('teamMemberId', options.teamMemberId)
      }

      const response = await fetch(`/api/admin/availability-slots?${params.toString()}`)
      if (!response.ok) throw new Error('Failed to fetch availability slots')

      const data = await response.json()
      const slots = Array.isArray(data.availabilitySlots) ? data.availabilitySlots : []

      // Notify of most recent slot
      if (slots.length > 0) {
        const slot = slots[slots.length - 1]
        if (action === 'created' && options.onSlotCreated) {
          options.onSlotCreated(slot)
        } else if (action === 'updated' && options.onSlotUpdated) {
          options.onSlotUpdated(slot)
        }
      }
    } catch (error) {
      if (options.onError) {
        options.onError(error instanceof Error ? error : new Error('Unknown error'))
      }
    }
  }, [options])

  const connect = useCallback(() => {
    if (isConnecting || connected) return

    setIsConnecting(true)

    // Try WebSocket first, then fallback to EventSource (SSE)
    const connectWebSocket = () => {
      try {
        const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws'
        const wsUrl = `${protocol}://${window.location.host}/api/realtime?events=availability-updated`
        const ws = new WebSocket(wsUrl)

        ws.onopen = () => {
          console.log('[availability realtime] WebSocket connected')
          setConnected(true)
          setIsConnecting(false)
          wsRef.current = ws
        }

        ws.onmessage = (event) => {
          try {
            const message = JSON.parse(event.data)
            if (message.type === 'availability-updated') {
              handleAvailabilityUpdate(message.data as AvailabilityUpdatedPayload)
            }
          } catch (error) {
            console.error('[availability realtime] Error parsing message:', error)
          }
        }

        ws.onerror = () => {
          console.log('[availability realtime] WebSocket error, falling back to SSE')
          connectEventSource()
        }

        ws.onclose = () => {
          console.log('[availability realtime] WebSocket closed')
          setConnected(false)
        }
      } catch (error) {
        console.error('[availability realtime] WebSocket error:', error)
        connectEventSource()
      }
    }

    const connectEventSource = () => {
      try {
        const esUrl = `/api/realtime?events=availability-updated`
        const es = new EventSource(esUrl)

        es.addEventListener('availability-updated', (event) => {
          try {
            const data = JSON.parse(event.data) as AvailabilityUpdatedPayload
            handleAvailabilityUpdate(data)
          } catch (error) {
            console.error('[availability realtime] Error parsing SSE message:', error)
          }
        })

        es.onerror = () => {
          console.error('[availability realtime] EventSource error')
          es.close()
          setConnected(false)
          setIsConnecting(false)
        }

        es.onopen = () => {
          console.log('[availability realtime] EventSource connected')
          setConnected(true)
          setIsConnecting(false)
          wsRef.current = es
        }
      } catch (error) {
        console.error('[availability realtime] EventSource error:', error)
        setIsConnecting(false)
        if (options.onError) {
          options.onError(error instanceof Error ? error : new Error('Connection failed'))
        }
      }
    }

    connectWebSocket()
  }, [connected, isConnecting, handleAvailabilityUpdate, options])

  const disconnect = useCallback(() => {
    if (wsRef.current) {
      if (wsRef.current instanceof WebSocket) {
        wsRef.current.close()
      } else if (wsRef.current instanceof EventSource) {
        wsRef.current.close()
      }
      wsRef.current = null
    }
    setConnected(false)
  }, [])

  const subscribe = useCallback((actions: Array<'created' | 'updated' | 'deleted'> = ['created', 'updated', 'deleted']) => {
    actions.forEach(action => subscriptionsRef.current.add(action))
    if (!connected && !isConnecting) {
      connect()
    }
  }, [connected, isConnecting, connect])

  const unsubscribe = useCallback((actions: Array<'created' | 'updated' | 'deleted'> = []) => {
    if (actions.length === 0) {
      subscriptionsRef.current.clear()
      disconnect()
    } else {
      actions.forEach(action => subscriptionsRef.current.delete(action))
    }
  }, [disconnect])

  // Auto-connect if specified
  useEffect(() => {
    if (options.autoConnect !== false) {
      subscribe()
    }

    return () => {
      disconnect()
    }
  }, [options.autoConnect, subscribe, disconnect])

  return {
    connected,
    isConnecting,
    subscribe,
    unsubscribe,
    disconnect,
    connect,
  }
}

/**
 * Hook for fetching availability slots for a service
 * Optionally subscribes to real-time updates
 * 
 * @example
 * ```tsx
 * const { slots, loading, refetch } = useAvailabilitySlots('service-1', {
 *   teamMemberId: 'tm-1',
 *   subscribeToUpdates: true,
 * })
 * ```
 */
export function useAvailabilitySlots(
  serviceId?: string,
  options?: {
    teamMemberId?: string
    subscribeToUpdates?: boolean
    onError?: (error: Error) => void
  }
) {
  const [slots, setSlots] = useState<AvailabilitySlot[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const { connected, subscribe } = useAvailabilityRealtime({
    serviceId,
    teamMemberId: options?.teamMemberId,
    autoConnect: options?.subscribeToUpdates || false,
    onSlotCreated: (slot) => {
      setSlots(prev => [...prev, slot])
    },
    onSlotUpdated: (slot) => {
      setSlots(prev => prev.map(s => s.id === slot.id ? slot : s))
    },
    onSlotDeleted: (slotId) => {
      setSlots(prev => prev.filter(s => s.id !== slotId))
    },
    onError: (err) => {
      setError(err)
      if (options?.onError) {
        options.onError(err)
      }
    },
  })

  const refetch = useCallback(async () => {
    if (!serviceId) return

    setLoading(true)
    try {
      const params = new URLSearchParams()
      params.append('serviceId', serviceId)
      if (options?.teamMemberId) {
        params.append('teamMemberId', options.teamMemberId)
      }

      const response = await fetch(`/api/admin/availability-slots?${params.toString()}`)
      if (!response.ok) throw new Error('Failed to fetch availability slots')

      const data = await response.json()
      setSlots(Array.isArray(data.availabilitySlots) ? data.availabilitySlots : [])
      setError(null)
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error')
      setError(error)
      if (options?.onError) {
        options.onError(error)
      }
    } finally {
      setLoading(false)
    }
  }, [serviceId, options])

  // Initial fetch
  useEffect(() => {
    refetch()
  }, [refetch])

  // Subscribe to updates if requested
  useEffect(() => {
    if (options?.subscribeToUpdates) {
      subscribe(['created', 'updated', 'deleted'])
    }
  }, [options?.subscribeToUpdates, subscribe])

  return {
    slots,
    loading,
    error,
    refetch,
    connected,
  }
}
