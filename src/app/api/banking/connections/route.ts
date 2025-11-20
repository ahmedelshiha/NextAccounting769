import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { logAuditSafe } from '@/lib/observability-helpers'
import { withTenantContext } from '@/lib/api-wrapper'
import { requireTenantContext } from '@/lib/tenant-utils'
import { z } from 'zod'
import { createBankingProvider } from '@/lib/banking/adapters'

const CreateConnectionSchema = z.object({
  provider: z.enum(['plaid', 'uae', 'ksa', 'csv']),
  accountNumber: z.string().min(1).max(50),
  bankName: z.string().min(1).max(255),
  accountType: z.enum(['checking', 'savings', 'business']).optional(),
  entityId: z.string().optional(),
  syncFrequency: z.enum(['DAILY', 'WEEKLY', 'MONTHLY', 'MANUAL']).default('DAILY'),
  credentials: z.record(z.string(), z.any()).optional(),
})

const FilterSchema = z.object({
  status: z.enum(['ACTIVE', 'INACTIVE', 'ERROR']).optional(),
  provider: z.string().optional(),
  limit: z.coerce.number().min(1).max(100).default(20).optional(),
  offset: z.coerce.number().min(0).default(0).optional(),
})

export const GET = withTenantContext(async (request: NextRequest) => {
  try {
    const ctx = requireTenantContext()

    if (!ctx?.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const tenantId = ctx.tenantId
    if (!tenantId) {
      return NextResponse.json({ error: 'Tenant context required' }, { status: 400 })
    }

    // Parse query filters
    const queryParams = Object.fromEntries(request.nextUrl.searchParams) as Record<string, string>
    const filters = FilterSchema.parse(queryParams)

    // Build where clause
    const where: any = { tenantId }
    if (filters.status) {
      where.status = filters.status
    }
    if (filters.provider) {
      where.provider = filters.provider
    }

    // Count total
    const total = await prisma.bankingConnection.count({ where })

    // Fetch connections
    const connections = await prisma.bankingConnection.findMany({
      where,
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
      orderBy: { createdAt: 'desc' },
      take: filters.limit,
      skip: filters.offset,
    })

    const formatted = connections.map((conn) => ({
      ...conn,
      transactionCount: conn._count.transactions,
      _count: undefined,
    }))

    await logAuditSafe({
      action: 'banking:list_connections',
      details: {
        count: formatted.length,
        filters,
      },
    }).catch(() => {})

    return NextResponse.json(
      {
        connections: formatted,
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

    console.error('Banking connections list error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
})

export const POST = withTenantContext(async (request: NextRequest) => {
  try {
    const ctx = requireTenantContext()

    if (!ctx?.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const tenantId = ctx.tenantId
    if (!tenantId) {
      return NextResponse.json({ error: 'Tenant context required' }, { status: 400 })
    }

    const body = await request.json()
    const validated = CreateConnectionSchema.parse(body)

    // Get provider and test connection
    const provider = createBankingProvider(validated.provider)

    let sessionToken: string | null = null
    try {
      if (validated.credentials) {
        sessionToken = await provider.authenticate(validated.credentials)
      }
    } catch (error) {
      return NextResponse.json(
        {
          error: 'Failed to authenticate with bank provider',
          details: String(error),
        },
        { status: 400 }
      )
    }

    // Create connection
    const connection = await prisma.bankingConnection.create({
      data: {
        tenantId,
        entityId: validated.entityId || null,
        provider: validated.provider,
        accountNumber: validated.accountNumber,
        bankName: validated.bankName,
        accountType: validated.accountType || 'checking',
        status: 'ACTIVE',
        syncFrequency: validated.syncFrequency,
        sessionToken: sessionToken || null,
        credentials: validated.credentials || undefined,
        metadata: {
          createdByUserId: ctx.userId,
          initializedAt: new Date().toISOString(),
        },
      },
      select: {
        id: true,
        provider: true,
        accountNumber: true,
        bankName: true,
        accountType: true,
        status: true,
        syncFrequency: true,
        createdAt: true,
      },
    })

    await logAuditSafe({
      action: 'banking:create_connection',
      details: {
        connectionId: connection.id,
        provider: connection.provider,
        bankName: connection.bankName,
      },
    }).catch(() => {})

    return NextResponse.json(connection, { status: 201 })
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

    console.error('Banking connection creation error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
})
