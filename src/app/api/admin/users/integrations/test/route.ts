import { NextRequest, NextResponse } from 'next/server'
import { withTenantContext } from '@/lib/api-wrapper'
import { hasPermission, PERMISSIONS } from '@/lib/permissions'
import * as Sentry from '@sentry/nextjs'
import { z } from 'zod'

const TestPayloadSchema = z.object({
  platform: z.enum(['slack', 'zapier', 'webhook', 'teams']),
  webhookUrl: z.string().url(),
})

// POST - Test integration connectivity
export const POST = withTenantContext(async (req: NextRequest, ctx: any) => {
  try {
    const { tenantId, userId, role } = ctx

    if (!hasPermission(role, PERMISSIONS.INTEGRATIONS_MANAGE)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const body = await req.json().catch(() => ({}))
    const parsed = TestPayloadSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid test payload', details: parsed.error.format() },
        { status: 400 }
      )
    }

    const { platform, webhookUrl } = parsed.data
    const startTime = Date.now()

    try {
      let testPayload: Record<string, any> = {}

      // Build platform-specific test payload
      switch (platform) {
        case 'slack':
          testPayload = {
            text: '✅ Filter bar integration test successful',
            blocks: [
              {
                type: 'section',
                text: {
                  type: 'mrkdwn',
                  text: '✅ *Filter Bar Integration Test Successful*\n_Slack webhook is working correctly_',
                },
              },
            ],
          }
          break

        case 'teams':
          testPayload = {
            '@type': 'MessageCard',
            '@context': 'https://schema.org/extensions',
            summary: 'Filter Bar Integration Test',
            themeColor: '0078D4',
            sections: [
              {
                activityTitle: '✅ Filter Bar Integration Test',
                text: 'Teams webhook is working correctly',
                facts: [
                  {
                    name: 'Status',
                    value: 'Connected',
                  },
                  {
                    name: 'Timestamp',
                    value: new Date().toISOString(),
                  },
                ],
              },
            ],
          }
          break

        case 'zapier':
          testPayload = {
            event: 'test',
            timestamp: new Date().toISOString(),
            data: { message: 'Filter bar Zapier integration test' },
            userId: 'test',
            tenantId: 'test',
          }
          break

        case 'webhook':
          testPayload = {
            event: 'test',
            timestamp: new Date().toISOString(),
            data: { message: 'Filter bar webhook integration test' },
            userId: userId || 'test',
            tenantId: tenantId || 'test',
          }
          break
      }

      // Send test request
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(testPayload),
        signal: AbortSignal.timeout(10000), // 10 second timeout
      })

      const responseTime = Date.now() - startTime

      if (!response.ok) {
        return NextResponse.json(
          {
            success: false,
            platform,
            statusCode: response.status,
            message: `Webhook returned status ${response.status}`,
            responseTime,
            timestamp: new Date().toISOString(),
          },
          { status: 200 }
        )
      }

      return NextResponse.json({
        success: true,
        platform,
        statusCode: response.status,
        message: 'Webhook test successful',
        responseTime,
        timestamp: new Date().toISOString(),
      })
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      const responseTime = Date.now() - startTime

      Sentry.captureException(error)

      return NextResponse.json(
        {
          success: false,
          platform,
          error: errorMessage,
          message: 'Failed to test webhook',
          responseTime,
          timestamp: new Date().toISOString(),
        },
        { status: 200 }
      )
    }
  } catch (error) {
    Sentry.captureException(error)
    return NextResponse.json(
      { error: 'Failed to run integration test' },
      { status: 500 }
    )
  }
})
