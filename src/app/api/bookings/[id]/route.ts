import { NextRequest } from 'next/server'
import prisma from '@/lib/prisma'
import type { BookingStatus } from '@prisma/client'
import { withTenantContext } from '@/lib/api-wrapper'
import { requireTenantContext } from '@/lib/tenant-utils'
import { isMultiTenancyEnabled } from '@/lib/tenant'
import { PERMISSIONS, hasPermission } from '@/lib/permissions'
import { logAudit } from '@/lib/audit'
import { respond } from '@/lib/api-response'
import { logger } from '@/lib/logger'
import { publishBookingUpdated, publishBookingDeleted } from '@/lib/realtime/booking-events'

/**
 * Filter booking fields based on user role and ownership
 */
function filterBookingFields(booking: any, userRole: string, userId: string) {
  // Admin and team members see all fields
  if (userRole === 'ADMIN' || userRole === 'TEAM_LEAD' || userRole === 'TEAM_MEMBER') {
    return booking
  }

  // Portal users can see most fields but not internal notes
  const { internalNotes, profitMargin, costPerUnit, ...portalFields } = booking
  return portalFields
}

/**
 * Check if user can access booking
 */
function canAccessBooking(booking: any, ctx: any): boolean {
  // Admin/team members can access all bookings
  if (ctx.role === 'ADMIN' || ctx.role === 'TEAM_LEAD' || ctx.role === 'TEAM_MEMBER') {
    return true
  }

  // Portal users can only access their own bookings
  return booking.clientId === ctx.userId
}

/**
 * GET /api/bookings/[id]
 * Get booking by ID with role-based field filtering
 */
export const GET = withTenantContext(
  async (request: NextRequest, context: { params: Promise<{ id: string }> }) => {
    try {
      const { id } = await context.params
      const ctx = requireTenantContext()

      if (!id || typeof id !== 'string') {
        return respond.badRequest('Invalid booking ID')
      }

      // Fetch booking with relations
      const booking = await prisma.booking.findUnique({
        where: { id },
        include: {
          service: { select: { id: true, name: true, slug: true, duration: true, price: true, description: true, tenantId: true } },
          client: { select: { id: true, name: true, email: true, image: true } },
          assignedTeamMember: { select: { id: true, name: true, email: true, image: true } },
        },
      })

      if (!booking) {
        return respond.notFound('Booking not found')
      }

      // Check tenant access
      if (isMultiTenancyEnabled() && ctx.tenantId) {
        const bookingTenantId = booking.tenantId || (booking as any).service?.tenantId
        if (bookingTenantId && bookingTenantId !== ctx.tenantId) {
          return respond.notFound('Booking not found')
        }
      }

      // Check user access permission
      if (!canAccessBooking(booking, ctx)) {
        return respond.forbidden('You do not have permission to view this booking')
      }

      // Filter fields based on role
      const filteredBooking = filterBookingFields(booking, ctx.role, ctx.userId)

      return respond.ok(filteredBooking)
    } catch (error) {
      logger.error('Failed to fetch booking detail', { error })
      return respond.serverError('Failed to fetch booking')
    }
  },
  { requireAuth: true }
)

/**
 * PUT /api/bookings/[id]
 * Update booking
 * - Portal users: can update notes and reschedule (if allowed)
 * - Admin users: can update all fields
 */
