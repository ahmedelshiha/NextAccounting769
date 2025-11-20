import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { z } from 'zod'
import { withTenantContext } from '@/lib/api-wrapper'
import { requireTenantContext } from '@/lib/tenant-utils'

const AuditFilterSchema = z.object({
  limit: z.coerce.number().min(1).max(100).default(50),
  offset: z.coerce.number().min(0).default(0),
  action: z.string().optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
})

type AuditFilter = z.infer<typeof AuditFilterSchema>

export const GET = withTenantContext(
  async (request: NextRequest, { params }: { params: { id: string } }) => {
    try {
      const { userId, tenantId } = requireTenantContext()!
      const { id } = params

      // Parse and validate filters
      const queryParams = Object.fromEntries(request.nextUrl.searchParams)
      const filters = AuditFilterSchema.parse(queryParams)

      // Verify document exists and belongs to tenant
      const document = await prisma.attachment.findFirst({
        where: { id, tenantId: tenantId! },
      })

      if (!document) {
        return NextResponse.json({ error: 'Document not found' }, { status: 404 })
      }

      // Build Prisma where clause
      const where: any = {
        attachmentId: id,
        tenantId,
      }

      if (filters.action) {
        where.action = filters.action
      }

      if (filters.startDate || filters.endDate) {
        const dateFilter: any = {}
        if (filters.startDate) {
          dateFilter.gte = new Date(filters.startDate)
        }
        if (filters.endDate) {
          dateFilter.lte = new Date(filters.endDate)
        }
        where.performedAt = dateFilter
      }

      // Count total audit logs
      const total = await prisma.documentAuditLog.count({ where })

      // Fetch paginated audit logs
      const logs = await prisma.documentAuditLog.findMany({
        where,
        orderBy: { performedAt: 'desc' },
        take: filters.limit,
        skip: filters.offset,
      })

      const formattedLogs = logs.map((log) => ({
        id: log.id,
        action: log.action,
        performedBy: log.performedBy,
        performedAt: log.performedAt.toISOString(),
        ipAddress: log.ipAddress,
        userAgent: log.userAgent,
        details: log.details,
      }))

      return NextResponse.json(
        {
          documentId: id,
          logs: formattedLogs,
          pagination: {
            total,
            limit: filters.limit,
            offset: filters.offset,
            hasMore: (filters.offset! + filters.limit!) < total,
          },
        },
        { status: 200 }
      )
    } catch (error) {
      if (error instanceof z.ZodError) {
        return NextResponse.json(
          {
            error: 'Invalid query parameters',
            details: error.issues,
          },
          { status: 400 }
        )
      }

      console.error('Document audit log API error:', error)
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      )
    }
  },
  { requireAuth: true }
);

export const POST = withTenantContext(
  async (request: NextRequest, { params }: { params: { id: string } }) => {
    try {
      const { userId, tenantId } = requireTenantContext()!
      const { id } = params
      const body = await request.json()
      const { action, details } = body

      if (!action) {
        return NextResponse.json(
          { error: 'action is required' },
          { status: 400 }
        )
      }

      // Verify document exists and belongs to tenant
      const document = await prisma.attachment.findFirst({
        where: { id, tenantId: tenantId! },
      })

      if (!document) {
        return NextResponse.json({ error: 'Document not found' }, { status: 404 })
      }

      // Create audit log entry
      const log = await prisma.documentAuditLog.create({
        data: {
          attachmentId: id,
          action,
          details: details || {},
          performedBy: userId,
          performedAt: new Date(),
          tenantId: tenantId as string,
        },
      })

      return NextResponse.json(
        {
          success: true,
          log: {
            id: log.id,
            action: log.action,
            performedAt: log.performedAt.toISOString(),
          },
        },
        { status: 201 }
      )
    } catch (error) {
      console.error('Document audit log creation API error:', error)
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      )
    }
  },
  { requireAuth: true }
);
