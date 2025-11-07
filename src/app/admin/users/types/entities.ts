import { UserItem } from '../contexts/UserDataContext'

/**
 * Unified type system for user management entities
 * Prevents type drift by centralizing type definitions
 * Used across all user management components
 */

/**
 * Client - extends UserItem with client-specific fields
 * Represents a client user in the system
 */
export type ClientItem = UserItem & {
  // Client-specific fields (in addition to UserItem)
  tier?: 'INDIVIDUAL' | 'SMB' | 'ENTERPRISE'
  lastBooking?: string
  totalBookings?: number
  totalRevenue?: number
}

/**
 * TeamMember - extends UserItem with team-specific fields
 * Represents a team member in the system
 */
export type TeamMemberItem = UserItem & {
  // Team-specific fields (in addition to UserItem)
  department?: string
  position?: string
  specialties?: string[]
  certifications?: string[]
  hourlyRate?: number
  workingHours?: Record<string, { start: string; end: string }>
  bookingBuffer?: number
  autoAssign?: boolean
  experienceYears?: number
}

/**
 * AdminUser - extends UserItem with admin-specific fields
 * Represents an admin or super admin user
 */
export type AdminUser = UserItem & {
  // Admin-specific fields
  permissions?: string[]
  roleId?: string
  lastLoginAt?: string
}

/**
 * EntityFormData - generic form data for any entity
 * Used by useEntityForm hook for flexible form handling
 */
export type EntityFormData<T extends UserItem = UserItem> = Partial<T>

/**
 * Type guards for safely checking entity types
 */
export const isClientItem = (user: UserItem): user is ClientItem => {
  return user.role === 'CLIENT'
}

export const isTeamMemberItem = (user: UserItem): user is TeamMemberItem => {
  return ['TEAM_MEMBER', 'TEAM_LEAD', 'STAFF'].includes(user.role)
}

export const isAdminUser = (user: UserItem): user is AdminUser => {
  return ['ADMIN', 'SUPER_ADMIN'].includes(user.role)
}

/**
 * Type coercions - safely convert UserItem to specific types
 */
export const asClientItem = (user: UserItem): ClientItem => ({
  ...user,
  tier: (user as any).tier,
  lastBooking: (user as any).lastBooking,
  totalBookings: (user as any).totalBookings,
  totalRevenue: (user as any).totalRevenue
})

export const asTeamMemberItem = (user: UserItem): TeamMemberItem => ({
  ...user,
  department: user.department,
  position: user.position || (user as any).position,
  specialties: (user as any).specialties || (user as any).skills,
  certifications: (user as any).certifications,
  hourlyRate: (user as any).hourlyRate,
  workingHours: (user as any).workingHours,
  bookingBuffer: (user as any).bookingBuffer,
  autoAssign: (user as any).autoAssign,
  experienceYears: (user as any).experienceYears
})

export const asAdminUser = (user: UserItem): AdminUser => ({
  ...user,
  permissions: user.permissions,
  roleId: (user as any).roleId,
  lastLoginAt: user.lastLoginAt
})
