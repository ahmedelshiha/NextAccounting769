import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { withTenantContext } from '@/lib/api-wrapper'
import { requireTenantContext } from '@/lib/tenant-utils'
import { hasRole } from '@/lib/permissions'

export const GET = withTenantContext(async () => {
  try {
    const ctx = requireTenantContext()

    const allowed = ['ADMIN', 'TEAM_LEAD', 'STAFF']
    if (!ctx.role || !hasRole(ctx.role, allowed)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const now = new Date()
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const startOfWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0)

    const tenantScope: any = ctx.tenantId && ctx.tenantId !== 'undefined' ? { client: { tenantId: String(ctx.tenantId) } } : {}

    const [
      totalBookings,
      pendingBookings,
      confirmedBookings,
      completedBookings,
      cancelledBookings,
      todayBookings,
      thisMonthBookings,
      lastMonthBookings,
      weekRevenue,
      totalRevenue,
      completedThisMonth,
      completedLastMonth,
    ] = await Promise.all([
      prisma.booking.count({ where: { ...tenantScope } }),
      prisma.booking.count({ where: { status: 'PENDING', ...tenantScope } }),
      prisma.booking.count({ where: { status: 'CONFIRMED', ...tenantScope } }),
      prisma.booking.count({ where: { status: 'COMPLETED', ...tenantScope } }),
      prisma.booking.count({ where: { status: 'CANCELLED', ...tenantScope } }),
      prisma.booking.count({ where: { scheduledAt: { gte: startOfToday, lt: new Date(startOfToday.getTime() + 24 * 60 * 60 * 1000) }, ...tenantScope } }),
      prisma.booking.count({ where: { createdAt: { gte: startOfMonth }, ...tenantScope } }),
      prisma.booking.count({ where: { createdAt: { gte: startOfLastMonth, lt: startOfMonth }, ...tenantScope } }),
      prisma.booking.aggregate({ _sum: { duration: true }, where: { status: 'COMPLETED', scheduledAt: { gte: startOfWeek }, ...tenantScope } }),
      prisma.booking.aggregate({ _sum: { duration: true }, where: { status: 'COMPLETED', ...tenantScope } }),
      prisma.booking.count({ where: { status: 'COMPLETED', scheduledAt: { gte: startOfMonth }, ...tenantScope } }),
      prisma.booking.count({ where: { status: 'COMPLETED', scheduledAt: { gte: startOfLastMonth, lt: startOfMonth }, ...tenantScope } }),
    ])

    const growth = lastMonthBookings > 0 ? ((thisMonthBookings - lastMonthBookings) / lastMonthBookings) * 100 : thisMonthBookings > 0 ? 100 : 0

    const noShowBookings = 0
    const totalScheduled = confirmedBookings + completedBookings + cancelledBookings + noShowBookings
    const completionRate = totalScheduled > 0 ? (completedBookings / totalScheduled) * 100 : 0

    const weekRevenueAmount = Number((weekRevenue as any)._sum.duration) || 0
    const totalRevenueAmount = Number((totalRevenue as any)._sum.duration) || 0
    const averageBookingValue = completedBookings > 0 ? totalRevenueAmount / completedBookings : 0

    const stats = {
      total: totalBookings,
      pending: pendingBookings,
      confirmed: confirmedBookings,
      completed: completedBookings,
      cancelled: cancelledBookings,
      noShows: noShowBookings,
      todayBookings,
      weekRevenue: weekRevenueAmount,
      averageBookingValue: Math.round(averageBookingValue),
      completionRate: Math.round(completionRate * 10) / 10,
      growth: Math.round(growth * 10) / 10,
    }

    return NextResponse.json({ success: true, data: stats })
  } catch (error) {
    console.error('Error fetching booking statistics:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
})
