import prisma from '@/lib/prisma'
import { logger } from '@/lib/logger'
import { getStripeClient } from '@/lib/payments/stripe-client'

export interface DunningResult {
  processed: number
  retried: number
  escalated: number
  failed: number
}

export interface DunningConfig {
  maxRetries: number
  retryIntervals: number[] // Days between retries: [1, 3, 7]
  escalationThreshold: number // Days before escalation
  notificationChannels: ('email' | 'sms' | 'whatsapp')[]
}

const DEFAULT_CONFIG: DunningConfig = {
  maxRetries: 3,
  retryIntervals: [1, 3, 7], // Retry after 1, 3, and 7 days
  escalationThreshold: 14, // Escalate after 14 days
  notificationChannels: ['email'],
}

interface PaymentAttempt {
  id: string
  invoiceId: string
  attemptNumber: number
  lastAttemptAt: Date
  nextRetryAt?: Date
  status: 'pending' | 'failed' | 'succeeded'
  error?: string
}

/**
 * Process dunning for unpaid invoices
 * Handles retry logic, escalation, and notifications
 */
export async function processDunning(
  tenantId: string,
  config: Partial<DunningConfig> = {}
): Promise<{
  processed: number
  retried: number
  escalated: number
  failed: number
}> {
  const finalConfig = { ...DEFAULT_CONFIG, ...config }
  const now = new Date()

  const stats = {
    processed: 0,
    retried: 0,
    escalated: 0,
    failed: 0,
  }

  try {
    // Find unpaid invoices due for retry
    const invoices = await prisma.invoice.findMany({
      where: {
        tenantId,
        status: 'UNPAID',
      },
      include: {
        client: {
          select: { id: true, email: true, name: true },
        },
      },
    })

    for (const invoice of invoices) {
      stats.processed++

      const daysSinceCreated = Math.floor(
        (now.getTime() - invoice.createdAt.getTime()) / (1000 * 60 * 60 * 24)
      )

      // Check if escalation needed
      if (daysSinceCreated >= finalConfig.escalationThreshold) {
        await escalateInvoice(invoice.id, tenantId)
        stats.escalated++
        continue
      }

      // Attempt retry based on dunning schedule
      const shouldRetry = shouldRetryPayment(
        invoice.createdAt,
        finalConfig.retryIntervals
      )

      if (shouldRetry && invoice.client) {
        try {
          const paymentMethods = await prisma.userPaymentMethod.findMany({
            where: {
              userId: invoice.client.id,
              tenantId,
              isDefault: true,
              status: 'ACTIVE',
            },
            take: 1,
          })

          if (paymentMethods.length > 0) {
            const method = paymentMethods[0]
            const success = await retryPayment(
              invoice.id,
              method.paymentMethodId,
              invoice.totalCents,
              invoice.currency
            )

            if (success) {
              stats.retried++
              await updateInvoiceStatus(invoice.id, 'PAID')
            } else {
              stats.failed++
              await sendDunningNotification(invoice, invoice.client, finalConfig)
            }
          } else {
            // No default payment method, send notification
            await sendDunningNotification(invoice, invoice.client, finalConfig)
          }
        } catch (error) {
          logger.error('Error processing dunning for invoice', {
            invoiceId: invoice.id,
            error: String(error),
          })
          stats.failed++
        }
      }
    }

    return stats
  } catch (error) {
    logger.error('Error processing dunning', {
      tenantId,
      error: String(error),
    })
    throw error
  }
}

/**
 * Determine if a payment should be retried based on dunning schedule
 */
function shouldRetryPayment(createdAt: Date, retryIntervals: number[]): boolean {
  const now = new Date()
  const daysSinceCreated = Math.floor(
    (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24)
  )

  // Check if we're within any retry window (±1 day tolerance)
  for (const interval of retryIntervals) {
    if (Math.abs(daysSinceCreated - interval) <= 1) {
      return true
    }
  }

  return false
}

/**
 * Attempt to charge the payment method
 */
async function retryPayment(
  invoiceId: string,
  paymentMethodId: string,
  amountCents: number,
  currency: string
): Promise<boolean> {
  try {
    const stripe = getStripeClient()
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountCents,
      currency: currency.toLowerCase(),
      payment_method: paymentMethodId,
      confirm: true,
      off_session: true,
      metadata: {
        invoiceId,
        retryAttempt: 'true',
      },
    })

    return paymentIntent.status === 'succeeded'
  } catch (error) {
    logger.error('Payment retry failed', {
      invoiceId,
      error: String(error),
    })
    return false
  }
}

