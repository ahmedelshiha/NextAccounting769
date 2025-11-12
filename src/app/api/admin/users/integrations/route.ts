import { NextRequest, NextResponse } from 'next/server'
import { withTenantContext } from '@/lib/api-wrapper'
import { hasPermission, PERMISSIONS } from '@/lib/permissions'
import * as Sentry from '@sentry/nextjs'
import { z } from 'zod'

const IntegrationConfigSchema = z.object({
  slack: z.object({
    webhookUrl: z.string().url(),
    enabled: z.boolean().optional(),
  }).optional(),
  zapier: z.object({
    webhookUrl: z.string().url(),
    enabled: z.boolean().optional(),
  }).optional(),
  webhook: z.object({
    url: z.string().url(),
    secret: z.string().optional(),
    enabled: z.boolean().optional(),
  }).optional(),
  teams: z.object({
    webhookUrl: z.string().url(),
    enabled: z.boolean().optional(),
  }).optional(),
})

// GET - List all integrations configuration
export const GET = withTenantContext(async (req: NextRequest, ctx: any) => {
  try {
    const { tenantId, userId, role } = ctx

    if (!hasPermission(role, PERMISSIONS.INTEGRATIONS_MANAGE)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    // Return integration statuses (without revealing secrets)
    const integrations = {
      slack: {
        name: 'Slack',
        description: 'Share presets and scheduled reports to Slack',
        enabled: !!process.env.SLACK_WEBHOOK_URL,
        configured: !!process.env.SLACK_WEBHOOK_URL,
        features: ['Share Presets', 'Scheduled Reports', 'Filter Notifications'],
        icon: 'slack',
        docs: 'https://docs.example.com/integrations/slack',
      },
      zapier: {
        name: 'Zapier',
        description: 'Trigger workflows and automate with 8000+ apps',
        enabled: !!process.env.ZAPIER_WEBHOOK_URL,
        configured: !!process.env.ZAPIER_WEBHOOK_URL,
        features: ['Workflow Automation', 'Multi-app Integration', 'Zap Templates'],
        icon: 'zapier',
        docs: 'https://docs.example.com/integrations/zapier',
      },
      webhook: {
        name: 'Custom Webhooks',
        description: 'Send filter events to your custom endpoints',
        enabled: !!process.env.CUSTOM_WEBHOOK_URL,
        configured: !!process.env.CUSTOM_WEBHOOK_URL,
        features: ['Custom Events', 'Retry Logic', 'Event History'],
        icon: 'webhook',
        docs: 'https://docs.example.com/integrations/webhooks',
      },
      teams: {
        name: 'Microsoft Teams',
        description: 'Share presets and reports directly to Teams',
        enabled: !!process.env.TEAMS_WEBHOOK_URL,
        configured: !!process.env.TEAMS_WEBHOOK_URL,
        features: ['Share Presets', 'Scheduled Reports', 'Bot Commands'],
        icon: 'teams',
        docs: 'https://docs.example.com/integrations/teams',
      },
    }

    return NextResponse.json({ success: true, data: integrations })
  } catch (error) {
    Sentry.captureException(error)
    return NextResponse.json(
      { error: 'Failed to fetch integrations' },
      { status: 500 }
    )
  }
})

// POST - Configure integration
export const POST = withTenantContext(async (req: NextRequest, ctx: any) => {
  try {
    const { tenantId, userId, role } = ctx

    if (!hasPermission(role, PERMISSIONS.INTEGRATIONS_MANAGE)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const body = await req.json().catch(() => ({}))
    const parsed = IntegrationConfigSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid configuration', details: parsed.error.format() },
        { status: 400 }
      )
    }

    // Store integration configuration
    // In production, this would be stored in the database
    const config = parsed.data

    // Validate each integration's webhook
    const validations: Record<string, {valid: boolean; error?: string}> = {}

    if (config.slack) {
      try {
        const response = await fetch(config.slack.webhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: 'Test' }),
        })
        validations.slack = { valid: response.ok }
      } catch (error) {
        validations.slack = { valid: false, error: 'Failed to connect' }
      }
    }

    if (config.teams) {
      try {
        const response = await fetch(config.teams.webhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            '@type': 'MessageCard',
            '@context': 'https://schema.org/extensions',
            summary: 'Test',
          }),
        })
        validations.teams = { valid: response.ok }
      } catch (error) {
        validations.teams = { valid: false, error: 'Failed to connect' }
      }
    }

    if (config.zapier) {
      try {
        const response = await fetch(config.zapier.webhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ event: 'test' }),
        })
        validations.zapier = { valid: response.ok }
      } catch (error) {
        validations.zapier = { valid: false, error: 'Failed to connect' }
      }
    }

    if (config.webhook) {
      try {
        const response = await fetch(config.webhook.url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ event: 'test' }),
        })
        validations.webhook = { valid: response.ok }
      } catch (error) {
        validations.webhook = { valid: false, error: 'Failed to connect' }
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Integrations configured',
      validations,
    })
  } catch (error) {
    Sentry.captureException(error)
    return NextResponse.json(
      { error: 'Failed to configure integrations' },
      { status: 500 }
    )
  }
})
