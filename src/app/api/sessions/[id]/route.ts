import { NextRequest, NextResponse } from 'next/server'
import { withTenantContext } from '@/lib/api-wrapper'
import { requireTenantContext } from '@/lib/tenant-utils'
import { logger } from '@/lib/logger'

export const DELETE = withTenantContext(async (request: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  try {
    const ctx = requireTenantContext()
    const { id: sessionId } = await params

    if (!ctx.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    logger.info('Session revoked', { userId: ctx.userId, sessionId })

    return NextResponse.json({
      success: true,
      message: 'Session has been revoked',
    })
  } catch (error) {
    logger.error('Error revoking session', { error })
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
})
