import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { logAuditSafe } from '@/lib/observability-helpers'
import { z } from 'zod'
import { withTenantContext } from '@/lib/api-wrapper'
import { requireTenantContext } from '@/lib/tenant-utils'

const CreateTicketSchema = z.object({
  title: z.string().min(5).max(255),
  description: z.string().min(10).max(5000).optional(),
  category: z.enum(['GENERAL', 'BILLING', 'TECHNICAL', 'ACCOUNT', 'OTHER']).default('GENERAL'),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).default('MEDIUM'),
  dueAt: z.string().datetime().optional(),
  tags: z.array(z.string()).default([]),
})

const TicketFilterSchema = z.object({
  limit: z.coerce.number().min(1).max(100).default(20).optional(),
  offset: z.coerce.number().min(0).default(0).optional(),
  status: z.string().optional(),
  priority: z.string().optional(),
  category: z.string().optional(),
  assignedToMe: z.coerce.boolean().default(false).optional(),
  sortBy: z.enum(['createdAt', 'dueAt', 'priority']).default('createdAt').optional(),
  sortOrder: z.enum(['asc', 'desc']).default('desc').optional(),
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

    // Parse filters
    const queryParams = Object.fromEntries(request.nextUrl.searchParams)
    const filters = TicketFilterSchema.parse(queryParams)

    // Build where clause
    const where: any = { tenantId }

    if (filters.status) {
      where.status = filters.status
    }

    if (filters.priority) {
      where.priority = filters.priority
    }

    if (filters.category) {
      where.category = filters.category
    }

    if (filters.assignedToMe) {
      where.assignedToId = ctx.userId
    }

    // Count total
    const total = await prisma.supportTicket.count({ where })

    // Fetch paginated tickets
    const tickets = await prisma.supportTicket.findMany({
      where,
      select: {
        id: true,
        title: true,
        description: true,
        category: true,
        priority: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        resolvedAt: true,
        dueAt: true,
        user: {
          select: { id: true, email: true, name: true },
        },
        assignedTo: {
          select: { id: true, email: true, name: true },
        },
        _count: {
          select: { comments: true },
        },
      },
      orderBy: {
        [filters.sortBy || 'createdAt']: filters.sortOrder || 'desc',
      },
      take: filters.limit,
      skip: filters.offset,
    })

    const formattedTickets = tickets.map((ticket) => ({
      id: ticket.id,
      title: ticket.title,
      description: ticket.description,
      category: ticket.category,
      priority: ticket.priority,
      status: ticket.status,
      createdAt: ticket.createdAt.toISOString(),
      updatedAt: ticket.updatedAt.toISOString(),
      resolvedAt: ticket.resolvedAt?.toISOString(),
      dueAt: ticket.dueAt?.toISOString(),
      createdBy: {
        id: ticket.user.id,
        email: ticket.user.email,
        name: ticket.user.name,
      },
      assignedTo: ticket.assignedTo
        ? {
            id: ticket.assignedTo.id,
            email: ticket.assignedTo.email,
            name: ticket.assignedTo.name,
          }
        : null,
      commentCount: ticket._count.comments,
    }))

    return NextResponse.json(
      {
        tickets: formattedTickets,
        pagination: {
          total,
          limit: filters.limit,
          offset: filters.offset,
          hasMore: (filters.offset ?? 0) + (filters.limit ?? 0) < total,
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

    console.error('Support tickets list API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
})

export const POST = withTenantContext(async (request: NextRequest) => {
  try {
    const ctx = requireTenantContext()

    if (!ctx?.userId || !ctx?.userEmail) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const tenantId = ctx.tenantId
    if (!tenantId) {
      return NextResponse.json({ error: 'Tenant context required' }, { status: 400 })
    }

    const body = await request.json()
    const validated = CreateTicketSchema.parse(body)

    // Create ticket
    const ticket = await prisma.supportTicket.create({
      data: {
        tenantId,
        userId: ctx.userId,
        title: validated.title,
        description: validated.description,
        category: validated.category,
        priority: validated.priority,
        dueAt: validated.dueAt ? new Date(validated.dueAt) : null,
        tags: validated.tags,
        status: 'OPEN',
      },
      include: {
        user: { select: { id: true, email: true, name: true } },
        assignedTo: { select: { id: true, email: true, name: true } },
      },
    })

    // Log creation
    await logAuditSafe({
      action: 'support:create_ticket',
      details: {
        ticketId: ticket.id,
        title: ticket.title,
        category: ticket.category,
        priority: ticket.priority,
      },
    }).catch(() => {})

    return NextResponse.json(
      {
        success: true,
        ticket: {
          id: ticket.id,
          title: ticket.title,
          description: ticket.description,
          category: ticket.category,
          priority: ticket.priority,
          status: ticket.status,
          createdAt: ticket.createdAt.toISOString(),
          createdBy: {
            id: ticket.user.id,
            email: ticket.user.email,
            name: ticket.user.name,
          },
        },
      },
      { status: 201 }
    )
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

    console.error('Support ticket creation API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
})
