import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { logAuditSafe } from '@/lib/observability-helpers'
import { withTenantContext } from '@/lib/api-wrapper'
import { requireTenantContext } from '@/lib/tenant-utils'
import { z } from 'zod'

const UpdateConnectionSchema = z.object({
  accountNumber: z.string().min(1).max(50).optional(),
  bankName: z.string().min(1).max(255).optional(),
  accountType: z.enum(['checking', 'savings', 'business']).optional(),
  syncFrequency: z.enum(['DAILY', 'WEEKLY', 'MONTHLY', 'MANUAL']).optional(),
  status: z.enum(['ACTIVE', 'INACTIVE', 'ERROR']).optional(),
})

export const GET = withTenantContext(async (
  request: NextRequest,
  { params }: { params: { id: string } }
) => {
  try {
    const ctx = requireTenantContext()

    if (!ctx?.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const tenantId = ctx.tenantId
    if (!tenantId) {
      return NextResponse.json({ error: 'Tenant context required' }, { status: 400 })
    }

    const { id } = params

    // Fetch connection
    const connection = await prisma.bankingConnection.findFirst({
      where: { id, tenantId },
      select: {
        id: true,
        provider: true,
        accountNumber: true,
        bankName: true,
        accountType: true,
        status: true,
        syncFrequency: true,
        lastSyncAt: true,
        lastSyncError: true,
        entityId: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: { transactions: true },
        },
      },
    })

    if (!connection) {
      return NextResponse.json({ error: 'Connection not found' }, { status: 404 })
    }

    return NextResponse.json(
      {
        ...connection,
        transactionCount: connection._count.transactions,
        _count: undefined,
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Banking connection detail error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
})

export const PATCH = withTenantContext(async (
  request: NextRequest,
  { params }: { params: { id: string } }
) => {
  try {
    const ctx = requireTenantContext()

    if (!ctx?.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const tenantId = ctx.tenantId
    if (!tenantId) {
      return NextResponse.json({ error: 'Tenant context required' }, { status: 400 })
    }

    const { id } = params
    const body = await request.json()
    const validated = UpdateConnectionSchema.parse(body)

    // Verify connection exists and belongs to tenant
    const connection = await prisma.bankingConnection.findFirst({
      where: { id, tenantId },
    })

    if (!connection) {
      return NextResponse.json({ error: 'Connection not found' }, { status: 404 })
    }

    // Update connection
    const updatedConnection = await prisma.bankingConnection.update({
      where: { id },
      data: validated,
      select: {
        id: true,
        provider: true,
        accountNumber: true,
        bankName: true,
        accountType: true,
        status: true,
        syncFrequency: true,
        lastSyncAt: true,
        lastSyncError: true,
        updatedAt: true,
      },
    })

    await logAuditSafe({
      action: 'banking:update_connection',
      details: {
        connectionId: id,
        changes: Object.keys(validated),
      },
    }).catch(() => {})

    return NextResponse.json(updatedConnection, { status: 200 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: 'Invalid request body',
          details: error.issues,
        },
        { status: 400 }
      )
    }

    console.error('Banking connection update error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
})

export const DELETE = withTenantContext(async (
  request: NextRequest,
  { params }: { params: { id: string } }
) => {
  try {
    const ctx = requireTenantContext()

    if (!ctx?.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const tenantId = ctx.tenantId
    if (!tenantId) {
      return NextResponse.json({ error: 'Tenant context required' }, { status: 400 })
    }

    const { id } = params

    // Verify connection exists and belongs to tenant
    const connection = await prisma.bankingConnection.findFirst({
      where: { id, tenantId },
      select: {
        id: true,
        accountNumber: true,
        bankName: true,
        sessionToken: true,
      },
    })

    if (!connection) {
      return NextResponse.json({ error: 'Connection not found' }, { status: 404 })
    }

    // Delete all associated transactions first
    await prisma.bankingTransaction.deleteMany({
      where: { connectionId: id },
    })

    // Delete connection
    await prisma.bankingConnection.delete({
      where: { id },
    })

    await logAuditSafe({
      action: 'banking:delete_connection',
      details: {
        connectionId: id,
        bankName: connection.bankName,
        accountNumber: connection.accountNumber,
      },
    }).catch(() => {})

    return NextResponse.json(
      { success: true, message: 'Connection deleted' },
      { status: 200 }
    )
  } catch (error) {
    console.error('Banking connection delete error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
})
