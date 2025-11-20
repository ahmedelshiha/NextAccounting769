import { NextRequest, NextResponse } from 'next/server'
import { withTenantContext } from '@/lib/api-wrapper'
import { requireTenantContext } from '@/lib/tenant-utils'
import prisma from '@/lib/prisma'
import { logger } from '@/lib/logger'
import { z } from 'zod'

const payInvoiceSchema = z.object({
  amount: z.number().positive().optional(),
  paymentMethod: z.string().optional(),
  reference: z.string().optional(),
})

export const POST = withTenantContext(
  async (request: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
    try {
      const { id: invoiceId } = await params
      const ctx = requireTenantContext()

      if (!ctx.userId || !ctx.tenantId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }

      // Verify invoice exists and belongs to tenant
      const invoice = await prisma.invoice.findUnique({
        where: { id: invoiceId },
      })

      if (!invoice) {
        return NextResponse.json({ error: 'Invoice not found' }, { status: 404 })
      }

      if (invoice.tenantId !== ctx.tenantId) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }

      // Parse payment data
      const body = await request.json()
      const paymentData = payInvoiceSchema.parse(body)

      const amountToPay = paymentData.amount ? Math.round(paymentData.amount * 100) : invoice.totalCents
      
      if (amountToPay > invoice.totalCents) {
        return NextResponse.json(
          { error: 'Payment amount exceeds invoice total' },
          { status: 400 }
        )
      }

      // Update invoice status
      const updatedInvoice = await prisma.invoice.update({
        where: { id: invoiceId },
        data: {
          status: amountToPay >= invoice.totalCents ? 'PAID' : 'UNPAID',
          paidAt: new Date(),
        },
      })

      logger.info('Invoice payment processed', {
        invoiceId,
        tenantId: ctx.tenantId,
        amount: amountToPay / 100,
      })

      return NextResponse.json({
        success: true,
        invoice: {
          id: updatedInvoice.id,
          invoiceNumber: updatedInvoice.number || 'INV-' + updatedInvoice.id.slice(0, 8),
          amount: updatedInvoice.totalCents / 100,
          currency: updatedInvoice.currency || 'USD',
          status: updatedInvoice.status === 'PAID' ? 'paid' : 'pending',
          paidAt: updatedInvoice.paidAt?.toISOString(),
        },
      })
    } catch (error) {
      if (error instanceof z.ZodError) {
        return NextResponse.json(
          { error: 'Validation error', details: error.issues },
          { status: 400 }
        )
      }
      logger.error('Error processing invoice payment', { error })
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      )
    }
  },
  { requireAuth: true }
)
