import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { withTenantContext } from '@/lib/api-wrapper'
import { requireTenantContext } from '@/lib/tenant-utils'
import { PERMISSIONS, hasPermission } from '@/lib/permissions'
import { applyRateLimit, getClientIp } from '@/lib/rate-limit'
import { logAudit } from '@/lib/audit'
import { respond } from '@/lib/api-response'
import { logger } from '@/lib/logger'
import { publishBookingCreated } from '@/lib/realtime/booking-events'

/**
 * Filter booking fields based on user role
 * Admin sees all fields, Portal users see limited fields for their bookings
 */
function filterBookingFields(booking: any, userRole: string, userId: string) {
  // Admin and team members can see all fields
  if (userRole === 'ADMIN' || userRole === 'TEAM_LEAD' || userRole === 'TEAM_MEMBER') {
    return booking
  }

  // Portal users can see most fields but not internal notes
  const { internalNotes, profitMargin, costPerUnit, ...portalFields } = booking

  return portalFields
}

/**
 * Build where clause based on user role
 */
function buildBookingWhereClause(ctx: any) {
  const baseClause: any = { tenantId: ctx.tenantId }

  // Portal users only see their own bookings
  if (ctx.role !== 'ADMIN' && ctx.role !== 'TEAM_LEAD' && ctx.role !== 'TEAM_MEMBER') {
    baseClause.clientId = ctx.userId
  }

  return baseClause
}

/**
 * GET /api/bookings
 * List bookings with optional filters
 * - Portal users: see only their own bookings, limited fields
 * - Admin users: see all bookings, all fields, with optional filters
 */
export const GET = withTenantContext(
  async (request: NextRequest) => {
    try {
      const ctx = requireTenantContext()

      // Rate limiting
      const ip = getClientIp(request as any)
      const rl = await applyRateLimit(`bookings-list:${ip}`, 100, 60_000)
      if (rl && !rl.allowed) {
        await logAudit({
          action: 'security.ratelimit.block',
          details: { ip, key: `bookings-list:${ip}`, route: new URL(request.url).pathname },
        }).catch(() => {}) // Don't fail if audit logging fails
        return respond.tooMany('Rate limit exceeded')
      }

      // Check permission
      if (ctx.role === 'ADMIN' || ctx.role === 'TEAM_LEAD' || ctx.role === 'TEAM_MEMBER') {
        if (!hasPermission(ctx.role, PERMISSIONS.BOOKINGS_VIEW)) {
          return respond.forbidden('You do not have permission to view bookings')
        }
      }

      // Parse query parameters
      const sp = new URL(request.url).searchParams
      const status = sp.get('status') || undefined
      const serviceId = sp.get('serviceId') || undefined
      const clientId = sp.get('clientId') || undefined
      const limit = Math.min(Number(sp.get('limit')) || 20, 100)
      const offset = Number(sp.get('offset')) || 0
      const sortBy = (sp.get('sortBy') || 'scheduledAt') as string
      const sortOrder = (sp.get('sortOrder') || 'desc').toUpperCase()

      // Build where clause
      const where = buildBookingWhereClause(ctx)

      // Apply optional filters
      if (status) where.status = status
      if (serviceId) where.serviceId = serviceId

      // Admin can filter by client
      if (clientId && (ctx.role === 'ADMIN' || ctx.role === 'TEAM_LEAD' || ctx.role === 'TEAM_MEMBER')) {
        where.clientId = clientId
      }

      // Fetch bookings
      const [bookings, total] = await Promise.all([
        prisma.booking.findMany({
          where,
          take: limit,
          skip: offset,
          orderBy: { [sortBy]: sortOrder === 'ASC' ? 'asc' : 'desc' },
          include: {
            service: { select: { id: true, name: true, slug: true } },
            client: { select: { id: true, email: true, name: true, image: true } },
            assignedTeamMember: ctx.role === 'ADMIN' || ctx.role === 'TEAM_LEAD' ? { select: { id: true, email: true, name: true, image: true } } : false,
          },
        }),
        prisma.booking.count({ where }),
      ])

      // Filter fields based on role
      const filteredBookings = bookings.map((b) => filterBookingFields(b, ctx.role, ctx.userId))

      return respond.ok(filteredBookings, {
        pagination: {
          total,
          limit,
          offset,
          hasMore: offset + bookings.length < total,
        },
      })
    } catch (error) {
      logger.error('Failed to fetch bookings', { error })
      return respond.serverError('Failed to fetch bookings')
    }
  },
  { requireAuth: true }
)

