import { NextResponse, type NextRequest } from 'next/server'
import { withTenantContext } from '@/lib/api-wrapper'
import { requireTenantContext } from '@/lib/tenant-utils'

export const DELETE = withTenantContext(
  async (request: NextRequest, { params }: { params: { id: string } }) => {
    try {
      const { userId } = requireTenantContext()

      const { id } = params

      return NextResponse.json({
        success: true,
        message: 'Item removed from cart',
      })
    } catch (error) {
      console.error('Cart item delete error:', error)
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
  },
  { requireAuth: true }
)
