import { NextRequest, NextResponse } from 'next/server'
import { withTenantContext } from '@/lib/api-wrapper'
import { requireTenantContext } from '@/lib/tenant-utils'
import prisma from '@/lib/prisma'
import { respond } from '@/lib/api-response'
import { hasPermission, PERMISSIONS } from '@/lib/permissions'
import { applyRateLimit, getClientIp } from '@/lib/rate-limit'

export const runtime = 'nodejs'
export const revalidate = 0

/**
 * POST /api/admin/users/presets/:id/use
 * Increment preset usage count when preset is applied
 */
export const POST = withTenantContext(async (request: NextRequest, props: { params: Promise<{ id: string }> }) => {
  const ctx = requireTenantContext()
  const tenantId = ctx.tenantId
  const userId = ctx.userId
  const { id } = await props.params

  if (!tenantId || !userId) {
    return respond.badRequest('Tenant and user context required')
  }

  try {
    const ip = getClientIp(request as unknown as Request)
    const rl = await applyRateLimit(`admin-user-presets-use:${userId}`, 500, 60_000)
    if (rl && rl.allowed === false) {
      return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 })
    }

    if (!hasPermission(ctx.role ?? '', PERMISSIONS.USERS_MANAGE)) {
      return respond.forbidden('Insufficient permissions')
    }

    // Verify preset exists and belongs to user
    const preset = await prisma.filterPreset.findFirst({
      where: {
        id,
        tenantId,
        userId
      }
    })

    if (!preset) {
      return respond.notFound('Preset not found')
    }

    // Update usage count and last used timestamp
    const updated = await prisma.filterPreset.update({
      where: { id },
      data: {
        usageCount: { increment: 1 },
        lastUsedAt: new Date()
      },
      select: {
        id: true,
        usageCount: true,
        lastUsedAt: true
      }
    })

    return respond.ok(updated)
  } catch (error) {
    console.error('[Presets Use] Error:', error)
    return respond.serverError('Failed to update preset usage')
  }
})
