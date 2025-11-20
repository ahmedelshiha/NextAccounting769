import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { logAuditSafe } from '@/lib/observability-helpers'
import { withTenantContext } from '@/lib/api-wrapper'
import { requireTenantContext } from '@/lib/tenant-utils'
import { z } from 'zod'
import { UAEVATWorkflow, UAEESRWorkflow, UAECorporateTaxWorkflow } from '@/lib/tax-workflows/uae-workflows'
import { KSAVATWorkflow, KSAZakatWorkflow, KSAWHTWorkflow } from '@/lib/tax-workflows/ksa-workflows'
import { EgyptVATWorkflow, EgyptETAWorkflow } from '@/lib/tax-workflows/egypt-workflows'

const CreateFilingSchema = z.object({
  entityId: z.string().min(1),
  country: z.enum(['AE', 'SA', 'EG']),
  taxType: z.enum(['VAT', 'CORPORATE_TAX', 'ZAKAT', 'WHT', 'ESR', 'UBO', 'ETA', 'E_RECEIPT']),
  periodStartDate: z.string().datetime(),
  periodEndDate: z.string().datetime(),
  data: z.record(z.string(), z.any()),
})

const FilterSchema = z.object({
  country: z.string().optional(),
  taxType: z.string().optional(),
  status: z.string().optional(),
  limit: z.coerce.number().min(1).max(100).default(20),
  offset: z.coerce.number().min(0).default(0),
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
    const queryParams = Object.fromEntries(request.nextUrl.searchParams)
    const filters = FilterSchema.parse(queryParams)

    // Build where clause
    const where: any = { tenantId }
    if (filters.country) where.country = filters.country
    if (filters.taxType) where.taxType = filters.taxType
    if (filters.status) where.status = filters.status

    // Count total
    const total = await prisma.taxFiling.count({ where })

    // Fetch filings
    const filings = await prisma.taxFiling.findMany({
      where,
      select: {
        id: true,
        country: true,
        taxType: true,
        status: true,
        periodStartDate: true,
        periodEndDate: true,
        taxAmount: true,
        submittedAt: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { createdAt: 'desc' },
      take: filters.limit,
      skip: filters.offset,
    })

    await logAuditSafe({
      action: 'tax_filings:list',
      details: {
        count: filings.length,
        filters,
      },
    }).catch(() => {})

    return NextResponse.json(
      {
        filings,
        pagination: {
          total,
          limit: filters.limit,
          offset: filters.offset,
          hasMore: filters.offset + filters.limit < total,
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

    console.error('Tax filings list error:', error)
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
    const validated = CreateFilingSchema.parse(body)

    // Get entity
    const entity = await prisma.entity.findFirst({
      where: { id: validated.entityId, tenantId },
    })

    if (!entity) {
      return NextResponse.json({ error: 'Entity not found' }, { status: 404 })
    }

    // Calculate based on country and tax type
    let calculations: any = {}
    let validationErrors: any[] = []

    try {
      if (validated.country === 'AE') {
        if (validated.taxType === 'VAT') {
          const workflow = new UAEVATWorkflow()
          const validation = workflow.validateFiling(validated.data as any)
          if (!validation.isValid) validationErrors = validation.errors
          calculations = workflow.calculateVAT(validated.data as any)
        } else if (validated.taxType === 'ESR') {
          const workflow = new UAEESRWorkflow()
          const validation = workflow.validateESRFiling(validated.data as any)
          if (!validation.isValid) validationErrors = validation.errors
          calculations = { taxAmount: 0 } // ESR doesn't have tax amount
        } else if (validated.taxType === 'CORPORATE_TAX') {
          const workflow = new UAECorporateTaxWorkflow()
          const validation = workflow.validateCorporateTaxFiling(validated.data as any)
          if (!validation.isValid) validationErrors = validation.errors
          calculations = workflow.calculateCorporateTax(validated.data as any)
        }
      } else if (validated.country === 'SA') {
        if (validated.taxType === 'VAT') {
          const workflow = new KSAVATWorkflow()
          const validation = workflow.validateFiling(validated.data as any)
          if (!validation.isValid) validationErrors = validation.errors
          calculations = workflow.calculateVAT(validated.data as any)
        } else if (validated.taxType === 'ZAKAT') {
          const workflow = new KSAZakatWorkflow()
          const validation = workflow.validateZakatFiling(validated.data as any)
          if (!validation.isValid) validationErrors = validation.errors
          calculations = workflow.calculateZakat(validated.data as any)
        } else if (validated.taxType === 'WHT') {
          const workflow = new KSAWHTWorkflow()
          const validation = workflow.validateWHTFiling(validated.data as any)
          if (!validation.isValid) validationErrors = validation.errors
          calculations = workflow.calculateWHT(validated.data as any)
        }
      } else if (validated.country === 'EG') {
        if (validated.taxType === 'VAT') {
          const workflow = new EgyptVATWorkflow()
          const validation = workflow.validateVATFiling(validated.data as any)
          if (!validation.isValid) validationErrors = validation.errors
          calculations = workflow.calculateVAT(validated.data as any)
        } else if (validated.taxType === 'ETA') {
          const workflow = new EgyptETAWorkflow()
          const validation = workflow.validateETAInvoice(validated.data as any)
          if (!validation.isValid) validationErrors = validation.errors
          calculations = { taxAmount: 0 }
        }
      }
    } catch (error) {
      return NextResponse.json(
        {
          error: 'Failed to calculate tax filing',
          details: String(error),
        },
        { status: 400 }
      )
    }

    // Return validation errors if any
    if (validationErrors.length > 0) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: validationErrors,
        },
        { status: 400 }
      )
    }

    // Create filing
    const filing = await prisma.taxFiling.create({
      data: {
        tenantId,
        entityId: validated.entityId,
        country: validated.country,
        taxType: validated.taxType,
        periodStartDate: new Date(validated.periodStartDate),
        periodEndDate: new Date(validated.periodEndDate),
        status: 'DRAFT',
        data: JSON.stringify(validated.data),
        taxAmount: calculations.taxAmount || 0,
        calculations: JSON.stringify(calculations),
      },
      select: {
        id: true,
        country: true,
        taxType: true,
        status: true,
        taxAmount: true,
        createdAt: true,
      },
    })

    await logAuditSafe({
      action: 'tax_filings:create',
      details: {
        filingId: filing.id,
        country: filing.country,
        taxType: filing.taxType,
        taxAmount: filing.taxAmount,
      },
    }).catch(() => {})

    return NextResponse.json(filing, { status: 201 })
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

    console.error('Tax filing creation error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
})
