'use client'

import React, { useEffect, useState, useMemo, useCallback } from 'react'
import { useLocalizationContext } from '../LocalizationProvider'
import { toast } from 'sonner'
import { Activity, TrendingUp, Download } from 'lucide-react'
import { useRouter } from 'next/navigation'
// Local copy of response type to avoid importing server route types in client component
type LanguageActivityData = {
  timestamp: string
  language: string
  sessionCount: number
  uniqueUsers: number
  averageSessionDuration: number
}

type HeatmapPeriod = {
  period: string
  data: LanguageActivityData[]
}

type LanguageActivityResponse = {
  success: boolean
  periods: HeatmapPeriod[]
  dateRange: { start: string; end: string }
  summary: { totalSessions: number; totalUsers: number; languagesTracked: number }
  meta?: any
}
import { debounce } from '../utils/performance'

export const LanguageActivityHeatmap: React.FC = () => {
  const { languages } = useLocalizationContext()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<LanguageActivityResponse | null>(null)
  const [selectedDays, setSelectedDays] = useState(7)
  const [hoveredCell, setHoveredCell] = useState<{ timestamp: string; language: string } | null>(null)

  // Filters
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>([])
  const [selectedDevice, setSelectedDevice] = useState<string>('all')
  const [selectedRegion, setSelectedRegion] = useState<string>('all')

  // Read initial filters from URL on mount
  useEffect(() => {
    try {
      const url = new URL(window.location.href)
      const days = parseInt(url.searchParams.get('days') || '7', 10)
      setSelectedDays([7, 14, 30].includes(days) ? days : 7)

      const langs = url.searchParams.get('languages')
      if (langs) setSelectedLanguages(langs.split(',').filter(Boolean))

      const device = url.searchParams.get('device')
      if (device) setSelectedDevice(device)

      const region = url.searchParams.get('region')
      if (region) setSelectedRegion(region)
    } catch (e) {
      // ignore
    }
  }, [])

  // Debounced loader to avoid rapid requests
   
  const debouncedLoad = useCallback(
    debounce(() => {
      loadActivityData()
    }, 300),
    [selectedDays, selectedLanguages, selectedDevice, selectedRegion]
  )

  useEffect(() => {
    debouncedLoad()
    // Update URL (replace to avoid history spam)
    try {
      const params = new URLSearchParams(window.location.search)
      params.set('tab', 'heatmap')
      params.set('days', String(selectedDays))
      if (selectedLanguages.length) params.set('languages', selectedLanguages.join(','))
      else params.delete('languages')
      if (selectedDevice !== 'all') params.set('device', selectedDevice)
      else params.delete('device')
      if (selectedRegion !== 'all') params.set('region', selectedRegion)
      else params.delete('region')

      const href = `${window.location.pathname}?${params.toString()}`
      router.replace(href)
    } catch (e) {
      // ignore
    }
  }, [selectedDays, selectedLanguages, selectedDevice, selectedRegion, debouncedLoad, router])

  async function loadActivityData() {
    try {
      setLoading(true)
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 10000)

      const params = new URLSearchParams()
      params.set('days', String(selectedDays))
      if (selectedLanguages.length) params.set('languages', selectedLanguages.join(','))
      if (selectedDevice !== 'all') params.set('device', selectedDevice)
      if (selectedRegion !== 'all') params.set('region', selectedRegion)

      const r = await fetch(`/api/admin/language-activity-analytics?${params.toString()}`, {
        signal: controller.signal,
      })
      clearTimeout(timeoutId)

      if (r.ok) {
        const d = await r.json()
        setData(d.data)
      } else {
        toast.error('Failed to load activity data')
      }
    } catch (e: any) {
      const message = e?.name === 'AbortError' ? 'Request timed out' : e?.message || 'Failed to load activity data'
      toast.error(message)
    } finally {
      setLoading(false)
    }
  }

  const period = data?.periods?.[0] ?? null

  const languageList = useMemo(() => {
    if (!period || !period.data) return []
    const list = Array.from(new Set(period.data.map(d => d.language))).sort()
    return selectedLanguages.length ? list.filter(l => selectedLanguages.includes(l)) : list
  }, [period, selectedLanguages])

  const timestamps = useMemo(() => {
    if (!period || !period.data) return []
    return Array.from(new Set(period.data.map(d => d.timestamp))).sort()
  }, [period])

  const maxSessions = useMemo(() => {
    if (!period || !period.data || period.data.length === 0) return 1
    return Math.max(...period.data.map(d => d.sessionCount), 1)
  }, [period])

  if (loading) {
    return <div className="text-gray-600 py-12 text-center">Loading activity heatmap...</div>
  }

  if (!data || !data.periods || data.periods.length === 0) {
    return (
      <div className="rounded-lg border bg-white p-6 text-center">
        <Activity className="h-12 w-12 text-gray-400 mx-auto mb-3" />
        <p className="text-gray-600">No language activity data available yet</p>
        <p className="text-xs text-gray-500 mt-2">Activity tracking will begin once users change their language preferences</p>
      </div>
    )
  }

  function getIntensity(count: number): number {
    if (count === 0) return 0
    return Math.max(0.1, (count / maxSessions) * 100)
  }

  function getColorForIntensity(intensity: number): string {
    if (intensity === 0) return 'bg-gray-100'
    if (intensity < 20) return 'bg-blue-100'
    if (intensity < 40) return 'bg-blue-300'
    if (intensity < 60) return 'bg-blue-500'
    if (intensity < 80) return 'bg-blue-700'
    return 'bg-blue-900'
  }

  function getSessionCount(language: string, timestamp: string): number {
    if (!period || !period.data) return 0
    const match = period.data.find(d => d.language === language && d.timestamp === timestamp)
    return match?.sessionCount ?? 0
  }

  function formatTimestamp(timestamp: string): string {
    const date = new Date(timestamp)
    const hours = date.getHours().toString().padStart(2, '0')
    const month = (date.getMonth() + 1).toString().padStart(2, '0')
    const day = date.getDate().toString().padStart(2, '0')
    return `${month}/${day} ${hours}:00`
  }

  function getLanguageDisplay(code: string): { name: string; flag: string } {
    const lang = languages.find(l => l.code === code)
    return lang ? { name: lang.name || code.toUpperCase(), flag: lang.flag || '🌐' } : { name: code.toUpperCase(), flag: '🌐' }
  }

  function toggleLanguageSelection(code: string) {
    setSelectedLanguages(prev => {
      if (prev.includes(code)) return prev.filter(p => p !== code)
      return [...prev, code]
    })
  }

  function exportCsv() {
    if (!period || !period.data.length) return
    const rows = ['timestamp,language,sessionCount,uniqueUsers,averageSessionDuration']
    period.data.forEach(d => rows.push(`${d.timestamp},${d.language},${d.sessionCount},${d.uniqueUsers},${d.averageSessionDuration}`))
    const csv = rows.join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `language-activity-${selectedDays}d.csv`
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="rounded-lg border bg-white p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Activity className="h-5 w-5 text-purple-600" />
          <h3 className="text-lg font-semibold text-gray-900">Language Activity Heatmap</h3>
        </div>

        <div className="flex gap-2 items-center">
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-600">Filter:</label>
            <select
              multiple
              value={selectedLanguages}
              onChange={e => {
                const opts = Array.from(e.target.selectedOptions).map(o => o.value)
                setSelectedLanguages(opts)
              }}
              className="border rounded p-1 text-sm max-w-[180px]"
              aria-label="Select languages to include"
            >
              {languageList.map((code: string) => (
                <option key={code} value={code}>
                  {getLanguageDisplay(code).name}
                </option>
              ))}
            </select>
          </div>

          <select
            value={selectedDevice}
            onChange={e => setSelectedDevice(e.target.value)}
            className="border rounded p-1 text-sm"
            aria-label="Device filter"
          >
            <option value="all">All devices</option>
            {(((data as any)?.meta?.availableDevices as any[]) || ['desktop','mobile','tablet','unknown']).map((d: any) => (
              <option key={String(d)} value={String(d)}>{String(d)[0].toUpperCase() + String(d).slice(1)}</option>
            ))}
          </select>

          <select
            value={selectedRegion}
            onChange={e => setSelectedRegion(e.target.value)}
            className="border rounded p-1 text-sm"
            aria-label="Region filter"
          >
            <option value="all">All regions</option>
            {(((data as any)?.meta?.availableRegions as any[]) || ['unknown']).map((r: any) => (
              <option key={String(r)} value={String(r)}>{String(r).toUpperCase()}</option>
            ))}
          </select>

          {[7, 14, 30].map(days => (
            <button
              key={days}
              onClick={() => setSelectedDays(days)}
              className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                selectedDays === days
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
              aria-pressed={selectedDays === days}
            >
              {days}d
            </button>
          ))}

          <button
            onClick={exportCsv}
            className="ml-2 inline-flex items-center gap-2 px-3 py-1 rounded bg-gray-100 text-sm"
            aria-label="Export heatmap to CSV"
          >
            <Download className="w-4 h-4" /> Export
          </button>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-blue-50 rounded-lg p-3">
          <p className="text-xs text-blue-600 font-medium">Total Sessions</p>
          <p className="text-2xl font-bold text-blue-900 mt-1">{data.summary.totalSessions}</p>
        </div>
        <div className="bg-green-50 rounded-lg p-3">
          <p className="text-xs text-green-600 font-medium">Active Users</p>
          <p className="text-2xl font-bold text-green-900 mt-1">{data.summary.totalUsers}</p>
        </div>
        <div className="bg-purple-50 rounded-lg p-3">
          <p className="text-xs text-purple-600 font-medium">Languages</p>
          <p className="text-2xl font-bold text-purple-900 mt-1">{data.summary.languagesTracked}</p>
        </div>
      </div>

      {/* Heatmap */}
      <div className="overflow-x-auto">
        <div className="min-w-max">
          {/* Column headers (timestamps) */}
          <div className="flex">
            <div className="w-24 flex-shrink-0" />
            <div className="flex gap-0.5">
              {timestamps.map(timestamp => (
                <div key={timestamp} className="w-12 text-center">
                  <div className="text-xs text-gray-600 truncate px-1">{formatTimestamp(timestamp).split(' ')[1]}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Heatmap grid */}
          {languageList.map(language => {
            const { name, flag } = getLanguageDisplay(language)
            return (
              <div key={language} className="flex items-center gap-0.5">
                <div className="w-24 flex-shrink-0 pr-2">
                  <div className="flex items-center gap-2 text-sm font-medium text-gray-900">
                    <span>{flag}</span>
                    <span className="truncate">{name}</span>
                  </div>
                </div>
                <div className="flex gap-0.5">
                  {timestamps.map(timestamp => {
                    const count = getSessionCount(language, timestamp)
                    const intensity = getIntensity(count)
                    const isHovered = hoveredCell?.timestamp === timestamp && hoveredCell?.language === language

                    return (
                      <button
                        key={`${language}-${timestamp}`}
                        onMouseEnter={() => setHoveredCell({ timestamp, language })}
                        onMouseLeave={() => setHoveredCell(null)}
                        className={`w-12 h-12 rounded border border-gray-200 transition-all ${getColorForIntensity(intensity)} ${
                          isHovered ? 'ring-2 ring-offset-2 ring-purple-500 scale-110' : ''
                        }`} 
                        title={`${name}: ${count} sessions on ${formatTimestamp(timestamp)}`}
                        aria-label={`${name} ${formatTimestamp(timestamp)}: ${count} sessions`}
                      >
                        <span className="text-xs font-semibold text-gray-900">{count > 0 ? count : ''}</span>
                      </button>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Legend */}
      <div className="mt-6 pt-6 border-t">
        <div className="flex items-center gap-4">
          <span className="text-sm font-medium text-gray-900">Intensity:</span>
          <div className="flex gap-2 items-center">
            {[
              { label: 'None', class: 'bg-gray-100' },
              { label: 'Low', class: 'bg-blue-100' },
              { label: 'Medium', class: 'bg-blue-500' },
              { label: 'High', class: 'bg-blue-900' },
            ].map(item => (
              <div key={item.label} className="flex items-center gap-2">
                <div className={`w-4 h-4 rounded ${item.class} border border-gray-300`} />
                <span className="text-xs text-gray-600">{item.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Insights */}
      <div className="mt-6 pt-6 border-t">
        <div className="flex items-start gap-3 bg-amber-50 rounded-lg p-4">
          <TrendingUp className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="text-sm font-semibold text-amber-900">Top Language</h4>
            <p className="text-sm text-amber-800 mt-1">
              {languageList.length > 0
                ? `${getLanguageDisplay(languageList[0]).flag} ${getLanguageDisplay(languageList[0]).name} is the most active language in your system`
                : 'No activity data available'}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
