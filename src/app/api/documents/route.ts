'use server'

import { NextRequest } from 'next/server'
import { withAdminAuth, withTenantAuth, type AuthenticatedRequest } from '@/lib/auth-middleware'
import { respond } from '@/lib/api-response'
import prisma from '@/lib/prisma'
import { uploadFile } from '@/lib/upload-provider'
import { z } from 'zod'
import { randomUUID } from 'crypto'

const DocumentFilterSchema = z.object({
  limit: z.coerce.number().min(1).max(100).default(20),
  offset: z.coerce.number().min(0).default(0),
  search: z.string().optional(),
  category: z.string().optional(),
  status: z.enum(['pending', 'scanned', 'approved', 'infected']).optional(),
  uploadedBy: z.string().optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  sortBy: z.enum(['uploadedAt', 'name', 'size']).default('uploadedAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
})

const DocumentUploadSchema = z.object({
  file: z.instanceof(File),
  linkedToType: z.string().optional(),
  linkedToId: z.string().optional(),
  description: z.string().optional(),
})

type DocumentFilter = z.infer<typeof DocumentFilterSchema>

/**
 * GET /api/documents
 * List documents (portal: own, admin: all with filters)
 */
export const GET = withTenantAuth(async (request, context) => {
  try {
    const authReq = request as AuthenticatedRequest
    const tenantId = authReq.tenantId
    const userId = authReq.userId
    const userRole = authReq.userRole

    const queryParams = Object.fromEntries(request.nextUrl.searchParams)
    const filters = DocumentFilterSchema.parse(queryParams)

    // Build where clause
    const where: any = { tenantId }

    // Portal users see only their own documents
    if (userRole !== 'ADMIN') {
      where.uploaderId = userId
    }

    // Admin can filter by uploadedBy
    if (filters.uploadedBy && userRole === 'ADMIN') {
      where.uploaderId = filters.uploadedBy
    }

    // Search filter
    if (filters.search) {
      where.OR = [
        { name: { contains: filters.search, mode: 'insensitive' } },
        { key: { contains: filters.search, mode: 'insensitive' } },
      ]
    }

    // Status filter (based on avStatus)
    if (filters.status) {
      const statusMap: Record<string, string | null> = {
        pending: 'pending',
        scanned: 'clean',
        approved: 'approved',
        infected: 'infected',
      }
      where.avStatus = statusMap[filters.status]
    }

    // Date range filter
    if (filters.startDate || filters.endDate) {
      where.uploadedAt = {}
      if (filters.startDate) {
        where.uploadedAt.gte = new Date(filters.startDate)
      }
      if (filters.endDate) {
        where.uploadedAt.lte = new Date(filters.endDate)
      }
    }

    // Count total matching documents
    const total = await prisma.attachment.count({ where })

    // Fetch paginated documents
    const documents = await prisma.attachment.findMany({
      where,
      include: {
        uploader: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        versions: {
          select: {
            id: true,
            versionNumber: true,
            uploadedAt: true,
          },
          orderBy: { versionNumber: 'desc' },
          take: 1,
        },
        links: {
          select: {
            id: true,
            linkedToType: true,
            linkedToId: true,
          },
        },
        auditLogs: {
          select: {
            id: true,
            action: true,
            performedAt: true,
          },
          orderBy: { performedAt: 'desc' },
          take: 5,
        },
      },
      orderBy: {
        [filters.sortBy]: filters.sortOrder,
      },
      skip: filters.offset,
      take: filters.limit,
    })

    // Format response - filter admin-only fields for portal users
    const formattedDocuments = documents.map((doc) => {
      const baseDoc = {
        id: doc.id,
        name: doc.name || 'Unnamed Document',
        size: doc.size,
        contentType: doc.contentType,
        url: doc.url,
        uploadedAt: doc.uploadedAt,
        uploadedBy: doc.uploader
          ? {
              id: doc.uploader.id,
              name: doc.uploader.name,
              email: doc.uploader.email,
            }
          : null,
        status: doc.avStatus,
        isStarred: doc.isStarred,
        isQuarantined: doc.avStatus === 'infected',
      }

      // Admin-only fields
      if (userRole === 'ADMIN') {
        return {
          ...baseDoc,
          key: doc.key,
          provider: doc.provider,
          avDetails: doc.avDetails,
          avThreatName: doc.avThreatName,
          avScanTime: doc.avScanTime,
          avScanAt: doc.avScanAt,
          metadata: doc.metadata,
          latestVersion: doc.versions[0] || null,
          links: doc.links,
          recentAuditLogs: doc.auditLogs,
        }
      }

      return baseDoc
    })

    // Log access
    await prisma.auditLog.create({
      data: {
        tenantId,
        action: 'documents:list',
        userId,
        resource: 'Document',
        metadata: {
          count: documents.length,
          total,
          filters: {
            search: !!filters.search,
            status: filters.status,
          },
        },
      },
    }).catch(() => {}) // Non-critical

    return respond.ok({
      data: formattedDocuments,
      meta: {
        total,
        limit: filters.limit,
        offset: filters.offset,
        hasMore: filters.offset + filters.limit < total,
      },
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return respond.badRequest('Invalid query parameters', error.errors)
    }
    console.error('Document list error:', error)
    return respond.serverError()
  }
})

/**
 * POST /api/documents
 * Upload new document
 */
export const POST = withTenantAuth(async (request, context) => {
  try {
    const authReq = request as AuthenticatedRequest
    const tenantId = authReq.tenantId
    const userId = authReq.userId
    const userRole = authReq.userRole

    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const linkedToType = formData.get('linkedToType') as string | undefined
    const linkedToId = formData.get('linkedToId') as string | undefined
    const description = formData.get('description') as string | undefined

    // Validation
    if (!file) {
      return respond.badRequest('File is required')
    }

    // File validation
    const MAX_FILE_SIZE = 100 * 1024 * 1024 // 100MB
    if (file.size > MAX_FILE_SIZE) {
      return respond.badRequest('File size exceeds 100MB limit')
    }

    const ALLOWED_TYPES = [
      'application/pdf',
      'image/jpeg',
      'image/png',
      'image/webp',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/csv',
      'text/plain',
    ]

    if (!ALLOWED_TYPES.includes(file.type)) {
      return respond.badRequest(
        `File type ${file.type} not allowed. Allowed types: PDF, images, Office documents, CSV, text`
      )
    }

    // Upload file
    const fileId = randomUUID()
    const fileKey = `${tenantId}/${fileId}/${file.name}`
    const fileBuffer = Buffer.from(await file.arrayBuffer())

    let uploadUrl: string
    try {
      const uploadResult = await uploadFile(fileBuffer, fileKey, file.type)
      uploadUrl = uploadResult.url
    } catch (uploadError) {
      console.error('File upload error:', uploadError)
      return respond.serverError('Failed to upload file')
    }

    // Create document record
    const document = await prisma.attachment.create({
      data: {
        id: fileId,
        name: file.name,
        key: fileKey,
        url: uploadUrl,
        size: file.size,
        contentType: file.type,
        provider: process.env.UPLOADS_PROVIDER || 'vercel',
        tenantId,
        uploaderId: userId,
        avStatus: 'pending', // Will be scanned asynchronously
        metadata: {
          description: description || null,
          uploadedFrom: 'api',
        },
      },
      include: {
        uploader: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    })

    // Create link if provided
    if (linkedToType && linkedToId) {
      await prisma.documentLink.create({
        data: {
          attachmentId: document.id,
          linkedToType,
          linkedToId,
          linkedBy: userId,
          tenantId,
        },
      }).catch(() => {}) // Non-critical
    }

    // Log audit
    await prisma.auditLog.create({
      data: {
        tenantId,
        action: 'documents:upload',
        userId,
        resource: 'Document',
        metadata: {
          documentName: document.name,
          documentSize: document.size,
          contentType: document.contentType,
          linkedTo: linkedToType && linkedToId ? { type: linkedToType, id: linkedToId } : null,
        },
      },
    }).catch(() => {}) // Non-critical

    return respond.created({
      data: {
        id: document.id,
        name: document.name,
        size: document.size,
        contentType: document.contentType,
        url: document.url,
        status: document.avStatus,
        uploadedAt: document.uploadedAt,
        uploadedBy: document.uploader,
      },
    })
  } catch (error) {
    console.error('Document upload error:', error)
    return respond.serverError()
  }
})
