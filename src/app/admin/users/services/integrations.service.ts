import * as Sentry from '@sentry/nextjs'
import {
  SlackIntegrationService,
  SlackIntegrationConfig,
  SlackPresetSharePayload,
  SlackReportSchedulePayload,
} from './slack-integration.service'
import {
  ZapierIntegrationService,
  ZapierConfig,
  FilterTriggerPayload,
} from './zapier-integration.service'
import {
  WebhookIntegrationService,
  WebhookConfig,
  FilterEventPayload,
  PresetEventPayload,
} from './webhook-integration.service'
import {
  TeamsIntegrationService,
  TeamsIntegrationConfig,
  TeamsPresetSharePayload,
} from './teams-integration.service'

export interface IntegrationConfig {
  slack?: SlackIntegrationConfig
  zapier?: ZapierConfig
  webhook?: WebhookConfig
  teams?: TeamsIntegrationConfig
}

export interface IntegrationStatus {
  platform: 'slack' | 'zapier' | 'webhook' | 'teams'
  enabled: boolean
  connected: boolean
  lastTestedAt?: string
  error?: string
}

export class IntegrationsService {
  private slack?: SlackIntegrationService
  private zapier?: ZapierIntegrationService
  private webhook?: WebhookIntegrationService
  private teams?: TeamsIntegrationService
  private tenantId: string

  constructor(tenantId: string, config: IntegrationConfig) {
    this.tenantId = tenantId

    if (config.slack) {
      try {
        this.slack = new SlackIntegrationService(config.slack)
      } catch (error) {
        Sentry.captureException(error)
      }
    }

    if (config.zapier) {
      try {
        this.zapier = new ZapierIntegrationService(config.zapier)
      } catch (error) {
        Sentry.captureException(error)
      }
    }

    if (config.webhook) {
      try {
        this.webhook = new WebhookIntegrationService(config.webhook)
      } catch (error) {
        Sentry.captureException(error)
      }
    }

    if (config.teams) {
      try {
        this.teams = new TeamsIntegrationService(config.teams)
      } catch (error) {
        Sentry.captureException(error)
      }
    }
  }

  /**
   * Share preset across all enabled integrations
   */
  async sharePreset(
    presetId: string,
    presetName: string,
    filters: Record<string, any>,
    sharedBy: string,
    shareUrl?: string
  ): Promise<{slack?: boolean; zapier?: boolean; teams?: boolean; webhook?: boolean; error?: string}> {
    const results: Record<string, boolean | undefined> = {}
    const sharedAt = new Date().toISOString()

    try {
      if (this.slack) {
        const slackPayload: SlackPresetSharePayload = {
          presetId,
          presetName,
          filters,
          sharedBy,
          sharedAt,
          shareUrl,
        }
        const result = await this.slack.sharePresetToSlack(slackPayload)
        results.slack = result.success
      }

      if (this.teams) {
        const teamsPayload: TeamsPresetSharePayload = {
          presetId,
          presetName,
          filters,
          sharedBy,
          sharedAt,
          shareUrl,
        }
        const result = await this.teams.sharePresetToTeams(teamsPayload)
        results.teams = result.success
      }

      if (this.zapier) {
        const zapierPayload: FilterTriggerPayload = {
          event: 'preset.shared',
          timestamp: sharedAt,
          userId: sharedBy,
          tenantId: this.tenantId,
          data: {
            presetId,
            filterName: presetName,
            filters,
          },
        }
        const result = await this.zapier.triggerFilterWorkflow(zapierPayload)
        results.zapier = result.success
      }

      if (this.webhook) {
        const webhookPayload: PresetEventPayload = {
          event: 'preset.shared',
          timestamp: sharedAt,
          userId: sharedBy,
          tenantId: this.tenantId,
          data: {
            presetId,
            presetName,
            filters,
            action: 'shared',
          },
        }
        const result = await this.webhook.sendWebhook(webhookPayload)
        results.webhook = result.success
      }

      return results
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error'
      Sentry.captureException(error)
      return { ...results, error: message }
    }
  }

