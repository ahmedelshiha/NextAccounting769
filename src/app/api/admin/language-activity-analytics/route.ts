import { requireTenantContext } from '@/lib/tenant-utils'
import { hasPermission, PERMISSIONS } from '@/lib/permissions'
import prisma from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export interface LanguageActivityData {
  timestamp: string
  language: string
  sessionCount: number
  uniqueUsers: number
  averageSessionDuration: number
}

export interface HeatmapPeriod {
  period: string
  data: LanguageActivityData[]
}

export interface LanguageActivityResponse {
  success: boolean
  periods: HeatmapPeriod[]
  dateRange: {
    start: string
    end: string
  }
  summary: {
    totalSessions: number
    totalUsers: number
    languagesTracked: number
  }
}

function detectDeviceFromUA(ua?: string | null): string {
  if (!ua) return 'unknown'
  const u = ua.toLowerCase()
  if (/ipad|tablet/.test(u)) return 'tablet'
  if (/mobi|android|iphone/.test(u)) return 'mobile'
  return 'desktop'
}

import { lookupCountryISO } from '@/lib/country-map'

function normalizeCountryName(name: string): string | null {
  if (!name) return null
  const n = String(name).trim()
  const lower = n.toLowerCase()
  // If two-letter code, return as-is
  if (/^[a-z]{2}$/.test(lower)) return lower

  const iso = lookupCountryISO(n)
  if (iso) return iso

  // fallback: remove punctuation and try again
  const clean = lower.replace(/[^a-z\s]/g, '').replace(/\s+/g, ' ').trim()
  return lookupCountryISO(clean)
}

function regionFromProfile(profile: any): string {
  try {
    const meta = profile.metadata || {}
    if (meta && typeof meta === 'object') {
      if (meta.country) {
        const normalized = normalizeCountryName(String(meta.country))
        if (normalized) return normalized
        const c = String(meta.country).trim()
        if (c.length === 2) return c.toLowerCase()
        // fallback to stringified country
        return c.toLowerCase().replace(/\s+/g, '_')
      }
    }
    if (profile.timezone && typeof profile.timezone === 'string') {
      const parts = profile.timezone.split('/')
      if (parts.length > 0) return parts[0].toLowerCase()
    }
  } catch (e) {
    // ignore
  }
  return 'unknown'
}

