import { NextRequest, NextResponse } from 'next/server'
import { TaskStatus } from '@prisma/client'
import { hasPermission, PERMISSIONS } from '@/lib/permissions'
import prisma from '@/lib/prisma'
import { logger } from '@/lib/logger'

const hasDb = !!process.env.NETLIFY_DATABASE_URL

import { tenantFilter } from '@/lib/tenant'
import { withTenantContext } from '@/lib/api-wrapper'
import { requireTenantContext } from '@/lib/tenant-utils'
import { respond } from '@/lib/api-response'

export const GET = withTenantContext(async (request: NextRequest) => {
  const startTime = Date.now()

  try {
    const ctx = requireTenantContext()
    const role = ctx.role ?? undefined

    if (!hasPermission(role, PERMISSIONS.ANALYTICS_VIEW)) {
      logger.warn('Analytics access denied', {
        userId: ctx.userId,
        role,
        requiredPermission: PERMISSIONS.ANALYTICS_VIEW
      })
      return respond.forbidden('Forbidden')
    }

    if (!hasDb) {
      logger.debug('Database not available; returning empty analytics', {
        tenantId: ctx.tenantId
      })
      return NextResponse.json({
        total: 0,
        completed: 0,
        byStatus: [],
        byPriority: [],
        avgAgeDays: 0,
        compliance: {
          complianceTotal: 0,
          complianceCompleted: 0,
          complianceRate: 0,
          overdueCompliance: 0,
          avgTimeToCompliance: 0
        },
        dailyTotals: Array.from({ length: 7 }).map(() => 0),
        dailyCompleted: Array.from({ length: 7 }).map(() => 0),
      })
    }

    const tenantId = ctx.tenantId

    logger.debug('Computing task analytics', {
      tenantId,
      userId: ctx.userId
    })

    const total = await prisma.task.count({ where: tenantFilter(tenantId) })
    const completed = await prisma.task.count({ where: { ...tenantFilter(tenantId), status: TaskStatus.COMPLETED } })

    const byStatus = await prisma.task.groupBy({
      by: ['status'],
      _count: { _all: true },
      where: tenantFilter(tenantId)
    })

    const byPriority = await prisma.task.groupBy({
      by: ['priority'],
      _count: { _all: true },
      where: tenantFilter(tenantId)
    })

    const sample = await prisma.task.findMany({
      select: { createdAt: true, updatedAt: true },
      where: tenantFilter(tenantId),
      take: 1000
    })
    const avgAgeDays = sample.length
      ? Math.round(sample.reduce((sum, t) => sum + ((t.updatedAt.getTime() - t.createdAt.getTime()) / (1000 * 60 * 60 * 24)), 0) / sample.length)
      : 0

    const complianceTotal = await prisma.task.count({
      where: { ...tenantFilter(tenantId), complianceRequired: true }
    })

    const complianceCompleted = await prisma.complianceRecord.count({
      where: {
        ...(tenantFilter(tenantId)),
        status: { equals: 'COMPLETED' }
      }
    })

    const completedRecords = await prisma.complianceRecord.findMany({
      where: {
        ...tenantFilter(tenantId),
        status: 'COMPLETED',
        completedAt: { not: null }
      },
      select: { completedAt: true, createdAt: true },
      take: 1000
    })

    const avgTimeToCompliance = completedRecords.length
      ? Math.round(completedRecords.reduce((sum, r) => sum + ((r.completedAt!.getTime() - r.createdAt.getTime()) / (1000 * 60 * 60 * 24)), 0) / completedRecords.length)
      : 0

    const now = new Date()
    const start = new Date(now.getTime() - 6 * 24 * 60 * 60 * 1000)

    const created = await prisma.task.findMany({
      select: { createdAt: true },
      where: { ...tenantFilter(tenantId), createdAt: { gte: start } }
    })

    const dones = await prisma.task.findMany({
      select: { updatedAt: true },
      where: { ...tenantFilter(tenantId), updatedAt: { gte: start }, status: TaskStatus.COMPLETED }
    })

    const dayKey = (d: Date) => d.toISOString().slice(0, 10)
    const keys = Array.from({ length: 7 }).map((_, i) => dayKey(new Date(start.getTime() + i * 24 * 60 * 60 * 1000)))
    const totalsMap = Object.fromEntries(keys.map(k => [k, 0])) as Record<string, number>
    const completedMap = Object.fromEntries(keys.map(k => [k, 0])) as Record<string, number>
    created.forEach(c => { const k = dayKey(new Date(c.createdAt)); if (k in totalsMap) totalsMap[k] += 1 })
    dones.forEach(d => { const k = dayKey(new Date(d.updatedAt)); if (k in completedMap) completedMap[k] += 1 })
    const dailyTotals = keys.map(k => totalsMap[k] || 0)
    const dailyCompleted = keys.map(k => completedMap[k] || 0)

    const overdueCompliance = await prisma.task.count({
      where: {
        ...tenantFilter(tenantId),
        complianceRequired: true,
        complianceDeadline: { lt: now },
        NOT: { complianceRecords: { some: { status: 'COMPLETED' } } }
      }
    })

    const duration = Date.now() - startTime
    logger.info('Analytics computed successfully', {
      tenantId,
      userId: ctx.userId,
      duration: `${duration}ms`,
      taskCount: total,
      complianceTotal
    })

    return NextResponse.json({
      total,
      completed,
      byStatus,
      byPriority,
      avgAgeDays,
      compliance: {
        complianceTotal,
        complianceCompleted,
        complianceRate: complianceTotal > 0 ? Math.round((complianceCompleted / complianceTotal) * 1000) / 10 : 0,
        overdueCompliance,
        avgTimeToCompliance
      },
      dailyTotals,
      dailyCompleted
    })
  } catch (err) {
    const duration = Date.now() - startTime
    const error = err instanceof Error ? err : new Error(String(err))

    logger.error('Analytics computation failed', {
      duration: `${duration}ms`,
      errorName: error.name,
      errorMessage: error.message
    }, error)

    const isDevelopment = process.env.NODE_ENV === 'development'

    return NextResponse.json(
      {
        error: 'Failed to compute analytics',
        ...(isDevelopment && {
          details: error.message,
          stack: error.stack?.split('\n').slice(0, 5)
        })
      },
      { status: 500 }
    )
  }
})
