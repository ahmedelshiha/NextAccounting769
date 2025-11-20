import { NextResponse, type NextRequest } from 'next/server'
import { withTenantContext } from '@/lib/api-wrapper'
import { requireTenantContext } from '@/lib/tenant-utils'

export const POST = withTenantContext(
  async (request: NextRequest) => {
    try {
      const { userId } = requireTenantContext()

      const { items, promoCode } = await request.json()

      if (!items || !Array.isArray(items)) {
        return NextResponse.json({ error: 'Invalid cart items' }, { status: 400 })
      }

      const total = items.reduce((sum: number, item: any) => sum + item.price * item.quantity, 0)

      return NextResponse.json({
        redirectUrl: `https://checkout.example.com/session?total=${total}&user=${userId}`,
        sessionId: `sess_${Date.now()}`,
        total,
      })
    } catch (error) {
      console.error('Checkout error:', error)
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
  },
  { requireAuth: true }
)