/**
 * POST /api/bookings
 * Create a new booking
 * - Portal users: can create their own bookings
 * - Admin users: can create bookings for clients
 */
export const POST = withTenantContext(
  async (request: NextRequest) => {
    try {
      const ctx = requireTenantContext()

      // Rate limiting for creation
      const rl = await applyRateLimit(`bookings-create:${ctx.userId}`, 10, 3600_000)
      if (rl && !rl.allowed) {
        return respond.tooMany('Too many booking creation attempts')
      }

      let body = await request.json()

      // Extract fields
      const {
        serviceId,
        scheduledAt,
        duration,
        clientId,
        clientName,
        clientEmail,
        clientPhone,
        notes,
        assignedTeamMemberId,
      } = body

      // Validation
      if (!serviceId) return respond.badRequest('Service ID is required')
      if (!scheduledAt) return respond.badRequest('Scheduled date is required')

      // Portal users create bookings for themselves
      const actualClientId = ctx.role === 'ADMIN' ? clientId || ctx.userId : ctx.userId

      // Verify service exists
      const service = await prisma.service.findUnique({
        where: { id: serviceId },
        select: { id: true, name: true, tenantId: true, duration: true },
      })

      if (!service || service.tenantId !== ctx.tenantId) {
        return respond.badRequest('Service not found')
      }

      // Verify client exists if different from current user
      if (actualClientId !== ctx.userId && ctx.role === 'ADMIN') {
        const clientExists = await prisma.user.findFirst({
          where: { id: actualClientId, tenantId: ctx.tenantId },
          select: { id: true },
        })
        if (!clientExists) {
          return respond.badRequest('Client not found')
        }
      }

      // Create booking
      const booking = await prisma.booking.create({
        data: {
          serviceId,
          clientId: actualClientId,
          tenantId: ctx.tenantId,
          scheduledAt: new Date(scheduledAt),
          duration: duration || service.duration || 60,
          status: 'PENDING',
          clientName: clientName || undefined,
          clientEmail: clientEmail || undefined,
          clientPhone: clientPhone || undefined,
          notes: notes || undefined,
          assignedTeamMemberId:
            assignedTeamMemberId && (ctx.role === 'ADMIN' || ctx.role === 'TEAM_LEAD')
              ? assignedTeamMemberId
              : undefined,
          createdBy: ctx.userId,
        },
        include: {
          service: { select: { id: true, name: true, slug: true } },
          client: { select: { id: true, email: true, name: true } },
          assignedTeamMember: { select: { id: true, email: true, name: true } },
        },
      })

      // Log audit
      await logAudit({
        action: 'booking.created',
        actorId: ctx.userId,
        targetId: booking.id,
        details: {
          serviceId: booking.serviceId,
          clientId: booking.clientId,
          scheduledAt: booking.scheduledAt,
        },
      })

      // Publish real-time event for portal and admin notifications
      publishBookingCreated({
        id: booking.id,
        serviceId: booking.serviceId,
        action: 'created',
      })

      return respond.created(booking)
    } catch (error) {
      logger.error('Failed to create booking', { error })

      if (error instanceof Error) {
        if (error.message.includes('Zod') || error.message.includes('validation')) {
          return respond.badRequest('Invalid booking data')
        }
        if (error.message.includes('conflict') || error.message.includes('constraint')) {
          return respond.badRequest('Booking time slot is not available')
        }
      }

      return respond.serverError('Failed to create booking')
    }
  },
  { requireAuth: true }
)
