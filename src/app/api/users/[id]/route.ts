import { NextRequest, NextResponse } from 'next/server'
import { withTenantContext } from '@/lib/api-wrapper'
import { respond } from '@/lib/api-response'
import { prisma } from '@/lib/prisma'

/**
 * GET /api/users/[id]
 *
 * Fetch a user's profile information
 * - Users can view their own profile
 * - Users can view other team members' profiles (if they're on the same team)
 * - Admins can view any user's profile
 */
export const GET = withTenantContext(
  async (request: NextRequest, { user, tenantId }, { params }) => {
    try {
      const targetUserId = params.id

      // Validate user ID format
      if (!targetUserId || typeof targetUserId !== 'string') {
        return respond.badRequest('Invalid user ID')
      }

      const isAdmin = user.role === 'ADMIN' || user.role === 'SUPER_ADMIN'

      // Fetch the target user
      const targetUser = await prisma.user.findUnique({
        where: { id: targetUserId },
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
          department: true,
          position: true,
          createdAt: true,
          // Only admins see these fields
          isAdmin: isAdmin,
          emailVerified: isAdmin,
          // Only self can see these
          phone: user.id === targetUserId,
        },
      })

      if (!targetUser) {
        return respond.notFound('User not found')
      }

      // Check authorization
      if (user.id !== targetUserId && !isAdmin) {
        // Portal users can only see team members they work with
        const isTeamMember = await checkIfTeamMember(user.id, targetUserId, tenantId)

        if (!isTeamMember) {
          return respond.forbidden('You do not have access to this user profile')
        }
      }

      // Verify tenant isolation
      const userTenant = await prisma.user.findUnique({
        where: { id: targetUserId },
        select: { tenantId: true },
      })

      if (!userTenant || userTenant.tenantId !== tenantId) {
        return respond.forbidden('User not found in this organization')
      }

      // Clean up response - remove fields not authorized for this user
      const response = {
        ...targetUser,
        // Remove admin-only fields for non-admins
        ...(isAdmin ? {} : { isAdmin: undefined, emailVerified: undefined }),
        // Remove personal fields for non-self users
        ...(user.id !== targetUserId ? { phone: undefined } : {}),
      }

      Object.keys(response).forEach(
        (key) => response[key as keyof typeof response] === undefined && delete response[key as keyof typeof response]
      )

      return respond.ok(response)
    } catch (error) {
      console.error('Error fetching user profile:', error)
      return respond.serverError()
    }
  },
  { requireAuth: true }
)

/**
 * PUT /api/users/[id]
 *
 * Update a user's profile
 * - Users can update their own profile
 * - Admins can update any user's profile
 */
export const PUT = withTenantContext(
  async (request: NextRequest, { user, tenantId }, { params }) => {
    try {
      const targetUserId = params.id

      // Validate user ID
      if (!targetUserId || typeof targetUserId !== 'string') {
        return respond.badRequest('Invalid user ID')
      }

      const isAdmin = user.role === 'ADMIN' || user.role === 'SUPER_ADMIN'

      // Check authorization
      if (user.id !== targetUserId && !isAdmin) {
        return respond.forbidden('You can only update your own profile')
      }

      // Verify target user exists and belongs to this tenant
      const targetUser = await prisma.user.findUnique({
        where: { id: targetUserId },
        select: { tenantId: true },
      })

      if (!targetUser || targetUser.tenantId !== tenantId) {
        return respond.forbidden('User not found')
      }

      // Parse request body
      const body = await request.json()

      // Validate updateable fields
      const updateData: any = {}

      // All users can update these fields for themselves
      if (body.name !== undefined) {
        updateData.name = typeof body.name === 'string' ? body.name.trim() : null
      }

      if (body.image !== undefined) {
        updateData.image = typeof body.image === 'string' ? body.image.trim() : null
      }

      if (body.phone !== undefined) {
        updateData.phone = typeof body.phone === 'string' ? body.phone.trim() : null
      }

      // Only admins can update these fields
      if (isAdmin) {
        if (body.department !== undefined) {
          updateData.department = typeof body.department === 'string' ? body.department.trim() : null
        }

        if (body.position !== undefined) {
          updateData.position = typeof body.position === 'string' ? body.position.trim() : null
        }
      }

      if (Object.keys(updateData).length === 0) {
        return respond.badRequest('No valid fields to update')
      }

      // Update the user
      const updatedUser = await prisma.user.update({
        where: { id: targetUserId },
        data: updateData,
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
          department: true,
          position: true,
          ...(user.id === targetUserId && { phone: true }),
        },
      })

      return respond.ok(updatedUser)
    } catch (error) {
      console.error('Error updating user profile:', error)
      return respond.serverError()
    }
  },
  { requireAuth: true }
)

/**
 * Helper function to check if two users are team members
 * (work on the same tasks/bookings or same department)
 */
async function checkIfTeamMember(
  userId: string,
  targetUserId: string,
  tenantId: string
): Promise<boolean> {
  // Check if they work on the same tasks
  const sharedTask = await prisma.task.findFirst({
    where: {
      tenantId,
      OR: [
        { assigneeId: userId, createdBy: targetUserId },
        { assigneeId: targetUserId, createdBy: userId },
        { AND: [{ OR: [{ assigneeId: userId }, { createdBy: userId }] }, { OR: [{ assigneeId: targetUserId }, { createdBy: targetUserId }] }] },
      ],
    },
    select: { id: true },
  })

  if (sharedTask) return true

  // Check if they work on the same bookings
  const sharedBooking = await prisma.booking.findFirst({
    where: {
      tenantId,
      OR: [
        { clientId: userId, assignedToId: targetUserId },
        { clientId: targetUserId, assignedToId: userId },
      ],
    },
    select: { id: true },
  })

  if (sharedBooking) return true

  // Check if they're in the same department
  const [user, target] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: { department: true },
    }),
    prisma.user.findUnique({
      where: { id: targetUserId },
      select: { department: true },
    }),
  ])

  if (user?.department && target?.department && user.department === target.department) {
    return true
  }

  return false
}
