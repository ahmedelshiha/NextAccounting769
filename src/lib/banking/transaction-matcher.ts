import prisma from '@/lib/prisma'
import { logger } from '@/lib/logger'
import Decimal from 'decimal.js'

interface MatchCriteria {
  amountTolerance: number // Tolerance in decimal places (0.01 = 1 cent)
  descriptionSimilarity: number // 0-1, minimum similarity score
  dateWindowDays: number // Days before/after transaction date
}

const DEFAULT_CRITERIA: MatchCriteria = {
  amountTolerance: 0.01, // Exact match by default
  descriptionSimilarity: 0.7, // 70% match required
  dateWindowDays: 3, // Match within 3 days
}

/**
 * Calculate similarity between two strings (0-1)
 * Simple implementation using character comparison
 */
function calculateStringSimilarity(str1: string, str2: string): number {
  const s1 = str1.toLowerCase()
  const s2 = str2.toLowerCase()

  if (s1 === s2) return 1

  const longer = s1.length > s2.length ? s1 : s2
  const shorter = s1.length > s2.length ? s2 : s1

  if (longer.length === 0) return 1

  const editDistance = getEditDistance(longer, shorter)
  return (longer.length - editDistance) / longer.length
}

/**
 * Levenshtein distance for string comparison
 */
function getEditDistance(s1: string, s2: string): number {
  const costs: number[] = []

  for (let i = 0; i <= s1.length; i++) {
    let lastValue = i
    for (let j = 0; j <= s2.length; j++) {
      if (i === 0) {
        costs[j] = j
      } else if (j > 0) {
        let newValue = costs[j - 1]
        if (s1.charAt(i - 1) !== s2.charAt(j - 1)) {
          newValue = Math.min(Math.min(newValue, lastValue), costs[j]) + 1
        }
        costs[j - 1] = lastValue
        lastValue = newValue
      }
    }
    if (i > 0) costs[s2.length] = lastValue
  }

  return costs[s2.length]
}

/**
 * Match bank transactions to invoices
 */
export async function matchTransactionsToInvoices(
  connectionId: string,
  tenantId: string,
  criteria: MatchCriteria = DEFAULT_CRITERIA
): Promise<{
  matched: number
  attempted: number
  errors: string[]
}> {
  const result = { matched: 0, attempted: 0, errors: [] as string[] }

  try {
    // Get unmatched transactions
    const transactions = await prisma.bankingTransaction.findMany({
      where: {
        connectionId,
        tenantId,
        matched: false,
      },
      select: {
        id: true,
        amount: true,
        description: true,
        date: true,
        type: true,
      },
    })

    logger.info(`Attempting to match ${transactions.length} transactions`, {
      connectionId,
      tenantId,
    })

    for (const txn of transactions) {
      result.attempted++

      try {
        // Only match credit transactions (incoming payments)
        if (txn.type !== 'credit') continue

        const txnAmount = new Decimal(txn.amount)
        const txnDate = new Date(txn.date)

        // Find matching invoices
        const dateMin = new Date(txnDate.getTime() - criteria.dateWindowDays * 24 * 60 * 60 * 1000)
        const dateMax = new Date(txnDate.getTime() + criteria.dateWindowDays * 24 * 60 * 60 * 1000)

        const invoices = await prisma.invoice.findMany({
          where: {
            tenantId,
            status: { in: ['ISSUED', 'PARTIAL_PAID'] },
            createdAt: {
              gte: dateMin,
              lte: dateMax,
            },
          },
          select: {
            id: true,
            totalAmount: true,
            description: true,
          },
        })

        // Score and find best match
        let bestMatch: typeof invoices[0] | null = null
        let bestScore = 0

        for (const invoice of invoices) {
          let score = 0

          // Amount match (primary criteria)
          const invoiceAmount = new Decimal(invoice.totalAmount)
          const amountDiff = txnAmount.sub(invoiceAmount).abs()

          if (amountDiff.lte(new Decimal(criteria.amountTolerance))) {
            score += 0.5 // Amount matches exactly
          } else if (amountDiff.lte(new Decimal(criteria.amountTolerance * 2))) {
            score += 0.25 // Close match
          }

          // Description similarity
          const descriptionScore = calculateStringSimilarity(
            txn.description,
            invoice.description || ''
          )

          if (descriptionScore >= criteria.descriptionSimilarity) {
            score += 0.5 * descriptionScore
          }

          if (score > bestScore) {
            bestScore = score
            bestMatch = invoice
          }
        }

        // If we found a good match (score > 0.5), link them
        if (bestMatch && bestScore > 0.5) {
          await prisma.bankingTransaction.update({
            where: { id: txn.id },
            data: {
              matched: true,
              matchedToId: bestMatch.id,
              matchedToType: 'invoice',
            },
          })

          result.matched++

          logger.debug(`Matched transaction to invoice`, {
            transactionId: txn.id,
            invoiceId: bestMatch.id,
            score: bestScore,
          })
        }
      } catch (error) {
        result.errors.push(`Failed to match transaction ${txn.id}: ${String(error)}`)
        logger.error('Transaction matching error', {
          transactionId: txn.id,
          error: String(error),
        })
      }
    }

    logger.info(`Transaction matching complete`, {
      matched: result.matched,
      attempted: result.attempted,
      errors: result.errors.length,
    })

    return result
  } catch (error) {
    result.errors.push(`Matching operation failed: ${String(error)}`)
    logger.error('Transaction matching operation failed', {
      connectionId,
      error: String(error),
    })
    return result
  }
}

