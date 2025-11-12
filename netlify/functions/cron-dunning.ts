import { Handler } from '@netlify/functions'
import prisma from '@/lib/prisma'
import { processDunning } from '@/lib/payments/dunning'
import { logger } from '@/lib/logger'

/**
 * Cron job for processing dunning (payment retry) sequences
 * Runs every 6 hours to check for invoices that need retry attempts
 */
export const handler: Handler = async (event) => {
  // Verify cron secret for security
  const cronSecret = event.headers['x-nf-cron'] || event.headers['x-cron-secret']
  const expectedSecret = process.env.CRON_DUNNING_SECRET

  if (expectedSecret && cronSecret !== expectedSecret) {
    return {
      statusCode: 401,
      body: JSON.stringify({ error: 'Unauthorized' }),
    }
  }

  const startTime = Date.now()
  const stats = {
    totalTenants: 0,
    totalProcessed: 0,
    totalRetried: 0,
    totalEscalated: 0,
    totalFailed: 0,
    errors: 0,
  }

  try {
    // Get all tenants
    const tenants = await prisma.tenant.findMany({
      select: { id: true, name: true },
      where: { status: 'ACTIVE' },
    })

    logger.info('Starting dunning process', {
      tenantCount: tenants.length,
    })

    // Process dunning for each tenant
    for (const tenant of tenants) {
      try {
        const result = await processDunning(tenant.id)

        stats.totalTenants += 1
        stats.totalProcessed += result.processed
        stats.totalRetried += result.retried
        stats.totalEscalated += result.escalated
        stats.totalFailed += result.failed

        logger.info('Dunning processed for tenant', {
          tenantId: tenant.id,
          tenantName: tenant.name,
          ...result,
        })
      } catch (error) {
        stats.errors += 1
        logger.error('Error processing dunning for tenant', {
          tenantId: tenant.id,
          error: String(error),
        })
      }
    }

    const duration = Date.now() - startTime

    logger.info('Dunning process completed', {
      ...stats,
      durationMs: duration,
    })

    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        ...stats,
        durationMs: duration,
      }),
    }
  } catch (error) {
    logger.error('Dunning cron job failed', {
      error: String(error),
    })

    return {
      statusCode: 500,
      body: JSON.stringify({
        error: 'Dunning process failed',
        details: String(error),
      }),
    }
  }
}
