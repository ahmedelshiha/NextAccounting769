import * as Sentry from '@sentry/nextjs'

export interface SlackIntegrationConfig {
  webhookUrl: string
  teamId?: string
  channelId?: string
  botToken?: string
}

export interface SlackMessage {
  channel?: string
  text?: string
  blocks?: any[]
  thread_ts?: string
}

export interface SlackPresetSharePayload {
  presetId: string
  presetName: string
  filters: Record<string, any>
  sharedBy: string
  sharedAt: string
  shareUrl?: string
}

export interface SlackReportSchedulePayload {
  reportId: string
  reportName: string
  scheduleFrequency: string
  nextExecution: string
  recipientChannel: string
}

export class SlackIntegrationService {
  private webhookUrl: string
  private botToken?: string

  constructor(config: SlackIntegrationConfig) {
    this.webhookUrl = config.webhookUrl
    this.botToken = config.botToken
  }

  /**
   * Share a filter preset via Slack
   */
  async sharePresetToSlack(payload: SlackPresetSharePayload): Promise<{success: boolean; messageTs?: string; error?: string}> {
    try {
      const message = this.buildPresetShareMessage(payload)
      const response = await fetch(this.webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(message),
      })

      if (!response.ok) {
        throw new Error(`Slack webhook returned ${response.status}`)
      }

      const data = await response.json() as {ok?: boolean; ts?: string; error?: string}
      if (!data.ok) {
        throw new Error(data.error || 'Unknown Slack error')
      }

      return { success: true, messageTs: data.ts }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error'
      Sentry.captureException(error)
      return { success: false, error: message }
    }
  }

  /**
   * Send scheduled report to Slack channel
   */
  async sendScheduledReportToSlack(
    payload: SlackReportSchedulePayload,
    reportData: {
      totalRecords: number
      filteredRecords: number
      columns: string[]
      summary: Record<string, any>
    }
  ): Promise<{success: boolean; messageTs?: string; error?: string}> {
    try {
      const message = this.buildScheduledReportMessage(payload, reportData)
      const response = await fetch(this.webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(message),
      })

      if (!response.ok) {
        throw new Error(`Slack webhook returned ${response.status}`)
      }

      const data = await response.json() as {ok?: boolean; ts?: string; error?: string}
      if (!data.ok) {
        throw new Error(data.error || 'Unknown Slack error')
      }

      return { success: true, messageTs: data.ts }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error'
      Sentry.captureException(error)
      return { success: false, error: message }
    }
  }

  /**
   * Send filter notification (when filters match certain criteria)
   */
  async sendFilterNotification(
    channel: string,
    title: string,
    message: string,
    details: Record<string, any>
  ): Promise<{success: boolean; error?: string}> {
    try {
      const slackMessage: SlackMessage = {
        channel,
        text: title,
        blocks: [
          {
            type: 'header',
            text: { type: 'plain_text', text: title, emoji: true },
          },
          {
            type: 'section',
            text: { type: 'mrkdwn', text: message },
          },
          {
            type: 'section',
            fields: Object.entries(details).map(([key, value]) => ({
              type: 'mrkdwn',
              text: `*${key}:*\n${value}`,
            })),
          },
          {
            type: 'divider',
          },
        ],
      }

      const response = await fetch(this.webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(slackMessage),
      })

      if (!response.ok) {
        throw new Error(`Slack webhook returned ${response.status}`)
      }

      const data = await response.json() as {ok?: boolean; error?: string}
      if (!data.ok) {
        throw new Error(data.error || 'Unknown Slack error')
      }

      return { success: true }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error'
      Sentry.captureException(error)
      return { success: false, error: message }
    }
  }

  /**
   * Test Slack webhook connectivity
   */
  async testWebhook(): Promise<{success: boolean; error?: string}> {
    try {
      const response = await fetch(this.webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: '✅ Filter bar Slack integration test successful',
          blocks: [
            {
              type: 'section',
              text: {
                type: 'mrkdwn',
                text: '✅ *Filter Bar Integration Test Successful*\n_Slack webhook is working correctly_',
              },
            },
          ],
        }),
      })

      if (!response.ok) {
        throw new Error(`Webhook returned ${response.status}`)
      }

      const data = await response.json() as {ok?: boolean; error?: string}
      return { success: data.ok !== false, error: data.error }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error'
      return { success: false, error: message }
    }
  }

  /**
   * Build Slack message for preset sharing
   */
  private buildPresetShareMessage(payload: SlackPresetSharePayload): SlackMessage {
    const filterText = Object.entries(payload.filters)
      .map(([key, value]) => `• ${key}: ${value}`)
      .join('\n')

    return {
      blocks: [
        {
          type: 'header',
          text: {
            type: 'plain_text',
            text: '🎯 Filter Preset Shared',
            emoji: true,
          },
        },
        {
          type: 'section',
          fields: [
            {
              type: 'mrkdwn',
              text: `*Preset:*\n${payload.presetName}`,
            },
            {
              type: 'mrkdwn',
              text: `*Shared by:*\n${payload.sharedBy}`,
            },
          ],
        },
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `*Applied Filters:*\n${filterText}`,
          },
        },
        {
          type: 'context',
          elements: [
            {
              type: 'mrkdwn',
              text: `_Shared at ${new Date(payload.sharedAt).toLocaleString()}_`,
            },
          ],
        },
        ...(payload.shareUrl
          ? [
              {
                type: 'actions',
                elements: [
                  {
                    type: 'button',
                    text: { type: 'plain_text', text: 'View in Dashboard', emoji: true },
                    url: payload.shareUrl,
                    style: 'primary' as const,
                  },
                ],
              },
            ]
          : []),
      ],
    }
  }

  /**
   * Build Slack message for scheduled reports
   */
  private buildScheduledReportMessage(
    payload: SlackReportSchedulePayload,
    reportData: {
      totalRecords: number
      filteredRecords: number
      columns: string[]
      summary: Record<string, any>
    }
  ): SlackMessage {
    return {
      blocks: [
        {
          type: 'header',
          text: {
            type: 'plain_text',
            text: '📊 Scheduled Report',
            emoji: true,
          },
        },
        {
          type: 'section',
          fields: [
            {
              type: 'mrkdwn',
              text: `*Report:*\n${payload.reportName}`,
            },
            {
              type: 'mrkdwn',
              text: `*Frequency:*\n${payload.scheduleFrequency}`,
            },
            {
              type: 'mrkdwn',
              text: `*Total Records:*\n${reportData.totalRecords}`,
            },
            {
              type: 'mrkdwn',
              text: `*Filtered Records:*\n${reportData.filteredRecords}`,
            },
          ],
        },
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `*Columns:*\n${reportData.columns.join(', ')}`,
          },
        },
        {
          type: 'context',
          elements: [
            {
              type: 'mrkdwn',
              text: `_Next execution: ${new Date(payload.nextExecution).toLocaleString()}_`,
            },
          ],
        },
      ],
    }
  }
}

/**
 * Create Slack integration service instance
 */
export function createSlackIntegration(config: SlackIntegrationConfig): SlackIntegrationService {
  if (!config.webhookUrl) {
    throw new Error('Slack webhook URL is required')
  }
  return new SlackIntegrationService(config)
}
