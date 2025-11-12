import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { items, promoCode } = await request.json()

    if (!items || !Array.isArray(items)) {
      return NextResponse.json({ error: 'Invalid cart items' }, { status: 400 })
    }

    const total = items.reduce((sum: number, item: any) => sum + item.price * item.quantity, 0)

    return NextResponse.json({
      redirectUrl: `https://checkout.example.com/session?total=${total}&user=${session.user.id}`,
      sessionId: `sess_${Date.now()}`,
      total,
    })
  } catch (error) {
    console.error('Checkout error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
