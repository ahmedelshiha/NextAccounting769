import * as Sentry from '@sentry/nextjs'
import { createHmac } from 'crypto'

export interface WebhookConfig {
  url: string
  secret?: string
  headers?: Record<string, string>
  timeout?: number
  retryAttempts?: number
  retryDelayMs?: number
}

export interface WebhookPayload {
  event: string
  timestamp: string
  data: Record<string, any>
  userId: string
  tenantId: string
  signature?: string
}

export interface WebhookDelivery {
  id: string
  webhookId: string
  url: string
  payload: WebhookPayload
  status: 'pending' | 'success' | 'failed' | 'retrying'
  statusCode?: number
  responseBody?: string
  attempts: number
  nextRetryAt?: string
  createdAt: string
  updatedAt: string
}

export interface FilterEventPayload extends WebhookPayload {
  event: 'filter.created' | 'filter.applied' | 'filter.deleted' | 'filter.updated'
  data: {
    filterId: string
    filterName: string
    filters: Record<string, any>
    resultCount?: number
    executionTime?: number
    previousFilters?: Record<string, any>
  }
}

export interface PresetEventPayload extends WebhookPayload {
  event: 'preset.created' | 'preset.applied' | 'preset.deleted' | 'preset.shared' | 'preset.updated'
  data: {
    presetId: string
    presetName: string
    filters: Record<string, any>
    action: string
    sharedWith?: string[]
    permissions?: string
  }
}

export interface ExportEventPayload extends WebhookPayload {
  event: 'export.generated' | 'export.scheduled' | 'export.sent'
  data: {
    exportId: string
    format: 'pdf' | 'xlsx' | 'csv' | 'json'
    recordCount: number
    fileSize: number
    fileName?: string
    recipients?: string[]
  }
}

export class WebhookIntegrationService {
  private url: string
  private secret?: string
  private headers: Record<string, string>
  private timeout: number
  private retryAttempts: number
  private retryDelayMs: number
  private deliveries: Map<string, WebhookDelivery> = new Map()

  constructor(config: WebhookConfig) {
    this.url = config.url
    this.secret = config.secret
    this.headers = {
      'Content-Type': 'application/json',
      ...config.headers,
    }
    this.timeout = config.timeout || 30000 // 30 seconds
    this.retryAttempts = config.retryAttempts || 3
    this.retryDelayMs = config.retryDelayMs || 1000
  }

