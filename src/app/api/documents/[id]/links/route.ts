import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { logAuditSafe } from '@/lib/observability-helpers'
import { z } from 'zod'
import { withTenantContext } from '@/lib/api-wrapper'
import { requireTenantContext } from '@/lib/tenant-utils'

const LinkDocumentSchema = z.object({
  linkedToType: z.enum(['FILING', 'TASK', 'SERVICE_REQUEST', 'ENTITY', 'COMPLIANCE']),
  linkedToId: z.string().min(1),
})

export const GET = withTenantContext(
  async (request: NextRequest, { params }: { params: { id: string } }) => {
    try {
      const { userId, tenantId } = requireTenantContext()!
      const { id } = params

      // Verify document exists and belongs to tenant
      const document = await prisma.attachment.findFirst({
        where: { id, tenantId: tenantId! },
      })

      if (!document) {
        return NextResponse.json({ error: 'Document not found' }, { status: 404 })
      }

      // Fetch all links for this document
      const links = await prisma.documentLink.findMany({
        where: { attachmentId: id, tenantId: tenantId! },
        orderBy: { linkedAt: 'desc' },
      })

      const formattedLinks = links.map((link) => ({
        id: link.id,
        linkedToType: link.linkedToType,
        linkedToId: link.linkedToId,
        linkedAt: link.linkedAt.toISOString(),
        linkedBy: link.linkedBy,
      }))

      return NextResponse.json(
        {
          documentId: id,
          totalLinks: links.length,
          links: formattedLinks,
        },
        { status: 200 }
      )
    } catch (error) {
      console.error('Document links API error:', error)
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
      const { userId, tenantId } = requireTenantContext()!
      const { id } = params
      const body = await request.json()

      // Validate request body
      const validated = LinkDocumentSchema.parse(body)

      // Verify document exists and belongs to tenant
      const document = await prisma.attachment.findFirst({
        where: { id, tenantId: tenantId! },
      })

      if (!document) {
        return NextResponse.json({ error: 'Document not found' }, { status: 404 })
      }

      // Check if link already exists
      const existingLink = await prisma.documentLink.findUnique({
        where: {
          attachmentId_linkedToType_linkedToId: {
            attachmentId: id,
            linkedToType: validated.linkedToType,
            linkedToId: validated.linkedToId,
          },
        },
      })

      if (existingLink) {
        return NextResponse.json(
          { error: 'Document is already linked to this entity' },
          { status: 409 }
        )
      }

      // Create link
      const link = await prisma.documentLink.create({
        data: {
          attachmentId: id,
          linkedToType: validated.linkedToType,
          linkedToId: validated.linkedToId,
          linkedBy: userId,
          tenantId: tenantId!,
        },
      })

      // Log link creation
      await logAuditSafe({
        action: 'documents:create_link',
        details: {
          documentId: id,
          linkedToType: validated.linkedToType,
          linkedToId: validated.linkedToId,
        },
      }).catch(() => {})

      return NextResponse.json(
        {
          success: true,
          link: {
            id: link.id,
            linkedToType: link.linkedToType,
            linkedToId: link.linkedToId,
            linkedAt: link.linkedAt.toISOString(),
          },
        },
        { status: 201 }
      )
    } catch (error) {
      if (error instanceof z.ZodError) {
        return NextResponse.json(
          {
            error: 'Invalid request body',
            details: error.issues,
          },
          { status: 400 }
        )
      }

      console.error('Document link creation API error:', error)
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      )
    }
  },
  { requireAuth: true }
);

export const DELETE = withTenantContext(
  async (request: NextRequest, { params }: { params: { id: string } }) => {
    try {
      const { userId, tenantId } = requireTenantContext()!
      const { id } = params
      const { linkId } = await request.json()

      if (!linkId) {
        return NextResponse.json({ error: 'linkId is required' }, { status: 400 })
      }

      // Verify document exists
      const document = await prisma.attachment.findFirst({
        where: { id, tenantId: tenantId! },
      })

      if (!document) {
        return NextResponse.json({ error: 'Document not found' }, { status: 404 })
      }

      // Verify link exists and belongs to this document
      const link = await prisma.documentLink.findFirst({
        where: { id: linkId, attachmentId: id, tenantId: tenantId! },
      })

      if (!link) {
        return NextResponse.json({ error: 'Link not found' }, { status: 404 })
      }

      // Delete link
      await prisma.documentLink.delete({
        where: { id: linkId },
      })

      // Log link deletion
      await logAuditSafe({
        action: 'documents:delete_link',
        details: {
          documentId: id,
          linkedToType: link.linkedToType,
          linkedToId: link.linkedToId,
        },
      }).catch(() => {})

      return NextResponse.json(
        { success: true, message: 'Link deleted' },
        { status: 200 }
      )
    } catch (error) {
      console.error('Document link deletion API error:', error)
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      )
    }
  },
  { requireAuth: true }
);
