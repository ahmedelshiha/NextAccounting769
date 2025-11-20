import { NextRequest, NextResponse } from 'next/server'
import { withTenantContext } from '@/lib/api-wrapper'
import { requireTenantContext } from '@/lib/tenant-utils'
import prisma from '@/lib/prisma'
import { respond } from '@/lib/api-response'
import { hasPermission, PERMISSIONS } from '@/lib/permissions'
import { applyRateLimit, getClientIp } from '@/lib/rate-limit'

export const runtime = 'nodejs'
export const revalidate = 0 // Don't cache presets - they're user-specific

const MAX_PRESETS = 50
const MAX_NAME_LENGTH = 255

/**
 * GET /api/admin/users/presets
 * List all filter presets for the current user
 */
export const GET = withTenantContext(async (request: NextRequest) => {
  const ctx = requireTenantContext()
  const tenantId = ctx.tenantId
  const userId = ctx.userId

  if (!tenantId || !userId) {
    return respond.badRequest('Tenant and user context required')
  }

  try {
    const ip = getClientIp(request as unknown as Request)
    const rl = await applyRateLimit(`admin-user-presets-list:${userId}`, 100, 60_000)
    if (rl && rl.allowed === false) {
      return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 })
    }

    if (!hasPermission(ctx.role ?? '', PERMISSIONS.USERS_MANAGE)) {
      return respond.forbidden('Insufficient permissions to access presets')
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url)
    const sortBy = searchParams.get('sortBy') || 'updatedAt'
    const sortOrder = (searchParams.get('sortOrder') || 'desc').toLowerCase() as 'asc' | 'desc'

    const presets = await prisma.filterPreset.findMany({
      where: {
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
      },
      orderBy:
        sortBy === 'name'
          ? { name: sortOrder }
          : sortBy === 'usageCount'
            ? { usageCount: sortOrder }
            : { updatedAt: sortOrder }
    })

    return respond.ok({
      presets,
      count: presets.length,
      maxPresets: MAX_PRESETS
    })
  } catch (error) {
    console.error('[Presets GET] Error:', error)
    return respond.serverError('Failed to fetch presets')
  }
})

/**
 * POST /api/admin/users/presets
 * Create a new filter preset
 */
export const POST = withTenantContext(async (request: NextRequest) => {
  const ctx = requireTenantContext()
  const tenantId = ctx.tenantId
  const userId = ctx.userId

  if (!tenantId || !userId) {
    return respond.badRequest('Tenant and user context required')
  }

  try {
    const ip = getClientIp(request as unknown as Request)
    const rl = await applyRateLimit(`admin-user-presets-create:${userId}`, 50, 60_000)
    if (rl && rl.allowed === false) {
      return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 })
    }

    if (!hasPermission(ctx.role ?? '', PERMISSIONS.USERS_MANAGE)) {
      return respond.forbidden('Insufficient permissions to create presets')
    }

    const body = await request.json()
    const { name, description, filters } = body

    // Validate required fields
    if (!name || typeof name !== 'string') {
      return respond.badRequest('Preset name is required and must be a string')
    }

    if (!filters || typeof filters !== 'object') {
      return respond.badRequest('Filters object is required')
    }

    // Validate name length and format
    const trimmedName = name.trim()
    if (trimmedName.length === 0) {
      return respond.badRequest('Preset name cannot be empty')
    }

    if (trimmedName.length > MAX_NAME_LENGTH) {
      return respond.badRequest(`Preset name cannot exceed ${MAX_NAME_LENGTH} characters`)
    }

    // Check preset count
    const existingCount = await prisma.filterPreset.count({
      where: {
        tenantId,
        userId
      }
    })

    if (existingCount >= MAX_PRESETS) {
      return respond.badRequest(`Maximum of ${MAX_PRESETS} presets allowed`)
    }

    // Check for duplicate name
    const existingPreset = await prisma.filterPreset.findUnique({
      where: {
        userId_tenantId_name: {
          userId,
          tenantId,
          name: trimmedName
        }
      }
    })

    if (existingPreset) {
      return respond.badRequest('A preset with this name already exists')
    }

    // Create preset
    const preset = await prisma.filterPreset.create({
      data: {
        name: trimmedName,
        description: description || null,
        filters: filters as any,
        tenantId,
        userId,
        isPinned: false,
        usageCount: 0
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

    return respond.created(preset)
  } catch (error) {
    console.error('[Presets POST] Error:', error)
    if ((error as any).code === 'P2002') {
      return respond.badRequest('A preset with this name already exists')
    }
    return respond.serverError('Failed to create preset')
  }
})
