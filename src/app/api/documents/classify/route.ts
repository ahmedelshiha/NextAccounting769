import { NextRequest, NextResponse } from 'next/server'
import { withTenantContext } from '@/lib/api-wrapper'
import { requireTenantContext } from '@/lib/tenant-utils'
import prisma from '@/lib/prisma'
import { classifyDocument } from '@/lib/ai/document-classifier'
import { z } from 'zod'

/**
 * POST /api/documents/classify
 * Classifies a document and extracts key information
 */
const ClassifyRequestSchema = z.object({
  documentId: z.string(),
  fileName: z.string(),
  content: z.string().optional(),
})

export const POST = withTenantContext(async (request: NextRequest) => {
    const { userId, tenantId } = requireTenantContext()

    if (!userId || !tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    try {
      const body = await request.json()
      const { documentId, fileName, content } = ClassifyRequestSchema.parse(body)

      // Get document from database
      const document = await prisma.attachment.findUnique({
        where: { id: documentId },
      })

      if (!document) {
        return NextResponse.json(
          { error: 'Document not found' },
          { status: 404 }
        )
      }

      if (document.tenantId !== tenantId) {
        return NextResponse.json(
          { error: 'Unauthorized' },
          { status: 403 }
        )
      }

      // Classify the document
      const classification = classifyDocument(
        fileName || document.name || 'document',
        content,
        document.size || undefined
      )

      // Update classification result
      classification.documentId = documentId

      // Store classification results in document metadata if available
      // This would require updating the Attachment model to include classification data
      // For now, we'll return the classification

      return NextResponse.json({
        success: true,
        data: classification,
      })
    } catch (error) {
      if (error instanceof z.ZodError) {
        return NextResponse.json(
          { error: 'Invalid request', details: error.issues },
          { status: 400 }
        )
      }

      console.error('Document classification error:', error)
      return NextResponse.json(
        { error: 'Failed to classify document' },
        { status: 500 }
      )
    }
  })

/**
 * GET /api/documents/classify/:documentId
 * Retrieves classification for a document
 */
export const GET = withTenantContext(async (request: NextRequest) => {
    const { tenantId } = requireTenantContext()

    if (!tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const documentId = searchParams.get('id')

    if (!documentId) {
      return NextResponse.json(
        { error: 'Document ID required' },
        { status: 400 }
      )
    }

    const document = await prisma.attachment.findUnique({
      where: { id: documentId },
    })

    if (!document) {
      return NextResponse.json(
        { error: 'Document not found' },
        { status: 404 }
      )
    }

    if (document.tenantId !== tenantId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      )
    }

    // For now, return the document metadata
    // In production, would retrieve stored classification from database
    return NextResponse.json({
      success: true,
      data: {
        documentId: document.id,
        fileName: document.name,
        uploaded: document.uploadedAt,
        size: document.size,
        contentType: document.contentType,
        // Classification would be stored and retrieved here
      },
    })
  })
