import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { logAuditSafe } from '@/lib/observability-helpers'
import { withTenantContext } from '@/lib/api-wrapper'
import { requireTenantContext } from '@/lib/tenant-utils'
import { z } from 'zod'
import { ZATCAAdapter } from '@/lib/einvoicing/zatca-adapter'
import { ETAAdapter } from '@/lib/einvoicing/eta-adapter'

const SubmitEInvoiceSchema = z.object({
  invoiceId: z.string().min(1),
  country: z.enum(['AE', 'SA', 'EG']),
  certificateId: z.string().optional(),
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
    const validated = SubmitEInvoiceSchema.parse(body)

    // Get invoice
    const invoice = await prisma.invoice.findFirst({
      where: { id: validated.invoiceId, tenantId },
    })

    if (!invoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 })
    }

    let submitResult: any = null

    try {
      if (validated.country === 'SA') {
        // ZATCA (KSA) submission
        const zatca = new ZATCAAdapter()

        // TODO: Fetch certificate from secure storage
        // For now, use mock certificate
        const mockCertificate = {
          privateKey: process.env.ZATCA_PRIVATE_KEY || '',
          certificate: process.env.ZATCA_CERTIFICATE || '',
          algorithm: 'SHA256_RSA' as const,
        }

        if (!mockCertificate.privateKey) {
          return NextResponse.json(
            {
              error: 'ZATCA certificate not configured',
              details: 'Missing ZATCA_PRIVATE_KEY environment variable',
            },
            { status: 400 }
          )
        }

        // Create ZATCA invoice object from invoice data
        const zatcaInvoice = {
          id: invoice.id,
          uuid: `UUID-${Date.now()}`,
          invoiceNumber: invoice.invoiceNumber,
          invoiceType: 'STANDARD' as const,
          issueDate: invoice.createdAt,
          seller: {
            name: invoice.sellerName || 'Company',
            crNumber: 'CR_NUMBER',
            taxId: invoice.taxId || 'TAX_ID',
            address: invoice.sellerAddress || 'Address',
          },
          lineItems: [],
          totals: {
            subtotal: invoice.subtotal || 0,
            discountTotal: 0,
            taxTotal: invoice.taxAmount || 0,
            total: invoice.totalAmount || 0,
          },
          status: 'DRAFT' as const,
        }

        submitResult = await zatca.submit(zatcaInvoice)
      } else if (validated.country === 'EG') {
        // ETA (Egypt) submission
        const eta = new ETAAdapter()

        // TODO: Fetch certificate from secure storage
        const mockCertificate = {
          privateKey: process.env.ETA_PRIVATE_KEY || '',
          certificate: process.env.ETA_CERTIFICATE || '',
          algorithm: 'SHA256_RSA' as const,
        }

        if (!mockCertificate.privateKey) {
          return NextResponse.json(
            {
              error: 'ETA certificate not configured',
              details: 'Missing ETA_PRIVATE_KEY environment variable',
            },
            { status: 400 }
          )
        }

        // Create ETA invoice object
        const etaInvoice = {
          id: invoice.id,
          uuid: `UUID-${Date.now()}`,
          invoiceNumber: invoice.invoiceNumber,
          invoiceType: 'STANDARD' as const,
          documentType: 'INVOICE' as const,
          issueDate: invoice.createdAt,
          seller: {
            name: invoice.sellerName || 'Company',
            taxNumber: invoice.taxId || '000000000',
            address: invoice.sellerAddress || 'Address',
          },
          lineItems: [],
          totals: {
            subtotal: invoice.subtotal || 0,
            discountTotal: 0,
            taxTotal: invoice.taxAmount || 0,
            total: invoice.totalAmount || 0,
          },
          status: 'DRAFT' as const,
        }

        submitResult = await eta.submit(etaInvoice)
      }
    } catch (error) {
      return NextResponse.json(
        {
          error: 'E-invoicing submission failed',
          details: String(error),
        },
        { status: 400 }
      )
    }

    // Update invoice with submission details
    if (submitResult.success) {
      await prisma.invoice.update({
        where: { id: validated.invoiceId },
        data: {
          status: 'SUBMITTED',
          metadata: JSON.stringify({
            ...invoice.metadata,
            einvoicingStatus: 'SUBMITTED',
            einvoicingReference: submitResult.referenceNumber || submitResult.etaUuid,
            einvoicingSubmittedAt: new Date().toISOString(),
            country: validated.country,
          }),
        },
      })
    }

    // Log audit event
    await logAuditSafe({
      action: 'einvoicing:submit',
      details: {
        invoiceId: validated.invoiceId,
        country: validated.country,
        success: submitResult.success,
        reference: submitResult.referenceNumber || submitResult.etaUuid,
      },
    }).catch(() => {})

    return NextResponse.json(
      {
        success: submitResult.success,
        message: submitResult.message,
        reference: submitResult.referenceNumber || submitResult.etaUuid,
        errors: submitResult.errors || [],
      },
      { status: submitResult.success ? 200 : 400 }
    )
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: 'Invalid request body',
          details: error.errors,
        },
        { status: 400 }
      )
    }

    console.error('E-invoicing submission error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
})
