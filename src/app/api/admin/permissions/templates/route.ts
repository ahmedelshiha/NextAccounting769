import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { PermissionEngine } from '@/lib/permission-engine'
import { Permission } from '@/lib/permissions'

/**
 * Request body for creating/updating a template
 */
interface TemplateRequest {
  name: string
  description?: string
  icon?: string
  color?: string
  permissions: Permission[]
  isCustom?: boolean
}

/**
 * GET /api/admin/permissions/templates
 * 
 * List all permission templates for the tenant
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const tenantId = request.headers.get('x-tenant-id')
    const { searchParams } = new URL(request.url)
    const isActive = searchParams.get('isActive')

    if (!tenantId) {
      return NextResponse.json(
        { error: 'Unauthorized', success: false },
        { status: 401 }
      )
    }

    const where: any = { tenantId }
    if (isActive !== null) {
      where.isActive = isActive === 'true'
    }

    const templates = await prisma.permissionTemplate.findMany({
      where,
      select: {
        id: true,
        name: true,
        description: true,
        icon: true,
        color: true,
        permissions: true,
        isCustom: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { createdAt: 'desc' },
    })

    // Parse permissions JSON
    const parsedTemplates = templates.map(t => ({
      ...t,
      permissions: Array.isArray(t.permissions) ? t.permissions : JSON.parse(typeof t.permissions === 'string' ? t.permissions : '[]'),
    }))

    return NextResponse.json({
      success: true,
      templates: parsedTemplates,
    })
  } catch (error) {
    console.error('[permissions/templates] GET Error:', error)
    return NextResponse.json(
      { error: 'Internal server error', success: false },
      { status: 500 }
    )
  }
}

/**
 * POST /api/admin/permissions/templates
 * 
 * Create a new permission template
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const tenantId = request.headers.get('x-tenant-id')
    const userId = request.headers.get('x-user-id')

    if (!tenantId || !userId) {
      return NextResponse.json(
        { error: 'Unauthorized', success: false },
        { status: 401 }
      )
    }

    const body = (await request.json()) as TemplateRequest

    // Validate input
    if (!body.name || !body.permissions) {
      return NextResponse.json(
        {
          error: 'name and permissions are required',
          success: false,
        },
        { status: 400 }
      )
    }

    // Validate permissions
    const validation = PermissionEngine.validate(body.permissions)
    if (!validation.isValid) {
      return NextResponse.json(
        {
          error: 'Invalid permissions',
          success: false,
          details: validation.errors,
        },
        { status: 400 }
      )
    }

    // Check for duplicate name
    const existing = await prisma.permissionTemplate.findFirst({
      where: {
        tenantId,
        name: body.name,
      },
    })

    if (existing) {
      return NextResponse.json(
        {
          error: `Template with name "${body.name}" already exists`,
          success: false,
        },
        { status: 409 }
      )
    }

    // Create template
    const template = await prisma.permissionTemplate.create({
      data: {
        tenantId,
        name: body.name,
        description: body.description,
        icon: body.icon,
        color: body.color,
        permissions: body.permissions,
        isCustom: body.isCustom !== false,
        createdBy: userId,
      },
    })

    return NextResponse.json(
      {
        success: true,
        template: {
          ...template,
          permissions: Array.isArray(template.permissions)
            ? template.permissions
            : JSON.parse(typeof template.permissions === 'string' ? template.permissions : '[]'),
        },
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('[permissions/templates] POST Error:', error)
    return NextResponse.json(
      { error: 'Internal server error', success: false },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/admin/permissions/templates/[id]
 * 
 * Update an existing permission template
 */
export async function PUT(request: NextRequest): Promise<NextResponse> {
  try {
    const tenantId = request.headers.get('x-tenant-id')
    const { searchParams } = new URL(request.url)
    const templateId = searchParams.get('id')

    if (!tenantId || !templateId) {
      return NextResponse.json(
        { error: 'Unauthorized or missing template ID', success: false },
        { status: 401 }
      )
    }

    const body = (await request.json()) as TemplateRequest

    // Validate permissions if provided
    if (body.permissions) {
      const validation = PermissionEngine.validate(body.permissions)
      if (!validation.isValid) {
        return NextResponse.json(
          {
            error: 'Invalid permissions',
            success: false,
            details: validation.errors,
          },
          { status: 400 }
        )
      }
    }

    // Update template
    const template = await prisma.permissionTemplate.update({
      where: { id: templateId },
      data: {
        name: body.name,
        description: body.description,
        icon: body.icon,
        color: body.color,
        permissions: body.permissions,
      },
    })

    return NextResponse.json({
      success: true,
      template: {
        ...template,
        permissions: Array.isArray(template.permissions)
          ? template.permissions
          : JSON.parse(typeof template.permissions === 'string' ? template.permissions : '[]'),
      },
    })
  } catch (error) {
    console.error('[permissions/templates] PUT Error:', error)
    return NextResponse.json(
      { error: 'Internal server error', success: false },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/admin/permissions/templates/[id]
 * 
 * Delete a permission template
 */
export async function DELETE(request: NextRequest): Promise<NextResponse> {
  try {
    const tenantId = request.headers.get('x-tenant-id')
    const { searchParams } = new URL(request.url)
    const templateId = searchParams.get('id')

    if (!tenantId || !templateId) {
      return NextResponse.json(
        { error: 'Unauthorized or missing template ID', success: false },
        { status: 401 }
      )
    }

    // Verify template belongs to tenant
    const template = await prisma.permissionTemplate.findUnique({
      where: { id: templateId },
      select: { tenantId: true },
    })

    if (!template || template.tenantId !== tenantId) {
      return NextResponse.json(
        { error: 'Template not found', success: false },
        { status: 404 }
      )
    }

    // Delete template
    await prisma.permissionTemplate.delete({
      where: { id: templateId },
    })

    return NextResponse.json({
      success: true,
      message: 'Template deleted successfully',
    })
  } catch (error) {
    console.error('[permissions/templates] DELETE Error:', error)
    return NextResponse.json(
      { error: 'Internal server error', success: false },
      { status: 500 }
    )
  }
}
