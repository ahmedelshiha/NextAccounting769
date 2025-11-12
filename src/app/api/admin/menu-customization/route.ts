import { NextRequest, NextResponse } from 'next/server'
import { withTenantContext } from '@/lib/api-wrapper'
import { tenantContext } from '@/lib/tenant-context'
import { Prisma } from '@prisma/client'
import prisma from '@/lib/prisma'
import { MenuCustomizationData } from '@/types/admin/menuCustomization'
import { validateMenuCustomization } from '@/lib/menu/menuValidator'
import { hasRole } from '@/lib/permissions'

const ALLOWED_ADMIN_ROLES = ['ADMIN','TEAM_LEAD','SUPER_ADMIN','STAFF']

/**
 * Default menu structure - returned when user has no customization
 */
const getDefaultMenuCustomization = (): MenuCustomizationData => ({
  sectionOrder: ['dashboard', 'business', 'financial', 'operations', 'system'],
  hiddenItems: [],
  practiceItems: [],
  bookmarks: [],
})

/**
 * GET /api/admin/menu-customization
 * Retrieves the user's menu customization configuration
 *
 * Returns:
 * - User's custom menu configuration if it exists
 * - Default menu configuration if no customization record found
 *
 * Authorization: Requires authenticated user (requireAuth: true)
 */
const _api_GET = async (request: NextRequest): Promise<NextResponse> => {
  try {
    const ctx = tenantContext.getContext()
    const userId = String(ctx.userId ?? '')

    // Server-side guard: allow only admin/staff roles or super admin
    const role = ctx.role ?? ''
    if (!(hasRole(role, ALLOWED_ADMIN_ROLES) || ctx.isSuperAdmin)) {
      return NextResponse.json({ error: 'Forbidden', message: 'Insufficient permissions' }, { status: 403 })
    }

    if (!userId) {
      return NextResponse.json(
        { error: 'User not authenticated', message: 'User ID not found in context' },
        { status: 401 }
      )
    }

    // Fetch user's customization from database
    const customization = await prisma.menuCustomization.findUnique({
      where: { userId },
    })

    // If no customization found, return default
    if (!customization) {
      return NextResponse.json(getDefaultMenuCustomization(), { status: 200 })
    }

    // Parse JSON fields and return customization data
    const data: MenuCustomizationData = {
      sectionOrder: customization.sectionOrder as string[],
      hiddenItems: customization.hiddenItems as string[],
      practiceItems: customization.practiceItems as any[],
      bookmarks: customization.bookmarks as any[],
    }

    return NextResponse.json(data, { status: 200 })
  } catch (error) {
    console.error('[menu-customization:GET] Error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch menu customization'
    return NextResponse.json(
      { error: errorMessage, message: 'Failed to fetch menu customization' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/admin/menu-customization
 * Saves (upserts) the user's menu customization configuration
 *
 * Request Body: MenuCustomizationData
 * Returns: Updated MenuCustomizationData
 *
 * Authorization: Requires authenticated user (requireAuth: true)
 */
const _api_POST = async (request: NextRequest): Promise<NextResponse> => {
  try {
    const ctx = tenantContext.getContext()
    const userId = String(ctx.userId ?? '')

    // Server-side guard: allow only admin/staff roles or super admin
    const role = ctx.role ?? ''
    if (!(hasRole(role, ALLOWED_ADMIN_ROLES) || ctx.isSuperAdmin)) {
      return NextResponse.json({ error: 'Forbidden', message: 'Insufficient permissions' }, { status: 403 })
    }

    if (!userId) {
      return NextResponse.json(
        { error: 'User not authenticated', message: 'User ID not found in context' },
        { status: 401 }
      )
    }

    // Parse request body
    let body: MenuCustomizationData
    try {
      body = await request.json()
    } catch (error) {
      return NextResponse.json(
        { error: 'Invalid request format', message: 'Request body must be valid JSON' },
        { status: 400 }
      )
    }

    // Validate the customization data
    const validation = validateMenuCustomization(body)
    if (!validation.isValid) {
      const errorMessage = validation.errors.length > 0
        ? validation.errors[0]
        : 'Menu customization data is invalid'
      return NextResponse.json(
        {
          error: errorMessage,
          details: validation.errors
        },
        { status: 400 }
      )
    }

    // Upsert customization record in database
    const customization = await prisma.menuCustomization.upsert({
      where: { userId },
      update: {
        sectionOrder: body.sectionOrder as Prisma.InputJsonValue,
        hiddenItems: body.hiddenItems as Prisma.InputJsonValue,
        practiceItems: body.practiceItems as unknown as Prisma.InputJsonValue,
        bookmarks: body.bookmarks as unknown as Prisma.InputJsonValue,
      },
      create: {
        userId,
        sectionOrder: body.sectionOrder as Prisma.InputJsonValue,
        hiddenItems: body.hiddenItems as Prisma.InputJsonValue,
        practiceItems: body.practiceItems as unknown as Prisma.InputJsonValue,
        bookmarks: body.bookmarks as unknown as Prisma.InputJsonValue,
      },
    })

    // Parse and return customization data
    const data: MenuCustomizationData = {
      sectionOrder: customization.sectionOrder as string[],
      hiddenItems: customization.hiddenItems as string[],
      practiceItems: customization.practiceItems as any[],
      bookmarks: customization.bookmarks as any[],
    }

    return NextResponse.json(data, { status: 200 })
  } catch (error) {
    console.error('[menu-customization:POST] Error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Failed to save menu customization'
    return NextResponse.json(
      { error: errorMessage, message: 'Failed to save menu customization' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/admin/menu-customization
 * Resets the user's menu customization to defaults
 *
 * Returns: Default MenuCustomizationData
 *
 * Authorization: Requires authenticated user (requireAuth: true)
 */
const _api_DELETE = async (request: NextRequest): Promise<NextResponse> => {
  try {
    const ctx = tenantContext.getContext()
    const userId = String(ctx.userId ?? '')

    // Server-side guard: allow only admin/staff roles or super admin
    const role = ctx.role ?? ''
    if (!(hasRole(role, ALLOWED_ADMIN_ROLES) || ctx.isSuperAdmin)) {
      return NextResponse.json({ error: 'Forbidden', message: 'Insufficient permissions' }, { status: 403 })
    }

    if (!userId) {
      return NextResponse.json(
        { error: 'User not authenticated', message: 'User ID not found in context' },
        { status: 401 }
      )
    }

    // Delete customization record from database
    await prisma.menuCustomization.delete({
      where: { userId },
    }).catch(() => {
      // Silently ignore if record doesn't exist
    })

    // Return default configuration
    const defaultConfig = getDefaultMenuCustomization()
    return NextResponse.json(defaultConfig, { status: 200 })
  } catch (error) {
    console.error('[menu-customization:DELETE] Error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Failed to reset menu customization'
    return NextResponse.json(
      { error: errorMessage, message: 'Failed to reset menu customization' },
      { status: 500 }
    )
  }
}

export const GET = withTenantContext(_api_GET, { requireAuth: true, allowedRoles: ALLOWED_ADMIN_ROLES })
export const POST = withTenantContext(_api_POST, { requireAuth: true, allowedRoles: ALLOWED_ADMIN_ROLES })
export const DELETE = withTenantContext(_api_DELETE, { requireAuth: true, allowedRoles: ALLOWED_ADMIN_ROLES })
