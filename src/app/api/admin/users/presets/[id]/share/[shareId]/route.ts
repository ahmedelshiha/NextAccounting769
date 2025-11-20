import { NextRequest, NextResponse } from 'next/server'
import { withTenantContext } from '@/lib/api-wrapper'
import { requireTenantContext } from '@/lib/tenant-utils'
import prisma from '@/lib/prisma'
import { respond } from '@/lib/api-response'
import { hasPermission, PERMISSIONS } from '@/lib/permissions'
import { applyRateLimit, getClientIp } from '@/lib/rate-limit'

export const runtime = 'nodejs'
export const revalidate = 0

const VALID_PERMISSION_LEVELS = ['viewer', 'editor', 'admin']

/**
 * GET /api/admin/users/presets/:id/share/:shareId
 * Get a specific share
 */
export const GET = withTenantContext(async (request: NextRequest, props: { params: Promise<{ id: string; shareId: string }> }) => {
  const ctx = requireTenantContext()
  const tenantId = ctx.tenantId
  const userId = ctx.userId
  const { id, shareId } = await props.params

  if (!tenantId || !userId) {
    return respond.badRequest('Tenant and user context required')
  }

  try {
    const ip = getClientIp(request as unknown as Request)
    const rl = await applyRateLimit(`admin-preset-share-get:${userId}`, 200, 60_000)
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

    // Get share
    const share = await prisma.presetShare.findFirst({
      where: {
        id: shareId,
        presetId: id,
        ownerId: userId
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

    if (!share) {
      return respond.notFound('Share not found')
    }

    return respond.ok(share)
  } catch (error) {
    console.error('[PresetShare GET] Error:', error)
    return respond.serverError('Failed to fetch share')
  }
})

/**
 * PATCH /api/admin/users/presets/:id/share/:shareId
 * Update share permissions
 */
export const PATCH = withTenantContext(async (request: NextRequest, props: { params: Promise<{ id: string; shareId: string }> }) => {
  const ctx = requireTenantContext()
  const tenantId = ctx.tenantId
  const userId = ctx.userId
  const { id, shareId } = await props.params

  if (!tenantId || !userId) {
    return respond.badRequest('Tenant and user context required')
  }

  try {
    const ip = getClientIp(request as unknown as Request)
    const rl = await applyRateLimit(`admin-preset-share-update:${userId}`, 100, 60_000)
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

    // Verify share exists and user is owner
    const share = await prisma.presetShare.findFirst({
      where: {
        id: shareId,
        presetId: id,
        ownerId: userId
      }
    })

    if (!share) {
      return respond.notFound('Share not found')
    }

    const body = await request.json()
    const { permissionLevel, expiresAt } = body

    // Validate input
    const updates: any = {}

    if (permissionLevel !== undefined) {
      if (!VALID_PERMISSION_LEVELS.includes(permissionLevel)) {
        return respond.badRequest(`permissionLevel must be one of: ${VALID_PERMISSION_LEVELS.join(', ')}`)
      }
      updates.permissionLevel = permissionLevel
    }

    if (expiresAt !== undefined) {
      updates.expiresAt = expiresAt ? new Date(expiresAt) : null
    }

    if (Object.keys(updates).length === 0) {
      return respond.badRequest('No fields to update')
    }

    const updated = await prisma.presetShare.update({
      where: { id: shareId },
      data: updates,
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

    // Log the update
    await prisma.presetShareLog.create({
      data: {
        presetId: id,
        userId,
        eventType: 'UPDATED',
        eventDetails: updates,
        ipAddress: ip
      }
    })

    return respond.ok(updated)
  } catch (error) {
    console.error('[PresetShare PATCH] Error:', error)
    return respond.serverError('Failed to update share')
  }
})

/**
 * DELETE /api/admin/users/presets/:id/share/:shareId
 * Revoke access to a preset
 */
export const DELETE = withTenantContext(async (request: NextRequest, props: { params: Promise<{ id: string; shareId: string }> }) => {
  const ctx = requireTenantContext()
  const tenantId = ctx.tenantId
  const userId = ctx.userId
  const { id, shareId } = await props.params

  if (!tenantId || !userId) {
    return respond.badRequest('Tenant and user context required')
  }

  try {
    const ip = getClientIp(request as unknown as Request)
    const rl = await applyRateLimit(`admin-preset-share-delete:${userId}`, 100, 60_000)
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

    // Verify share exists and user is owner
    const share = await prisma.presetShare.findFirst({
      where: {
        id: shareId,
        presetId: id,
        ownerId: userId
      }
    })

    if (!share) {
      return respond.notFound('Share not found')
    }

    // Delete share
    await prisma.presetShare.delete({
      where: { id: shareId }
    })

    // Log the revocation
    await prisma.presetShareLog.create({
      data: {
        presetId: id,
        userId,
        eventType: 'REVOKED',
        eventDetails: {
          sharedWithUserId: share.sharedWithUserId
        },
        ipAddress: ip
      }
    })

    return respond.ok({
      message: 'Share revoked successfully',
      id: shareId
    })
  } catch (error) {
    console.error('[PresetShare DELETE] Error:', error)
    return respond.serverError('Failed to revoke share')
  }
})
