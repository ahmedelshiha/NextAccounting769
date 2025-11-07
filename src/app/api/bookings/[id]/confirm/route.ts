import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import type { BookingStatus } from '@prisma/client'
import { withTenantContext } from '@/lib/api-wrapper'
import { requireTenantContext } from '@/lib/tenant-utils'
import { sendBookingConfirmation } from '@/lib/email'
import { hasRole } from '@/lib/permissions'

// POST /api/bookings/[id]/confirm - Confirm booking and send email
export const POST = withTenantContext(async (request: NextRequest, context: { params: Promise<{ id: string }> }) => {
  try {
    const { id } = await context.params
    const ctx = requireTenantContext()
    if (!ctx.userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    if (!hasRole(ctx.role ?? '', ['ADMIN', 'TEAM_LEAD', 'TEAM_MEMBER', 'STAFF'])) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const booking = await prisma.booking.findUnique({ where: { id }, include: { client: { select: { id: true, name: true, email: true } }, service: { select: { id: true, name: true, price: true } } } })

    if (!booking) return NextResponse.json({ error: 'Booking not found' }, { status: 404 })

    const updatedBooking = await prisma.booking.update({ where: { id }, data: { status: 'CONFIRMED', confirmed: true }, include: { client: { select: { id: true, name: true, email: true } }, service: { select: { id: true, name: true, price: true } } } })

    try {
      await sendBookingConfirmation({
        id: updatedBooking.id,
        scheduledAt: updatedBooking.scheduledAt,
        duration: updatedBooking.duration,
        clientName: updatedBooking.clientName,
        clientEmail: updatedBooking.clientEmail,
        service: { name: updatedBooking.service.name, price: updatedBooking.service.price ? Number(updatedBooking.service.price) : 0 },
      })
    } catch (emailError) {
      console.error('Failed to send confirmation email:', emailError)
    }

    return NextResponse.json({ message: 'Booking confirmed successfully', booking: updatedBooking })
  } catch (error) {
    console.error('Error confirming booking:', error)
    return NextResponse.json({ error: 'Failed to confirm booking' }, { status: 500 })
  }
})
