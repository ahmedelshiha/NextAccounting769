import { NextRequest, NextResponse } from 'next/server'
import { withTenantContext } from '@/lib/api-wrapper'
import { requireTenantContext } from '@/lib/tenant-utils'
import prisma from '@/lib/prisma'
import { respond } from '@/lib/api-response'
import { hasPermission, PERMISSIONS } from '@/lib/permissions'
import { applyRateLimit, getClientIp } from '@/lib/rate-limit'

export const runtime = 'nodejs'
export const revalidate = 0

const MAX_NAME_LENGTH = 255

/**
 * GET /api/admin/users/presets/:id
 * Get a single filter preset by ID
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
    const rl = await applyRateLimit(`admin-user-presets-get:${userId}`, 200, 60_000)
    if (rl && rl.allowed === false) {
      return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 })
    }

    if (!hasPermission(ctx.role ?? '', PERMISSIONS.USERS_MANAGE)) {
      return respond.forbidden('Insufficient permissions to access presets')
    }

    const preset = await prisma.filterPreset.findFirst({
      where: {
        id,
        tenantId,
        userId
      },
      select: {
        id: true,
        name: true,
        description: true,
        filters: true,
        isPinned: true,
        usageCount: true,
        lastUsedAt: true,
        createdAt: true,
        updatedAt: true
      }
    })

    if (!preset) {
      return respond.notFound('Preset not found')
    }

    return respond.ok(preset)
  } catch (error) {
    console.error('[Presets GET] Error:', error)
    return respond.serverError('Failed to fetch preset')
  }
})

/**
 * PATCH /api/admin/users/presets/:id
 * Update a filter preset
 */
export const PATCH = withTenantContext(async (request: NextRequest, props: { params: Promise<{ id: string }> }) => {
  const ctx = requireTenantContext()
  const tenantId = ctx.tenantId
  const userId = ctx.userId
  const { id } = await props.params

  if (!tenantId || !userId) {
    return respond.badRequest('Tenant and user context required')
  }

  try {
    const ip = getClientIp(request as unknown as Request)
    const rl = await applyRateLimit(`admin-user-presets-update:${userId}`, 100, 60_000)
    if (rl && rl.allowed === false) {
      return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 })
    }

    if (!hasPermission(ctx.role ?? '', PERMISSIONS.USERS_MANAGE)) {
      return respond.forbidden('Insufficient permissions to update presets')
    }

    // Verify preset exists and belongs to user
    const existingPreset = await prisma.filterPreset.findFirst({
      where: {
        id,
        tenantId,
        userId
      }
    })

    if (!existingPreset) {
      return respond.notFound('Preset not found')
    }

    const body = await request.json()
    const { name, description, filters, isPinned } = body

    // Build update object with only provided fields
    const updateData: any = {}

    if (name !== undefined) {
      if (typeof name !== 'string') {
        return respond.badRequest('Preset name must be a string')
      }

      const trimmedName = name.trim()
      if (trimmedName.length === 0) {
        return respond.badRequest('Preset name cannot be empty')
      }

      if (trimmedName.length > MAX_NAME_LENGTH) {
        return respond.badRequest(`Preset name cannot exceed ${MAX_NAME_LENGTH} characters`)
      }

      // Check for duplicate name (excluding current preset)
      if (trimmedName !== existingPreset.name) {
        const duplicate = await prisma.filterPreset.findFirst({
          where: {
            tenantId,
            userId,
            name: trimmedName,
            id: { not: id }
          }
        })

        if (duplicate) {
          return respond.badRequest('A preset with this name already exists')
        }
      }

      updateData.name = trimmedName
    }

    if (description !== undefined) {
      updateData.description = description || null
    }

    if (filters !== undefined) {
      if (typeof filters !== 'object') {
        return respond.badRequest('Filters must be an object')
      }
      updateData.filters = filters
    }

    if (isPinned !== undefined) {
      if (typeof isPinned !== 'boolean') {
        return respond.badRequest('isPinned must be a boolean')
      }
      updateData.isPinned = isPinned
    }

    if (Object.keys(updateData).length === 0) {
      return respond.badRequest('No fields to update')
    }

    const preset = await prisma.filterPreset.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        name: true,
        description: true,
        filters: true,
        isPinned: true,
        usageCount: true,
        lastUsedAt: true,
        createdAt: true,
        updatedAt: true
      }
    })

    return respond.ok(preset)
  } catch (error) {
    console.error('[Presets PATCH] Error:', error)
    if ((error as any).code === 'P2002') {
      return respond.badRequest('A preset with this name already exists')
    }
    return respond.serverError('Failed to update preset')
  }
})

/**
 * DELETE /api/admin/users/presets/:id
 * Delete a filter preset
 */
export const DELETE = withTenantContext(async (request: NextRequest, props: { params: Promise<{ id: string }> }) => {
  const ctx = requireTenantContext()
  const tenantId = ctx.tenantId
  const userId = ctx.userId
  const { id } = await props.params

  if (!tenantId || !userId) {
    return respond.badRequest('Tenant and user context required')
  }

  try {
    const ip = getClientIp(request as unknown as Request)
    const rl = await applyRateLimit(`admin-user-presets-delete:${userId}`, 100, 60_000)
    if (rl && rl.allowed === false) {
      return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 })
    }

    if (!hasPermission(ctx.role ?? '', PERMISSIONS.USERS_MANAGE)) {
      return respond.forbidden('Insufficient permissions to delete presets')
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

    await prisma.filterPreset.delete({
      where: { id }
    })

    return respond.ok({ message: 'Preset deleted successfully', id })
  } catch (error) {
    console.error('[Presets DELETE] Error:', error)
    return respond.serverError('Failed to delete preset')
  }
})
