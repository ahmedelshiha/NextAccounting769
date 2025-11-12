import { NextRequest, NextResponse } from 'next/server'
import { withTenantContext } from '@/lib/api-wrapper'
import { requireTenantContext } from '@/lib/tenant-utils'
import prisma from '@/lib/prisma'
import { logAuditSafe } from '@/lib/observability-helpers'
import { ocrService } from '@/lib/ocr/ocr-service'
import { z } from 'zod'

const AnalysisRequestSchema = z.object({
  analysisType: z.enum(['TEXT_EXTRACTION', 'INVOICE_ANALYSIS', 'RECEIPT_ANALYSIS', 'CLASSIFICATION']),
})

type AnalysisType = z.infer<typeof AnalysisRequestSchema>['analysisType']

async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { userId, tenantId } = requireTenantContext()

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!tenantId) {
      return NextResponse.json({ error: 'Tenant context required' }, { status: 400 })
    }

    const { id } = params
    const body = await request.json()

    // Validate request
    const validated = AnalysisRequestSchema.parse(body)

    // Fetch document
    const document = await prisma.attachment.findFirst({
      where: { id, tenantId },
    })

    if (!document) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 })
    }

    if (!document.url) {
      return NextResponse.json(
        { error: 'Document content not available for analysis' },
        { status: 400 }
      )
    }

    // Check if document is text-based (PDF, image)
    const supportedTypes = [
      'application/pdf',
      'image/jpeg',
      'image/png',
      'image/webp',
      'image/tiff',
    ]

    if (!supportedTypes.includes(document.contentType || '')) {
      return NextResponse.json(
        {
          error: 'Document type not supported for OCR analysis',
          supportedTypes,
        },
        { status: 400 }
      )
    }

    // Fetch document data from provider
    // In a real implementation, this would download from Netlify/Supabase
    // For now, we'll assume the URL is publicly accessible
    let documentData: Buffer

    try {
      const response = await fetch(document.url)
      if (!response.ok) {
        throw new Error(`Failed to fetch document: ${response.statusText}`)
      }
      documentData = Buffer.from(await response.arrayBuffer())
    } catch (error) {
      return NextResponse.json(
        {
          error: 'Failed to fetch document for analysis',
          details: String(error),
        },
        { status: 500 }
      )
    }

    // Perform OCR analysis based on requested type
    let analysisResult: any

    try {
      switch (validated.analysisType) {
        case 'TEXT_EXTRACTION':
          analysisResult = await ocrService.extractText(
            documentData,
            document.contentType || 'application/pdf'
          )
          break

        case 'INVOICE_ANALYSIS':
          analysisResult = await ocrService.analyzeInvoice(documentData)
          break

        case 'RECEIPT_ANALYSIS':
          analysisResult = await ocrService.analyzeReceipt(documentData)
          break

        case 'CLASSIFICATION':
          analysisResult = await ocrService.classifyDocument(documentData)
          break

        default:
          return NextResponse.json({ error: 'Invalid analysis type' }, { status: 400 })
      }
    } catch (error) {
      return NextResponse.json(
        {
          error: 'OCR analysis failed',
          details: String(error),
        },
        { status: 500 }
      )
    }

    // Log analysis
    await logAuditSafe({
      action: 'documents:analyze',
      details: {
        documentId: id,
        analysisType: validated.analysisType,
        resultConfidence:
          'confidence' in analysisResult ? analysisResult.confidence : undefined,
      },
    }).catch(() => {})

    // Store analysis metadata
    // Update document metadata with extracted tags (if available)
    if (analysisResult.extractedTags) {
      // TODO: Store extracted tags in document metadata
      await prisma.attachment
        .update({
          where: { id },
          data: {
            // metadata: { tags: analysisResult.extractedTags }
          },
        })
        .catch(() => {}) // Non-critical metadata update
    }

    return NextResponse.json(
      {
        success: true,
        analysisType: validated.analysisType,
        result: analysisResult,
        timestamp: new Date().toISOString(),
      },
      { status: 200 }
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

    console.error('Document analysis API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { userId, tenantId } = requireTenantContext()

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!tenantId) {
      return NextResponse.json({ error: 'Tenant context required' }, { status: 400 })
    }

    const { id } = params

    // Fetch document with analysis metadata
    const document = await prisma.attachment.findFirst({
      where: { id, tenantId },
    })

    if (!document) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 })
    }

    return NextResponse.json(
      {
        documentId: id,
        documentName: document.name,
        contentType: document.contentType,
        supportedAnalysisTypes: [
          'TEXT_EXTRACTION',
          'INVOICE_ANALYSIS',
          'RECEIPT_ANALYSIS',
          'CLASSIFICATION',
        ],
        analysisMetadata: {
          // TODO: Return stored analysis results
          lastAnalyzedAt: null,
          extractedTags: [],
          classification: null,
        },
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Document analysis info API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export const postHandler = withTenantContext(POST, { requireAuth: true })
export const getHandler = withTenantContext(GET, { requireAuth: true })

export { postHandler as POST, getHandler as GET }
