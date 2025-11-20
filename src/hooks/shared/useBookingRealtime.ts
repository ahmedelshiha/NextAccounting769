'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import type { BookingEventPayload } from '@/lib/realtime-events'

export interface BookingUpdate {
  id: string
  serviceId?: string
  clientId?: string
  status: string
  scheduledAt?: string | Date
  teamMemberId?: string | null
  action?: 'created' | 'updated' | 'deleted'
}

interface BookingRealtimeOptions {
  bookingId?: string
  clientId?: string
  serviceId?: string
  autoConnect?: boolean
  onBookingCreated?: (booking: BookingUpdate) => void
  onBookingUpdated?: (booking: BookingUpdate) => void
  onBookingDeleted?: (bookingId: string) => void
  onError?: (error: Error) => void
}

/**
 * Hook for subscribing to real-time booking updates
 * Syncs booking changes between admin and portal in real-time
 *
 * @example
 * ```tsx
 * const { connected } = useBookingRealtime({
 *   clientId: 'client-1',
 *   onBookingUpdated: (booking) => console.log('Booking updated:', booking),
 * })
 * ```
 */
export function useBookingRealtime(options: BookingRealtimeOptions = {}) {
  const [connected, setConnected] = useState(false)
  const [isConnecting, setIsConnecting] = useState(false)
  const wsRef = useRef<WebSocket | EventSource | null>(null)
  const subscriptionsRef = useRef<Set<string>>(new Set())

  const handleBookingEvent = useCallback((data: BookingEventPayload) => {
    // Filter by subscription criteria
    if (options.bookingId && data.id !== options.bookingId) {
      return
    }

    if (options.clientId && data.clientId && data.clientId !== options.clientId) {
      return
    }

    if (options.serviceId && data.serviceId && data.serviceId !== options.serviceId) {
      return
    }

    // Handle different action types
    switch (data.action) {
      case 'created': {
        if (options.onBookingCreated) {
          options.onBookingCreated({
            id: String(data.id),
            serviceId: data.serviceId ? String(data.serviceId) : undefined,
            status: 'PENDING',
            action: 'created',
          })
        }
        break
      }
      case 'updated': {
        if (options.onBookingUpdated) {
          options.onBookingUpdated({
            id: String(data.id),
            serviceId: data.serviceId ? String(data.serviceId) : undefined,
            status: 'PENDING',
            action: 'updated',
          })
        }
        break
      }
      case 'deleted': {
        if (options.onBookingDeleted) {
          options.onBookingDeleted(String(data.id))
        }
        break
      }
    }
  }, [options])

  const connect = useCallback(() => {
    if (isConnecting || connected) return

    setIsConnecting(true)

    const connectWebSocket = () => {
      try {
        const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws'
        const wsUrl = `${protocol}://${window.location.host}/api/realtime?events=booking-created,booking-updated,booking-deleted`
        const ws = new WebSocket(wsUrl)

        ws.onopen = () => {
          console.log('[booking realtime] WebSocket connected')
          setConnected(true)
          setIsConnecting(false)
          wsRef.current = ws
        }

        ws.onmessage = (event) => {
          try {
            const message = JSON.parse(event.data)
            if (
              message.type === 'booking-created' ||
              message.type === 'booking-updated' ||
              message.type === 'booking-deleted'
            ) {
              handleBookingEvent(message.data as BookingEventPayload)
            }
          } catch (error) {
            console.error('[booking realtime] Error parsing message:', error)
          }
        }

        ws.onerror = () => {
          console.log('[booking realtime] WebSocket error, falling back to SSE')
          connectEventSource()
        }

        ws.onclose = () => {
          console.log('[booking realtime] WebSocket closed')
          setConnected(false)
        }
      } catch (error) {
        console.error('[booking realtime] WebSocket error:', error)
        connectEventSource()
      }
    }

    const connectEventSource = () => {
      try {
        const esUrl = `/api/realtime?events=booking-created,booking-updated,booking-deleted`
        const es = new EventSource(esUrl)

        es.addEventListener('booking-created', (event) => {
          try {
            const data = JSON.parse(event.data) as BookingEventPayload
            handleBookingEvent({ ...data, action: 'created' })
          } catch (error) {
            console.error('[booking realtime] Error parsing SSE message:', error)
          }
        })

        es.addEventListener('booking-updated', (event) => {
          try {
            const data = JSON.parse(event.data) as BookingEventPayload
            handleBookingEvent({ ...data, action: 'updated' })
          } catch (error) {
            console.error('[booking realtime] Error parsing SSE message:', error)
          }
        })

        es.addEventListener('booking-deleted', (event) => {
          try {
            const data = JSON.parse(event.data) as BookingEventPayload
            handleBookingEvent({ ...data, action: 'deleted' })
          } catch (error) {
            console.error('[booking realtime] Error parsing SSE message:', error)
          }
        })

        es.onerror = () => {
          console.error('[booking realtime] EventSource error')
          es.close()
          setConnected(false)
          setIsConnecting(false)
        }

        es.onopen = () => {
          console.log('[booking realtime] EventSource connected')
          setConnected(true)
          setIsConnecting(false)
          wsRef.current = es
        }
      } catch (error) {
        console.error('[booking realtime] EventSource error:', error)
        setIsConnecting(false)
        if (options.onError) {
          options.onError(error instanceof Error ? error : new Error('Connection failed'))
        }
      }
    }

    connectWebSocket()
  }, [connected, isConnecting, handleBookingEvent, options])

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

  const subscribe = useCallback(
    (actions: Array<'created' | 'updated' | 'deleted'> = ['created', 'updated', 'deleted']) => {
      actions.forEach(action => subscriptionsRef.current.add(action))
      if (!connected && !isConnecting) {
        connect()
      }
    },
    [connected, isConnecting, connect]
  )

  const unsubscribe = useCallback(
    (actions: Array<'created' | 'updated' | 'deleted'> = []) => {
      if (actions.length === 0) {
        subscriptionsRef.current.clear()
        disconnect()
      } else {
        actions.forEach(action => subscriptionsRef.current.delete(action))
      }
    },
    [disconnect]
  )

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
 * Hook for fetching bookings with real-time sync
 *
 * @example
 * ```tsx
 * const { bookings, loading, refetch } = useBookingsWithRealtime('client-1', {
 *   subscribeToUpdates: true,
 * })
 * ```
 */
export function useBookingsWithRealtime(
  clientId?: string,
  options?: {
    serviceId?: string
    subscribeToUpdates?: boolean
    onError?: (error: Error) => void
  }
) {
  const [bookings, setBookings] = useState<BookingUpdate[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const { connected, subscribe } = useBookingRealtime({
    clientId,
    serviceId: options?.serviceId,
    autoConnect: options?.subscribeToUpdates || false,
    onBookingCreated: (booking) => {
      setBookings(prev => [...prev, booking])
    },
    onBookingUpdated: (booking) => {
      setBookings(prev => prev.map(b => (b.id === booking.id ? booking : b)))
    },
    onBookingDeleted: (bookingId) => {
      setBookings(prev => prev.filter(b => b.id !== bookingId))
    },
    onError: (err) => {
      setError(err)
      if (options?.onError) {
        options.onError(err)
      }
    },
  })

  const refetch = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (clientId) {
        params.append('clientId', clientId)
      }
      if (options?.serviceId) {
        params.append('serviceId', options.serviceId)
      }

      const response = await fetch(`/api/bookings?${params.toString()}`)
      if (!response.ok) throw new Error('Failed to fetch bookings')

      const data = await response.json()
      const bookingsList = Array.isArray(data.data) ? data.data : []
      setBookings(
        bookingsList.map((b: any) => ({
          id: b.id,
          serviceId: b.serviceId,
          clientId: b.clientId,
          status: b.status,
          scheduledAt: b.scheduledAt,
          teamMemberId: b.teamMemberId,
        }))
      )
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
  }, [clientId, options])

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
    bookings,
    loading,
    error,
    refetch,
    connected,
  }
}
