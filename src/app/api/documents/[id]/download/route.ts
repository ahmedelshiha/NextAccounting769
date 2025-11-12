import { NextRequest, NextResponse } from 'next/server'
import { withTenantContext } from '@/lib/api-wrapper'
import { requireTenantContext } from '@/lib/tenant-utils'
import prisma from '@/lib/prisma'
import { logAuditSafe } from '@/lib/observability-helpers'
import { getSession } from 'next-auth/react'

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

    // Fetch document with tenant isolation
    const document = await prisma.attachment.findFirst({
      where: { id, tenantId },
    })

    if (!document) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 })
    }

    // Log download access
    await logAuditSafe({
      action: 'documents:download',
      details: {
        documentId: document.id,
        documentName: document.name,
        documentSize: document.size,
        downloadedBy: session.user.id,
      },
    }).catch(() => {})

    // Quarantined documents cannot be downloaded
    if (document.avStatus === 'infected') {
      return NextResponse.json(
        { error: 'Document is quarantined and cannot be downloaded' },
        { status: 403 }
      )
    }

    // If document is stored in external provider (Netlify, Supabase)
    if (document.url) {
      // Return a redirect to the provider's signed URL
      // The client will follow the redirect to get the file
      return NextResponse.redirect(document.url, { status: 303 })
    }

    // If no URL is available, document content is not accessible
    return NextResponse.json(
      {
        error: 'Document content not available',
        details: 'Document was deleted from storage provider',
      },
      { status: 404 }
    )
  } catch (error) {
    console.error('Document download API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export default withTenantContext(GET, { requireAuth: true })
