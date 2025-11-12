import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { NextRequest, NextResponse } from 'next/server'

const validPromoCodes: Record<string, number> = {
  SAVE10: 0.1,
  SAVE20: 0.2,
  LAUNCH50: 0.5,
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { code } = await request.json()

    if (!code || typeof code !== 'string') {
      return NextResponse.json({ error: 'Invalid promo code format' }, { status: 400 })
    }

    const upperCode = code.toUpperCase().trim()
    const discount = validPromoCodes[upperCode]

    if (discount === undefined) {
      return NextResponse.json(
        { error: 'Invalid or expired promo code' },
        { status: 400 }
      )
    }

    return NextResponse.json({
      code: upperCode,
      discount: discount * 100,
      percentage: discount,
    })
  } catch (error) {
    console.error('Promo code error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
