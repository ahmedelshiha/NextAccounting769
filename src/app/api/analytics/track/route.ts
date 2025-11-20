import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { applyRateLimit, getClientIp } from '@/lib/rate-limit'
import { logAudit } from '@/lib/audit'
import { withTenantContext } from '@/lib/api-wrapper'

const eventSchema = z.object({
  event: z.string().min(1).max(64),
  properties: z.record(z.string(), z.any()).default({}),
  timestamp: z.number().int().optional(),
})

export const POST = withTenantContext(async (req: NextRequest) => {
  // Public endpoint; protect via strict rate limiting per IP
  const ip = getClientIp(req as unknown as Request)
  const key = `analytics:track:${ip}`
  const trackLimit = await applyRateLimit(key, 100, 60_000)
  if (!trackLimit.allowed) {
    try { await logAudit({ action: 'security.ratelimit.block', details: { ip, key, route: new URL(req.url).pathname } }) } catch {}
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
  }

  try {
    const body = await req.json()
    const { event, properties, timestamp } = eventSchema.parse(body)

    // Lightweight payload guard (approximate 8KB)
    const size = Buffer.byteLength(JSON.stringify({ event, properties, timestamp }))
    if (size > 8 * 1024) {
      return NextResponse.json({ error: 'Payload too large' }, { status: 413 })
    }

    // Best-effort audit log; DB optional
    await logAudit({
      action: 'analytics:event',
      details: { event, properties, timestamp: timestamp ?? Date.now(), ip },
    })

    return NextResponse.json({ ok: true })
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid analytics payload' }, { status: 400 })
    }
    return NextResponse.json({ error: 'Failed to track event' }, { status: 500 })
  }
}, { requireAuth: false })
