import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { sumDecimals } from '@/lib/decimal-utils'
import { hasPermission, PERMISSIONS } from '@/lib/permissions'
import { tenantFilter } from '@/lib/tenant'
import { withTenantContext } from '@/lib/api-wrapper'
import { requireTenantContext } from '@/lib/tenant-utils'

function isDbSchemaError(e: any) {
  const code = String(e?.code || '')
  const msg = String(e?.message || '')
  return code.startsWith('P10') || code.startsWith('P20') || /relation|table|column/i.test(msg)
}

export const runtime = 'nodejs'

export const GET = withTenantContext(async (request: NextRequest) => {
  try {
    const ctx = requireTenantContext()
    const role = ctx.role as string | undefined
    if (!ctx.userId || !hasPermission(role, PERMISSIONS.ANALYTICS_VIEW)) {
      console.warn('Forbidden access to /api/admin/stats/bookings', { userId: ctx.userId, role, isSuperAdmin: ctx.isSuperAdmin })
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const tenantId = ctx.tenantId
    const rangeParam = (searchParams.get('range') || '').toLowerCase()
    const days = rangeParam === '7d' ? 7 : rangeParam === '30d' ? 30 : rangeParam === '90d' ? 90 : rangeParam === '1y' ? 365 : 0

    const now = new Date()
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const endOfToday = new Date(startOfToday.getTime() + 24 * 60 * 60 * 1000)

    const total = await prisma.booking.count({ where: tenantFilter(tenantId) })

    const [pending, confirmed, completed, cancelled] = await Promise.all([
      prisma.booking.count({ where: { ...tenantFilter(tenantId), status: 'PENDING' } }),
      prisma.booking.count({ where: { ...tenantFilter(tenantId), status: 'CONFIRMED' } }),
      prisma.booking.count({ where: { ...tenantFilter(tenantId), status: 'COMPLETED' } }),
      prisma.booking.count({ where: { ...tenantFilter(tenantId), status: 'CANCELLED' } })
    ])

    const today = await prisma.booking.count({
      where: { ...tenantFilter(tenantId), scheduledAt: { gte: startOfToday, lt: endOfToday } }
    })

    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const thisMonth = await prisma.booking.count({
      where: { ...tenantFilter(tenantId), createdAt: { gte: startOfMonth } }
    })

    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0)
    const lastMonth = await prisma.booking.count({
      where: { ...tenantFilter(tenantId), createdAt: { gte: startOfLastMonth, lte: endOfLastMonth } }
    })

    const growth = lastMonth > 0 ? ((thisMonth - lastMonth) / lastMonth) * 100 : 0

    const completedBookings = (await prisma.booking.findMany({
      where: { ...tenantFilter(tenantId), status: 'COMPLETED' },
      include: { service: { select: { price: true } } }
    })) as Array<import('@prisma/client').Booking & { service: { price: unknown } | null }>

    const priceValues = completedBookings.map((b) => b?.service?.price as import('@/lib/decimal-utils').DecimalLike)
    const totalRevenue = sumDecimals(priceValues)

    const thisMonthRevenue = sumDecimals(
      completedBookings
        .filter((booking) => booking.createdAt >= startOfMonth)
        .map((b) => b?.service?.price as import('@/lib/decimal-utils').DecimalLike)
    )

    const lastMonthRevenue = sumDecimals(
      completedBookings
        .filter((booking) => booking.createdAt >= startOfLastMonth && booking.createdAt <= endOfLastMonth)
        .map((b) => b?.service?.price as import('@/lib/decimal-utils').DecimalLike)
    )

    const revenueGrowth = lastMonthRevenue > 0 ? ((thisMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100 : 0

    const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
    const upcoming = await prisma.booking.count({
      where: { ...tenantFilter(tenantId), scheduledAt: { gte: now, lte: nextWeek }, status: { in: ['PENDING', 'CONFIRMED'] } }
    })

    let ranged: { range?: string; bookings?: number; revenue?: number; growth?: number } = {}
    if (days > 0) {
      const start = new Date(now.getTime() - days * 24 * 60 * 60 * 1000)
      const prevStart = new Date(start.getTime() - days * 24 * 60 * 60 * 1000)

      const bookingsInRange = await prisma.booking.count({ where: { ...tenantFilter(tenantId), createdAt: { gte: start } } })
      const bookingsPrevRange = await prisma.booking.count({ where: { ...tenantFilter(tenantId), createdAt: { gte: prevStart, lt: start } } })

      const completedInRange = (await prisma.booking.findMany({
        where: { ...tenantFilter(tenantId), status: 'COMPLETED', createdAt: { gte: start } },
        include: { service: { select: { price: true } } }
      })) as Array<import('@prisma/client').Booking & { service: { price: unknown } | null }>
      const revenueInRange = sumDecimals(completedInRange.map(b => b?.service?.price as import('@/lib/decimal-utils').DecimalLike))

      const completedPrevRange = (await prisma.booking.findMany({
        where: { ...tenantFilter(tenantId), status: 'COMPLETED', createdAt: { gte: prevStart, lt: start } },
        include: { service: { select: { price: true } } }
      })) as Array<import('@prisma/client').Booking & { service: { price: unknown } | null }>
      const _revenuePrevRange = sumDecimals(completedPrevRange.map(b => b?.service?.price as import('@/lib/decimal-utils').DecimalLike))

      const growthRange = bookingsPrevRange > 0 ? ((bookingsInRange - bookingsPrevRange) / bookingsPrevRange) * 100 : 0

      ranged = { range: rangeParam, bookings: bookingsInRange, revenue: revenueInRange, growth: Math.round(growthRange * 100) / 100 }
    }

    return NextResponse.json({
      total,
      pending,
      confirmed,
      completed,
      cancelled,
      today,
      thisMonth,
      lastMonth,
      growth: Math.round(growth * 100) / 100,
      upcoming,
      revenue: { total: totalRevenue, thisMonth: thisMonthRevenue, lastMonth: lastMonthRevenue, growth: Math.round(revenueGrowth * 100) / 100 },
      range: ranged
    })
  } catch (error) {
    console.error('Error fetching booking statistics:', error)
    if (isDbSchemaError(error)) {
      return NextResponse.json({
        total: 0,
        pending: 0,
        confirmed: 0,
        completed: 0,
        cancelled: 0,
        today: 0,
        thisMonth: 0,
        lastMonth: 0,
        growth: 0,
        upcoming: 0,
        revenue: { total: 0, thisMonth: 0, lastMonth: 0, growth: 0 },
        range: {}
      })
    }
    return NextResponse.json({ error: 'Failed to fetch booking statistics' }, { status: 500 })
  }
})
