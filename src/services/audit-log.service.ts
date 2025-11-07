import prisma from '@/lib/prisma'
import { Prisma } from '@prisma/client'

export interface AuditLogFilter {
  tenantId: string
  action?: string
  userId?: string
  resource?: string
  startDate?: Date
  endDate?: Date
  search?: string
  limit?: number
  offset?: number
}

export interface AuditLogEntry {
  id: string
  tenantId: string | null
  userId: string | null
  action: string
  resource: string | null
  metadata: any
  ipAddress: string | null
  userAgent: string | null
  createdAt: Date
  user?: {
    id: string
    name: string | null
    email: string
  } | null
}

export interface AuditLogQueryResult {
  logs: AuditLogEntry[]
  total: number
  limit: number
  offset: number
  hasMore: boolean
}

export class AuditLogService {
  /**
   * Fetch audit logs with filtering and pagination
   */
  static async fetchAuditLogs(filters: AuditLogFilter): Promise<AuditLogQueryResult> {
    const {
      tenantId,
      action,
      userId,
      resource,
      startDate,
      endDate,
      search,
      limit = 50,
      offset = 0
    } = filters

    // Build where clause for filtering
    const where: Prisma.AuditLogWhereInput = {
      tenantId
    }

    if (action) {
      where.action = {
        contains: action,
        mode: 'insensitive'
      }
    }

    if (userId) {
      where.userId = userId
    }

    if (resource) {
      where.resource = {
        contains: resource,
        mode: 'insensitive'
      }
    }

    if (startDate || endDate) {
      where.createdAt = {}
      if (startDate) {
        where.createdAt.gte = startDate
      }
      if (endDate) {
        where.createdAt.lte = endDate
      }
    }

    // Handle full-text search across action and resource
    if (search) {
      where.OR = [
        {
          action: {
            contains: search,
            mode: 'insensitive'
          }
        },
        {
          resource: {
            contains: search,
            mode: 'insensitive'
          }
        }
      ]
    }

    // Fetch logs with related user data
    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        },
        take: limit,
        skip: offset
      }),
      prisma.auditLog.count({ where })
    ])

    return {
      logs: logs as AuditLogEntry[],
      total,
      limit,
      offset,
      hasMore: offset + limit < total
    }
  }

  /**
   * Get audit log entry by ID
   */
  static async getAuditLog(id: string, tenantId: string): Promise<AuditLogEntry | null> {
    const log = await prisma.auditLog.findFirst({
      where: {
        id,
        tenantId
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    })

    return log as AuditLogEntry | null
  }

  /**
   * Create an audit log entry
   */
  static async createAuditLog(data: {
    tenantId: string
    userId?: string
    action: string
    resource?: string
    metadata?: any
    ipAddress?: string
    userAgent?: string
  }): Promise<AuditLogEntry> {
    const log = await prisma.auditLog.create({
      data: {
        tenantId: data.tenantId,
        userId: data.userId,
        action: data.action,
        resource: data.resource,
        metadata: data.metadata,
        ipAddress: data.ipAddress,
        userAgent: data.userAgent
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    })

    return log as AuditLogEntry
  }

  /**
   * Get distinct actions for filtering - OPTIMIZED
   * Uses groupBy instead of findMany for better performance on large datasets
   */
  static async getDistinctActions(tenantId: string): Promise<string[]> {
    // Cache frequent queries for 1 hour
    const cacheKey = `actions:${tenantId}`
    const cached = this.getQueryCache(cacheKey)
    if (cached) return cached

    // Use groupBy for better performance on large datasets
    const actions = await prisma.auditLog.groupBy({
      by: ['action'],
      where: {
        tenantId
      },
      orderBy: {
        action: 'asc'
      },
      take: 100
    })

    const result = actions.map(a => a.action).filter(Boolean)
    this.setQueryCache(cacheKey, result, 60 * 60 * 1000) // Cache for 1 hour
    return result
  }

  /**
   * Get audit statistics - OPTIMIZED with caching
   */
  static async getAuditStats(tenantId: string, days: number = 30): Promise<any> {
    // Check cache first
    const cacheKey = `stats:${tenantId}:${days}`
    const cached = this.getQueryCache(cacheKey)
    if (cached) return cached

    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)

    const [totalLogs, logsByAction, logsByUser] = await Promise.all([
      prisma.auditLog.count({
        where: {
          tenantId,
          createdAt: { gte: startDate }
        }
      }),
      prisma.auditLog.groupBy({
        by: ['action'],
        where: {
          tenantId,
          createdAt: { gte: startDate }
        },
        _count: {
          id: true
        },
        orderBy: {
          _count: {
            id: 'desc'
          }
        },
        take: 10
      }),
      prisma.auditLog.groupBy({
        by: ['userId'],
        where: {
          tenantId,
          createdAt: { gte: startDate }
        },
        _count: {
          id: true
        },
        orderBy: {
          _count: {
            id: 'desc'
          }
        },
        take: 10
      })
    ])

    const result = {
      totalLogs,
      logsByAction: logsByAction.map(item => ({
        action: item.action,
        count: item._count.id
      })),
      logsByUser: logsByUser.map(item => ({
        userId: item.userId,
        count: item._count.id
      }))
    }

    // Cache stats for 10 minutes
    this.setQueryCache(cacheKey, result, 10 * 60 * 1000)
    return result
  }

  /**
   * Export audit logs to CSV format
   */
  static async exportAuditLogs(filters: AuditLogFilter): Promise<string> {
    // Fetch all logs matching filters (with a reasonable limit)
    const { logs } = await this.fetchAuditLogs({
      ...filters,
      limit: 10000,
      offset: 0
    })

    // CSV header
    const headers = ['ID', 'Action', 'User', 'Resource', 'Date', 'IP Address', 'Details']
    const rows = logs.map(log => [
      log.id,
      log.action || '',
      log.user?.email || '',
      log.resource || '',
      log.createdAt.toISOString(),
      log.ipAddress || '',
      JSON.stringify(log.metadata || {})
    ])

    // Format as CSV
    const csvContent = [
      headers.map(h => `"${h}"`).join(','),
      ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    ].join('\n')

    return csvContent
  }

  /**
   * Query cache for frequently accessed data
   */
  private static queryCache = new Map<string, { data: any; timestamp: number }>()
  private static readonly QUERY_CACHE_DEFAULT_TTL = 5 * 60 * 1000 // 5 minutes

  private static getQueryCache(key: string): any {
    const cached = this.queryCache.get(key)
    if (cached && Date.now() - cached.timestamp < this.QUERY_CACHE_DEFAULT_TTL) {
      return cached.data
    }
    this.queryCache.delete(key)
    return null
  }

  private static setQueryCache(key: string, data: any, ttl: number = this.QUERY_CACHE_DEFAULT_TTL): void {
    this.queryCache.set(key, {
      data,
      timestamp: Date.now()
    })
    // Auto-cleanup old cache entries
    if (this.queryCache.size > 100) {
      const now = Date.now()
      for (const [k, v] of this.queryCache.entries()) {
        if (now - v.timestamp > ttl) {
          this.queryCache.delete(k)
        }
      }
    }
  }
}
