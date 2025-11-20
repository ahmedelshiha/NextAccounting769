/**
 * Notification Preferences API
 * GET /api/notifications/preferences - Get user's notification preferences
 * PUT /api/notifications/preferences - Update user's notification preferences
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { prisma } from '@/lib/prisma'
import { respond } from '@/lib/api-response'
import { NotificationHub } from '@/lib/notifications/hub'
import { z } from 'zod'

// Validation schema for preferences update
const PreferencesSchema = z.object({
  inAppEnabled: z.boolean().optional(),
  emailEnabled: z.boolean().optional(),
  smsEnabled: z.boolean().optional(),
  emailDigest: z.enum(['instant', 'daily', 'weekly', 'none']).optional(),
  doNotDisturb: z.boolean().optional(),
  doNotDisturbStart: z.string().regex(/^\d{2}:\d{2}$/).optional(), // HH:mm
  doNotDisturbEnd: z.string().regex(/^\d{2}:\d{2}$/).optional(),   // HH:mm
  types: z.record(z.any()).optional(),
})

// GET - Get notification preferences
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession()

    if (!session?.user) {
      return respond.unauthorized()
    }

    const userId = session.user.id
    if (!userId) {
      return respond.unauthorized()
    }

    const preferences = await NotificationHub.getPreferences(userId)

    if (!preferences) {
      // Return default preferences if not yet set
      return respond.ok({
        data: {
          inAppEnabled: true,
          emailEnabled: true,
          smsEnabled: false,
          emailDigest: 'instant',
          doNotDisturb: false,
          types: {},
        },
      })
    }

    return respond.ok({ data: preferences })
  } catch (error) {
    console.error('Error fetching notification preferences:', error)
    return respond.serverError()
  }
}

// PUT - Update notification preferences
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession()

    if (!session?.user) {
      return respond.unauthorized()
    }

    const userId = session.user.id
    const tenantId = session.user.tenantId
    if (!userId || !tenantId) {
      return respond.unauthorized()
    }

    const body = await request.json()
    const preferences = PreferencesSchema.parse(body)

    // Validate do-not-disturb times if both are provided
    if (preferences.doNotDisturbStart && preferences.doNotDisturbEnd) {
      const start = parseInt(preferences.doNotDisturbStart.split(':')[0]) * 60 +
        parseInt(preferences.doNotDisturbStart.split(':')[1])
      const end = parseInt(preferences.doNotDisturbEnd.split(':')[0]) * 60 +
        parseInt(preferences.doNotDisturbEnd.split(':')[1])

      if (start >= end) {
        return respond.badRequest('Invalid do-not-disturb time range')
      }
    }

    const updated = await NotificationHub.updatePreferences(
      userId,
      tenantId,
      preferences
    )

    return respond.ok({
      data: updated,
      meta: { message: 'Preferences updated successfully' },
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return respond.badRequest(error.errors)
    }
    console.error('Error updating notification preferences:', error)
    return respond.serverError()
  }
}
