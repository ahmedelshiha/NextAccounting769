import * as Sentry from '@sentry/nextjs'

export interface TeamsIntegrationConfig {
  webhookUrl: string
  tenantId?: string
  clientId?: string
  clientSecret?: string
}

export interface TeamsMessage {
  [key: string]: any
  summary?: string
  themeColor?: string
  sections?: TeamsSection[]
  potentialAction?: TeamsAction[]
}

export interface TeamsSection {
  activityTitle?: string
  activitySubtitle?: string
  activityImage?: string
  text?: string
  facts?: {name: string; value: string}[]
  markdown?: boolean
}

export interface TeamsAction {
  [key: string]: any
  name: string
  targets?: {os: string; uri: string}[]
  inputs?: {
    id: string
    type: string
    placeholder?: string
  }[]
}

export interface TeamsPresetSharePayload {
  presetId: string
  presetName: string
  filters: Record<string, any>
  sharedBy: string
  sharedAt: string
  shareUrl?: string
}

export interface TeamsReportPayload {
  reportId: string
  reportName: string
  scheduleFrequency: string
  nextExecution: string
  totalRecords: number
  filteredRecords: number
}

export class TeamsIntegrationService {
  private webhookUrl: string
  private clientId?: string
  private clientSecret?: string

  constructor(config: TeamsIntegrationConfig) {
    this.webhookUrl = config.webhookUrl
    this.clientId = config.clientId
    this.clientSecret = config.clientSecret
  }

  /**
   * Share a filter preset via Teams
   */
  async sharePresetToTeams(payload: TeamsPresetSharePayload): Promise<{success: boolean; messageId?: string; error?: string}> {
    try {
      const message = this.buildPresetShareMessage(payload)
      const response = await fetch(this.webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(message),
      })

      if (!response.ok) {
        throw new Error(`Teams webhook returned ${response.status}`)
      }

      return { success: true, messageId: `msg_${Date.now()}` }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error'
      Sentry.captureException(error)
      return { success: false, error: message }
    }
  }

  /**
   * Send scheduled report to Teams channel
   */
  async sendScheduledReportToTeams(payload: TeamsReportPayload): Promise<{success: boolean; messageId?: string; error?: string}> {
    try {
      const message = this.buildScheduledReportMessage(payload)
      const response = await fetch(this.webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(message),
      })

      if (!response.ok) {
        throw new Error(`Teams webhook returned ${response.status}`)
      }

      return { success: true, messageId: `msg_${Date.now()}` }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error'
      Sentry.captureException(error)
      return { success: false, error: message }
    }
  }

  /**
   * Send filter notification to Teams
   */
  async sendFilterNotification(
    title: string,
    message: string,
    details: Record<string, any>
  ): Promise<{success: boolean; error?: string}> {
    try {
      const teamsMessage: TeamsMessage = {
        '@type': 'MessageCard',
        '@context': 'https://schema.org/extensions',
        summary: title,
        themeColor: '0078D4',
        sections: [
          {
            activityTitle: title,
            activitySubtitle: 'Filter Bar Notification',
            text: message,
            facts: Object.entries(details).map(([key, value]) => ({
              name: key,
              value: String(value),
            })),
          },
        ],
      }

      const response = await fetch(this.webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(teamsMessage),
      })

      if (!response.ok) {
        throw new Error(`Teams webhook returned ${response.status}`)
      }

      return { success: true }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error'
      Sentry.captureException(error)
      return { success: false, error: message }
    }
  }

  /**
   * Send Teams bot command response
   */
  async sendBotCommandResponse(
    title: string,
    content: string,
    actionUrl?: string
  ): Promise<{success: boolean; error?: string}> {
    try {
      const teamsMessage: TeamsMessage = {
        '@type': 'MessageCard',
        '@context': 'https://schema.org/extensions',
        summary: title,
        themeColor: '107C10',
        sections: [
          {
            activityTitle: title,
            text: content,
          },
        ],
        potentialAction: actionUrl
          ? [
              {
                '@type': 'OpenUri',
                name: 'View in Dashboard',
                targets: [
                  {
                    os: 'default',
                    uri: actionUrl,
                  },
                ],
              },
            ]
          : [],
      }

      const response = await fetch(this.webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(teamsMessage),
      })

      if (!response.ok) {
        throw new Error(`Teams webhook returned ${response.status}`)
      }

      return { success: true }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error'
      return { success: false, error: message }
    }
  }

  /**
   * Test Teams webhook connectivity
   */
  async testWebhook(): Promise<{success: boolean; error?: string}> {
    try {
      const teamsMessage: TeamsMessage = {
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

      const response = await fetch(this.webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(teamsMessage),
      })

      if (!response.ok) {
        throw new Error(`Webhook returned ${response.status}`)
      }

      return { success: true }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error'
      return { success: false, error: message }
    }
  }

  /**
   * Build Teams message for preset sharing
   */
  private buildPresetShareMessage(payload: TeamsPresetSharePayload): TeamsMessage {
    const filterFacts = Object.entries(payload.filters).map(([key, value]) => ({
      name: key.charAt(0).toUpperCase() + key.slice(1),
      value: String(value),
    }))

    return {
      '@type': 'MessageCard',
      '@context': 'https://schema.org/extensions',
      summary: `Filter Preset Shared: ${payload.presetName}`,
      themeColor: '0078D4',
      sections: [
        {
          activityTitle: '🎯 Filter Preset Shared',
          activitySubtitle: payload.presetName,
          text: `Shared by ${payload.sharedBy}`,
          facts: [
            ...filterFacts,
            {
              name: 'Shared At',
              value: new Date(payload.sharedAt).toLocaleString(),
            },
          ],
        },
      ],
      potentialAction: payload.shareUrl
        ? [
            {
              '@type': 'OpenUri',
              name: 'View in Dashboard',
              targets: [
                {
                  os: 'default',
                  uri: payload.shareUrl,
                },
              ],
            },
          ]
        : [],
    }
  }

  /**
   * Build Teams message for scheduled reports
   */
  private buildScheduledReportMessage(payload: TeamsReportPayload): TeamsMessage {
    return {
      '@type': 'MessageCard',
      '@context': 'https://schema.org/extensions',
      summary: `Scheduled Report: ${payload.reportName}`,
      themeColor: '107C10',
      sections: [
        {
          activityTitle: '📊 Scheduled Report',
          activitySubtitle: payload.reportName,
          facts: [
            {
              name: 'Frequency',
              value: payload.scheduleFrequency,
            },
            {
              name: 'Total Records',
              value: String(payload.totalRecords),
            },
            {
              name: 'Filtered Records',
              value: String(payload.filteredRecords),
            },
            {
              name: 'Next Execution',
              value: new Date(payload.nextExecution).toLocaleString(),
            },
          ],
        },
      ],
    }
  }

  /**
   * Validate Teams webhook URL
   */
  validateWebhookUrl(url: string): {valid: boolean; error?: string} {
    try {
      const parsed = new URL(url)
      if (!parsed.hostname.includes('webhook.office.com')) {
        return { valid: false, error: 'Must be a Teams webhook URL (webhook.office.com)' }
      }
      return { valid: true }
    } catch {
      return { valid: false, error: 'Invalid URL format' }
    }
  }
}

/**
 * Create Teams integration service instance
 */
export function createTeamsIntegration(config: TeamsIntegrationConfig): TeamsIntegrationService {
  if (!config.webhookUrl) {
    throw new Error('Teams webhook URL is required')
  }
  return new TeamsIntegrationService(config)
}
