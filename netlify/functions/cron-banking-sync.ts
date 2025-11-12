import { Handler, HandlerEvent } from '@netlify/functions'
import prisma from '@/lib/prisma'
import { logger } from '@/lib/logger'
import { BankingProviderFactory } from '@/lib/banking/adapters'

interface SyncStats {
  connectionsProcessed: number
  successCount: number
  failureCount: number
  transactionsCreated: number
  duplicatesSkipped: number
  totalDuration: number
  errors: Array<{
    connectionId: string
    bankName: string
    error: string
  }>
}

const handler: Handler = async (event: HandlerEvent) => {
  const startTime = Date.now()

  // Verify cron secret
  const cronSecret = process.env.CRON_BANKING_SYNC_SECRET
  const authHeader = event.headers['x-netlify-cron'] || event.headers['authorization']

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    logger.warn('Unauthorized cron invocation', {
      path: event.path,
      timestamp: new Date().toISOString(),
    })
    return {
      statusCode: 401,
      body: JSON.stringify({ error: 'Unauthorized' }),
    }
  }

  const stats: SyncStats = {
    connectionsProcessed: 0,
    successCount: 0,
    failureCount: 0,
    transactionsCreated: 0,
    duplicatesSkipped: 0,
    totalDuration: 0,
    errors: [],
  }

  try {
    // Find all active connections that need syncing
    const now = new Date()
    const connections = await prisma.bankingConnection.findMany({
      where: {
        status: 'ACTIVE',
        sessionToken: { not: null },
        OR: [
          { lastSyncAt: null }, // Never synced
          // Based on syncFrequency, determine if sync is needed
          {
            syncFrequency: 'DAILY',
            lastSyncAt: {
              lt: new Date(now.getTime() - 24 * 60 * 60 * 1000),
            },
          },
          {
            syncFrequency: 'WEEKLY',
            lastSyncAt: {
              lt: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
            },
          },
          {
            syncFrequency: 'MONTHLY',
            lastSyncAt: {
              lt: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000),
            },
          },
        ],
      },
      select: {
        id: true,
        tenantId: true,
        provider: true,
        accountNumber: true,
        bankName: true,
        sessionToken: true,
        status: true,
      },
    })

    logger.info(`Banking sync cron started: processing ${connections.length} connections`)

    // Process each connection
    for (const connection of connections) {
      const connectionStartTime = Date.now()

      try {
        const factory = new BankingProviderFactory()
        const provider = factory.getProvider(connection.provider)

        // Fetch transactions
        const endDate = new Date()
        const startDate = new Date(endDate.getTime() - 90 * 24 * 60 * 60 * 1000) // Last 90 days

        const transactions = await provider.getTransactions(
          connection.sessionToken!,
          connection.accountNumber,
          startDate,
          endDate
        )

        let createdCount = 0
        let duplicateCount = 0

        // Save transactions
        for (const txn of transactions) {
          try {
            // Check for duplicates
            const existing = await prisma.bankingTransaction.findFirst({
              where: {
                connectionId: connection.id,
                externalId: txn.id,
              },
            })

            if (existing) {
              duplicateCount++
              continue
            }

            // Create transaction
            await prisma.bankingTransaction.create({
              data: {
                connectionId: connection.id,
                tenantId: connection.tenantId,
                externalId: txn.id,
                date: txn.date,
                description: txn.description,
                amount: txn.amount.toString(),
                currency: txn.currency,
                type: txn.type,
                balance: txn.balance ? txn.balance.toString() : null,
                reference: txn.reference || null,
                tags: txn.tags || [],
                matched: false,
              },
            })

            createdCount++
          } catch (error) {
            logger.error('Failed to create transaction', {
              connectionId: connection.id,
              error: String(error),
            })
          }
        }

        // Update connection sync status
        await prisma.bankingConnection.update({
          where: { id: connection.id },
          data: {
            lastSyncAt: endDate,
            lastSyncError: null,
            status: 'ACTIVE',
          },
        })

        stats.successCount++
        stats.transactionsCreated += createdCount
        stats.duplicatesSkipped += duplicateCount

        logger.info(`Synced connection ${connection.id}`, {
          bankName: connection.bankName,
          createdCount,
          duplicateCount,
          duration: Date.now() - connectionStartTime,
        })
      } catch (error) {
        stats.failureCount++
        const errorMsg = String(error)

        // Update connection error status
        await prisma.bankingConnection.update({
          where: { id: connection.id },
          data: {
            lastSyncError: errorMsg,
            status: 'ERROR',
          },
        }).catch(() => {})

        stats.errors.push({
          connectionId: connection.id,
          bankName: connection.bankName,
          error: errorMsg,
        })

        logger.error(`Failed to sync connection ${connection.id}`, {
          bankName: connection.bankName,
          error: errorMsg,
          duration: Date.now() - connectionStartTime,
        })
      }

      stats.connectionsProcessed++
    }

    stats.totalDuration = Date.now() - startTime

    logger.info('Banking sync cron completed', stats)

    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        message: 'Banking sync completed',
        stats,
      }),
    }
  } catch (error) {
    stats.totalDuration = Date.now() - startTime

    const errorMsg = String(error)
    logger.error('Banking sync cron failed', {
      error: errorMsg,
      duration: stats.totalDuration,
    })

    return {
      statusCode: 500,
      body: JSON.stringify({
        success: false,
        error: 'Banking sync failed',
        details: errorMsg,
        stats,
      }),
    }
  }
}

export { handler }
