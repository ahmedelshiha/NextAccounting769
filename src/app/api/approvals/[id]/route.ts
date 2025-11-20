/**
 * Approval Decision API
 * GET /api/approvals/[id] - Get approval details
 * POST /api/approvals/[id]/approve - Approve request
 * POST /api/approvals/[id]/reject - Reject request
 * POST /api/approvals/[id]/delegate - Delegate to another user
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { prisma } from '@/lib/prisma'
import { ApprovalEngine } from '@/lib/workflows/approval-engine'
import { respond } from '@/lib/api-response'
import { z } from 'zod'

// GET - Get approval details
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession()

    if (!session?.user) {
      return respond.unauthorized()
    }

    const tenantId = session.user.tenantId
    if (!tenantId) {
      return respond.unauthorized()
    }

    const approval = await prisma.approval.findUnique({
      where: { id: params.id },
      include: {
        approver: {
          select: { id: true, name: true, email: true },
        },
        requester: {
          select: { id: true, name: true, email: true },
        },
      },
    })

    if (!approval) {
      return respond.notFound()
    }

    if (approval.tenantId !== tenantId) {
      return respond.forbidden()
    }

    // Get approval history
    const history = await ApprovalEngine.getApprovalHistory(approval.id, 10)

    return respond.ok({
      data: { ...approval, history },
    })
  } catch (error) {
    console.error('Error fetching approval:', error)
    return respond.serverError()
  }
}

// POST - Approve request
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const approval = await prisma.approval.findUnique({
      where: { id: params.id },
    })

    if (!approval || approval.tenantId !== tenantId) {
      return respond.forbidden()
    }

    // Check authorization
    if (approval.approverId !== userId) {
      return respond.forbidden('Not authorized to approve this request')
    }

    // Determine action from route
    const action = request.nextUrl.searchParams.get('action') || 'approve'

    // Parse request body
    const schema = z.object({
      notes: z.string().optional(),
      metadata: z.record(z.any()).optional(),
      delegateTo: z.string().optional(),
    })

    const body = schema.parse(await request.json())

    if (action === 'delegate' && body.delegateTo) {
      // Delegate approval
      const result = await ApprovalEngine.delegate(
        params.id,
        userId,
        body.delegateTo,
        body.notes
      )
      return respond.ok({ data: result })
    } else if (action === 'reject') {
      // Reject approval
      const result = await ApprovalEngine.reject(params.id, {
        approverId: userId,
        status: 'rejected',
        notes: body.notes,
        metadata: body.metadata,
      })
      return respond.ok({ data: result })
    } else {
      // Approve (default)
      const result = await ApprovalEngine.approve(params.id, {
        approverId: userId,
        status: 'approved',
        notes: body.notes,
        metadata: body.metadata,
      })
      return respond.ok({ data: result })
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return respond.badRequest(error.errors)
    }
    if (error instanceof Error) {
      return respond.badRequest(error.message)
    }
    console.error('Error updating approval:', error)
    return respond.serverError()
  }
}
