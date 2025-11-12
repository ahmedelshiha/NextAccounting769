import * as Sentry from '@sentry/nextjs'

export interface ZapierConfig {
  webhookUrl: string
  apiKey?: string
  appId?: string
}

export interface ZapierTriggerPayload {
  event: string
  timestamp: string
  data: Record<string, any>
  userId: string
  tenantId: string
}

export interface FilterTriggerPayload extends ZapierTriggerPayload {
  event: 'filter.created' | 'filter.applied' | 'filter.deleted' | 'preset.created' | 'preset.shared'
  data: {
    filterId?: string
    presetId?: string
    filterName: string
    filters: Record<string, any>
    resultCount?: number
    executionTime?: number
  }
}

export interface WorkflowTriggerPayload extends ZapierTriggerPayload {
  event: 'workflow.triggered'
  data: {
    workflowId: string
    workflowName: string
    triggerType: 'filter_match' | 'preset_apply' | 'schedule' | 'manual'
    metadata: Record<string, any>
  }
}

export interface ZapTemplate {
  id: string
  name: string
  description: string
  trigger: string
  action: string
  category: 'automation' | 'notification' | 'integration' | 'workflow'
  icon: string
  docUrl?: string
}

export class ZapierIntegrationService {
  private webhookUrl: string
  private apiKey?: string
  private appId?: string

  constructor(config: ZapierConfig) {
    this.webhookUrl = config.webhookUrl
    this.apiKey = config.apiKey
    this.appId = config.appId
  }

  /**
   * Trigger a Zapier workflow based on filter event
   */
  async triggerFilterWorkflow(payload: FilterTriggerPayload): Promise<{success: boolean; workflowId?: string; error?: string}> {
    try {
      const response = await fetch(this.webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(this.apiKey && { 'Authorization': `Bearer ${this.apiKey}` }),
        },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        throw new Error(`Zapier webhook returned ${response.status}`)
      }

      const data = await response.json() as {id?: string; status?: string; error?: string}
      if (data.error) {
        throw new Error(data.error)
      }

      return { success: true, workflowId: data.id }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error'
      Sentry.captureException(error)
      return { success: false, error: message }
    }
  }

  /**
   * Trigger when preset is created
   */
  async onPresetCreated(
    presetId: string,
    presetName: string,
    filters: Record<string, any>,
    userId: string,
    tenantId: string
  ): Promise<{success: boolean; error?: string}> {
    return this.triggerFilterWorkflow({
      event: 'preset.created',
      timestamp: new Date().toISOString(),
      userId,
      tenantId,
      data: {
        presetId,
        filterName: presetName,
        filters,
      },
    })
  }

  /**
   * Trigger when preset is shared
   */
  async onPresetShared(
    presetId: string,
    presetName: string,
    sharedWith: string[],
    permissions: string,
    userId: string,
    tenantId: string
  ): Promise<{success: boolean; error?: string}> {
    return this.triggerFilterWorkflow({
      event: 'preset.shared',
      timestamp: new Date().toISOString(),
      userId,
      tenantId,
      data: {
        presetId,
        filterName: presetName,
        filters: { sharedWith, permissions },
      },
    })
  }

  /**
   * Trigger when filter is applied
   */
  async onFilterApplied(
    filterId: string,
    filterName: string,
    filters: Record<string, any>,
    resultCount: number,
    executionTime: number,
    userId: string,
    tenantId: string
  ): Promise<{success: boolean; error?: string}> {
    return this.triggerFilterWorkflow({
      event: 'filter.applied',
      timestamp: new Date().toISOString(),
      userId,
      tenantId,
      data: {
        filterId,
        filterName,
        filters,
        resultCount,
        executionTime,
      },
    })
  }

  /**
   * Create a preset from Zapier
   */
  async createPresetFromZapier(
    presetName: string,
    filters: Record<string, any>,
    description?: string
  ): Promise<{success: boolean; presetId?: string; error?: string}> {
    try {
      // This would be called from a Zapier action, returning the created preset ID
      // In implementation, this would call the API to create a preset
      const presetId = `preset_${Date.now()}`
      return { success: true, presetId }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error'
      return { success: false, error: message }
    }
  }

  /**
   * Get available Zap templates for filter bar
   */
  getZapTemplates(): ZapTemplate[] {
    return [
      {
        id: 'zap-slack-notify',
        name: 'Send Slack message when filter matches',
        description: 'Send a notification to Slack whenever a specific filter is applied',
        trigger: 'filter.applied',
        action: 'slack.send_message',
        category: 'notification',
        icon: 'slack',
        docUrl: 'https://docs.example.com/zapier/slack-notify',
      },
      {
        id: 'zap-email-schedule',
        name: 'Email scheduled reports',
        description: 'Send filtered report results via email on a schedule',
        trigger: 'schedule.triggered',
        action: 'email.send',
        category: 'automation',
        icon: 'email',
        docUrl: 'https://docs.example.com/zapier/email-schedule',
      },
      {
        id: 'zap-sheets-export',
        name: 'Export filtered data to Google Sheets',
        description: 'Automatically export filtered results to a Google Sheet',
        trigger: 'preset.created',
        action: 'google_sheets.append_row',
        category: 'integration',
        icon: 'google_sheets',
        docUrl: 'https://docs.example.com/zapier/sheets-export',
      },
      {
        id: 'zap-webhook-custom',
        name: 'Send webhook to custom app',
        description: 'Trigger a webhook in your custom application when filter changes',
        trigger: 'filter.applied',
        action: 'webhook.post',
        category: 'workflow',
        icon: 'webhook',
        docUrl: 'https://docs.example.com/zapier/webhook',
      },
      {
        id: 'zap-record-create',
        name: 'Create record in Airtable',
        description: 'Create a new Airtable record for each filter application',
        trigger: 'filter.applied',
        action: 'airtable.create_record',
        category: 'integration',
        icon: 'airtable',
        docUrl: 'https://docs.example.com/zapier/airtable',
      },
      {
        id: 'zap-trigger-workflow',
        name: 'Trigger workflow automation',
        description: 'Start an automated workflow based on filter events',
        trigger: 'preset.shared',
        action: 'workflow.execute',
        category: 'workflow',
        icon: 'workflow',
        docUrl: 'https://docs.example.com/zapier/workflow',
      },
    ]
  }

  /**
   * Test Zapier webhook connectivity
   */
  async testWebhook(): Promise<{success: boolean; error?: string}> {
    try {
      const response = await fetch(this.webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(this.apiKey && { 'Authorization': `Bearer ${this.apiKey}` }),
        },
        body: JSON.stringify({
          event: 'test',
          timestamp: new Date().toISOString(),
          data: { message: 'Filter bar Zapier integration test' },
          userId: 'test',
          tenantId: 'test',
        }),
      })

      if (!response.ok) {
        throw new Error(`Zapier webhook returned ${response.status}`)
      }

      return { success: true }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error'
      return { success: false, error: message }
    }
  }

  /**
   * Validate Zapier webhook URL format
   */
  validateWebhookUrl(url: string): boolean {
    try {
      const parsedUrl = new URL(url)
      return (
        parsedUrl.protocol === 'https:' &&
        (parsedUrl.hostname.includes('zapier') || parsedUrl.hostname.includes('hooks'))
      )
    } catch {
      return false
    }
  }
}

/**
 * Create Zapier integration service instance
 */
export function createZapierIntegration(config: ZapierConfig): ZapierIntegrationService {
  if (!config.webhookUrl) {
    throw new Error('Zapier webhook URL is required')
  }
  return new ZapierIntegrationService(config)
}
