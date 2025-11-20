/**
 * Filter Analytics Service for Phase 15 Implementation
 * Tracks and analyzes filter usage patterns, adoption metrics, and engagement
 */

import prisma from '@/lib/prisma'

export interface FilterUsageEvent {
  userId: string
  tenantId: string
  filterType: string // e.g., 'search', 'role', 'status', 'department'
  filterValue?: string
  resultCount?: number
  duration?: number
  timestamp: Date
  metadata?: Record<string, any>
}

export interface FilterUsageStats {
  filterType: string
  usageCount: number
  uniqueUsers: number
  avgDuration: number
  mostCommonValue?: string
  trend7Days: number[]
}

export interface PresetAdoptionMetrics {
  totalPresets: number
  usedPresets: number
  unusedPresets: number
  adoptionRate: number // Percentage
  averageUsagePerPreset: number
  topPresets: Array<{
    id: string
    name: string
    usageCount: number
    lastUsed: Date
  }>
}

export interface FilterCombinationMetrics {
  combination: string // e.g., "role+status"
  frequency: number
  usageCount: number
  avgResultCount: number
}

export interface UserEngagementMetrics {
  role: string
  filterUsageCount: number
  averageFiltersPerSession: number
  uniqueFiltersUsed: number
  departmentPreference?: string
}

/**
 * Service for collecting and analyzing filter usage metrics
 */
export class FilterAnalyticsService {
  /**
   * Record a filter usage event
   */
  static async recordFilterEvent(event: Omit<FilterUsageEvent, 'timestamp'>): Promise<void> {
    try {
      // In production, store to database for historical analysis
      // For now, we'll use in-memory tracking with periodic persistence
      if (typeof window === 'undefined') {
        // Server-side: Could store to database
        // await prisma.filterUsageLog.create({ data: { ...event, timestamp: new Date() } })
      } else {
        // Client-side: Store in localStorage
        this.recordClientEvent(event)
      }
    } catch (error) {
      console.warn('Failed to record filter event:', error)
    }
  }

  /**
   * Get filter usage statistics for a time period
   */
  static async getFilterUsageStats(
    tenantId: string,
    startDate: Date,
    endDate: Date
  ): Promise<FilterUsageStats[]> {
    const filterStats: FilterUsageStats[] = []

    // In production, query from database
    // For MVP, generate from client-side events
    const events = this.getClientEvents(tenantId)

    // Group by filter type
    const grouped = new Map<string, FilterUsageEvent[]>()
    events.forEach(event => {
      if (!grouped.has(event.filterType)) {
        grouped.set(event.filterType, [])
      }
      grouped.get(event.filterType)!.push(event)
    })

    // Calculate statistics
    grouped.forEach((events, filterType) => {
      const avgDuration = events.reduce((sum, e) => sum + (e.duration ?? 0), 0) / events.length
      const uniqueUsers = new Set(events.map(e => e.userId)).size

      // Find most common value
      const valueCounts = new Map<string, number>()
      events.forEach(e => {
        if (e.filterValue) {
          valueCounts.set(e.filterValue, (valueCounts.get(e.filterValue) ?? 0) + 1)
        }
      })
      const mostCommonValue = Array.from(valueCounts.entries())
        .sort((a, b) => b[1] - a[1])[0]?.[0]

      filterStats.push({
        filterType,
        usageCount: events.length,
        uniqueUsers,
        avgDuration,
        mostCommonValue,
        trend7Days: this.calculateTrend(events, 7)
      })
    })

    return filterStats.sort((a, b) => b.usageCount - a.usageCount)
  }

