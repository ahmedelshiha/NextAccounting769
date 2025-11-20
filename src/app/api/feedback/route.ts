import { NextRequest, NextResponse } from 'next/server'
import { withTenantContext } from '@/lib/api-wrapper'
import { requireTenantContext } from '@/lib/tenant-utils'

export const POST = withTenantContext(async (request: NextRequest) => {
  try {
    const { userId } = requireTenantContext()

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { rating, comment, allowContact } = await request.json()

    if (!rating || rating < 1 || rating > 5) {
      return NextResponse.json({ error: 'Invalid rating' }, { status: 400 })
    }

    if (!comment || comment.length < 10) {
      return NextResponse.json({ error: 'Comment too short' }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      feedbackId: `feedback_${Date.now()}`,
      message: 'Thank you for your feedback!',
    })
  } catch (error) {
    console.error('Feedback API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
})


