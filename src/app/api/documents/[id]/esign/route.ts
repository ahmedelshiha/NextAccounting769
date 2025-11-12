import { NextRequest, NextResponse } from 'next/server'
import { withTenantContext } from '@/lib/api-wrapper'
import { requireTenantContext } from '@/lib/tenant-utils'
import prisma from '@/lib/prisma'
import { logAuditSafe } from '@/lib/observability-helpers'
import { esignService } from '@/lib/esign/esign-service'
import { z } from 'zod'

const InitiateSigningSchema = z.object({
  signers: z
    .array(
      z.object({
        email: z.string().email(),
        name: z.string(),
        signingOrder: z.number().optional(),
      })
    )
    .min(1),
  expirationDays: z.number().min(1).max(365).default(30),
  callbackUrl: z.string().url().optional(),
})

async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { userId, userEmail, userName, tenantId } = requireTenantContext()

    if (!userId || !userEmail) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!tenantId) {
      return NextResponse.json({ error: 'Tenant context required' }, { status: 400 })
    }

    const { id } = params
    const body = await request.json()

    // Validate request
    const validated = InitiateSigningSchema.parse(body)

    // Fetch document
    const document = await prisma.attachment.findFirst({
      where: { id, tenantId },
    })

    if (!document) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 })
    }

    if (!document.url) {
      return NextResponse.json(
        { error: 'Document content not available for signing' },
        { status: 400 }
      )
    }

    // Check if document is PDF (required for e-signature)
    if (document.contentType !== 'application/pdf') {
      return NextResponse.json(
        {
          error: 'Only PDF documents can be signed',
          contentType: document.contentType,
        },
        { status: 400 }
      )
    }

    // Create signing session with e-signature service
    const signingSession = await esignService.initiateSigningFlow({
      documentId: id,
      documentUrl: document.url,
      fileName: document.name || 'document.pdf',
      signers: validated.signers,
      requesterEmail: userEmail,
      requesterName: userName || 'User',
      callbackUrl: validated.callbackUrl,
      expirationDays: validated.expirationDays,
    })

    // Store signing session in database
    // TODO: Create SigningSession model if not exists
    const sessionData = {
      documentId: id,
      sessionId: signingSession.sessionId,
      status: signingSession.status,
      signers: JSON.stringify(signingSession.signers),
      expiresAt: signingSession.expiresAt,
      signingUrl: signingSession.signingUrl,
      createdBy: userId,
      tenantId,
    }

    // Log signing initiation
    await logAuditSafe({
      action: 'documents:initiate_signing',
      details: {
        documentId: id,
        sessionId: signingSession.sessionId,
        signerCount: validated.signers.length,
        expirationDays: validated.expirationDays,
      },
    }).catch(() => {})

    return NextResponse.json(
      {
        success: true,
        signingSession: {
          sessionId: signingSession.sessionId,
          documentId: signingSession.documentId,
          status: signingSession.status,
          signingUrl: signingSession.signingUrl,
          expiresAt: signingSession.expiresAt.toISOString(),
          signers: signingSession.signers,
        },
      },
      { status: 201 }
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

    console.error('E-signature initiation API error:', error)
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

    // Fetch document
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
        documentType: document.contentType,
        canBeSigned: document.contentType === 'application/pdf',
        signingInfo: {
          provider: process.env.ESIGN_PROVIDER || 'mock',
          supportedSignerTypes: ['EMAIL'],
          maxSigners: 10,
          maxExpirationDays: 365,
        },
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('E-signature info API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
