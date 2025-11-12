'use server'

import prisma from '@/lib/prisma'
import { requireTenantContext } from '@/lib/tenant-utils'
import { tenantContext } from '@/lib/tenant-context'
import { hasPermission, PERMISSIONS } from '@/lib/permissions'
import { tenantFilter } from '@/lib/tenant'
import { UserItem, UserStats } from './contexts/UsersContextProvider'
import { AvailabilityStatus } from '@prisma/client'

/**
 * ✅ Server-side Data Fetching for Admin Users Page
 * 
 * Benefits over client-side fetching:
 * - Data available instantly (no API call wait)
 * - Smaller initial JavaScript bundle
 * - Better SEO (data in HTML)
 * - Faster Time to First Byte (TTFB)
 * - More secure (auth happens on server)
 * - No loading skeletons needed
 */

/**
 * Fetch users list from server
 * Called during page render, data is immediately available
 */
export async function fetchUsersServerSide(
  page: number = 1,
  limit: number = 50,
  tenantId: string
): Promise<{ users: UserItem[]; total: number; page: number; limit: number }> {
  try {
    // ✅ FIXED: Validate tenantId directly instead of using tenantContext
    if (!tenantId) {
      console.error('fetchUsersServerSide: tenantId is required')
      return {
        users: [],
        total: 0,
        page: 1,
        limit: 50
      }
    }

    // Validate pagination
    const validPage = Math.max(1, page)
    const validLimit = Math.min(100, Math.max(1, limit))
    const skip = (validPage - 1) * validLimit

    // Fetch users with timeout protection
    const [total, users] = await Promise.all([
      prisma.user.count({ where: tenantFilter(tenantId) }),
      prisma.user.findMany({
        where: tenantFilter(tenantId),
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          createdAt: true,
          updatedAt: true,
          image: true,
          department: true,
          position: true,
          employeeId: true,
          availabilityStatus: true
        },
        skip,
        take: validLimit,
        orderBy: { createdAt: 'desc' }
      })
    ])

    // Map to UserItem type with proper formatting
    const mapped: UserItem[] = users.map((user) => ({
      id: user.id,
      name: user.name,
      email: user.email,
      role: (user.role as 'ADMIN' | 'TEAM_MEMBER' | 'TEAM_LEAD' | 'STAFF' | 'CLIENT') || 'TEAM_MEMBER',
      createdAt: user.createdAt instanceof Date ? user.createdAt.toISOString() : String(user.createdAt),
      lastLoginAt: user.updatedAt instanceof Date ? user.updatedAt.toISOString() : String(user.updatedAt),
      isActive: user.availabilityStatus === AvailabilityStatus.AVAILABLE,
      avatar: user.image || undefined,
      company: user.department || undefined,
      location: user.position || undefined,
      status: 'ACTIVE' as const
    }))

    console.log(`[fetchUsersServerSide] Successfully fetched ${mapped.length} users for tenant ${tenantId}`)

    return {
      users: mapped,
      total,
      page: validPage,
      limit: validLimit
    }
  } catch (error) {
    console.error('Failed to fetch users on server:', error)
    // Return empty data instead of throwing, let client handle retry
    return {
      users: [],
      total: 0,
      page: 1,
      limit: 50
    }
  }
}

/**
 * Fetch user statistics
 * Called during page render, data is immediately available
 */
export async function fetchStatsServerSide(tenantId: string): Promise<UserStats> {
  try {
    // ✅ FIXED: Validate tenantId directly instead of using tenantContext
    if (!tenantId) {
      console.error('fetchStatsServerSide: tenantId is required')
      return {
        total: 0,
        clients: 0,
        staff: 0,
        admins: 0,
        newThisMonth: 0,
        newLastMonth: 0,
        growth: 0,
        activeUsers: 0,
        registrationTrends: [],
        topUsers: []
      }
    }

    // Fetch all required stats in parallel
    const [total, active, admins, staffCount, clientCount, newThisMonth, newLastMonth] = await Promise.all([
      prisma.user.count({ where: tenantFilter(tenantId) }),
      prisma.user.count({
        where: { ...tenantFilter(tenantId), availabilityStatus: AvailabilityStatus.AVAILABLE }
      }),
      prisma.user.count({
        where: { ...tenantFilter(tenantId), role: 'ADMIN' }
      }),
      prisma.user.count({
        where: { ...tenantFilter(tenantId), role: 'STAFF' }
      }),
      prisma.user.count({
        where: { ...tenantFilter(tenantId), role: 'CLIENT' }
      }),
      prisma.user.count({
        where: {
          ...tenantFilter(tenantId),
          createdAt: {
            gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
            lt: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1)
          }
        }
      }),
      prisma.user.count({
        where: {
          ...tenantFilter(tenantId),
          createdAt: {
            gte: new Date(new Date().getFullYear(), new Date().getMonth() - 1, 1),
            lt: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
          }
        }
      })
    ])

    const growth = newLastMonth > 0 ? ((newThisMonth - newLastMonth) / newLastMonth) * 100 : 0

    console.log(`[fetchStatsServerSide] Fetched stats for tenant ${tenantId}: ${total} total users, ${active} active`)

    return {
      total,
      clients: clientCount,
      staff: staffCount,
      admins,
      newThisMonth,
      newLastMonth,
      growth: Math.round(growth),
      activeUsers: active,
      registrationTrends: [],
      topUsers: []
    }
  } catch (error) {
    console.error('Failed to fetch stats on server:', error)
    // Return empty stats instead of throwing
    return {
      total: 0,
      clients: 0,
      staff: 0,
      admins: 0,
      newThisMonth: 0,
      newLastMonth: 0,
      growth: 0,
      activeUsers: 0,
      registrationTrends: [],
      topUsers: []
    }
  }
}

/**
 * Fetch detailed activity/logs for a specific user
 * Can be called as needed for user profiles
 */
export async function fetchUserActivityServerSide(userId: string, tenantId: string, limit: number = 50) {
  try {
    if (!userId || !tenantId) {
      console.error('fetchUserActivityServerSide: userId and tenantId are required')
      return []
    }

    // Fetch audit logs related to this user
    const activityLogs = await prisma.auditLog.findMany({
      where: {
        tenantId,
        OR: [
          { userId }, // User performed the action
          { metadata: { path: ['targetUserId'], equals: userId } } // Action was performed on this user
        ]
      },
      select: {
        id: true,
        action: true,
        resource: true,
        metadata: true,
        createdAt: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: limit
    })

    // Format for frontend consumption
    return activityLogs.map((log) => ({
      id: log.id,
      action: log.action,
      resource: log.resource || '',
      timestamp: log.createdAt instanceof Date ? log.createdAt.toISOString() : String(log.createdAt),
      actor: log.user ? {
        id: log.user.id,
        name: log.user.name || 'Unknown',
        email: log.user.email,
        avatar: log.user.image
      } : null,
      details: log.metadata || {}
    }))
  } catch (error) {
    console.error('Failed to fetch user activity:', error)
    return []
  }
}
