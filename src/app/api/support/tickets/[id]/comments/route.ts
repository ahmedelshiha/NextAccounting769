import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { z } from 'zod'
import { withTenantContext } from '@/lib/api-wrapper'
import { requireTenantContext } from '@/lib/tenant-utils'

const CreateCommentSchema = z.object({
  content: z.string().min(1).max(5000),
})

export const GET = withTenantContext(
  async (request: NextRequest, { params }: { params: { id: string } }) => {
    try {
      const { userId, tenantId } = requireTenantContext()
      const { id } = params

      const ticket = await prisma.supportTicket.findFirst({
        where: { id, tenantId },
      })

      if (!ticket) {
        return NextResponse.json({ error: 'Ticket not found' }, { status: 404 })
      }

      const comments = await prisma.supportTicketComment.findMany({
        where: { ticketId: id, tenantId },
        include: { author: { select: { id: true, email: true, name: true } } },
        orderBy: { createdAt: 'asc' },
      })

      return NextResponse.json({ comments }, { status: 200 })
    } catch (error) {
      console.error('Support comments list API error:', error)
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
  },
  { requireAuth: true }
);

export const POST = withTenantContext(
  async (request: NextRequest, { params }: { params: { id: string } }) => {
    try {
      const { userId, tenantId } = requireTenantContext()
      const { id } = params
      const body = await request.json()
      const validated = CreateCommentSchema.parse(body)

      const ticket = await prisma.supportTicket.findFirst({
        where: { id, tenantId },
      })

      if (!ticket) {
        return NextResponse.json({ error: 'Ticket not found' }, { status: 404 })
      }

      const comment = await prisma.supportTicketComment.create({
        data: {
          ticketId: id,
          tenantId,
          authorId: userId,
          content: validated.content,
        },
        include: { author: { select: { id: true, email: true, name: true } } },
      })

      return NextResponse.json({ success: true, comment }, { status: 201 })
    } catch (error) {
      if (error instanceof z.ZodError) {
        return NextResponse.json({ error: 'Invalid request body', details: error.errors }, { status: 400 })
      }
      console.error('Support comment create API error:', error)
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
  },
  { requireAuth: true }
);
