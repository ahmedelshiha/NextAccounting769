import { NextRequest, NextResponse } from 'next/server'
import { withTenantContext } from '@/lib/api-wrapper'
import { requireTenantContext } from '@/lib/tenant-utils'
import type { TenantContext } from '@/lib/tenant-context'
import prisma from '@/lib/prisma'
import { logger } from '@/lib/logger'
import { z } from 'zod'

const createInvoiceSchema = z.object({
  number: z.string().optional(),
  amount: z.number().positive(),
  currency: z.string().default('USD'),
})

export const GET = withTenantContext(async (request: NextRequest) => {
  let ctx: TenantContext | undefined;

  try {
    ctx = requireTenantContext()

    if (!ctx.userId || !ctx.tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const invoices = await prisma.invoice.findMany({
      where: {
        tenantId: ctx.tenantId,
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 50,
      select: {
        id: true,
        number: true,
        totalCents: true,
        currency: true,
        status: true,
        paidAt: true,
        createdAt: true,
      },
    })

    const formattedInvoices = invoices.map((inv) => ({
      id: inv.id,
      invoiceNumber: inv.number || 'INV-' + inv.id.slice(0, 8),
      date: inv.createdAt.toISOString(),
      amount: inv.totalCents / 100,
      currency: inv.currency || 'USD',
      status: (inv.status === 'PAID' ? 'paid' : inv.paidAt ? 'paid' : 'pending') as 'paid' | 'pending' | 'overdue',
      pdfUrl: null,
    }))

    return NextResponse.json({
      success: true,
      invoices: formattedInvoices,
    })
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error ? error.stack : undefined;

    logger.error('Error fetching invoices', {
      error: errorMsg,
      userId: ctx?.userId,
      tenantId: ctx?.tenantId,
    });

    console.error('[INVOICES_API_ERROR] GET failed:', {
      message: errorMsg,
      stack: errorStack,
    });

    return NextResponse.json(
      {
        error: 'Internal server error',
        message: errorMsg,
        ...(process.env.NODE_ENV === 'development' && { details: errorStack }),
      },
      { status: 500 }
    )
  }
})

export const POST = withTenantContext(async (request: NextRequest) => {
  let ctx: TenantContext | undefined;

  try {
    ctx = requireTenantContext()

    if (!ctx.userId || !ctx.tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const data = createInvoiceSchema.parse(body)

    const invoice = await prisma.invoice.create({
      data: {
        tenantId: ctx.tenantId,
        number: data.number,
        totalCents: Math.round(data.amount * 100),
        currency: data.currency,
        status: 'UNPAID',
      },
    })

    return NextResponse.json(
      {
        success: true,
        data: {
          id: invoice.id,
          invoiceNumber: invoice.number || 'INV-' + invoice.id.slice(0, 8),
          amount: invoice.totalCents / 100,
          currency: invoice.currency || 'USD',
          status: 'pending',
        },
      },
      { status: 201 }
    )
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.issues },
        { status: 400 }
      )
    }
    const errorMsg = error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error ? error.stack : undefined;

    logger.error('Error creating invoice', {
      error: errorMsg,
      userId: ctx?.userId,
      tenantId: ctx?.tenantId,
    });

    console.error('[INVOICES_API_ERROR] POST failed:', {
      message: errorMsg,
      stack: errorStack,
    });

    return NextResponse.json(
      {
        error: 'Internal server error',
        message: errorMsg,
        ...(process.env.NODE_ENV === 'development' && { details: errorStack }),
      },
      { status: 500 }
    )
  }
})
