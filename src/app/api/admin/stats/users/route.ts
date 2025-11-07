import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { hasPermission, PERMISSIONS } from '@/lib/permissions'
import { tenantFilter } from '@/lib/tenant'
import { withTenantContext } from '@/lib/api-wrapper'
import { requireTenantContext } from '@/lib/tenant-utils'

export const runtime = 'nodejs'

// Response type for type safety
interface UserStatsResponse {
  total: number
  clients: number
  staff: number
  admins: number
  newThisMonth: number
  newLastMonth: number
  growth: number
  activeUsers: number
  registrationTrends: Array<{ month: string; count: number }>
  topUsers: Array<{
    id: string
    name: string | null
    email: string
    bookingsCount: number
    createdAt: Date | string
  }>
  range?: { range?: string; newUsers?: number; growth?: number }
}

export const GET = withTenantContext(async (request: NextRequest) => {
  try {
    const ctx = requireTenantContext()
    const role = ctx.role as string | undefined
    if (!ctx.userId || !hasPermission(role, PERMISSIONS.ANALYTICS_VIEW)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const tenantId = ctx.tenantId
    const rangeParam = (searchParams.get('range') || '').toLowerCase()
    const days = rangeParam === '7d' ? 7 : rangeParam === '30d' ? 30 : rangeParam === '90d' ? 90 : rangeParam === '1y' ? 365 : 0

    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0)
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

    // Parallelize all database queries for better performance with timeout resilience
    let timeoutId: NodeJS.Timeout | null = null
    const queryCompleted = { value: false }

    const statsPromise = Promise.all([
      // Get all users with role aggregation (single query)
      prisma.user.groupBy({
        by: ['role'],
        where: tenantFilter(tenantId),
        _count: { id: true }
      }),

      // Get top 5 clients by bookings with minimal data
      prisma.user.findMany({
        where: { ...tenantFilter(tenantId), role: 'CLIENT' },
        select: {
          id: true,
          name: true,
          email: true,
          createdAt: true,
          _count: { select: { bookings: true } }
        },
        orderBy: { bookings: { _count: 'desc' } },
        take: 5
      }),

      // Get registration trends for last 6 months
      prisma.$queryRaw`
        SELECT
          DATE_TRUNC('month', created_at) as month,
          COUNT(*) as count
        FROM "User"
        WHERE tenant_id = ${tenantId}
        GROUP BY DATE_TRUNC('month', created_at)
        ORDER BY month DESC
        LIMIT 6
      ` as Promise<Array<{ month: Date; count: bigint }>>,

      // Get users with recent bookings (last 30 days)
      prisma.user.count({
        where: {
          ...tenantFilter(tenantId),
          bookings: { some: { createdAt: { gte: thirtyDaysAgo } } }
        }
      }),

      // Get ranged stats if requested
      days > 0
        ? Promise.all([
            prisma.user.count({
              where: { ...tenantFilter(tenantId), createdAt: { gte: new Date(now.getTime() - days * 24 * 60 * 60 * 1000) } }
            }),
            prisma.user.count({
              where: {
                ...tenantFilter(tenantId),
                createdAt: {
                  gte: new Date(now.getTime() - days * 2 * 24 * 60 * 60 * 1000),
                  lt: new Date(now.getTime() - days * 24 * 60 * 60 * 1000)
                }
              }
            })
          ])
        : Promise.resolve([0, 0])
    ]).then(([allUsers, topClientsData, registrationByMonth, recentActiveUsersCount, rangedStats]) => {
      queryCompleted.value = true
      if (timeoutId) clearTimeout(timeoutId)
      return { allUsers, topClientsData, registrationByMonth, recentActiveUsersCount, rangedStats }
    }).catch(err => {
      queryCompleted.value = true
      if (timeoutId) clearTimeout(timeoutId)
      throw err
    })

    const timeoutPromise = new Promise<never>((_, reject) => {
      timeoutId = setTimeout(() => {
        if (!queryCompleted.value) {
          reject(new Error('Stats query timeout after 8 seconds'))
        }
      }, 8000)
    })

    const { allUsers, topClientsData, registrationByMonth, recentActiveUsersCount, rangedStats } =
      await Promise.race([statsPromise, timeoutPromise])

    // Calculate aggregated role counts
    const roleCounts = allUsers.reduce(
      (acc, group) => {
        acc[group.role as string] = group._count.id
        return acc
      },
      {} as Record<string, number>
    )

    const total = Object.values(roleCounts).reduce((sum, count) => sum + count, 0)
    const clients = roleCounts['CLIENT'] || 0
    const teamMembers = roleCounts['TEAM_MEMBER'] || 0
    const teamLeads = roleCounts['TEAM_LEAD'] || 0
    const admins = roleCounts['ADMIN'] || 0
    const staff = teamMembers + teamLeads

    // Get users created this month and last month
    const newThisMonth = await prisma.user.count({
      where: {
        ...tenantFilter(tenantId),
        createdAt: { gte: startOfMonth, lt: now }
      }
    })

    const newLastMonth = await prisma.user.count({
      where: {
        ...tenantFilter(tenantId),
        createdAt: { gte: startOfLastMonth, lt: endOfLastMonth }
      }
    })

    const growth = newLastMonth > 0 ? ((newThisMonth - newLastMonth) / newLastMonth) * 100 : 0

    // Transform registration data
    const registrationTrends = registrationByMonth.map((entry: any) => ({
      month: entry.month instanceof Date ? entry.month.toISOString().split('T')[0] : String(entry.month),
      count: typeof entry.count === 'bigint' ? Number(entry.count) : entry.count
    }))

    // Transform top users data
    const topUsers = topClientsData.map((user) => ({
      id: user.id,
      name: user.name,
      email: user.email,
      bookingsCount: user._count.bookings,
      createdAt: user.createdAt
    }))

    let ranged: { range?: string; newUsers?: number; growth?: number } = {}
    if (days > 0 && Array.isArray(rangedStats) && rangedStats.length === 2) {
      const [inRange, prevRange] = rangedStats as number[]
      const growthRange = prevRange > 0 ? ((inRange - prevRange) / prevRange) * 100 : 0
      ranged = {
        range: rangeParam,
        newUsers: inRange,
        growth: Math.round(growthRange * 100) / 100
      }
    }

    const response: UserStatsResponse = {
      total,
      clients,
      staff,
      admins,
      newThisMonth,
      newLastMonth,
      growth: Math.round(growth * 100) / 100,
      activeUsers: recentActiveUsersCount,
      registrationTrends,
      topUsers,
      range: ranged
    }

    return NextResponse.json(response, {
      headers: { 'Cache-Control': 'private, max-age=120' }
    })
  } catch (error) {
    console.error('Error fetching user statistics:', error)
    const emptyResponse: UserStatsResponse = {
      total: 0,
      clients: 0,
      staff: 0,
      admins: 0,
      newThisMonth: 0,
      newLastMonth: 0,
      growth: 0,
      activeUsers: 0,
      registrationTrends: [],
      topUsers: [],
      range: {}
    }
    return NextResponse.json(emptyResponse)
  }
})
