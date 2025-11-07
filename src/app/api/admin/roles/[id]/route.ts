import prisma from '@/lib/prisma'
import { NextResponse } from 'next/server'
import { withTenantContext } from '@/lib/api-wrapper'
import { requireTenantContext } from '@/lib/tenant-utils'
import { hasPermission, PERMISSIONS } from '@/lib/permissions'
import { AuditLoggingService, AuditActionType, AuditSeverity } from '@/services/audit-logging.service'
import { realtimeService } from '@/lib/realtime-enhanced'

export const GET = withTenantContext(async (req: Request, { params }: { params: { id: string } }) => {
  try {
    const ctx = requireTenantContext()
    const role = ctx.role ?? undefined
    if (!hasPermission(role, PERMISSIONS.USERS_VIEW)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!ctx.tenantId) {
      return NextResponse.json({ error: 'Tenant context missing' }, { status: 400 })
    }

    const targetRole = await prisma.customRole.findFirst({
      where: {
        id: params.id,
        tenantId: ctx.tenantId,
      },
      select: {
        id: true,
        name: true,
        description: true,
        permissions: true,
        createdAt: true,
        updatedAt: true,
      },
    })

    if (!targetRole) {
      return NextResponse.json({ error: 'Role not found' }, { status: 404 })
    }

    return NextResponse.json(targetRole)
  } catch (err) {
    console.error('GET /api/admin/roles/[id] error', err)
    return NextResponse.json({ error: 'Failed to fetch role' }, { status: 500 })
  }
})

export const PATCH = withTenantContext(async (req: Request, { params }: { params: { id: string } }) => {
  try {
    const ctx = requireTenantContext()
    const role = ctx.role ?? undefined
    if (!hasPermission(role, PERMISSIONS.USERS_MANAGE)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!ctx.tenantId) {
      return NextResponse.json({ error: 'Tenant context missing' }, { status: 400 })
    }

    const body = await req.json().catch(() => ({}))
    const { name, description, permissions } = body || {}

    const targetRole = await prisma.customRole.findFirst({
      where: {
        id: params.id,
        tenantId: ctx.tenantId,
      },
    })

    if (!targetRole) {
      return NextResponse.json({ error: 'Role not found' }, { status: 404 })
    }

    // Check if new name is available (if changed)
    if (name && name !== targetRole.name) {
      const existing = await prisma.customRole.findFirst({
        where: {
          name,
          tenantId: ctx.tenantId,
        },
      })
      if (existing) {
        return NextResponse.json({ error: 'Role name already exists' }, { status: 409 })
      }
    }

    // Validate permissions if provided
    if (permissions && (!Array.isArray(permissions) || permissions.length === 0)) {
      return NextResponse.json({ error: 'At least one permission must be assigned' }, { status: 400 })
    }

    const updated = await prisma.customRole.update({
      where: { id: params.id },
      data: {
        ...(name && { name }),
        ...(description && { description }),
        ...(permissions && { permissions }),
      },
      select: {
        id: true,
        name: true,
        description: true,
        permissions: true,
        createdAt: true,
        updatedAt: true,
      },
    })

    // Emit real-time event for role update
    try {
      realtimeService.emitRoleUpdated(params.id, {
        action: 'updated',
        roleName: updated.name,
        permissions: updated.permissions
      })
    } catch (err) {
      console.error('Failed to emit role updated event:', err)
    }

    // Log role update
    const changes: Record<string, any> = {}
    if (name) changes.name = { from: targetRole.name, to: name }
    if (description) changes.description = { from: targetRole.description, to: description }
    if (permissions) changes.permissions = { from: targetRole.permissions, to: permissions }

    await AuditLoggingService.logAuditEvent({
      action: AuditActionType.ROLE_UPDATED,
      severity: AuditSeverity.INFO,
      userId: ctx.userId ?? undefined,
      tenantId: ctx.tenantId,
      targetResourceId: params.id,
      targetResourceType: 'ROLE',
      description: `Updated role: ${updated.name}`,
      changes,
      metadata: {
        changedFields: Object.keys(changes),
      },
    }).catch(err => {
      console.warn('Failed to log role update:', err)
      // Don't fail the request if audit logging fails
    })

    return NextResponse.json(updated)
  } catch (err) {
    console.error('PATCH /api/admin/roles/[id] error', err)
    return NextResponse.json({ error: 'Failed to update role' }, { status: 500 })
  }
})

export const DELETE = withTenantContext(async (req: Request, { params }: { params: { id: string } }) => {
  try {
    const ctx = requireTenantContext()
    const role = ctx.role ?? undefined
    if (!hasPermission(role, PERMISSIONS.USERS_MANAGE)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!ctx.tenantId) {
      return NextResponse.json({ error: 'Tenant context missing' }, { status: 400 })
    }

    const targetRole = await prisma.customRole.findFirst({
      where: {
        id: params.id,
        tenantId: ctx.tenantId,
      },
    })

    if (!targetRole) {
      return NextResponse.json({ error: 'Role not found' }, { status: 404 })
    }

    await prisma.customRole.delete({
      where: { id: params.id },
    })

    // Emit real-time event for role deletion
    try {
      realtimeService.emitRoleUpdated(params.id, {
        action: 'deleted',
        roleName: targetRole.name,
        permissions: targetRole.permissions
      })
    } catch (err) {
      console.error('Failed to emit role deleted event:', err)
    }

    // Log role deletion
    await AuditLoggingService.logAuditEvent({
      action: AuditActionType.ROLE_DELETED,
      severity: AuditSeverity.WARNING,
      userId: ctx.userId ?? undefined,
      tenantId: ctx.tenantId,
      targetResourceId: params.id,
      targetResourceType: 'ROLE',
      description: `Deleted role: ${targetRole.name}`,
      changes: {
        name: targetRole.name,
        description: targetRole.description,
        permissionsCount: (targetRole.permissions as any[])?.length || 0,
      },
      metadata: {
        deletedRole: {
          id: targetRole.id,
          name: targetRole.name,
          description: targetRole.description,
        },
      },
    }).catch(err => {
      console.warn('Failed to log role deletion:', err)
      // Don't fail the request if audit logging fails
    })

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('DELETE /api/admin/roles/[id] error', err)
    return NextResponse.json({ error: 'Failed to delete role' }, { status: 500 })
  }
})