  /**
   * Get filter combinations (filters used together)
   */
  static async getFilterCombinations(
    tenantId: string,
    limit = 10
  ): Promise<FilterCombinationMetrics[]> {
    const events = this.getClientEvents(tenantId)
    
    // Group events by session (crude session detection: same user within 30 min)
    const sessions = this.groupIntoSessions(events, 30 * 60 * 1000)
    
    const combinations = new Map<string, FilterCombinationMetrics>()

    sessions.forEach(sessionEvents => {
      const filterTypes = new Set(sessionEvents.map(e => e.filterType))
      if (filterTypes.size > 1) {
        const key = Array.from(filterTypes).sort().join('+')
        
        if (!combinations.has(key)) {
          combinations.set(key, {
            combination: key,
            frequency: 0,
            usageCount: 0,
            avgResultCount: 0
          })
        }

        const metric = combinations.get(key)!
        metric.frequency++
        metric.usageCount += sessionEvents.length
        metric.avgResultCount += sessionEvents.reduce((sum, e) => sum + (e.resultCount ?? 0), 0)
      }
    })

    return Array.from(combinations.values())
      .map(m => ({
        ...m,
        avgResultCount: m.avgResultCount / m.frequency
      }))
      .sort((a, b) => b.frequency - a.frequency)
      .slice(0, limit)
  }

  /**
   * Get preset adoption metrics
   */
  static async getPresetAdoptionMetrics(
    tenantId: string
  ): Promise<PresetAdoptionMetrics> {
    try {
      // Query presets from database
      const presets = await prisma.filterPreset.findMany({
        where: { tenantId }
      })

      const totalPresets = presets.length
      const usedPresets = presets.filter(p => p.usageCount > 0).length
      const adoptionRate = totalPresets > 0 ? (usedPresets / totalPresets) * 100 : 0

      // Calculate average usage (from usageCount field if available)
      let totalUsage = 0
      presets.forEach(p => {
        // Assuming usageCount exists on FilterPreset model
        totalUsage += (p as any).usageCount ?? 0
      })
      const averageUsagePerPreset = totalPresets > 0 ? totalUsage / totalPresets : 0

      // Get top presets
      const topPresets = presets
        .sort((a, b) => ((b as any).usageCount ?? 0) - ((a as any).usageCount ?? 0))
        .slice(0, 5)
        .map(p => ({
          id: p.id,
          name: p.name,
          usageCount: (p as any).usageCount ?? 0,
          lastUsed: (p as any).lastUsedAt ?? p.updatedAt
        }))

      return {
        totalPresets,
        usedPresets,
        unusedPresets: totalPresets - usedPresets,
        adoptionRate,
        averageUsagePerPreset,
        topPresets
      }
    } catch (error) {
      console.warn('Failed to get preset adoption metrics:', error)
      return {
        totalPresets: 0,
        usedPresets: 0,
        unusedPresets: 0,
        adoptionRate: 0,
        averageUsagePerPreset: 0,
        topPresets: []
      }
    }
  }

  /**
   * Get user engagement metrics by role
   */
  static async getUserEngagementMetrics(
    tenantId: string
  ): Promise<UserEngagementMetrics[]> {
    const events = this.getClientEvents(tenantId)
    
    // Get user roles from context
    const users = await prisma.user.findMany({
      where: { tenantId },
      select: { id: true, role: true, department: true }
    })

    const userMap = new Map(users.map(u => [u.id, u]))
    const grouped = new Map<string, FilterUsageEvent[]>()

    events.forEach(event => {
      const role = userMap.get(event.userId)?.role ?? 'UNKNOWN'
      if (!grouped.has(role)) {
        grouped.set(role, [])
      }
      grouped.get(role)!.push(event)
    })

    const metrics: UserEngagementMetrics[] = []

    grouped.forEach((roleEvents, role) => {
      const uniqueFilters = new Set(roleEvents.map(e => e.filterType)).size
      const avgFiltersPerSession = roleEvents.length / new Set(roleEvents.map(e => e.userId)).size

      metrics.push({
        role,
        filterUsageCount: roleEvents.length,
        averageFiltersPerSession: avgFiltersPerSession,
        uniqueFiltersUsed: uniqueFilters,
        departmentPreference: this.getMostCommonValue(
          roleEvents.map(e => userMap.get(e.userId)?.department).filter(Boolean) as string[]
        )
      })
    })

    return metrics.sort((a, b) => b.filterUsageCount - a.filterUsageCount)
  }

