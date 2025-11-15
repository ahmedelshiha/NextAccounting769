import { NextRequest, NextResponse } from 'next/server'
import { withTenantContext } from '@/lib/api-wrapper'
import { requireTenantContext } from '@/lib/tenant-utils'
import prisma from '@/lib/prisma'

export const GET = withTenantContext(async (
  request: NextRequest,
  { params }: { params: { id: string } }
) => {
  try {
    const { userId, tenantId } = requireTenantContext()
    if (!userId || !tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = params

    const versions = await prisma.documentVersion.findMany({
      where: { attachmentId: id, tenantId },
      orderBy: { versionNumber: 'desc' },
      include: {
        uploader: {
          select: { id: true, email: true, name: true },
        },
      },
    })

    return NextResponse.json({ success: true, versions })
  } catch (error) {
    console.error('Document versions API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
})
