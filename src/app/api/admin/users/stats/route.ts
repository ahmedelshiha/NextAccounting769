import { NextRequest, NextResponse } from 'next/server'
import { withTenantContext } from '@/lib/api-wrapper'
import { requireTenantContext } from '@/lib/tenant-utils'
import { respond } from '@/lib/api-response'
import { hasPermission, PERMISSIONS } from '@/lib/permissions'
import prisma from '@/lib/prisma'
import { tenantFilter } from '@/lib/tenant'
import { AvailabilityStatus } from '@prisma/client'

export const runtime = 'nodejs'

/**
 * GET /api/admin/users/stats
 * Alias for /api/admin/stats/users - Returns user statistics
 */
export const GET = withTenantContext(async (request: NextRequest) => {
  try {
    const ctx = requireTenantContext()
    const role = ctx.role ?? ''
    
    if (!ctx.userId) return respond.unauthorized()
    if (!hasPermission(role, PERMISSIONS.ANALYTICS_VIEW)) return respond.forbidden('Forbidden')

    const tenantId = ctx.tenantId

    // Get user statistics
    const totalUsers = await prisma.user.count({
      where: tenantFilter(tenantId) 
    })

    const activeUsers = await prisma.user.count({
      where: {
        availabilityStatus: AvailabilityStatus.AVAILABLE,
        ...(tenantFilter(tenantId) )
      }
    })

    const inactiveUsers = await prisma.user.count({
      where: {
        availabilityStatus: AvailabilityStatus.OFFLINE,
        ...(tenantFilter(tenantId) )
      }
    })

    // Get users by role
    const usersByRole = await prisma.user.groupBy({
      by: ['role'],
      where: tenantFilter(tenantId) ,
      _count: {
        id: true
      }
    })

    return NextResponse.json({
      success: true,
      data: {
        totalUsers,
        activeUsers,
        inactiveUsers,
        usersByRole: usersByRole.reduce((acc, item) => {
          acc[item.role] = item._count.id
          return acc
        }, {} as Record<string, number>)
      }
    })
  } catch (error) {
    console.error('Error fetching user stats:', error)
    return NextResponse.json({ error: 'Failed to fetch user statistics' }, { status: 500 })
  }
})
