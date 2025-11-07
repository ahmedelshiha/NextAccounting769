import { NextRequest } from 'next/server'
import { withTenantContext } from '@/lib/api-wrapper'
import { requireTenantContext } from '@/lib/tenant-utils'
import { realtimeService } from '@/lib/realtime-enhanced'
import { withTenant } from '@/lib/tenant'

export const runtime = 'nodejs'

export const GET = withTenantContext(async (request: NextRequest) => {
  const ctx = requireTenantContext()

  const { searchParams } = new URL(request.url)
  const eventTypes = (searchParams.get('events')?.split(',') ?? ['all']).filter(Boolean)
  const userId = String(ctx.userId ?? 'anon')
  const tenantId = ctx.tenantId

  // Best-effort health log for observability - non-blocking
  if (tenantId) {
    try {
      const { default: prisma } = await import('@/lib/prisma')
      // Fire and forget - don't await to avoid blocking stream response
      prisma.healthLog
        .create({
          data: withTenant(
            { service: 'portal:realtime', status: 'CONNECTED', message: `user:${userId} events:${eventTypes.join(',')}` },
            tenantId
          ),
        })
        .catch(() => null)
    } catch {}
  }

  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      const enc = new TextEncoder()
      controller.enqueue(
        enc.encode(`data: ${JSON.stringify({ type: 'connected', timestamp: new Date().toISOString() })}\n\n`)
      )
      const connectionId = realtimeService.subscribe(controller as any, userId, eventTypes)
      const pingId = setInterval(() => {
        try {
          controller.enqueue(enc.encode(`: ping ${Date.now()}\n\n`))
        } catch {}
      }, 25000)
      const onAbort = async () => {
        try {
          clearInterval(pingId)
        } catch {}
        realtimeService.cleanup(connectionId)
        try {
          controller.close()
        } catch {}
        // Log disconnect - non-blocking
        if (tenantId) {
          try {
            const { default: prisma } = await import('@/lib/prisma')
            prisma.healthLog
              .create({ data: withTenant({ service: 'portal:realtime', status: 'DISCONNECTED', message: `user:${userId}` }, tenantId) })
              .catch(() => null)
          } catch {}
        }
      }
      request.signal.addEventListener('abort', onAbort)
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
    },
  })
})

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: { Allow: 'GET,OPTIONS' } })
}
