import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { logAuditSafe } from '@/lib/observability-helpers'
import { ESignatureService } from '@/lib/esign/esign-service'
import { withTenantContext } from '@/lib/api-wrapper'
import { requireTenantContext } from '@/lib/tenant-utils'

export const GET = withTenantContext(async (
  request: NextRequest,
  { params }: { params: { id: string; sessionId: string } }
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

    const { id, sessionId } = params
    const action = request.nextUrl.searchParams.get('action')

    // Verify document exists
    const document = await prisma.attachment.findFirst({
      where: { id, tenantId },
    })

    if (!document) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 })
    }

    const esignService = new ESignatureService()
    // Get signing status
    const signingStatus = await esignService.getSignatureRequestStatus(sessionId)

    if (action === 'download') {
      // Download signed document
      if (signingStatus.status !== 'completed') {
        return NextResponse.json(
          {
            error: 'Document not yet signed',
            status: signingStatus.status,
          },
          { status: 400 }
        )
      }

      try {
        const signedDocumentData = await esignService.downloadSignedDocument(sessionId)

        // Log download
        await logAuditSafe({
          action: 'documents:download_signed',
          details: {
            documentId: id,
            sessionId,
            size: signedDocumentData.length,
          },
        }).catch(() => {})

        return new NextResponse(signedDocumentData as any, {
          headers: {
            'Content-Type': 'application/pdf',
            'Content-Disposition': `attachment; filename="${document.name || 'signed-document.pdf'}"`,
          },
        })
      } catch (error) {
        return NextResponse.json(
          {
            error: 'Failed to download signed document',
            details: String(error),
          },
          { status: 500 }
        )
      }
    }

    // Default: return status
    return NextResponse.json(
      {
        documentId: id,
        sessionId,
        status: signingStatus.status,
        signers: signingStatus.signers,
        completedAt: signingStatus.completedAt?.toISOString() || null,
        signedDocumentUrl: signingStatus.signedDocumentUrl,
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('E-signature status API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
})

export const DELETE = withTenantContext(async (
  request: NextRequest,
  { params }: { params: { id: string; sessionId: string } }
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

    const { id, sessionId } = params

    // Verify document exists
    const document = await prisma.attachment.findFirst({
      where: { id, tenantId },
    })

    if (!document) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 })
    }

    const esignService = new ESignatureService()
    // Cancel signing flow
    await esignService.cancelSignatureRequest(sessionId)

    // Log cancellation
    await logAuditSafe({
      action: 'documents:cancel_signing',
      details: {
        documentId: id,
        sessionId,
        cancelledBy: ctx.userId,
      },
    }).catch(() => {})

    return NextResponse.json(
      { success: true, message: 'Signing flow cancelled' },
      { status: 200 }
    )
  } catch (error) {
    console.error('E-signature cancellation API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
})
