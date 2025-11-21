'use server'

import { withAdminAuth } from '@/lib/auth-middleware'
import { respond } from '@/lib/api-response'
import prisma from '@/lib/prisma'

/**
 * GET /api/admin/documents/stats
 * Get document statistics and metrics
 */
export const GET = withAdminAuth(async (request, context) => {
  const tenantId = (request as any).tenantId
  const userId = (request as any).userId
  try {
    // Get total documents
    const total = await prisma.attachment.count({
      where: { tenantId },
    })

    // Get documents by status
    const byStatus = await prisma.attachment.groupBy({
      by: ['avStatus'],
      where: { tenantId },
      _count: true,
    })

    // Get total size
    const sizeData = await prisma.attachment.aggregate({
      where: { tenantId },
      _sum: {
        size: true,
      },
    })

    // Get documents by content type (top 5)
    const byType = await prisma.attachment.groupBy({
      by: ['contentType'],
      where: { tenantId },
      _count: true,
      orderBy: {
        _count: {
          id: 'desc',
        },
      },
      take: 5,
    })

    // Get uploads by user (top 5)
    const byUploader = await prisma.attachment.findMany({
      where: { tenantId },
      select: {
        uploaderId: true,
        uploader: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    })

    // Group and count by uploader
    const uploaderMap: Record<string, any> = {}
    byUploader.forEach((doc) => {
      if (doc.uploaderId) {
        if (!uploaderMap[doc.uploaderId]) {
          uploaderMap[doc.uploaderId] = {
            user: doc.uploader,
            count: 0,
          }
        }
        uploaderMap[doc.uploaderId].count++
      }
    })

    const topUploaders = Object.values(uploaderMap)
      .sort((a: any, b: any) => b.count - a.count)
      .slice(0, 5)

    // Get infected documents
    const infected = await prisma.attachment.count({
      where: {
        tenantId,
        avStatus: 'infected',
      },
    })

    // Get recently uploaded (last 7 days)
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

    const recentCount = await prisma.attachment.count({
      where: {
        tenantId,
        uploadedAt: {
          gte: sevenDaysAgo,
        },
      },
    })

    // Get documents pending scan
    const pendingScans = await prisma.attachment.count({
      where: {
        tenantId,
        avStatus: 'pending',
      },
    })

    // Format response
    const statusMap: Record<string, number> = {
      pending: 0,
      clean: 0,
      infected: 0,
      approved: 0,
    }

    byStatus.forEach((item: any) => {
      statusMap[item.avStatus || 'pending'] = item._count
    })

    const typeMap = Object.fromEntries(
      byType.map((item: any) => [
        item.contentType || 'unknown',
        item._count,
      ])
    )

    // Log access
    await prisma.auditLog.create({
      data: {
        tenantId,
        action: 'admin:documents_stats',
        userId,
        resource: 'Document',
      },
    }).catch(() => {})

    return respond.ok({
      data: {
        totalDocuments: total,
        totalSize: sizeData._sum.size || 0,
        averageSize: total > 0 ? Math.round((sizeData._sum.size || 0) / total) : 0,
        byStatus: statusMap,
        byContentType: typeMap,
        topUploaders: topUploaders.map((item: any) => ({
          user: item.user,
          documentCount: item.count,
        })),
        infectedDocuments: infected,
        recentUploads: {
          last7Days: recentCount,
          period: '7 days',
        },
        pendingScans,
        metrics: {
          totalDocuments: total,
          infectionRate: total > 0 ? ((infected / total) * 100).toFixed(2) + '%' : '0%',
          avgUploadSize: total > 0 ? Math.round((sizeData._sum.size || 0) / total) : 0,
          healthStatus: infected > 0 ? 'warning' : 'healthy',
        },
      },
    })
  } catch (error) {
    console.error('Document stats error:', error)
    return respond.serverError()
  }
})
