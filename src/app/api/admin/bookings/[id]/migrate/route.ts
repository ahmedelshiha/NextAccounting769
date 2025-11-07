import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { withTenantContext } from '@/lib/api-wrapper'
import { requireTenantContext } from '@/lib/tenant-utils'
import { hasRole } from '@/lib/permissions'

export const POST = withTenantContext(async (_request: NextRequest, context: { params: Promise<{ id: string }> }) => {
  try {
    const { id } = await context.params
    const ctx = requireTenantContext()

    const allowed = ['ADMIN', 'TEAM_LEAD', 'TEAM_MEMBER', 'STAFF']
    if (!ctx.role || !hasRole(ctx.role, allowed)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    // Ensure booking exists and belongs to tenant (via client relation until tenantId is on Booking)
    const booking = await prisma.booking.findFirst({ where: { id, ...(ctx.tenantId && ctx.tenantId !== 'undefined' ? { client: { tenantId: String(ctx.tenantId) } } : {}) } as any })
    if (!booking) return NextResponse.json({ error: 'Booking not found' }, { status: 404 })

    // Create a ServiceRequest from booking data
    const title = `Appointment: ${booking.id}`
    const payload: any = {
      title,
      description: (booking as any).notes || undefined,
      priority: 'MEDIUM',
      isBooking: true,
      scheduledAt: (booking as any).scheduledAt ?? undefined,
      duration: (booking as any).duration ?? undefined,
      requirements: { migratedFromBookingId: booking.id },
    }

    const sr = await prisma.serviceRequest.create({ data: {
      client: { connect: { id: (booking as any).clientId } },
      service: { connect: { id: (booking as any).serviceId } },
      ...payload,
      tenant: (ctx.tenantId ? { connect: { id: ctx.tenantId } } : undefined),
    } })

    const updated = await prisma.booking.update({ where: { id }, data: { serviceRequest: { connect: { id: sr.id } } } })

    return NextResponse.json({ success: true, data: { serviceRequest: sr, booking: updated } })
  } catch (error) {
    console.error('Error migrating booking to service request:', error)
    return NextResponse.json({ error: 'Failed to migrate booking' }, { status: 500 })
  }
})
