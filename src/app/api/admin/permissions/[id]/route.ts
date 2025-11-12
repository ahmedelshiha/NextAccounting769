import prisma from '@/lib/prisma'
import { NextResponse, NextRequest } from 'next/server'
import { withTenantContext } from '@/lib/api-wrapper'
import { requireTenantContext } from '@/lib/tenant-utils'
import { ROLE_PERMISSIONS, PERMISSIONS, hasPermission } from '@/lib/permissions'
import { verifySuperAdminStepUp, stepUpChallenge } from '@/lib/security/step-up'

export const GET = withTenantContext(async (req: NextRequest, context: { params: Promise<{ userId: string }> }) => {
  const ctx = requireTenantContext()
  const roleCheck = ctx.role ?? undefined
  if (!hasPermission(roleCheck, PERMISSIONS.ANALYTICS_VIEW)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  if (ctx.isSuperAdmin) {
    const ok = await verifySuperAdminStepUp(req, String(ctx.userId || ''), ctx.tenantId)
    if (!ok) return stepUpChallenge()
  }

  try {
    const { userId } = await context.params
    const idStr = userId
    const isMe = idStr === 'me'

    let user: any = null
    if (isMe) {
      const sUserId = ctx.userId ?? ''
      user = { id: String(sUserId), role: ctx.role ?? 'CLIENT', name: ctx.userName ?? null, email: ctx.userEmail ?? null }
    } else {
      const dbUser = await prisma.user.findUnique({ where: { id: BigInt(idStr) } as any, select: { id: true, role: true, name: true, email: true } })
      if (!dbUser) return NextResponse.json({ error: 'User not found' }, { status: 404 })
      user = { ...dbUser, id: dbUser.id.toString() }
    }

    const roleKey = user.role as keyof typeof ROLE_PERMISSIONS
    const permissions = ROLE_PERMISSIONS[roleKey] ?? []

    return NextResponse.json({ success: true, data: { user, permissions } })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to load permissions' }, { status: 500 })
  }
})