  /**
   * Send webhook payload with retry logic
   */
  async sendWebhook(payload: WebhookPayload, attempt: number = 1): Promise<{success: boolean; deliveryId: string; error?: string}> {
    const deliveryId = `delivery_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    try {
      const payloadWithSignature = this.addSignature(payload)
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), this.timeout)

      const response = await fetch(this.url, {
        method: 'POST',
        headers: this.headers,
        body: JSON.stringify(payloadWithSignature),
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      const delivery: WebhookDelivery = {
        id: deliveryId,
        webhookId: this.url,
        url: this.url,
        payload: payloadWithSignature,
        status: response.ok ? 'success' : 'failed',
        statusCode: response.status,
        attempts: attempt,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }

      // Try to read response body
      try {
        delivery.responseBody = await response.text()
      } catch {
        // Ignore response body read errors
      }

      this.deliveries.set(deliveryId, delivery)

      if (!response.ok && attempt < this.retryAttempts) {
        return this.scheduleRetry(payload, deliveryId, attempt)
      }

      return {
        success: response.ok,
        deliveryId,
        error: !response.ok ? `HTTP ${response.status}` : undefined,
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error'
      Sentry.captureException(error)

      if (attempt < this.retryAttempts) {
        return this.scheduleRetry(payload, deliveryId, attempt)
      }

      const delivery: WebhookDelivery = {
        id: deliveryId,
        webhookId: this.url,
        url: this.url,
        payload,
        status: 'failed',
        attempts: attempt,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
      this.deliveries.set(deliveryId, delivery)

      return { success: false, deliveryId, error: message }
    }
  }

  /**
   * Trigger filter event webhook
   */
  async onFilterEvent(
    event: FilterEventPayload['event'],
    filterId: string,
    filterName: string,
    filters: Record<string, any>,
    userId: string,
    tenantId: string,
    additionalData?: Partial<FilterEventPayload['data']>
  ): Promise<{success: boolean; error?: string}> {
    const payload: FilterEventPayload = {
      event,
      timestamp: new Date().toISOString(),
      userId,
      tenantId,
      data: {
        filterId,
        filterName,
        filters,
        ...additionalData,
      },
    }

    const result = await this.sendWebhook(payload)
    return { success: result.success, error: result.error }
  }

  /**
   * Trigger preset event webhook
   */
  async onPresetEvent(
    event: PresetEventPayload['event'],
    presetId: string,
    presetName: string,
    filters: Record<string, any>,
    userId: string,
    tenantId: string,
    action: string,
    additionalData?: Partial<PresetEventPayload['data']>
  ): Promise<{success: boolean; error?: string}> {
    const payload: PresetEventPayload = {
      event,
      timestamp: new Date().toISOString(),
      userId,
      tenantId,
      data: {
        presetId,
        presetName,
        filters,
        action,
        ...additionalData,
      },
    }

    const result = await this.sendWebhook(payload)
    return { success: result.success, error: result.error }
  }

  /**
   * Trigger export event webhook
   */
  async onExportEvent(
    event: ExportEventPayload['event'],
    exportId: string,
    format: 'pdf' | 'xlsx' | 'csv' | 'json',
    recordCount: number,
    fileSize: number,
    userId: string,
    tenantId: string,
    additionalData?: Partial<ExportEventPayload['data']>
  ): Promise<{success: boolean; error?: string}> {
    const payload: ExportEventPayload = {
      event,
      timestamp: new Date().toISOString(),
      userId,
      tenantId,
      data: {
        exportId,
        format,
        recordCount,
        fileSize,
        ...additionalData,
      },
    }

    const result = await this.sendWebhook(payload)
    return { success: result.success, error: result.error }
  }

  /**
   * Test webhook connectivity
   */
  async testWebhook(): Promise<{success: boolean; statusCode?: number; error?: string}> {
    try {
      const payload: WebhookPayload = {
        event: 'test',
        timestamp: new Date().toISOString(),
        data: { message: 'Filter bar webhook integration test' },
        userId: 'test',
        tenantId: 'test',
      }

      const result = await this.sendWebhook(payload)
      return {
        success: result.success,
        error: result.error,
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error'
      return { success: false, error: message }
    }
  }

  /**
   * Get delivery history
   */
  getDeliveryHistory(limit: number = 50): WebhookDelivery[] {
    return Array.from(this.deliveries.values())
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, limit)
  }

  /**
   * Get delivery details
   */
  getDelivery(deliveryId: string): WebhookDelivery | undefined {
    return this.deliveries.get(deliveryId)
  }

  /**
   * Validate webhook URL
   */
  validateWebhookUrl(url: string): {valid: boolean; error?: string} {
    try {
      const parsed = new URL(url)
      if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
        return { valid: false, error: 'URL must use HTTP or HTTPS' }
      }
      if (!parsed.hostname) {
        return { valid: false, error: 'Invalid hostname' }
      }
      return { valid: true }
    } catch (error) {
      return { valid: false, error: 'Invalid URL format' }
    }
  }

  /**
   * Add HMAC signature to payload
   */
  private addSignature(payload: WebhookPayload): WebhookPayload {
    if (!this.secret) {
      return payload
    }

    // Create signature using HMAC-SHA256
    const signature = createHmac('sha256', this.secret)
      .update(JSON.stringify(payload))
      .digest('hex')

    return {
      ...payload,
      signature: `sha256=${signature}`,
    }
  }

  /**
   * Schedule retry for failed webhook
   */
  private scheduleRetry(
    payload: WebhookPayload,
    previousDeliveryId: string,
    attempt: number
  ): {success: boolean; deliveryId: string} {
    const delayMs = this.retryDelayMs * Math.pow(2, attempt - 1) // Exponential backoff
    const nextAttempt = attempt + 1

    setTimeout(() => {
      this.sendWebhook(payload, nextAttempt)
    }, delayMs)

    const delivery = this.deliveries.get(previousDeliveryId)
    if (delivery) {
      delivery.status = 'retrying'
      delivery.nextRetryAt = new Date(Date.now() + delayMs).toISOString()
      this.deliveries.set(previousDeliveryId, delivery)
    }

    return { success: false, deliveryId: previousDeliveryId }
  }
}

/**
 * Create webhook integration service instance
 */
export function createWebhookIntegration(config: WebhookConfig): WebhookIntegrationService {
  if (!config.url) {
    throw new Error('Webhook URL is required')
  }
  return new WebhookIntegrationService(config)
}