/**
 * Find potential duplicate transactions in a connection
 */
export async function findPotentialDuplicates(
  connectionId: string,
  tenantId: string
): Promise<
  Array<{
    id: string
    amount: string
    date: Date
    description: string
    duplicates: string[]
  }>
> {
  const transactions = await prisma.bankingTransaction.findMany({
    where: { connectionId, tenantId },
    select: { id: true, amount: true, date: true, description: true },
    orderBy: { date: 'desc' },
  })

  const duplicates = []

  for (let i = 0; i < transactions.length; i++) {
    const txn1 = transactions[i]

    for (let j = i + 1; j < transactions.length; j++) {
      const txn2 = transactions[j]

      // Check if similar (same amount, description, within 1 day)
      const amountMatch = txn1.amount === txn2.amount
      const descriptionSimilarity = calculateStringSimilarity(
        txn1.description,
        txn2.description
      )
      const dateWindow = Math.abs(
        new Date(txn1.date).getTime() - new Date(txn2.date).getTime()
      ) < 24 * 60 * 60 * 1000 // 1 day

      if (amountMatch && descriptionSimilarity > 0.8 && dateWindow) {
        duplicates.push({
          id: txn1.id,
          amount: txn1.amount,
          date: txn1.date,
          description: txn1.description,
          duplicates: [txn2.id],
        })
      }
    }
  }

  return duplicates
}

/**
 * Get matching statistics for a connection
 */
export async function getMatchingStats(connectionId: string, tenantId: string) {
  const transactions = await prisma.bankingTransaction.groupBy({
    by: ['matched'],
    where: { connectionId, tenantId },
    _count: true,
    _sum: {
      amount: true,
    },
  })

  const invoices = await prisma.invoice.groupBy({
    by: ['status'],
    where: { tenantId },
    _count: true,
    _sum: {
      totalAmount: true,
    },
  })

  return {
    transactions: {
      total: transactions.reduce((sum, group) => sum + group._count, 0),
      matched: transactions.find((g) => g.matched === true)?._count || 0,
      unmatched: transactions.find((g) => g.matched === false)?._count || 0,
      totalAmount: transactions
        .reduce((sum, group) => sum + parseFloat(group._sum?.amount || '0'), 0)
        .toFixed(2),
    },
    invoices: {
      total: invoices.reduce((sum, group) => sum + group._count, 0),
      totalAmount: invoices
        .reduce((sum, group) => sum + parseFloat(group._sum?.totalAmount || '0'), 0)
        .toFixed(2),
    },
  }
}
