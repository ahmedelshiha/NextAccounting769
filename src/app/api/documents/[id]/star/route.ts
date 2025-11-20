import { NextRequest, NextResponse } from 'next/server'
import { withTenantContext } from '@/lib/api-wrapper'
import { requireTenantContext } from '@/lib/tenant-utils'
import prisma from '@/lib/prisma'
import { logger } from '@/lib/logger'

export const POST = withTenantContext(async (request: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
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
        isStarred: true,
      },
    })

    if (!document || document.tenantId !== ctx.tenantId) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 })
    }

    const updated = await prisma.attachment.update({
      where: { id: documentId },
      data: {
        isStarred: true,
      },
      select: {
        id: true,
        isStarred: true,
      },
    })

    logger.info('Document starred', { documentId, userId: ctx.userId })

    return NextResponse.json({
      success: true,
      data: updated,
    })
  } catch (error) {
    logger.error('Error starring document', { error })
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
})

export const DELETE = withTenantContext(async (request: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
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
      },
    })

    if (!document || document.tenantId !== ctx.tenantId) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 })
    }

    const updated = await prisma.attachment.update({
      where: { id: documentId },
      data: {
        isStarred: false,
      },
      select: {
        id: true,
        isStarred: true,
      },
    })

    logger.info('Document unstarred', { documentId, userId: ctx.userId })

    return NextResponse.json({
      success: true,
      data: updated,
    })
  } catch (error) {
    logger.error('Error unstarring document', { error })
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
})
