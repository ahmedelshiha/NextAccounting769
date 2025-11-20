import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { subscribeToTaskEvents, TaskEventPayload } from '@/lib/realtime/task-events'

/**
 * GET /api/realtime/tasks
 *
 * WebSocket/SSE endpoint for real-time task updates
 *
 * Supports two connection types:
 * 1. WebSocket: ws://host/api/realtime/tasks?taskId=123
 * 2. SSE (Server-Sent Events): GET /api/realtime/tasks?taskId=123
 *
 * Query Parameters:
 * - taskId (optional): Subscribe to specific task events only
 *
 * Events sent:
 * - TASK_CREATED: New task created
 * - TASK_UPDATED: Task details updated
 * - TASK_ASSIGNED: Task assigned to user
 * - TASK_STATUS_CHANGED: Task status changed
 * - COMMENT_ADDED: Comment added to task
 */
export async function GET(request: NextRequest) {
  const session = await getServerSession()

  // Require authentication
  if (!session || !session.user) {
    return new NextResponse('Unauthorized', { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const taskId = searchParams.get('taskId') || 'all'

  // Check if client prefers WebSocket (would be handled by a WebSocket handler)
  // For now, implement SSE (Server-Sent Events)
  return handleSSE(taskId, session.user.id)
}

/**
 * Handle SSE (Server-Sent Events) connections
 */
function handleSSE(taskId: string, userId: string): Response {
  // Create a readable stream for SSE
  const encoder = new TextEncoder()

  // Track if connection is closed
  let closed = false

  // Create the response with SSE headers
  const customReadable = new ReadableStream({
    start(controller) {
      // Send initial connection message
      const welcomeMsg = encoder.encode(
        `data: ${JSON.stringify({ type: 'CONNECTED', message: 'Connected to task events' })}\n\n`
      )
      controller.enqueue(welcomeMsg)

      // Subscribe to task events
      const unsubscribe = subscribeToTaskEvents(taskId, (event: TaskEventPayload) => {
        if (closed) return

        // Filter events based on user permissions
        // In production, check if user has access to this task/tenant
        const eventMsg = encoder.encode(`data: ${JSON.stringify(event)}\n\n`)

        try {
          controller.enqueue(eventMsg)
        } catch (err) {
          console.error('Error sending SSE message:', err)
          closed = true
          unsubscribe()
          try {
            controller.close()
          } catch {}
        }
      })

      // Handle client disconnect
      // Note: The actual close detection is handled by the browser
      // This is a workaround to eventually clean up resources
      const checkInterval = setInterval(() => {
        if (closed) {
          clearInterval(checkInterval)
          unsubscribe()
        }
      }, 30000) // Check every 30 seconds

      // Attempt cleanup on error or close
      const cleanup = () => {
        closed = true
        clearInterval(checkInterval)
        unsubscribe()
      }

      // Return cleanup function (will be called when stream closes)
      return cleanup
    },

    cancel() {
      closed = true
    },
  })

  // Return SSE response
  return new Response(customReadable, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  })
}

export const runtime = 'nodejs'
