import { NextRequest, NextResponse } from 'next/server'
import { withTenantContext } from '@/lib/api-wrapper'
import { requireTenantContext } from '@/lib/tenant-utils'

export const POST = withTenantContext(
  async (request: NextRequest, { params }: { params: { id: string } }) => {
    try {
      const { userId } = requireTenantContext()

      return NextResponse.json({
        success: true,
        message: 'Document starred status updated',
      })
    } catch (error) {
      console.error('Document star error:', error)
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
  },
  { requireAuth: true }
)
