import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { withTenantContext } from '@/lib/api-wrapper'
import { requireTenantContext } from '@/lib/tenant-utils'
import { hasPermission, PERMISSIONS } from '@/lib/permissions'

const updateTeamMember = async (request: Request, context: any) => {
  const ctx = requireTenantContext()
  const role = ctx.role ?? undefined
  if (!hasPermission(role, PERMISSIONS.TEAM_MANAGE)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const params = context?.params || context
  try {
    const id = params.id
    const body = await request.json().catch(() => ({}))
    const updates: any = {}
    const allowed = ['name', 'email', 'role', 'department', 'title', 'status', 'isAvailable', 'userId', 'workingHours', 'specialties', 'phone', 'certifications', 'availability', 'notes']
    for (const k of allowed) if (k in body) updates[k] = (body as any)[k]
    const updated = await prisma.teamMember.update({ where: { id }, data: updates as any })
    return NextResponse.json(updated)
  } catch (err) {
    console.error('Update /api/admin/team-members/[id] error', err)
    return NextResponse.json({ error: 'Failed to update' }, { status: 500 })
  }
}

export const PUT = withTenantContext(updateTeamMember)
export const PATCH = withTenantContext(updateTeamMember)

export const DELETE = withTenantContext(async (request: Request, context: any) => {
  const ctx = requireTenantContext()
  const role = ctx.role ?? undefined
  if (!hasPermission(role, PERMISSIONS.TEAM_MANAGE)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const params = context?.params || context
  try {
    const id = params.id
    await prisma.teamMember.delete({ where: { id } })
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('DELETE /api/admin/team-members/[id] error', err)
    return NextResponse.json({ error: 'Failed to delete' }, { status: 500 })
  }
})

export const GET = withTenantContext(async (request: Request, context: any) => {
  const ctx = requireTenantContext()
  const role = ctx.role ?? undefined
  if (!hasPermission(role, PERMISSIONS.TEAM_VIEW)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const params = context?.params || context
  try {
    const id = params.id
    const member = await prisma.teamMember.findUnique({ where: { id } })
    if (!member) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json({ teamMember: member })
  } catch (err) {
    console.error('GET /api/admin/team-members/[id] error', err)
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
})
