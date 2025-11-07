import prisma from '@/lib/prisma'
import { z } from 'zod'
import { respond, zodDetails } from '@/lib/api-response'
import { logAuditSafe } from '@/lib/observability-helpers'
import { requireTenantContext } from '@/lib/tenant-utils'
import { withTenantContext } from '@/lib/api-wrapper'

export const runtime = 'nodejs'

// GET current user's sidebar preferences or sensible defaults
export const GET = withTenantContext(async () => {
  const ctx = requireTenantContext()
  if (!ctx.userId) return respond.unauthorized()
  const userId = ctx.userId

  try {
    // Try DB-backed preferences (model: SidebarPreferences)
    const prefs = await prisma.sidebarPreferences.findUnique({ where: { userId } }).catch(() => null)
    if (prefs) return respond.ok(prefs)
  } catch (e: any) {
    const code = String((e as any)?.code || '')
    const msg = String((e as any)?.message || '')
    if (!(code.startsWith('P') || /Database is not configured/i.test(msg))) throw e
  }

  // Defaults
  return respond.ok({
    userId,
    collapsed: false,
    width: 256,
    mobileOpen: false,
    expandedGroups: ['dashboard', 'business'],
  })
})

const UpdateSchema = z.object({
  collapsed: z.boolean().optional(),
  width: z.number().int().min(64).max(420).optional(),
  mobileOpen: z.boolean().optional(),
  expandedGroups: z.array(z.string()).optional(),
})

// PUT upserts sidebar preferences for the current user
export const PUT = withTenantContext(async (req: Request) => {
  const ctx = requireTenantContext()
  if (!ctx.userId) return respond.unauthorized()
  const userId = ctx.userId

  const body = await req.json().catch(() => null)
  const parsed = UpdateSchema.safeParse(body)
  if (!parsed.success) return respond.badRequest('Invalid payload', zodDetails(parsed.error))

  try {
    const data = parsed.data as any
    const upserted = await prisma.sidebarPreferences.upsert({
      where: { userId },
      create: { userId, ...data },
      update: { ...data },
    })

    try {
      await logAuditSafe({ action: 'preferences:update', actorId: userId, targetId: userId, details: { type: 'sidebar', fields: Object.keys(data) } })
    } catch {}

    return respond.ok(upserted)
  } catch (e: any) {
    const msg = String((e as any)?.message || '')
    if (/Database is not configured/i.test(msg) || String((e as any)?.code || '').startsWith('P')) {
      return respond.serverError('Database not configured')
    }
    return respond.serverError('Failed to update sidebar preferences', { message: msg })
  }
})

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: { Allow: 'GET,PUT,OPTIONS' } })
}
