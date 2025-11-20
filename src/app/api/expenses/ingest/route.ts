import { z } from 'zod'
import { NextResponse } from 'next/server'
import { withTenantContext } from '@/lib/api-wrapper'

export const runtime = 'nodejs'

const Fields = z.object({
  merchant: z.string().min(1).max(120),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  total: z.number().min(0).max(1_000_000),
  tax: z.number().min(0).max(1_000_000).default(0),
  currency: z.string().min(1).max(10).default('USD'),
  category: z.string().min(1).max(60).default('general'),
  notes: z.string().max(500).default('')
})

const Payload = z.object({
  fileName: z.string().min(1).max(200),
  contentType: z.string().min(1).max(100),
  size: z.number().min(1).max(8 * 1024 * 1024),
  fields: Fields
})

export const POST = withTenantContext(async (req: Request) => {
  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }
  const parsed = Payload.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid input', details: parsed.error.flatten() }, { status: 400 })
  }

  const { fields, fileName, contentType, size } = parsed.data
  const id = crypto.randomUUID?.() || Math.random().toString(36).slice(2)

  // In a real implementation, we would persist to DB and link to uploaded file/attachment.
  // For now, return a deterministic response useful for UI and tests.
  return NextResponse.json({
    success: true,
    data: {
      id,
      fields,
      file: { name: fileName, contentType, size }
    }
  })
}, { requireAuth: false })

export const GET = withTenantContext(async () => {
  return NextResponse.json({ schema: 'POST { fileName:string, contentType:string, size:number<=8MB, fields:{ merchant,date, total, tax, currency, category, notes? } } -> { success, data:{ id, fields, file } }' })
}, { requireAuth: false })
