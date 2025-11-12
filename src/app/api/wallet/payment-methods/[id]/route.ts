import { NextRequest, NextResponse } from 'next/server'
import { withTenantContext } from '@/lib/api-wrapper'
import { requireTenantContext } from '@/lib/tenant-utils'

export const POST = withTenantContext(async (
  request: NextRequest,
  { params }: { params: { id: string } }
) => {
  try {
    const ctx = requireTenantContext()

    if (!ctx?.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = params
    const url = new URL(request.url)
    const action = url.searchParams.get('action')

    if (action === 'set-default') {
      return NextResponse.json({
        success: true,
        message: 'Default payment method updated',
      })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (error) {
    console.error('Payment method API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
})

export const DELETE = withTenantContext(async (
  request: NextRequest,
  { params }: { params: { id: string } }
) => {
  try {
    const ctx = requireTenantContext()

    if (!ctx?.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = params

    return NextResponse.json({
      success: true,
      message: 'Payment method deleted',
    })
  } catch (error) {
    console.error('Payment method delete error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
})
