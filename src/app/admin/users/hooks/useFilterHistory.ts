import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { FilterState } from './useFilterState'

export interface FilterHistoryEntry {
  id: string
  filters: FilterState
  timestamp: string // ISO string
}

interface UsageStats {
  totalEntries: number
  searches: Record<string, number>
  roles: Record<string, number>
  statuses: Record<string, number>
}

const STORAGE_KEY = 'user-directory-filter-history'
const MAX_HISTORY = 20

function normalizeFilters(filters: FilterState): string {
  const search = (filters.search || '').trim().toLowerCase()
  const roles = [...(filters.roles || [])].sort().join(',')
  const statuses = [...(filters.statuses || [])].sort().join(',')
  return JSON.stringify({ search, roles, statuses })
}

function relativeTime(iso: string): string {
  const date = new Date(iso)
  const now = new Date()
  const diff = Math.max(0, now.getTime() - date.getTime())
  const m = Math.floor(diff / 60000)
  const h = Math.floor(diff / 3600000)
  const d = Math.floor(diff / 86400000)
  if (m < 1) return 'just now'
  if (m < 60) return `${m}m ago`
  if (h < 24) return `${h}h ago`
  if (d < 7) return `${d}d ago`
  return date.toLocaleDateString()
}

function describeFilters(filters: FilterState): string {
  const parts: string[] = []
  if (filters.search) parts.push(`search: ${filters.search}`)
  if (filters.roles && filters.roles.length) parts.push(`roles: ${filters.roles.join(' | ')}`)
  if (filters.statuses && filters.statuses.length) parts.push(`status: ${filters.statuses.join(' | ')}`)
  return parts.join(' • ') || 'All users'
}

export function useFilterHistory(initialFilters?: FilterState) {
  const [history, setHistory] = useState<FilterHistoryEntry[]>([])
  const lastKeyRef = useRef<string>('')

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) {
        const parsed = JSON.parse(raw) as FilterHistoryEntry[]
        if (Array.isArray(parsed)) {
          setHistory(parsed)
          lastKeyRef.current = parsed[0] ? normalizeFilters(parsed[0].filters) : ''
        }
      }
    } catch (e) {
      console.warn('Failed to load filter history')
    }
  }, [])

  const persist = useCallback((entries: FilterHistoryEntry[]) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(entries))
    } catch (e) {
      console.warn('Failed to persist filter history')
    }
  }, [])

  const addEntry = useCallback((filters: FilterState) => {
    const key = normalizeFilters(filters)
    if (!filters.search && (!filters.roles || filters.roles.length === 0) && (!filters.statuses || filters.statuses.length === 0)) {
      return
    }
    if (key === lastKeyRef.current) return

    const now = new Date().toISOString()
    setHistory(prev => {
      const withoutDuplicate = prev.filter(h => normalizeFilters(h.filters) !== key)
      const next: FilterHistoryEntry[] = [
        { id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`, filters, timestamp: now },
        ...withoutDuplicate
      ].slice(0, MAX_HISTORY)
      persist(next)
      lastKeyRef.current = key
      return next
    })
  }, [persist])

  const clearHistory = useCallback(() => {
    setHistory([])
    persist([])
    lastKeyRef.current = ''
  }, [persist])

  const exportHistory = useCallback(() => {
    const blob = new Blob([JSON.stringify(history, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `filter-history-${new Date().toISOString().slice(0,10)}.json`
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
  }, [history])

  const usageStats = useMemo<UsageStats>(() => {
    const stats: UsageStats = { totalEntries: history.length, searches: {}, roles: {}, statuses: {} }
    for (const h of history) {
      const s = (h.filters.search || '').trim().toLowerCase()
      if (s) stats.searches[s] = (stats.searches[s] || 0) + 1
      for (const r of h.filters.roles || []) stats.roles[r] = (stats.roles[r] || 0) + 1
      for (const st of h.filters.statuses || []) stats.statuses[st] = (stats.statuses[st] || 0) + 1
    }
    return stats
  }, [history])

  const mostUsed = useMemo(() => {
    const counts: Record<string, { count: number; filters: FilterState }> = {}
    for (const h of history) {
      const key = normalizeFilters(h.filters)
      if (!counts[key]) counts[key] = { count: 0, filters: h.filters }
      counts[key].count += 1
    }
    return Object.values(counts)
      .sort((a, b) => b.count - a.count)
      .slice(0, 5)
  }, [history])

  return {
    history,
    addEntry,
    clearHistory,
    exportHistory,
    usageStats,
    mostUsed,
    helpers: {
      normalize: normalizeFilters,
      relativeTime,
      describeFilters
    }
  }
}
