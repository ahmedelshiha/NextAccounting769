import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { logAuditSafe } from '@/lib/observability-helpers'
import { withTenantContext } from '@/lib/api-wrapper'
import { requireTenantContext } from '@/lib/tenant-utils'
import { z } from 'zod'

const FilterSchema = z.object({
  matched: z.coerce.boolean().optional(),
  type: z.enum(['debit', 'credit']).optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  minAmount: z.coerce.number().optional(),
  maxAmount: z.coerce.number().optional(),
  limit: z.coerce.number().min(1).max(100).default(50),
  offset: z.coerce.number().min(0).default(0),
  sortBy: z.enum(['date', 'amount']).default('date'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
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

    // Verify connection exists and belongs to tenant
    const connection = await prisma.bankingConnection.findFirst({
      where: { id, tenantId },
    })

    if (!connection) {
      return NextResponse.json({ error: 'Connection not found' }, { status: 404 })
    }

    // Parse query filters
    const queryParams = Object.fromEntries(request.nextUrl.searchParams)
    const filters = FilterSchema.parse(queryParams)

    // Build where clause
    const where: any = { connectionId: id, tenantId }

    if (filters.matched !== undefined) {
      where.matched = filters.matched
    }

    if (filters.type) {
      where.type = filters.type
    }

    if (filters.startDate || filters.endDate) {
      where.date = {}
      if (filters.startDate) {
        where.date.gte = new Date(filters.startDate)
      }
      if (filters.endDate) {
        where.date.lte = new Date(filters.endDate)
      }
    }

    if (filters.minAmount || filters.maxAmount) {
      where.amount = {}
      if (filters.minAmount) {
        where.amount.gte = filters.minAmount
      }
      if (filters.maxAmount) {
        where.amount.lte = filters.maxAmount
      }
    }

    // Count total
    const total = await prisma.bankingTransaction.count({ where })

    // Fetch transactions
    const transactions = await prisma.bankingTransaction.findMany({
      where,
      select: {
        id: true,
        date: true,
        description: true,
        amount: true,
        currency: true,
        type: true,
        balance: true,
        reference: true,
        tags: true,
        matched: true,
        matchedToId: true,
        matchedToType: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: {
        [filters.sortBy || 'date']: filters.sortOrder || 'desc',
      },
      take: filters.limit,
      skip: filters.offset,
    })

    const formatted = transactions.map((txn) => ({
      ...txn,
      amount: Number(txn.amount),
      balance: txn.balance ? Number(txn.balance) : null,
    }))

    await logAuditSafe({
      action: 'banking:list_transactions',
      details: {
        connectionId: id,
        count: formatted.length,
        filters,
      },
    }).catch(() => {})

    return NextResponse.json(
      {
        transactions: formatted,
        connection: {
          id: connection.id,
          bankName: connection.bankName,
          accountNumber: connection.accountNumber,
          lastSyncAt: connection.lastSyncAt?.toISOString() || null,
        },
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

    console.error('Banking transactions list error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
})
