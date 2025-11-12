import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { hasPermission, PERMISSIONS } from '@/lib/permissions'
import { AuditLogService } from '@/services/audit-log.service'
import { getClientIp, applyRateLimit } from '@/lib/rate-limit'
import { tenantFilter } from '@/lib/tenant'
import { realtimeService } from '@/lib/realtime-enhanced'
import { withTenantContext } from '@/lib/api-wrapper'
import { requireTenantContext } from '@/lib/tenant-utils'
import { respond } from '@/lib/api-response'
import { logAudit } from '@/lib/audit'

export const runtime = 'nodejs'

export const PUT = withTenantContext(async (request: NextRequest, context: { params: Promise<{ id: string }> }) => {
  try {
    const ctx = requireTenantContext()
    const role = ctx.role ?? ''
    if (!ctx.userId) return respond.unauthorized()
    if (!hasPermission(role, PERMISSIONS.USERS_MANAGE)) return respond.forbidden('Forbidden')

    const hasDb = Boolean(process.env.NETLIFY_DATABASE_URL)
    if (!hasDb) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 501 })
    }

    const { id } = await context.params
    const tenantId = ctx.tenantId

    // Verify user exists
    const existing = await prisma.user.findFirst({
      where: { id, ...(tenantFilter(tenantId) as any) },
      select: { id: true, role: true, email: true, name: true }
    })

    if (!existing) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    const ip = getClientIp(request as unknown as Request)

    // Rate limiting
    {
      const key = `permissions:${ip}`
      const rl = await applyRateLimit(key, 10, 60_000)
      if (!rl.allowed) {
        try {
          await logAudit({
            action: 'security.ratelimit.block',
            actorId: ctx.userId ?? null,
            details: { tenantId: ctx.tenantId ?? null, ip, key, route: new URL(request.url).pathname }
          })
        } catch {}
        return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
      }
    }

    const json = await request.json().catch(() => ({}))
    
    // Validate payload
    const { roleChange, permissionChanges } = json
    if (!roleChange && !permissionChanges) {
      return NextResponse.json({ error: 'No changes provided' }, { status: 400 })
    }

    const updateData: any = {}

    // Update role if provided
    if (roleChange?.to) {
      updateData.role = roleChange.to
    }

    const updated = await prisma.user.update({
      where: { id },
      data: updateData,
      select: { id: true, name: true, email: true, role: true, updatedAt: true }
    })

    // Emit real-time event for permission/role update
    try {
      realtimeService.emitUserUpdated(id, {
        action: 'permissions_updated',
        userEmail: updated.email,
        userName: updated.name,
        userRole: updated.role,
        changedFields: ['role', 'permissions']
      })
    } catch (err) {
      console.error('Failed to emit permission update event:', err)
    }

    // Log permission/role change
    try {
      if (tenantId) {
        await AuditLogService.createAuditLog({
          tenantId: tenantId,
          userId: ctx.userId,
          action: 'user.permissions.update',
          resource: `user:${id}`,
          metadata: {
            targetUserId: id,
            targetEmail: updated.email,
            targetName: updated.name,
            roleChange,
            permissionChanges,
            timestamp: new Date().toISOString()
          },
          ipAddress: ip,
          userAgent: request.headers.get('user-agent') || undefined
        })
      }
    } catch (auditError) {
      console.error('Failed to create audit log for permission change:', auditError)
      // Fallback to simple audit
      await logAudit({
        action: 'user.permissions.update',
        actorId: ctx.userId,
        targetId: id,
        details: { roleChange, permissionChanges }
      })
    }

    // Notify user of permission change
    try {
      realtimeService.broadcastToUser(String(id), {
        type: 'permissions-updated',
        data: { userId: String(id), role: updated.role },
        timestamp: new Date().toISOString()
      })
    } catch (err) {
      console.error('Failed to broadcast permission update:', err)
    }

    return NextResponse.json({
      success: true,
      data: updated
    })
  } catch (error) {
    console.error('Error updating permissions:', error)
    return NextResponse.json({ error: 'Failed to update permissions' }, { status: 500 })
  }
})
