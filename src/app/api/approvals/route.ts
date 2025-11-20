/**
 * Approvals API
 * GET /api/approvals - List pending approvals for current user
 * POST /api/approvals - Create new approval request (admin only)
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { prisma } from '@/lib/prisma'
import { ApprovalEngine } from '@/lib/workflows/approval-engine'
import { respond } from '@/lib/api-response'
import { z } from 'zod'

// GET - List pending approvals
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession()

    if (!session?.user) {
      return respond.unauthorized()
    }

    const userId = session.user.id
    const tenantId = session.user.tenantId
    if (!userId || !tenantId) {
      return respond.unauthorized()
    }

    // Parse query parameters
    const searchParams = request.nextUrl.searchParams
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100)
    const offset = parseInt(searchParams.get('offset') || '0')
    const type = searchParams.get('type') // BILL, EXPENSE, DOCUMENT, etc.
    const status = searchParams.get('status') // PENDING, APPROVED, REJECTED, EXPIRED

    // Build where clause
    const where: any = {
      tenantId,
      approverId: userId,
    }

    if (type) where.itemType = type
    if (status) where.status = status

    const [approvals, total] = await Promise.all([
      prisma.approval.findMany({
        where,
        include: {
          requester: {
            select: { id: true, name: true, email: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      prisma.approval.count({ where }),
    ])

    return respond.ok({
      data: approvals,
      meta: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total,
      },
    })
  } catch (error) {
    console.error('Error fetching approvals:', error)
    return respond.serverError()
  }
}

// POST - Create approval request (admin only)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession()

    if (!session?.user) {
      return respond.unauthorized()
    }

    const userId = session.user.id
    const tenantId = session.user.tenantId
    if (!userId || !tenantId || session.user.role !== 'ADMIN') {
      return respond.forbidden('Admin access required')
    }

    // Validate request body
    const schema = z.object({
      itemType: z.enum([
        'BILL',
        'EXPENSE',
        'DOCUMENT',
        'INVOICE',
        'SERVICE_REQUEST',
        'ENTITY',
        'USER',
        'OTHER',
      ]),
      itemId: z.string().min(1),
      approverId: z.string().min(1),
      priority: z.enum(['LOW', 'NORMAL', 'HIGH', 'URGENT']).optional(),
      expiresInDays: z.number().min(1).max(365).optional(),
      metadata: z.record(z.any()).optional(),
    })

    const payload = schema.parse(await request.json())

    // Verify approver exists
    const approver = await prisma.user.findUnique({
      where: { id: payload.approverId },
    })

    if (!approver || approver.tenantId !== tenantId) {
      return respond.badRequest('Invalid approver')
    }

    // Create approval using engine
    const expiresAt = payload.expiresInDays
      ? new Date(Date.now() + payload.expiresInDays * 24 * 60 * 60 * 1000)
      : undefined

    const approval = await ApprovalEngine.requestApproval({
      tenantId,
      itemType: payload.itemType as any,
      itemId: payload.itemId,
      approverId: payload.approverId,
      requesterId: userId,
      priority: payload.priority?.toLowerCase() as any,
      expiresAt,
      metadata: payload.metadata,
    })

    return respond.ok({ data: approval }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return respond.badRequest(error.errors)
    }
    console.error('Error creating approval:', error)
    return respond.serverError()
  }
}
