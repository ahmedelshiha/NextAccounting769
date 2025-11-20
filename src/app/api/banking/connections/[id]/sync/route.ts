import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { logAuditSafe } from '@/lib/observability-helpers'
import { withTenantContext } from '@/lib/api-wrapper'
import { requireTenantContext } from '@/lib/tenant-utils'
import { createBankingProvider, BankTransaction } from '@/lib/banking/adapters'

export const POST = withTenantContext(async (
  request: NextRequest,
  { params }: { params: { id: string } }
) => {
  try {
    const ctx = requireTenantContext()

    if (!ctx?.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const tenantId = ctx.tenantId
    if (!tenantId) {
      return NextResponse.json({ error: 'Tenant context required' }, { status: 400 })
    }

    const { id } = params

    // Fetch connection
    const connection = await prisma.bankingConnection.findFirst({
      where: { id, tenantId },
    })

    if (!connection) {
      return NextResponse.json({ error: 'Connection not found' }, { status: 404 })
    }

    if (!connection.sessionToken) {
      return NextResponse.json(
        { error: 'Connection not authenticated. Please re-authenticate with your bank.' },
        { status: 400 }
      )
    }

    // Get provider and sync transactions
    const provider = createBankingProvider(connection.provider)

    let transactionsFromBank: BankTransaction[] = []
    let syncError: string | null = null

    try {
      // Calculate date range (last 90 days by default, or since last sync)
      const endDate = new Date()
      const startDate = connection.lastSyncAt
        ? new Date(connection.lastSyncAt.getTime() - 7 * 24 * 60 * 60 * 1000) // Go back 7 days from last sync
        : new Date(endDate.getTime() - 90 * 24 * 60 * 60 * 1000) // Last 90 days if never synced

      // Fetch transactions from provider
      transactionsFromBank = await provider.getTransactions(
        connection.sessionToken,
        connection.accountNumber,
        startDate,
        endDate
      )
    } catch (error) {
      syncError = String(error)
      console.error('Failed to fetch transactions from provider:', error)
    }

    // Process transactions
    let successCount = 0
    let duplicateCount = 0
    let errorCount = 0

    for (const txn of transactionsFromBank) {
      try {
        // Check if transaction already exists (using externalId for deduplication)
        const existingTxn = await prisma.bankingTransaction.findFirst({
          where: {
            connectionId: id,
            externalId: txn.id,
          },
        })

        if (existingTxn) {
          duplicateCount++
          continue
        }

        // Create transaction
        await prisma.bankingTransaction.create({
          data: {
            connectionId: id,
            tenantId,
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

        successCount++
      } catch (error) {
        errorCount++
        console.error('Failed to create transaction:', error)
      }
    }

    // Update connection sync status
    await prisma.bankingConnection.update({
      where: { id },
      data: {
        lastSyncAt: new Date(),
        lastSyncError: syncError || null,
        status: syncError ? 'ERROR' : 'ACTIVE',
      },
    })

    await logAuditSafe({
      action: 'banking:sync_transactions',
      details: {
        connectionId: id,
        successCount,
        duplicateCount,
        errorCount,
        syncError,
      },
    }).catch(() => {})

    return NextResponse.json(
      {
        success: true,
        message: 'Transaction sync completed',
        stats: {
          successCount,
          duplicateCount,
          errorCount,
          totalProcessed: successCount + duplicateCount + errorCount,
        },
        syncError: syncError || null,
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Banking sync error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
})
