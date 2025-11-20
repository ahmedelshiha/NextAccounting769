import { NextRequest, NextResponse } from 'next/server'
import { withTenantContext } from '@/lib/api-wrapper'
import { requireTenantContext } from '@/lib/tenant-utils'
import { logger } from '@/lib/logger'
import { z } from 'zod'

const PreferencesSchema = z.object({
  language: z.string().optional(),
  theme: z.enum(['light', 'dark', 'system']).optional(),
  timezone: z.string().optional(),
  emailNotifications: z.boolean().optional(),
  smsNotifications: z.boolean().optional(),
  pushNotifications: z.boolean().optional(),
  weeklyDigest: z.boolean().optional(),
  remindersBefore: z.enum(['1day', '3days', '7days', '14days']).optional(),
})

type Preferences = z.infer<typeof PreferencesSchema>

const defaultPreferences: Preferences = {
  language: 'en',
  theme: 'system',
  timezone: 'UTC',
  emailNotifications: true,
  smsNotifications: false,
  pushNotifications: true,
  weeklyDigest: true,
  remindersBefore: '7days',
}

export const GET = withTenantContext(async (request: NextRequest) => {
  try {
    const ctx = requireTenantContext()

    if (!ctx.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    return NextResponse.json({
      success: true,
      data: defaultPreferences,
    })
  } catch (error) {
    logger.error('Error fetching user preferences', { error })
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
})

export const PUT = withTenantContext(async (request: NextRequest) => {
  try {
    const ctx = requireTenantContext()

    if (!ctx.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const input = PreferencesSchema.parse(body)

    const preferences = { ...defaultPreferences, ...input }

    logger.info('User preferences updated', { userId: ctx.userId })

    return NextResponse.json({
      success: true,
      data: preferences,
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.issues },
        { status: 400 }
      )
    }

    logger.error('Error updating user preferences', { error })
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
})