export const PUT = withTenantContext(
  async (request: NextRequest, context: { params: Promise<{ id: string }> }) => {
    try {
      const { id } = await context.params
      const ctx = requireTenantContext()

      if (!id || typeof id !== 'string') {
        return respond.badRequest('Invalid booking ID')
      }

      let body = await request.json()

      // Fetch existing booking
      const existing = await prisma.booking.findUnique({
        where: { id },
        include: { service: { select: { tenantId: true } } },
      })

      if (!existing) {
        return respond.notFound('Booking not found')
      }

      // Check tenant access
      if (isMultiTenancyEnabled() && ctx.tenantId) {
        const bookingTenantId = existing.tenantId || (existing as any).service?.tenantId
        if (bookingTenantId && bookingTenantId !== ctx.tenantId) {
          return respond.notFound('Booking not found')
        }
      }

      // Check user access permission
      if (!canAccessBooking(existing, ctx)) {
        return respond.forbidden('You do not have permission to update this booking')
      }

      const updateData: any = {}
      const isAdmin = ctx.role === 'ADMIN' || ctx.role === 'TEAM_LEAD' || ctx.role === 'TEAM_MEMBER'
      const isOwner = existing.clientId === ctx.userId

      // Admin-only fields
      if (isAdmin) {
        if (body.status) updateData.status = body.status as BookingStatus
        if (body.scheduledAt) updateData.scheduledAt = new Date(body.scheduledAt)
        if (body.internalNotes !== undefined) updateData.internalNotes = body.internalNotes
        if (body.confirmed !== undefined) updateData.confirmed = body.confirmed
        if (body.assignedTeamMemberId !== undefined) {
          updateData.assignedTeamMemberId = body.assignedTeamMemberId || null
        }
      }

      // User-editable fields
      if (body.notes !== undefined && (isAdmin || isOwner)) {
        updateData.notes = body.notes
      }

      // Portal users can reschedule only if not confirmed
      if (isOwner && !isAdmin && body.scheduledAt && !existing.confirmed) {
        updateData.scheduledAt = new Date(body.scheduledAt)
      }

      // Log what's being updated
      await logAudit({
        action: 'booking.updated',
        actorId: ctx.userId,
        targetId: existing.id,
        details: {
          changes: Object.keys(updateData),
          scheduledAt: updateData.scheduledAt,
          status: updateData.status,
        },
      })

      // Update booking
      const updated = await prisma.booking.update({
        where: { id },
        data: updateData,
        include: {
          service: { select: { id: true, name: true, slug: true } },
          client: { select: { id: true, name: true, email: true } },
          assignedTeamMember: { select: { id: true, name: true, email: true } },
        },
      })

      // Publish real-time event for portal and admin notifications
      publishBookingUpdated({
        id: updated.id,
        serviceId: updated.serviceId,
        action: 'updated',
      })

      // Filter fields based on role
      const filteredBooking = filterBookingFields(updated, ctx.role, ctx.userId)

      return respond.ok(filteredBooking)
    } catch (error) {
      logger.error('Failed to update booking', { error })

      if (error instanceof Error) {
        if (error.message.includes('conflict') || error.message.includes('constraint')) {
          return respond.badRequest('Booking time slot is not available')
        }
      }

      return respond.serverError('Failed to update booking')
    }
  },
  { requireAuth: true }
)

/**
 * DELETE /api/bookings/[id]
 * Cancel booking
 * - Portal users: can cancel if not confirmed
 * - Admin users: can cancel anytime
 */
export const DELETE = withTenantContext(
  async (request: NextRequest, context: { params: Promise<{ id: string }> }) => {
    try {
      const { id } = await context.params
      const ctx = requireTenantContext()

      if (!id || typeof id !== 'string') {
        return respond.badRequest('Invalid booking ID')
      }

      // Fetch booking
      const booking = await prisma.booking.findUnique({
        where: { id },
        include: { service: { select: { tenantId: true } } },
      })

      if (!booking) {
        return respond.notFound('Booking not found')
      }

      // Check tenant access
      if (isMultiTenancyEnabled() && ctx.tenantId) {
        const bookingTenantId = booking.tenantId || (booking as any).service?.tenantId
        if (bookingTenantId && bookingTenantId !== ctx.tenantId) {
          return respond.notFound('Booking not found')
        }
      }

      // Check user access and cancellation permission
      if (!canAccessBooking(booking, ctx)) {
        return respond.forbidden('You do not have permission to cancel this booking')
      }

      // Portal users can only cancel unconfirmed bookings
      const isAdmin = ctx.role === 'ADMIN' || ctx.role === 'TEAM_LEAD' || ctx.role === 'TEAM_MEMBER'
      if (!isAdmin && booking.confirmed) {
        return respond.forbidden('Cannot cancel confirmed booking. Please contact support.')
      }

      // Log audit
      await logAudit({
        action: 'booking.cancelled',
        actorId: ctx.userId,
        targetId: booking.id,
        details: { status: booking.status },
      })

      // Cancel booking
      const cancelled = await prisma.booking.update({
        where: { id },
        data: { status: 'CANCELLED' as BookingStatus },
        include: {
          service: { select: { id: true, name: true } },
          client: { select: { id: true, email: true, name: true } },
        },
      })

      // Publish real-time event for portal and admin notifications
      publishBookingDeleted({
        id: cancelled.id,
        serviceId: cancelled.serviceId,
        action: 'deleted',
      })

      return respond.ok({ success: true, message: 'Booking cancelled successfully', data: cancelled })
    } catch (error) {
      logger.error('Failed to cancel booking', { error })
      return respond.serverError('Failed to cancel booking')
    }
  },
  { requireAuth: true }
)

/**
 * OPTIONS /api/bookings/[id]
 * CORS options
 */
export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: { Allow: 'GET, PUT, DELETE, OPTIONS' },
  })
}
