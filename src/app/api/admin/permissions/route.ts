import { NextResponse } from 'next/server'
import { withTenantContext } from '@/lib/api-wrapper'
import { requireTenantContext } from '@/lib/tenant-utils'
import { PERMISSIONS, ROLE_PERMISSIONS, hasPermission } from '@/lib/permissions'
import { NextRequest } from 'next/server'
import { verifySuperAdminStepUp, stepUpChallenge } from '@/lib/security/step-up'

export const GET = withTenantContext(async (req: NextRequest) => {
  const ctx = requireTenantContext()
  const role = ctx.role ?? undefined
  if (!hasPermission(role, PERMISSIONS.ANALYTICS_VIEW)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  if (ctx.isSuperAdmin) {
    const ok = await verifySuperAdminStepUp(req, String(ctx.userId || ''), ctx.tenantId)
    if (!ok) return stepUpChallenge()
  }

  const allPermissions = Object.values(PERMISSIONS)
  const roles = Object.keys(ROLE_PERMISSIONS)

  // Group permissions by category for modal UI
  const permissionsByCategory = {
    'Users': [
      { id: 'users.view', name: 'View Users', description: 'View user profiles and information', category: 'Users' },
      { id: 'users.create', name: 'Create Users', description: 'Create new user accounts', category: 'Users' },
      { id: 'users.edit', name: 'Edit Users', description: 'Edit user information', category: 'Users' },
      { id: 'users.delete', name: 'Delete Users', description: 'Delete user accounts', category: 'Users' },
      { id: 'users.export', name: 'Export Users', description: 'Export user data', category: 'Users' },
    ],
    'Roles': [
      { id: 'roles.view', name: 'View Roles', description: 'View role configurations', category: 'Roles' },
      { id: 'roles.create', name: 'Create Roles', description: 'Create new roles', category: 'Roles' },
      { id: 'roles.edit', name: 'Edit Roles', description: 'Edit role settings', category: 'Roles' },
      { id: 'roles.delete', name: 'Delete Roles', description: 'Delete roles', category: 'Roles' },
    ],
    'Permissions': [
      { id: 'permissions.view', name: 'View Permissions', description: 'View available permissions', category: 'Permissions' },
      { id: 'permissions.manage', name: 'Manage Permissions', description: 'Assign permissions to roles', category: 'Permissions' },
    ],
    'Clients': [
      { id: 'clients.view', name: 'View Clients', description: 'View client information', category: 'Clients' },
      { id: 'clients.create', name: 'Create Clients', description: 'Create new clients', category: 'Clients' },
      { id: 'clients.edit', name: 'Edit Clients', description: 'Edit client information', category: 'Clients' },
      { id: 'clients.delete', name: 'Delete Clients', description: 'Delete clients', category: 'Clients' },
    ],
    'Team': [
      { id: 'team.view', name: 'View Team', description: 'View team members', category: 'Team' },
      { id: 'team.create', name: 'Create Team Members', description: 'Add team members', category: 'Team' },
      { id: 'team.edit', name: 'Edit Team Members', description: 'Edit team member information', category: 'Team' },
      { id: 'team.delete', name: 'Delete Team Members', description: 'Remove team members', category: 'Team' },
    ],
  }

  return NextResponse.json({
    success: true,
    permissions: Object.values(permissionsByCategory).flat(),
    data: {
      permissions: allPermissions,
      roles,
      rolePermissions: ROLE_PERMISSIONS,
    },
  })
})