  /**
   * Notify all integrations when filter is applied
   */
  async onFilterApplied(
    filterId: string,
    filterName: string,
    filters: Record<string, any>,
    resultCount: number,
    executionTime: number,
    userId: string
  ): Promise<{success: boolean; error?: string}> {
    try {
      const timestamp = new Date().toISOString()

      if (this.zapier) {
        const payload: FilterTriggerPayload = {
          event: 'filter.applied',
          timestamp,
          userId,
          tenantId: this.tenantId,
          data: {
            filterId,
            filterName,
            filters,
            resultCount,
            executionTime,
          },
        }
        await this.zapier.triggerFilterWorkflow(payload)
      }

      if (this.webhook) {
        const payload: FilterEventPayload = {
          event: 'filter.applied',
          timestamp,
          userId,
          tenantId: this.tenantId,
          data: {
            filterId,
            filterName,
            filters,
            resultCount,
            executionTime,
          },
        }
        await this.webhook.sendWebhook(payload)
      }

      return { success: true }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error'
      Sentry.captureException(error)
      return { success: false, error: message }
    }
  }

  /**
   * Send scheduled report to all integrations
   */
  async sendScheduledReport(
    reportId: string,
    reportName: string,
    scheduleFrequency: string,
    nextExecution: string,
    totalRecords: number,
    filteredRecords: number,
    userId: string
  ): Promise<{slack?: boolean; teams?: boolean; zapier?: boolean; webhook?: boolean}> {
    const results: Record<string, boolean> = {}

    try {
      if (this.slack) {
        const payload: SlackReportSchedulePayload = {
          reportId,
          reportName,
          scheduleFrequency,
          nextExecution,
          recipientChannel: '#reports',
        }
        const result = await this.slack.sendScheduledReportToSlack(payload, {
          totalRecords,
          filteredRecords,
          columns: [],
          summary: {},
        })
        results.slack = result.success
      }

      if (this.teams) {
        const result = await this.teams.sendScheduledReportToTeams({
          reportId,
          reportName,
          scheduleFrequency,
          nextExecution,
          totalRecords,
          filteredRecords,
        })
        results.teams = result.success
      }

      if (this.webhook) {
        const payload: any = {
          event: 'export.scheduled',
          timestamp: new Date().toISOString(),
          userId,
          tenantId: this.tenantId,
          data: {
            exportId: reportId,
            format: 'pdf',
            recordCount: filteredRecords,
            fileSize: 0,
          },
        }
        const result = await this.webhook.sendWebhook(payload)
        results.webhook = result.success
      }

      return results
    } catch (error) {
      Sentry.captureException(error)
      return results
    }
  }

  /**
   * Test all enabled integrations
   */
  async testAllIntegrations(): Promise<IntegrationStatus[]> {
    const results: IntegrationStatus[] = []
    const timestamp = new Date().toISOString()

    if (this.slack) {
      try {
        const result = await this.slack.testWebhook()
        results.push({
          platform: 'slack',
          enabled: true,
          connected: result.success,
          lastTestedAt: timestamp,
          error: result.error,
        })
      } catch (error) {
        results.push({
          platform: 'slack',
          enabled: true,
          connected: false,
          lastTestedAt: timestamp,
          error: error instanceof Error ? error.message : 'Unknown error',
        })
      }
    }

    if (this.zapier) {
      try {
        const result = await this.zapier.testWebhook()
        results.push({
          platform: 'zapier',
          enabled: true,
          connected: result.success,
          lastTestedAt: timestamp,
          error: result.error,
        })
      } catch (error) {
        results.push({
          platform: 'zapier',
          enabled: true,
          connected: false,
          lastTestedAt: timestamp,
          error: error instanceof Error ? error.message : 'Unknown error',
        })
      }
    }

    if (this.webhook) {
      try {
        const result = await this.webhook.testWebhook()
        results.push({
          platform: 'webhook',
          enabled: true,
          connected: result.success,
          lastTestedAt: timestamp,
          error: result.error,
        })
      } catch (error) {
        results.push({
          platform: 'webhook',
          enabled: true,
          connected: false,
          lastTestedAt: timestamp,
          error: error instanceof Error ? error.message : 'Unknown error',
        })
      }
    }

    if (this.teams) {
      try {
        const result = await this.teams.testWebhook()
        results.push({
          platform: 'teams',
          enabled: true,
          connected: result.success,
          lastTestedAt: timestamp,
          error: result.error,
        })
      } catch (error) {
        results.push({
          platform: 'teams',
          enabled: true,
          connected: false,
          lastTestedAt: timestamp,
          error: error instanceof Error ? error.message : 'Unknown error',
        })
      }
    }

    return results
  }

  /**
   * Get integration status summary
   */
  getStatus(): Record<string, boolean> {
    return {
      slack: !!this.slack,
      zapier: !!this.zapier,
      webhook: !!this.webhook,
      teams: !!this.teams,
    }
  }
}

/**
 * Create integrations service instance
 */
export function createIntegrationsService(
  tenantId: string,
  config: IntegrationConfig
): IntegrationsService {
  return new IntegrationsService(tenantId, config)
}
