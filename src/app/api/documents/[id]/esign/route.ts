import { NextRequest, NextResponse } from 'next/server'
import { withTenantContext } from '@/lib/api-wrapper'
import { requireTenantContext } from '@/lib/tenant-utils'
import prisma from '@/lib/prisma'
import { ESignatureService } from '@/lib/esign/esign-service'
import { z } from 'zod'
import { logAuditSafe } from '@/lib/observability-helpers'

const ESignatureRequestSchema = z.object({
  signerEmail: z.string().email(),
})

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
    const body = await request.json()
    const validation = ESignatureRequestSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid request body', details: validation.error.issues },
        { status: 400 }
      )
    }

    const { signerEmail } = validation.data

    const attachment = await prisma.attachment.findFirst({
      where: { id, tenantId },
    })

    if (!attachment) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 })
    }

    const esignatureService = new ESignatureService()
    const signatureRequest = await esignatureService.createSignatureRequest(
      attachment,
      signerEmail
    )

    await logAuditSafe({
      action: 'documents:esign_request',
      details: {
        documentId: attachment.id,
        documentName: attachment.name,
        signerEmail,
      },
    })

    return NextResponse.json({ success: true, signatureRequest })
  } catch (error) {
    console.error('E-signature request API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
})
