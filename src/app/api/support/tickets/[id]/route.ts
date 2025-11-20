import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { logAuditSafe } from '@/lib/observability-helpers'
import { z } from 'zod'
import { withTenantContext } from '@/lib/api-wrapper'
import { requireTenantContext } from '@/lib/tenant-utils'

const UpdateTicketSchema = z.object({
  title: z.string().min(5).max(255).optional(),
  description: z.string().min(10).max(5000).optional(),
  category: z.enum(['GENERAL', 'BILLING', 'TECHNICAL', 'ACCOUNT', 'OTHER']).optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional(),
  status: z.enum(['OPEN', 'IN_PROGRESS', 'WAITING', 'RESOLVED', 'CLOSED']).optional(),
  assignedToId: z.string().optional().nullable(),
  dueAt: z.string().datetime().optional().nullable(),
  tags: z.array(z.string()).optional(),
})

export const GET = withTenantContext(
  async (request: NextRequest, { params }: { params: { id: string } }) => {
    try {
      const { userId, tenantId } = requireTenantContext()
      const { id } = params

      const ticket = await prisma.supportTicket.findFirst({
        where: { id, tenantId: tenantId! },
        include: {
          user: { select: { id: true, email: true, name: true } },
          assignedTo: { select: { id: true, email: true, name: true } },
          comments: {
            include: { author: { select: { id: true, email: true, name: true } } },
            orderBy: { createdAt: 'desc' },
          },
          statusHistory: {
            orderBy: { changedAt: 'desc' },
            take: 10,
          },
        },
      })

      if (!ticket) {
        return NextResponse.json({ error: 'Ticket not found' }, { status: 404 })
      }

      return NextResponse.json(ticket, { status: 200 })
    } catch (error) {
      console.error('Support ticket detail API error:', error)
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
  },
  { requireAuth: true }
);

export const PATCH = withTenantContext(
  async (request: NextRequest, { params }: { params: { id: string } }) => {
    try {
      const { userId, tenantId } = requireTenantContext()
      const { id } = params
      const body = await request.json()
      const validated = UpdateTicketSchema.parse(body)

      const ticket = await prisma.supportTicket.findFirst({
        where: { id, tenantId: tenantId! },
      })

      if (!ticket) {
        return NextResponse.json({ error: 'Ticket not found' }, { status: 404 })
      }

      const updatedTicket = await prisma.supportTicket.update({
        where: { id },
        data: validated,
        include: {
          user: { select: { id: true, email: true, name: true } },
          assignedTo: { select: { id: true, email: true, name: true } },
        },
      })

      await logAuditSafe({
        action: 'support:update_ticket',
        details: { ticketId: id, updates: Object.keys(validated) },
      }).catch(() => {})

      return NextResponse.json(updatedTicket, { status: 200 })
    } catch (error) {
      if (error instanceof z.ZodError) {
        return NextResponse.json({ error: 'Invalid request body', details: error.issues }, { status: 400 })
      }
      console.error('Support ticket update API error:', error)
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
  },
  { requireAuth: true }
);

export const DELETE = withTenantContext(
  async (request: NextRequest, { params }: { params: { id: string } }) => {
    try {
      const { userId, tenantId } = requireTenantContext()
      const { id } = params

      const ticket = await prisma.supportTicket.findFirst({
        where: { id, tenantId: tenantId! },
      })

      if (!ticket) {
        return NextResponse.json({ error: 'Ticket not found' }, { status: 404 })
      }

      await prisma.supportTicket.delete({ where: { id } })

      await logAuditSafe({
        action: 'support:delete_ticket',
        details: { ticketId: id },
      }).catch(() => {})

      return NextResponse.json({ success: true }, { status: 200 })
    } catch (error) {
      console.error('Support ticket delete API error:', error)
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
  },
  { requireAuth: true }
);
