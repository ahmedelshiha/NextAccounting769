import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { logAuditSafe } from '@/lib/observability-helpers'
import { withTenantContext } from '@/lib/api-wrapper'
import { requireTenantContext } from '@/lib/tenant-utils'

export const GET = withTenantContext(
  async (request: NextRequest, { params }: { params: { id: string } }) => {
    try {
      const { userId, tenantId } = requireTenantContext()
      const { id } = params

      // Verify document exists and belongs to tenant
      const document = await prisma.attachment.findFirst({
        where: { id, tenantId },
      })

      if (!document) {
        return NextResponse.json({ error: 'Document not found' }, { status: 404 })
      }

      // Fetch all versions for this document
      const versions = await prisma.documentVersion.findMany({
        where: { attachmentId: id, tenantId },
        include: {
          uploader: {
            select: {
              id: true,
              email: true,
              name: true,
            },
          },
        },
        orderBy: { versionNumber: 'desc' },
      })

      const formattedVersions = versions.map((version) => ({
        id: version.id,
        versionNumber: version.versionNumber,
        name: version.name,
        size: version.size,
        contentType: version.contentType,
        uploadedAt: version.uploadedAt.toISOString(),
        changeDescription: version.changeDescription,
        uploadedBy: version.uploader
          ? {
              id: version.uploader.id,
              email: version.uploader.email,
              name: version.uploader.name,
            }
          : null,
      }))

      return NextResponse.json(
        {
          documentId: id,
          totalVersions: versions.length,
          versions: formattedVersions,
        },
        { status: 200 }
      )
    } catch (error) {
      console.error('Document versions API error:', error)
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      )
    }
  },
  { requireAuth: true }
);

export const POST = withTenantContext(
  async (request: NextRequest, { params }: { params: { id: string } }) => {
    try {
      const { userId, tenantId } = requireTenantContext()
      const { id } = params
      const body = await request.json()
      const { versionNumber, changeDescription } = body

      if (!versionNumber) {
        return NextResponse.json(
          { error: 'versionNumber is required' },
          { status: 400 }
        )
      }

      // Verify document exists and belongs to tenant
      const document = await prisma.attachment.findFirst({
        where: { id, tenantId },
      })

      if (!document) {
        return NextResponse.json({ error: 'Document not found' }, { status: 404 })
      }

      // Create new version record
      const newVersion = await prisma.documentVersion.create({
        data: {
          attachmentId: id,
          versionNumber,
          name: document.name,
          size: document.size,
          contentType: document.contentType,
          key: document.key,
          url: document.url,
          uploadedAt: new Date(),
          uploaderId: userId,
          changeDescription: changeDescription || undefined,
          tenantId,
        },
        include: {
          uploader: {
            select: {
              id: true,
              email: true,
              name: true,
            },
          },
        },
      })

      // Log version creation
      await logAuditSafe({
        action: 'documents:create_version',
        details: {
          documentId: id,
          versionNumber,
          changeDescription,
        },
      }).catch(() => {})

      return NextResponse.json(
        {
          success: true,
          version: {
            id: newVersion.id,
            versionNumber: newVersion.versionNumber,
            name: newVersion.name,
            uploadedAt: newVersion.uploadedAt.toISOString(),
            changeDescription: newVersion.changeDescription,
            uploadedBy: newVersion.uploader
              ? {
                  id: newVersion.uploader.id,
                  email: newVersion.uploader.email,
                  name: newVersion.uploader.name,
                }
              : null,
          },
        },
        { status: 201 }
      )
    } catch (error) {
      console.error('Document version creation API error:', error)
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      )
    }
  },
  { requireAuth: true }
);
