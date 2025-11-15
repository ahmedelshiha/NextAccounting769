import { NextRequest, NextResponse } from 'next/server'
import { withTenantContext } from '@/lib/api-wrapper'
import { requireTenantContext } from '@/lib/tenant-utils'
import prisma from '@/lib/prisma'
import { OcrService } from '@/lib/ocr/ocr-service'
import { logAuditSafe } from '@/lib/observability-helpers'

export const POST = withTenantContext(async (
  request: NextRequest,
  { params }: { params: { id: string } }
) => {
  try {
    const { userId, tenantId } = requireTenantContext()
    if (!userId || !tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = params

    const attachment = await prisma.attachment.findFirst({
      where: { id, tenantId },
    })

    if (!attachment) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 })
    }

    const ocrService = new OcrService()
    const ocrResult = await ocrService.processDocument(attachment)

    // In a real application, you would update the attachment record with the OCR results.
    // For now, we'll just log the action and return the result.
    await prisma.attachment.update({
      where: { id },
      data: {
        metadata: ocrResult,
      },
    })

    await logAuditSafe({
      action: 'documents:analyze',
      details: {
        documentId: attachment.id,
        documentName: attachment.name,
      },
    })

    return NextResponse.json({ success: true, ocrResult })
  } catch (error) {
    console.error('Document analysis API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
})
