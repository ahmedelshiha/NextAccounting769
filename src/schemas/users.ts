import { z } from 'zod'

/**
 * User Creation Schema
 * Used for admin creation of new users (not self-registration)
 */
export const UserCreateSchema = z.object({
  name: z.string()
    .min(1, 'Name is required')
    .min(2, 'Name must be at least 2 characters')
    .max(255, 'Name must be less than 255 characters'),
  email: z.string()
    .email('Enter a valid email address')
    .max(255, 'Email must be less than 255 characters'),
  phone: z.string()
    .optional()
    .refine(
      (v) => !v || /^[\+]?([0-9]|\s|\-|\(|\)){5,}$/.test(v),
      'Invalid phone number'
    ),
  company: z.string()
    .max(255, 'Company name must be less than 255 characters')
    .optional(),
  location: z.string()
    .max(255, 'Location must be less than 255 characters')
    .optional(),
  role: z.enum(['CLIENT', 'TEAM_MEMBER', 'STAFF', 'TEAM_LEAD', 'ADMIN'], {
    message: 'Select a valid role'
  }).default('CLIENT'),
  isActive: z.boolean().default(true),
  requiresOnboarding: z.boolean().default(true),
  notes: z.string()
    .max(1000, 'Notes must be less than 1000 characters')
    .optional(),
  temporaryPassword: z.string()
    .optional()
    .describe('Generated temporary password for new user'),
  tags: z.array(z.string()).default([]),
})

/**
 * User Edit Schema
 * Used for updating existing user details
 * Email cannot be changed in edit mode
 */
export const UserEditSchema = UserCreateSchema.omit({ email: true }).extend({
  id: z.string().uuid('Invalid user ID'),
})

/**
 * User Bulk Assignment Schema
 * Used for bulk role/permission assignment
 */
export const UserBulkAssignmentSchema = z.object({
  userIds: z.array(z.string().uuid()).min(1, 'Select at least one user'),
  role: z.enum(['CLIENT', 'TEAM_MEMBER', 'STAFF', 'TEAM_LEAD', 'ADMIN']).optional(),
  permissions: z.array(z.string()).optional(),
  status: z.enum(['ACTIVE', 'INACTIVE']).optional(),
})

/**
 * Type exports for use in components
 */
export type UserCreate = z.infer<typeof UserCreateSchema>
export type UserEdit = z.infer<typeof UserEditSchema>
export type UserBulkAssignment = z.infer<typeof UserBulkAssignmentSchema>

/**
 * Helper function to generate a temporary password
 */
export function generateTemporaryPassword(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()'
  const length = 12
  let password = ''
  for (let i = 0; i < length; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  // Ensure password has at least one uppercase, one lowercase, one number, and one special char
  const hasUpper = /[A-Z]/.test(password)
  const hasLower = /[a-z]/.test(password)
  const hasNum = /[0-9]/.test(password)
  const hasSpecial = /[!@#$%^&*()]/.test(password)

  if (!hasUpper || !hasLower || !hasNum || !hasSpecial) {
    return generateTemporaryPassword()
  }
  return password
}