  /**
   * Get filter performance metrics
   */
  static async getFilterPerformanceMetrics(
    tenantId: string,
    timeWindowMinutes = 60
  ): Promise<{
    averageFilterTime: number
    p95FilterTime: number
    p99FilterTime: number
    slowFilterCount: number
    slowThreshold: number
  }> {
    const events = this.getClientEvents(tenantId)
    const recentEvents = events.filter(e => {
      const age = Date.now() - e.timestamp.getTime()
      return age < timeWindowMinutes * 60 * 1000
    })

    const durations = recentEvents.map(e => e.duration ?? 0).sort((a, b) => a - b)

    if (durations.length === 0) {
      return {
        averageFilterTime: 0,
        p95FilterTime: 0,
        p99FilterTime: 0,
        slowFilterCount: 0,
        slowThreshold: 1000
      }
    }

    const slowThreshold = 1000 // milliseconds
    const slowCount = durations.filter(d => d > slowThreshold).length

    return {
      averageFilterTime: durations.reduce((a, b) => a + b, 0) / durations.length,
      p95FilterTime: durations[Math.floor(durations.length * 0.95)],
      p99FilterTime: durations[Math.floor(durations.length * 0.99)],
      slowFilterCount: slowCount,
      slowThreshold
    }
  }

  // Private helper methods

  /**
   * Record event in client localStorage
   */
  private static recordClientEvent(event: Omit<FilterUsageEvent, 'timestamp'>): void {
    if (typeof window === 'undefined') return

    try {
      const key = `analytics:events:${event.tenantId}`
      const events = JSON.parse(localStorage.getItem(key) || '[]')
      
      events.push({ ...event, timestamp: new Date().toISOString() })
      
      // Keep only last 500 events
      if (events.length > 500) {
        events.shift()
      }
      
      localStorage.setItem(key, JSON.stringify(events))
    } catch (e) {
      console.warn('Failed to record client event:', e)
    }
  }

  /**
   * Get events from localStorage
   */
  private static getClientEvents(tenantId: string): FilterUsageEvent[] {
    if (typeof window === 'undefined') return []

    try {
      const key = `analytics:events:${tenantId}`
      const data = JSON.parse(localStorage.getItem(key) || '[]')
      return data.map((e: any) => ({
        ...e,
        timestamp: new Date(e.timestamp)
      }))
    } catch (e) {
      return []
    }
  }

  /**
   * Calculate 7-day trend
   */
  private static calculateTrend(events: FilterUsageEvent[], days: number): number[] {
    const trend: number[] = []
    const now = Date.now()
    
    for (let i = 0; i < days; i++) {
      const dayStart = now - (days - i) * 24 * 60 * 60 * 1000
      const dayEnd = dayStart + 24 * 60 * 60 * 1000
      
      const count = events.filter(e => {
        const ts = e.timestamp.getTime()
        return ts >= dayStart && ts < dayEnd
      }).length
      
      trend.push(count)
    }
    
    return trend
  }

  /**
   * Group events into sessions by user and time
   */
  private static groupIntoSessions(
    events: FilterUsageEvent[],
    sessionTimeout: number
  ): FilterUsageEvent[][] {
    const sorted = events.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime())
    const sessions: FilterUsageEvent[][] = []
    let currentSession: FilterUsageEvent[] = []
    let lastTimestamp = 0

    sorted.forEach(event => {
      if (currentSession.length === 0 || 
          event.timestamp.getTime() - lastTimestamp > sessionTimeout) {
        if (currentSession.length > 0) {
          sessions.push(currentSession)
        }
        currentSession = [event]
      } else {
        currentSession.push(event)
      }
      lastTimestamp = event.timestamp.getTime()
    })

    if (currentSession.length > 0) {
      sessions.push(currentSession)
    }

    return sessions
  }

  /**
   * Get most common value from array
   */
  private static getMostCommonValue(values: string[]): string | undefined {
    if (values.length === 0) return undefined

    const counts = new Map<string, number>()
    values.forEach(v => counts.set(v, (counts.get(v) ?? 0) + 1))

    return Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1])[0]?.[0]
  }
}
