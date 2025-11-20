import { NextRequest, NextResponse } from 'next/server'
import { withTenantContext } from '@/lib/api-wrapper'
import { requireTenantContext } from '@/lib/tenant-utils'
import prisma from '@/lib/prisma'
import { logger } from '@/lib/logger'

export const GET = withTenantContext(async (request: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  try {
    const ctx = requireTenantContext()
    const { id: invoiceId } = await params

    if (!ctx.userId || !ctx.tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const invoice = await prisma.invoice.findUnique({
      where: { id: invoiceId },
      select: {
        id: true,
        tenantId: true,
        number: true,
        pdfUrl: true,
      },
    })

    if (!invoice || invoice.tenantId !== ctx.tenantId) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 })
    }

    if (!invoice.pdfUrl) {
      return NextResponse.json(
        { error: 'Invoice PDF not available' },
        { status: 404 }
      )
    }

    try {
      const pdfResponse = await fetch(invoice.pdfUrl)
      if (!pdfResponse.ok) {
        throw new Error('Failed to fetch PDF')
      }

      const buffer = await pdfResponse.arrayBuffer()

      return new NextResponse(buffer, {
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="Invoice-${invoice.number}.pdf"`,
          'Cache-Control': 'no-cache, no-store, must-revalidate',
        },
      })
    } catch (error) {
      logger.error('Error generating PDF', { invoiceId, error })
      return NextResponse.json(
        { error: 'Failed to generate invoice PDF' },
        { status: 500 }
      )
    }
  } catch (error) {
    logger.error('Error downloading invoice', { error })
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
})