async function handler(request: Request) {
  try {
    const ctx = requireTenantContext()

    if (!ctx.userId || !hasPermission(ctx.role, PERMISSIONS.ANALYTICS_VIEW)) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const tenantId = ctx.tenantId
    if (!tenantId) {
      return Response.json({ error: 'Tenant context required' }, { status: 400 })
    }

    const url = new URL(request.url)
    const daysParam = url.searchParams.get('days') || '7'
    const days = Math.min(Math.max(parseInt(daysParam, 10), 1), 90)

    // Optional filters
    const languagesParam = url.searchParams.get('languages')
    const languagesFilter = languagesParam ? languagesParam.split(',').map(s => s.trim()).filter(Boolean) : null
    const deviceFilter = (url.searchParams.get('device') || 'all').toLowerCase()
    const regionFilter = (url.searchParams.get('region') || 'all').toLowerCase()

    const endDate = new Date()
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)

    // Fetch audit logs for language change events in range (these provide activity)
    const auditLogs = await prisma.auditLog.findMany({
      where: {
        tenantId,
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
        action: 'user_language_change',
      },
      select: {
        createdAt: true,
        metadata: true,
        userAgent: true,
        userId: true,
      },
    })

    const userIds = Array.from(new Set(auditLogs.map(a => a.userId).filter((id): id is string => Boolean(id))))

    const profiles = await prisma.userProfile.findMany({
      where: {
        userId: { in: userIds },
      },
      select: {
        preferredLanguage: true,
        user: { select: { id: true, createdAt: true } },
        timezone: true,
        metadata: true,
      },
    })

    const profileByUserId = new Map<string, any>()
    profiles.forEach(p => profileByUserId.set(p.user.id, p))

    const heatmapData = new Map<string, Map<string, number>>()
    const usersByLanguage = new Map<string, Set<string>>()
    const uniqueUsers = new Set<string>()
    const availableDevices = new Set<string>()
    const availableRegions = new Set<string>()
    const availableLanguages = new Set<string>()

    function addEntry(ts: Date, lang: string, userId?: string | null) {
      const hour = new Date(ts)
      hour.setMinutes(0, 0, 0)
      const hourKey = hour.toISOString()

      if (!heatmapData.has(hourKey)) heatmapData.set(hourKey, new Map())
      const langMap = heatmapData.get(hourKey)!
      langMap.set(lang, (langMap.get(lang) || 0) + 1)

      if (userId) {
        uniqueUsers.add(userId)
        if (!usersByLanguage.has(lang)) usersByLanguage.set(lang, new Set())
        usersByLanguage.get(lang)!.add(userId)
      }

      availableLanguages.add(lang)
    }

    // Process audit logs
    for (const a of auditLogs) {
      const metaObj: any = a.metadata as any
      const ua = (a.userAgent as any) || (metaObj && metaObj.userAgent) || null
      const device = detectDeviceFromUA(ua)
      availableDevices.add(device)

      let lang: string | null = null
      try {
        if (metaObj && typeof metaObj === 'object') {
          if (metaObj.language) lang = String(metaObj.language)
          else if (metaObj.to) lang = String(metaObj.to)
          else if (metaObj.preferredLanguage) lang = String(metaObj.preferredLanguage)
        }
      } catch (e) {
        lang = null
      }

      const profile = a.userId ? profileByUserId.get(a.userId) : null
      if (!lang && profile) lang = (profile.preferredLanguage as any) || null
      if (!lang) lang = 'en'

      if (languagesFilter && !languagesFilter.includes(lang)) continue
      if (deviceFilter !== 'all' && device !== deviceFilter) continue

      const region = profile ? regionFromProfile(profile) : 'unknown'
      availableRegions.add(region)
      if (regionFilter !== 'all' && region !== regionFilter) continue

      addEntry(new Date(a.createdAt as any), lang, a.userId || undefined)
    }

    // Additionally include snapshot of current user language preferences
    const userLanguagePreferences = await prisma.userProfile.findMany({
      where: { user: { tenantId } },
      select: {
        preferredLanguage: true,
        user: { select: { id: true, createdAt: true } },
        timezone: true,
        metadata: true,
      },
    })

    for (const profile of userLanguagePreferences) {
      const lang = profile.preferredLanguage || 'en'
      if (languagesFilter && !languagesFilter.includes(lang)) continue

      // device unknown for snapshot entries
      if (deviceFilter !== 'all' && deviceFilter !== 'unknown') continue

      const region = regionFromProfile(profile)
      availableRegions.add(region)
      if (regionFilter !== 'all' && region !== regionFilter) continue

      const hour = new Date(profile.user.createdAt)
      addEntry(hour, lang, profile.user.id)
    }

    const periods: HeatmapPeriod[] = []
    const hourlyData: LanguageActivityData[] = []

    heatmapData.forEach((languages, timestamp) => {
      languages.forEach((count, lang) => {
        hourlyData.push({
          timestamp,
          language: lang,
          sessionCount: count,
          uniqueUsers: usersByLanguage.get(lang)?.size || 0,
          averageSessionDuration: 45,
        })
      })
    })

    hourlyData.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())

    if (hourlyData.length > 0) {
      periods.push({
        period: `Last ${days} days (hourly)`,
        data: hourlyData,
      })
    }

    const totalSessions = hourlyData.reduce((s, d) => s + d.sessionCount, 0)
    const totalUsers = uniqueUsers.size
    const languagesTracked = availableLanguages.size

    const response: LanguageActivityResponse & { meta?: any } = {
      success: true,
      periods,
      dateRange: {
        start: startDate.toISOString(),
        end: endDate.toISOString(),
      },
      summary: {
        totalSessions,
        totalUsers,
        languagesTracked,
      },
      meta: {
        availableDevices: Array.from(availableDevices),
        availableRegions: Array.from(availableRegions),
        availableLanguages: Array.from(availableLanguages),
      },
    }

    return Response.json({ success: true, data: response }, { status: 200 })
  } catch (error: any) {
    console.error('Failed to fetch language activity analytics:', error)
    return Response.json(
      { error: error.message || 'Failed to fetch analytics' },
      { status: 500 }
    )
  }
}

export const GET = handler
