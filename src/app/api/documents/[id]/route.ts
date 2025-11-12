import { NextRequest, NextResponse } from 'next/server'
import { withTenantContext } from '@/lib/api-wrapper'
import { requireTenantContext } from '@/lib/tenant-utils'
import prisma from '@/lib/prisma'
import { getSession } from 'next-auth/react'
import { logAuditSafe } from '@/lib/observability-helpers'

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
    const action = request.nextUrl.searchParams.get('action')

    // Fetch document with tenant isolation
    const document = await prisma.attachment.findFirst({
      where: { id, tenantId },
      include: {
        uploader: {
          select: { id: true, email: true, name: true },
        },
        tenant: {
          select: { id: true, name: true },
        },
      },
    })

    if (!document) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 })
    }

    // Handle download action
    if (action === 'download') {
      // Log download access
      await logAuditSafe({
        action: 'documents:download',
        details: {
          documentId: document.id,
          documentName: document.name,
          documentSize: document.size,
        },
      }).catch(() => {})

      // If we have a URL (stored on provider), redirect to it
      if (document.url) {
        // For external URLs, add expiration parameters if using signed URLs
        return NextResponse.redirect(document.url, { status: 303 })
      }

      // Fallback: return error if no URL available
      return NextResponse.json(
        { error: 'Document content not available' },
        { status: 404 }
      )
    }

    // Default: return document metadata
    const metadata = {
      id: document.id,
      name: document.name || 'Unknown',
      size: document.size || 0,
      contentType: document.contentType || 'application/octet-stream',
      key: document.key,
      url: document.url,
      uploadedAt: document.uploadedAt.toISOString(),
      uploadedBy: document.uploader
        ? {
            id: document.uploader.id,
            email: document.uploader.email,
            name: document.uploader.name,
          }
        : null,
      category: extractCategory(document.key || ''),
      avStatus: document.avStatus,
      avThreatName: document.avThreatName,
      avScanAt: document.avScanAt?.toISOString() || null,
      avScanTime: document.avScanTime,
      isQuarantined: document.avStatus === 'infected',
      provider: document.provider,
      tenant: {
        id: document.tenant.id,
        name: document.tenant.name,
      },
      // Version history (placeholder for future implementation)
      versions: [
        {
          version: 1,
          uploadedAt: document.uploadedAt.toISOString(),
          uploadedBy: document.uploader?.name || 'System',
          size: document.size,
        },
      ],
    }

    return NextResponse.json(metadata, { status: 200 })
  } catch (error) {
    console.error('Document detail API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

async function PATCH(
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
    const { action } = body

    // Verify document exists and belongs to tenant
    const document = await prisma.attachment.findFirst({
      where: { id, tenantId },
    })

    if (!document) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 })
    }

    // Handle star/unstar action
    if (action === 'star' || action === 'unstar') {
      // TODO: Implement document stars/favorites in metadata or separate table
      // For now, just log the action
      await logAuditSafe({
        action: `documents:${action}`,
        details: {
          documentId: document.id,
          documentName: document.name,
        },
      }).catch(() => {})

      return NextResponse.json(
        {
          success: true,
          message: `Document ${action === 'star' ? 'starred' : 'unstarred'}`,
        },
        { status: 200 }
      )
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (error) {
    console.error('Document update API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

async function DELETE(
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

    // Verify document exists and belongs to tenant
    const document = await prisma.attachment.findFirst({
      where: { id, tenantId },
    })

    if (!document) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 })
    }

    // Delete document from database
    // Note: File deletion from provider (Netlify/Supabase) should be handled separately
    // using a cleanup job or the provider's API
    await prisma.attachment.delete({
      where: { id },
    })

    // Log deletion
    await logAuditSafe({
      action: 'documents:delete',
      details: {
        documentId: document.id,
        documentName: document.name,
        documentSize: document.size,
        deletedBy: session.user.id,
      },
    }).catch(() => {})

    return NextResponse.json(
      { success: true, message: 'Document deleted' },
      { status: 200 }
    )
  } catch (error) {
    console.error('Document delete API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export const getHandler = withTenantContext(GET, { requireAuth: true })
export const patchHandler = withTenantContext(PATCH, { requireAuth: true })
export const deleteHandler = withTenantContext(DELETE, { requireAuth: true })

export { getHandler as GET, patchHandler as PATCH, deleteHandler as DELETE }

/**
 * Extract category from storage key path
 */
function extractCategory(key: string): string {
  const parts = key.split('/')
  if (parts.length < 2) return 'Other'

  const categoryPart = parts[1]
  return categoryPart
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}