/**
 * Update invoice status
 */
async function updateInvoiceStatus(
  invoiceId: string,
  status: 'PAID' | 'UNPAID'
): Promise<void> {
  await prisma.invoice.update({
    where: { id: invoiceId },
    data: {
      status: status === 'PAID' ? 'PAID' : 'UNPAID',
      paidAt: status === 'PAID' ? new Date() : null,
    },
  })
}

/**
 * Escalate invoice (move to collections, notify support, etc.)
 */
async function escalateInvoice(invoiceId: string, tenantId: string): Promise<void> {
  // Update invoice metadata to mark as escalated
  const invoice = await prisma.invoice.findUnique({
    where: { id: invoiceId },
  })

  if (invoice) {
    // In a real system, this would:
    // 1. Create a support ticket
    // 2. Notify management
    // 3. Suspend service
    // 4. Block future orders
    logger.warn('Invoice escalated due to non-payment', {
      invoiceId,
      tenantId,
      daysOverdue: Math.floor(
        (Date.now() - invoice.createdAt.getTime()) / (1000 * 60 * 60 * 24)
      ),
    })
  }
}

/**
 * Send dunning notification to customer
 */
async function sendDunningNotification(
  invoice: any,
  client: any,
  config: DunningConfig
): Promise<void> {
  // In a real system, this would send email/SMS/WhatsApp
  logger.info('Dunning notification sent', {
    invoiceId: invoice.id,
    clientId: client.id,
    clientEmail: client.email,
    channels: config.notificationChannels,
  })

  // TODO: Integrate with email/SMS service
  // For now, just log it
}

/**
 * Get dunning status for an invoice
 */
export async function getDunningStatus(invoiceId: string) {
  const invoice = await prisma.invoice.findUnique({
    where: { id: invoiceId },
    select: {
      id: true,
      status: true,
      createdAt: true,
      paidAt: true,
      totalCents: true,
      currency: true,
    },
  })

  if (!invoice) {
    return null
  }

  const now = new Date()
  const daysSinceCreated = Math.floor(
    (now.getTime() - invoice.createdAt.getTime()) / (1000 * 60 * 60 * 24)
  )

  return {
    invoiceId: invoice.id,
    status: invoice.status,
    daysOverdue: invoice.status === 'UNPAID' ? daysSinceCreated : 0,
    isEscalated: daysSinceCreated >= DEFAULT_CONFIG.escalationThreshold,
    nextRetryDue: DEFAULT_CONFIG.retryIntervals.find(
      (interval) => interval >= daysSinceCreated
    ),
  }
}

/**
 * Calculate aging buckets for reporting
 */
export interface AgingBucket {
  name: string
  minDays: number
  maxDays: number
  invoiceCount: number
  totalAmount: number
}

export async function getInvoiceAging(
  tenantId: string
): Promise<AgingBucket[]> {
  const invoices = await prisma.invoice.findMany({
    where: {
      tenantId,
      status: 'UNPAID',
    },
    select: {
      id: true,
      createdAt: true,
      totalCents: true,
    },
  })

  const buckets: AgingBucket[] = [
    { name: 'Current', minDays: 0, maxDays: 30, invoiceCount: 0, totalAmount: 0 },
    {
      name: '31-60 Days',
      minDays: 31,
      maxDays: 60,
      invoiceCount: 0,
      totalAmount: 0,
    },
    {
      name: '61-90 Days',
      minDays: 61,
      maxDays: 90,
      invoiceCount: 0,
      totalAmount: 0,
    },
    {
      name: '90+ Days',
      minDays: 91,
      maxDays: Infinity,
      invoiceCount: 0,
      totalAmount: 0,
    },
  ]

  const now = new Date()

  for (const invoice of invoices) {
    const daysSinceCreated = Math.floor(
      (now.getTime() - invoice.createdAt.getTime()) / (1000 * 60 * 60 * 24)
    )

    const bucket = buckets.find(
      (b) => daysSinceCreated >= b.minDays && daysSinceCreated <= b.maxDays
    )

    if (bucket) {
      bucket.invoiceCount += 1
      bucket.totalAmount += invoice.totalCents
    }
  }

  return buckets
}
