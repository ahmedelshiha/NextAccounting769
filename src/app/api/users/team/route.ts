import { NextRequest, NextResponse } from 'next/server'
import { withTenantContext } from '@/lib/api-wrapper'
import { respond } from '@/lib/api-response'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

/**
 * GET /api/users/team
 *
 * Fetch team members visible to the current user.
 * - Portal users: See team members assigned to their bookings/tasks
 * - Admin users: See all users in the organization
 *
 * Query Parameters:
 * - search: Filter by name, email, or position
 * - department: Filter by department
 * - status: Filter by online status
 * - limit: Results per page (default: 50, max: 100)
 * - offset: Pagination offset (default: 0)
 */
export const GET = withTenantContext(
  async (request: NextRequest, { user, tenantId }) => {
    try {
      const { searchParams } = new URL(request.url)

      // Parse query parameters
      const search = searchParams.get('search')?.trim()
      const department = searchParams.get('department')?.trim()
      const status = searchParams.get('status')?.toLowerCase()
      const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100)
      const offset = parseInt(searchParams.get('offset') || '0')

      const isAdmin = user.role === 'ADMIN' || user.role === 'SUPER_ADMIN'

      // Build where clause
      const where: any = {
        tenantId,
        // Exclude the current user from the list
        NOT: { id: user.id },
      }

      // For portal users: only show team members from their bookings/tasks
      if (!isAdmin) {
        // Get all team member IDs that are assigned to this user's bookings or tasks
        const [taskAssignees, bookingAssignees] = await Promise.all([
          prisma.task.findMany({
            where: {
              tenantId,
              OR: [
                // Tasks created by the user
                { createdById: user.id },
                // Tasks assigned to the user
                { assigneeId: user.id },
              ],
            },
            select: { assigneeId: true },
            distinct: ['assigneeId'],
          }),
          prisma.booking.findMany({
            where: {
              tenantId,
              clientId: user.id,
            },
            select: { assignedToId: true },
            distinct: ['assignedToId'],
          }),
        ])

        const teamMemberIds = new Set<string>()

        // Add task assignees
        taskAssignees.forEach((t) => {
          if (t.assigneeId) teamMemberIds.add(t.assigneeId)
        })

        // Add booking assignees
        bookingAssignees.forEach((b) => {
          // @ts-ignore - assignedToId exists in schema but types might lag
          if (b.assignedToId) teamMemberIds.add(b.assignedToId)
        })

        // Add the user's department colleagues if they have a department
        if (user.department) {
          const deptColleagues = await prisma.user.findMany({
            where: {
              tenantId,
              department: user.department,
              NOT: { id: user.id },
            },
            select: { id: true },
          })
          deptColleagues.forEach((c) => teamMemberIds.add(c.id))
        }

        if (teamMemberIds.size > 0) {
          where.id = { in: Array.from(teamMemberIds) }
        } else {
          // No team members visible
          return respond.ok({
            data: [],
            meta: { total: 0, limit, offset, hasMore: false },
          })
        }
      }

      // Apply search filter
      if (search) {
        where.OR = [
          { name: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } },
          { position: { contains: search, mode: 'insensitive' } },
        ]
      }

      // Apply department filter
      if (department) {
        where.department = department
      }

      // Apply status filter (for future online status tracking)
      // Currently, status is not tracked in the database
      // This is prepared for future implementation

      // Get total count
      const total = await prisma.user.count({ where })

      // Fetch team members
      const members = await prisma.user.findMany({
        where,
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
          department: true,
          position: true,
        },
        orderBy: { name: 'asc' },
        skip: offset,
        take: limit,
      })

      // Transform to TeamMember format
      const teamMembers = members.map((m) => ({
        ...m,
        status: 'offline' as const, // Default status - can be enhanced with real-time tracking
      }))

      return respond.ok({
        data: teamMembers,
        meta: {
          total,
          limit,
          offset,
          hasMore: offset + limit < total,
        },
      })
    } catch (error) {
      if (error instanceof z.ZodError) {
        return respond.badRequest('Invalid filter parameters', error.errors)
      }
      console.error('Error fetching team members:', error)
      return respond.serverError()
    }
  },
  { requireAuth: true }
)
