import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { withTenantContext } from '@/lib/api-wrapper'
import { requireTenantContext } from '@/lib/tenant-utils'
import { PERMISSIONS, hasPermission } from '@/lib/permissions'
import { ServiceSchema } from '@/schemas/services'
import { logAudit } from '@/lib/audit'
import { respond } from '@/lib/api-response'
import { logger } from '@/lib/logger'

/**
 * Filter service fields based on user role
 * Admin sees all fields, Portal users see limited fields
 */
function filterServiceFields(service: any, userRole: string) {
  if (userRole === 'ADMIN' || userRole === 'TEAM_LEAD' || userRole === 'TEAM_MEMBER') {
    return service
  }

  // Portal user - exclude admin-only fields
  const {
    basePrice,
    advanceBookingDays,
    minAdvanceHours,
    maxDailyBookings,
    bufferTime,
    businessHours,
    blackoutDates,
    costPerUnit,
    profitMargin,
    internalNotes,
    ...portalFields
  } = service

  return portalFields
}

/**
 * GET /api/services/[slug]
 * Get service by slug with role-based field filtering
 */
export const GET = withTenantContext(
  async (request: NextRequest, context: { params: Promise<{ slug: string }> }) => {
    try {
      const { slug } = await context.params

      // Verify it's a valid slug format
      if (!slug || typeof slug !== 'string' || slug.length === 0) {
        return respond.badRequest('Invalid service slug')
      }

      // Get user context (optional for GET)
      let userRole = 'PUBLIC'
      try {
        const ctx = requireTenantContext()
        userRole = ctx.role || 'PUBLIC'
      } catch {
        // Allow public access to read service info
      }

      // Find service by slug
      const service = await prisma.service.findFirst({
        where: {
          slug,
          ...(userRole === 'PUBLIC' || userRole === 'CLIENT'
            ? { active: true, status: 'ACTIVE' }
            : {}),
        },
        include: {
          availabilitySlots: true,
          reviews: { take: 5, orderBy: { createdAt: 'desc' } },
        },
      })

      if (!service) {
        return respond.notFound('Service not found')
      }

      // Filter fields based on role
      const filteredService = filterServiceFields(service, userRole)

      // Increment views counter (best-effort, non-blocking)
      prisma.service
        .update({
          where: { id: service.id },
          data: { views: { increment: 1 } },
        })
        .catch(() => {
          // Silently ignore view counter errors
        })

      return respond.ok(filteredService, {
        cacheControl: 'public, max-age=60, stale-while-revalidate=300',
      })
    } catch (error) {
      logger.error('Failed to fetch service detail', { error })
      return respond.serverError('Failed to fetch service')
    }
  },
  { requireAuth: false }
)

/**
 * PUT /api/services/[slug]
 * Update service (Admin only)
 */
export const PUT = withTenantContext(
  async (request: NextRequest, context: { params: Promise<{ slug: string }> }) => {
    try {
      const { slug } = await context.params
      const ctx = requireTenantContext()

      // Check permission
      if (!hasPermission(ctx.role, PERMISSIONS.SERVICES_UPDATE)) {
        return respond.forbidden('You do not have permission to update services')
      }

      let body = await request.json()

      // Find existing service
      const existing = await prisma.service.findFirst({
        where: {
          slug,
          tenantId: ctx.tenantId,
        },
      })

      if (!existing) {
        return respond.notFound('Service not found')
      }

      // Validate update data
      const validatedData = ServiceSchema.partial().parse(body)

      // Update service
      const updated = await prisma.service.update({
        where: { id: existing.id },
        data: {
          ...validatedData,
          updatedAt: new Date(),
        },
        include: {
          availabilitySlots: true,
        },
      })

      // Log audit
      await logAudit({
        action: 'service.updated',
        actorId: ctx.userId,
        targetId: updated.id,
        details: { name: updated.name, slug: updated.slug, changes: body },
      })

      return respond.ok(updated)
    } catch (error) {
      logger.error('Failed to update service', { error })

      if (error instanceof Error) {
        if (error.message.includes('Zod') || error.message.includes('validation')) {
          return respond.badRequest('Invalid service data')
        }
      }

      return respond.serverError('Failed to update service')
    }
  },
  { requireAuth: true }
)

/**
 * DELETE /api/services/[slug]
 * Delete service (Admin only - performs soft delete)
 */
export const DELETE = withTenantContext(
  async (request: NextRequest, context: { params: Promise<{ slug: string }> }) => {
    try {
      const { slug } = await context.params
      const ctx = requireTenantContext()

      // Check permission
      if (!hasPermission(ctx.role, PERMISSIONS.SERVICES_DELETE)) {
        return respond.forbidden('You do not have permission to delete services')
      }

      // Find existing service
      const existing = await prisma.service.findFirst({
        where: {
          slug,
          tenantId: ctx.tenantId,
        },
      })

      if (!existing) {
        return respond.notFound('Service not found')
      }

      // Soft delete by setting active to false and status to ARCHIVED
      const deleted = await prisma.service.update({
        where: { id: existing.id },
        data: {
          active: false,
          status: 'ARCHIVED',
          deletedAt: new Date(),
        },
      })

      // Log audit
      await logAudit({
        action: 'service.deleted',
        actorId: ctx.userId,
        targetId: deleted.id,
        details: { name: deleted.name, slug: deleted.slug },
      })

      return respond.ok({ success: true, message: 'Service deleted successfully' })
    } catch (error) {
      logger.error('Failed to delete service', { error })
      return respond.serverError('Failed to delete service')
    }
  },
  { requireAuth: true }
)
