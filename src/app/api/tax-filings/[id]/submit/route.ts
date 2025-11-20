import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { logAuditSafe } from '@/lib/observability-helpers'
import { withTenantContext } from '@/lib/api-wrapper'
import { requireTenantContext } from '@/lib/tenant-utils'
import { z } from 'zod'

const SubmitFilingSchema = z.object({
  documents: z.array(z.string()).optional(),
  comments: z.string().optional(),
})

export const POST = withTenantContext(async (
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
    const validated = SubmitFilingSchema.parse(body)

    // Get filing
    const filing = await prisma.taxFiling.findFirst({
      where: { id, tenantId },
    })

    if (!filing) {
      return NextResponse.json({ error: 'Filing not found' }, { status: 404 })
    }

    if (filing.status !== 'DRAFT') {
      return NextResponse.json(
        { error: `Cannot submit filing with status: ${filing.status}` },
        { status: 400 }
      )
    }

    // Update filing status
    const submittedFiling = await prisma.taxFiling.update({
      where: { id },
      data: {
        status: 'SUBMITTED',
        submittedAt: new Date(),
        submittedBy: ctx.userId,
        attachmentIds: validated.documents || [],
        metadata: JSON.stringify({
          submissionComments: validated.comments,
          submissionTime: new Date().toISOString(),
          submittedByEmail: ctx.userEmail,
        }),
      },
      select: {
        id: true,
        country: true,
        taxType: true,
        status: true,
        taxAmount: true,
        submittedAt: true,
      },
    })

    // Create audit event
    await logAuditSafe({
      action: 'tax_filings:submit',
      details: {
        filingId: id,
        country: filing.country,
        taxType: filing.taxType,
        taxAmount: filing.taxAmount,
        documentsCount: validated.documents?.length || 0,
      },
    }).catch(() => {})

    return NextResponse.json(
      {
        success: true,
        message: 'Filing submitted successfully',
        filing: submittedFiling,
      },
      { status: 200 }
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

    console.error('Tax filing submission error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
})
