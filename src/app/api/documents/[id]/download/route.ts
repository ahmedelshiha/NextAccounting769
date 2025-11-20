import { NextRequest, NextResponse } from 'next/server'
import { withTenantContext } from '@/lib/api-wrapper'
import { requireTenantContext } from '@/lib/tenant-utils'
import prisma from '@/lib/prisma'
import { logger } from '@/lib/logger'

export const GET = withTenantContext(async (request: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  try {
    const ctx = requireTenantContext()
    const { id: documentId } = await params

    if (!ctx.userId || !ctx.tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const document = await prisma.attachment.findUnique({
      where: { id: documentId },
      select: {
        id: true,
        tenantId: true,
        name: true,
        url: true,
        contentType: true,
      },
    })

    if (!document || document.tenantId !== ctx.tenantId) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 })
    }

    if (!document.url) {
      return NextResponse.json(
        { error: 'Document URL not available' },
        { status: 404 }
      )
    }

    try {
      const fileResponse = await fetch(document.url)
      if (!fileResponse.ok) {
        throw new Error('Failed to fetch file')
      }

      const buffer = await fileResponse.arrayBuffer()

      logger.info('Document downloaded', { documentId, userId: ctx.userId })

      return new NextResponse(buffer, {
        headers: {
          'Content-Type': document.contentType || 'application/octet-stream',
          'Content-Disposition': `attachment; filename="${document.name || 'document'}"`,
          'Cache-Control': 'no-cache, no-store, must-revalidate',
        },
      })
    } catch (error) {
      logger.error('Error downloading file', { documentId, error })
      return NextResponse.json(
        { error: 'Failed to download document' },
        { status: 500 }
      )
    }
  } catch (error) {
    logger.error('Error downloading document', { error })
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
})
