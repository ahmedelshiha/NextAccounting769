import prisma from './prisma'

const DEFAULT_PROVIDER = process.env.EXCHANGE_API_PROVIDER || 'exchangerate.host'
const BASE_CURRENCY = process.env.EXCHANGE_BASE_CURRENCY || 'USD'
const TTL_SECONDS = Number(process.env.EXCHANGE_RATE_TTL_SECONDS || '86400')

export async function fetchRates(targets: string[], base = BASE_CURRENCY): Promise<{ success: boolean; updated?: Array<{ target: string; rate: number; fetchedAt: string }>; error?: string } | []> {
  if (!targets || targets.length === 0) return []
  const provider = DEFAULT_PROVIDER
  // Use exchangerate.host by default
  try {
    if (provider === 'exchangerate.host') {
      // Build symbols param
      const symbols = targets.join(',')
      const url = `https://api.exchangerate.host/latest?base=${encodeURIComponent(base)}&symbols=${encodeURIComponent(symbols)}`
      const res = await fetch(url)
      if (!res.ok) throw new Error(`Failed to fetch rates: ${res.status}`)
      const json = await res.json()
      const rates: { target: string; rate: number }[] = []
      for (const t of targets) {
        const r = json.rates?.[t]
        if (typeof r === 'number') rates.push({ target: t, rate: r })
      }

      const now = new Date()
      const updated: { target: string; rate: number; fetchedAt: string }[] = []

      for (const r of rates) {
        const existing = await prisma.exchangeRate.findFirst({ where: { base, target: r.target } })
        if (existing) {
          await prisma.exchangeRate.update({ where: { id: existing.id }, data: { rate: r.rate, source: 'exchangerate.host', fetchedAt: now, ttlSeconds: TTL_SECONDS } })
        } else {
          await prisma.exchangeRate.create({ data: { base, target: r.target, rate: r.rate, source: 'exchangerate.host', fetchedAt: now, ttlSeconds: TTL_SECONDS } })
        }
        updated.push({ target: r.target, rate: r.rate, fetchedAt: now.toISOString() })
      }

      return { success: true, updated }
    }

    return { success: false, updated: [] }
  } catch (e) {
    console.error('fetchRates error', e)
    return { success: false, error: String(e) }
  }
}

export function convertCents(amountCents: number, rate: number, decimals = 2): number {
  // amountCents is in base currency cents; convert to target currency cents
  const amount = amountCents / 100
  const converted = amount * rate
  const factor = Math.pow(10, decimals)
  const rounded = Math.round(converted * factor) / factor
  return Math.round(rounded * 100)
}
