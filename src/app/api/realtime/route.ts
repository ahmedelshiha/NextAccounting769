import { NextRequest } from 'next/server'
import { globalEventEmitter } from '@/lib/event-emitter'

/**
 * Server-Sent Events (SSE) endpoint for real-time event streaming
 * Broadcasts events to connected clients
 *
 * Usage:
 * GET /api/realtime?events=availability-updated,booking-updated
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const eventsParam = searchParams.get('events') || 'all'
  const events = eventsParam === 'all' ? [] : eventsParam.split(',').map(e => e.trim())

  // Create response stream
  const stream = new ReadableStream({
    start(controller) {
      // Send initial connection message
      controller.enqueue(
        `data: ${JSON.stringify({ type: 'connected', timestamp: new Date().toISOString() })}\n\n`
      )

      // Set up event listeners
      const listeners: { [key: string]: (data: any) => void } = {}

      const subscribe = (eventName: string) => {
        if (!listeners[eventName]) {
          const listener = (data: any) => {
            try {
              controller.enqueue(
                `data: ${JSON.stringify({ type: eventName, data, timestamp: new Date().toISOString() })}\n\n`
              )
            } catch (error) {
              console.error('[realtime] Error sending event:', error)
            }
          }
          listeners[eventName] = listener
          globalEventEmitter.on(eventName, listener)
        }
      }

      // Subscribe to requested events
      if (events.length === 0) {
        // Subscribe to all events
        const allEventNames = globalEventEmitter.eventNames()
        allEventNames.forEach(subscribe)
      } else {
        // Subscribe to specific events
        events.forEach(subscribe)
      }

      // Heartbeat to keep connection alive
      const heartbeatInterval = setInterval(() => {
        try {
          controller.enqueue(
            `data: ${JSON.stringify({ type: 'heartbeat', timestamp: new Date().toISOString() })}\n\n`
          )
        } catch (error) {
          clearInterval(heartbeatInterval)
        }
      }, 30000) // 30 seconds

      // Cleanup on disconnect
      const cleanup = () => {
        clearInterval(heartbeatInterval)
        Object.entries(listeners).forEach(([eventName, listener]) => {
          globalEventEmitter.off(eventName)
        })
        try {
          controller.close()
        } catch (error) {
          // Already closed
        }
      }

      // Handle client disconnect
      request.signal.addEventListener('abort', cleanup)

      // Return cleanup function
      return () => cleanup()
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
      'Transfer-Encoding': 'chunked',
    },
  })
}
