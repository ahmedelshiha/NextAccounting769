export type Role = 'SUPER_ADMIN' | 'ADMIN' | 'STAFF' | 'CLIENT'

export type Permission =
  | 'view_dashboard'
  | 'view_analytics'
  | 'manage_users'
  | 'manage_bookings'
  | 'manage_posts'
  | 'manage_services'
  | 'manage_newsletter'
  | 'view_currencies'
  | 'manage_currencies'
  | 'manage_price_overrides'

const ADMIN_PERMISSIONS: Permission[] = [
  'view_dashboard',
  'view_analytics',
  'manage_users',
  'manage_bookings',
  'manage_posts',
  'manage_services',
  'manage_newsletter',
  'view_currencies',
  'manage_currencies',
  'manage_price_overrides',
]

const rolePermissions: Record<Role, Permission[]> = {
  SUPER_ADMIN: ADMIN_PERMISSIONS,
  ADMIN: ADMIN_PERMISSIONS,
  STAFF: [
    'view_dashboard',
    'view_analytics',
    'manage_bookings',
    'manage_posts',
    'manage_services',
    'manage_newsletter',
    'view_currencies',
  ],
  CLIENT: ['view_dashboard'],
}

export function hasPermission(role: string | undefined | null, permission: Permission) {
  if (!role) return false
  // Super admins bypass permissions (normalize role string)
  try {
    const roleNormalized = String(role).toUpperCase()
    if (roleNormalized === 'SUPER_ADMIN') return true
  } catch {}
  const perms = rolePermissions[(role as Role) ?? 'CLIENT'] || []
  return perms.includes(permission)
}
