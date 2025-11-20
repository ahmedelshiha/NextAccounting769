import { NextRequest, NextResponse } from 'next/server'
import { withTenantContext } from '@/lib/api-wrapper'
import { requireTenantContext } from '@/lib/tenant-utils'
import prisma from '@/lib/prisma'
import { respond } from '@/lib/api-response'
import { hasPermission, PERMISSIONS } from '@/lib/permissions'
import { applyRateLimit, getClientIp } from '@/lib/rate-limit'

export const runtime = 'nodejs'
export const revalidate = 0

const MAX_SHARES_PER_PRESET = 20
const VALID_PERMISSION_LEVELS = ['viewer', 'editor', 'admin']

/**
 * GET /api/admin/users/presets/:id/share
 * Get all shares for a preset
 */
export const GET = withTenantContext(async (request: NextRequest, props: { params: Promise<{ id: string }> }) => {
  const ctx = requireTenantContext()
  const tenantId = ctx.tenantId
  const userId = ctx.userId
  const { id } = await props.params

  if (!tenantId || !userId) {
    return respond.badRequest('Tenant and user context required')
  }

  try {
    const ip = getClientIp(request as unknown as Request)
    const rl = await applyRateLimit(`admin-preset-shares-list:${userId}`, 100, 60_000)
    if (rl && rl.allowed === false) {
      return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 })
    }

    if (!hasPermission(ctx.role ?? '', PERMISSIONS.USERS_MANAGE)) {
      return respond.forbidden('Insufficient permissions')
    }

    // Verify preset exists and user is owner
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

    // Get all shares for this preset
    const shares = await prisma.presetShare.findMany({
      where: { presetId: id },
      include: {
        sharedWithUser: {
          select: {
            id: true,
            email: true,
            name: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    return respond.ok({ shares, count: shares.length })
  } catch (error) {
    console.error('[PresetShare GET] Error:', error)
    return respond.serverError('Failed to fetch shares')
  }
})

/**
 * POST /api/admin/users/presets/:id/share
 * Create a new share for a preset
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
    const rl = await applyRateLimit(`admin-preset-shares-create:${userId}`, 50, 60_000)
    if (rl && rl.allowed === false) {
      return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 })
    }

    if (!hasPermission(ctx.role ?? '', PERMISSIONS.USERS_MANAGE)) {
      return respond.forbidden('Insufficient permissions')
    }

    // Verify preset exists and user is owner
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

    const body = await request.json()
    const { sharedWithUserId, permissionLevel, expiresAt } = body

    // Validate input
    if (!sharedWithUserId || typeof sharedWithUserId !== 'string') {
      return respond.badRequest('sharedWithUserId is required')
    }

    if (!permissionLevel || !VALID_PERMISSION_LEVELS.includes(permissionLevel)) {
      return respond.badRequest(`permissionLevel must be one of: ${VALID_PERMISSION_LEVELS.join(', ')}`)
    }

    // Verify shared user exists in same tenant
    const sharedUser = await prisma.user.findFirst({
      where: {
        id: sharedWithUserId,
        tenantId
      }
    })

    if (!sharedUser) {
      return respond.badRequest('User not found in this tenant')
    }

    // Prevent sharing with self
    if (sharedWithUserId === userId) {
      return respond.badRequest('Cannot share preset with yourself')
    }

    // Check share limit
    const shareCount = await prisma.presetShare.count({
      where: { presetId: id }
    })

    if (shareCount >= MAX_SHARES_PER_PRESET) {
      return respond.badRequest(`Maximum of ${MAX_SHARES_PER_PRESET} shares per preset`)
    }

    // Create share
    const share = await prisma.presetShare.create({
      data: {
        presetId: id,
        ownerId: userId,
        sharedWithUserId,
        permissionLevel,
        expiresAt: expiresAt ? new Date(expiresAt) : null
      },
      include: {
        sharedWithUser: {
          select: {
            id: true,
            email: true,
            name: true
          }
        }
      }
    })

    // Log the share event
    await prisma.presetShareLog.create({
      data: {
        presetId: id,
        userId,
        eventType: 'SHARED',
        eventDetails: {
          sharedWithUserId,
          permissionLevel
        },
        ipAddress: ip
      }
    })

    return respond.created(share)
  } catch (error) {
    console.error('[PresetShare POST] Error:', error)
    if ((error as any).code === 'P2002') {
      return respond.badRequest('Preset is already shared with this user')
    }
    return respond.serverError('Failed to create share')
  }
})
