import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const items = [
      {
        id: 'cart_1',
        serviceId: 'svc_1',
        serviceName: 'VAT Filing Service',
        description: 'Monthly VAT return filing and compliance',
        price: 299.99,
        quantity: 1,
        currency: 'USD',
      },
      {
        id: 'cart_2',
        serviceId: 'svc_2',
        serviceName: 'Corporate Tax Planning',
        description: 'Annual corporate tax filing and optimization',
        price: 599.99,
        quantity: 1,
        currency: 'USD',
      },
    ]

    const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0)
    const tax = subtotal * 0.05
    const discount = 0

    return NextResponse.json({
      items,
      subtotal,
      tax,
      discount,
      total: subtotal + tax - discount,
    })
  } catch (error) {
    console.error('Cart API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
