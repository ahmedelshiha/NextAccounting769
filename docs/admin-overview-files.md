# Admin Overview Files (Consolidated)

Below are the Admin Overview-related files with their full source code.

---

## File: src/app/admin/page.tsx

```tsx
import { Metadata } from 'next'
import { authOptions, getSessionOrBypass } from '@/lib/auth'
import { redirect } from 'next/navigation'
import AdminOverview from '@/components/admin/dashboard/AdminOverview'

export const metadata: Metadata = {
  title: 'Admin Dashboard Overview',
  description: 'Professional admin overview with live KPIs and analytics',
}

export default async function AdminOverviewPage() {
  const session = await getSessionOrBypass()
  if (!session?.user) redirect('/login')

  const role = (session.user as any)?.role as string | undefined
  if (role === 'CLIENT') redirect('/portal')
  if (!['ADMIN', 'TEAM_LEAD'].includes(role || '')) redirect('/admin/analytics')

  // Hydrate initial KPI data server-side for faster first paint (do not throw on failures)
  let bookingsJson: any = null
  let servicesJson: any = null
  let usersJson: any = null
  try {
    const [bookingsRes, servicesRes, usersRes] = await Promise.all([
      fetch('/api/admin/bookings/stats', { cache: 'no-store' }).catch(() => new Response(null, { status: 503 })),
      fetch('/api/admin/services/stats?range=90d', { cache: 'no-store' }).catch(() => new Response(null, { status: 503 })),
      fetch('/api/admin/stats/users?range=90d', { cache: 'no-store' }).catch(() => new Response(null, { status: 503 }))
    ])

    const [b, s, u] = await Promise.all([
      bookingsRes.ok ? bookingsRes.json().catch(() => null) : null,
      servicesRes.ok ? servicesRes.json().catch(() => null) : null,
      usersRes.ok ? usersRes.json().catch(() => null) : null
    ])
    bookingsJson = b
    servicesJson = s
    usersJson = u
  } catch {
    // swallow to keep server render resilient
  }

  return (
    <AdminOverview
      initial={{
        bookingsStats: bookingsJson ?? undefined,
        servicesStats: servicesJson ?? undefined,
        usersStats: usersJson ?? undefined,
      }}
    />
  )
}
```

---

## File: src/components/admin/dashboard/AdminOverview.tsx

```tsx
/**
 * Admin Overview (Client)
 *
 * Client-side dashboard for Admin /admin route using AnalyticsPage template.
 * Handles realtime data fetching, KPIs, charts and activity feed.
 */

'use client'

import { useMemo, useState } from 'react'
import AnalyticsPage from '@/components/dashboard/templates/AnalyticsPage'
import IntelligentActivityFeed from '@/components/dashboard/analytics/IntelligentActivityFeed'
import { useUnifiedData } from '@/hooks/useUnifiedData'
import { Download, RefreshCw, Calendar, Users } from 'lucide-react'
import { fetchExportBlob } from '@/lib/admin-export'
import { startOfWeek, endOfWeek } from 'date-fns'
import type { ActionItem, FilterConfig } from '@/types/dashboard'

interface DashboardStats {
  revenue: {
    current: number
    target: number
    targetProgress: number
    trend: number
  }
  bookings: {
    total: number
    today: number
    pending: number
    conversion: number
  }
  clients: {
    active: number
    new: number
    retention: number
    satisfaction: number
  }
  tasks: {
    productivity: number
    completed: number
    overdue: number
    dueToday: number
  }
}

type BookingStatsPayload = {
  total?: number
  pending?: number
  todayBookings?: number
  weekRevenue?: number
  completionRate?: number
  growth?: number
  averageBookingValue?: number
}

type ServiceRequestAnalyticsPayload = {
  total?: number
  newThisWeek?: number
  completedThisMonth?: number
  pipelineValue?: number
  statusDistribution?: Record<string, number>
  priorityDistribution?: Record<string, number>
  completionRate?: number
}

type TaskAnalyticsPayload = {
  total?: number
  completed?: number
  byStatus?: Array<{ status: string | null; _count?: { _all?: number } }>
  dailyTotals?: number[]
  dailyCompleted?: number[]
}

type ServicesStatsPayload = {
  totalRevenue?: number
  analytics?: {
    revenueTimeSeries?: Array<{ service: string; monthly: Array<{ month: string; revenue: number }> }>
  }
}

type UsersStatsPayload = {
  total?: number
  clients?: number
  staff?: number
  admins?: number
  newThisMonth?: number
  activeUsers?: number
  growth?: number
}

type AnalyticsResponse = {
  revenue_trend?: Array<{ month: string; revenue: number; target?: number }>
}

const clamp = (value: number, min = 0, max = 100) => {
  if (!Number.isFinite(value)) return min
  return Math.min(Math.max(value, min), max)
}

const safeNumber = (value: unknown, fallback = 0) => {
  const numeric = Number(value)
  return Number.isFinite(numeric) ? numeric : fallback
}

type AdminOverviewInitial = {
  bookingsStats?: { success?: boolean; data?: BookingStatsPayload } | BookingStatsPayload
  servicesStats?: ServicesStatsPayload
  usersStats?: UsersStatsPayload
}

export default function AdminOverview({ initial }: { initial?: AdminOverviewInitial }) {
  const [timeframe, setTimeframe] = useState<'today' | 'week' | 'month'>('month')
  const analyticsRange = timeframe === 'today' ? '24h' : timeframe === 'week' ? '7d' : '30d'
  const servicesRange = timeframe === 'today' ? '7d' : timeframe === 'week' ? '30d' : '90d'
  const usersRange = timeframe === 'today' ? '7d' : timeframe === 'week' ? '30d' : '90d'

  const {
    data: analytics,
    error: analyticsError,
    isLoading: analyticsLoading,
  } = useUnifiedData<AnalyticsResponse>({
    key: 'analytics',
    params: { range: analyticsRange },
    events: ['service-request-updated', 'task-updated', 'availability-updated', 'booking-updated', 'booking-created', 'booking-deleted', 'system_alert', 'heartbeat', 'ready'],
    revalidateOnEvents: true,
  })

  const {
    data: bookingStats,
    error: bookingStatsError,
    isLoading: bookingStatsLoading,
  } = useUnifiedData<{ success?: boolean; data?: BookingStatsPayload }>({
    key: 'bookings/stats',
    events: ['booking-updated', 'booking-created', 'booking-deleted', 'service-request-updated', 'task-updated', 'availability-updated', 'heartbeat'],
    revalidateOnEvents: true,
    initialData: initial?.bookingsStats as any,
  })

  const {
    data: serviceRequestsAnalytics,
    error: serviceRequestsError,
    isLoading: serviceRequestsLoading,
  } = useUnifiedData<{ success?: boolean; data?: ServiceRequestAnalyticsPayload }>({
    key: 'service-requests/analytics',
    events: ['service-request-updated', 'task-updated', 'availability-updated', 'booking-updated', 'booking-created', 'booking-deleted'],
    revalidateOnEvents: true,
  })

  const {
    data: tasksAnalyticsData,
    error: tasksError,
    isLoading: tasksLoading,
  } = useUnifiedData<TaskAnalyticsPayload>({
    key: 'tasks/analytics',
    events: ['task-updated', 'service-request-updated'],
    revalidateOnEvents: true,
  })

  const {
    data: servicesStatsData,
    error: servicesError,
    isLoading: servicesStatsLoading,
  } = useUnifiedData<ServicesStatsPayload>({
    key: 'services/stats',
    params: { range: servicesRange },
    events: ['booking-updated', 'booking-created', 'booking-deleted', 'service-request-updated', 'task-updated', 'availability-updated'],
    revalidateOnEvents: true,
    initialData: initial?.servicesStats,
  })

  const {
    data: usersOverview,
    error: usersError,
    isLoading: usersLoading,
  } = useUnifiedData<UsersStatsPayload>({
    key: 'stats/users',
    params: { range: usersRange },
    events: ['service-request-updated', 'task-updated', 'availability-updated', 'booking-updated', 'booking-created', 'booking-deleted'],
    revalidateOnEvents: true,
    initialData: initial?.usersStats,
  })

  const { data: recentBookingsResp } = useUnifiedData<{ bookings: any[]; total: number }>({
    key: 'bookings',
    params: { limit: 10, sortBy: 'scheduledAt', sortOrder: 'desc' },
    events: ['booking-updated', 'booking-created', 'booking-deleted'],
  })

  const { data: highPriorityTasks } = useUnifiedData<any[]>({
    key: 'tasks',
    params: { priority: 'HIGH', status: 'OPEN', orderBy: 'dueAt', order: 'asc', limit: 10 },
    events: ['task-updated'],
  })
  const { data: dueSoonTasks } = useUnifiedData<any[]>({
    key: 'tasks',
    params: { orderBy: 'dueAt', order: 'asc', limit: 10 },
    events: ['task-updated'],
  })

  const weekStart = startOfWeek(new Date(), { weekStartsOn: 0 })
  const weekEnd = endOfWeek(new Date(), { weekStartsOn: 0 })
  const { data: weekBookingsResp } = useUnifiedData<{ total: number }>({
    key: 'bookings',
    params: { startDate: weekStart.toISOString(), endDate: weekEnd.toISOString() },
    events: ['booking-updated', 'booking-created', 'booking-deleted'],
    parse: (raw: any) => ({ total: Number(raw?.total || 0) })
  })

  const bookingsPayload: BookingStatsPayload = ((bookingStats as any)?.data || bookingStats || {}) as BookingStatsPayload
  const serviceRequestPayload: ServiceRequestAnalyticsPayload = ((serviceRequestsAnalytics as any)?.data || serviceRequestsAnalytics || {}) as ServiceRequestAnalyticsPayload
  const tasksPayload: TaskAnalyticsPayload = (tasksAnalyticsData || {}) as TaskAnalyticsPayload
  const servicesPayload: ServicesStatsPayload = (servicesStatsData || {}) as ServicesStatsPayload
  const usersPayload: UsersStatsPayload = (usersOverview || {}) as UsersStatsPayload

  const revenueMetrics = useMemo(() => {
    const weekRevenue = safeNumber(bookingsPayload.weekRevenue)
    const averageBookingValue = safeNumber(bookingsPayload.averageBookingValue)
    const todayRevenue = safeNumber(bookingsPayload.todayBookings) * averageBookingValue
    const totalRevenue = safeNumber(servicesPayload.totalRevenue, weekRevenue)
    const current = timeframe === 'today' ? todayRevenue : timeframe === 'week' ? weekRevenue : totalRevenue
    const fallbackTarget = timeframe === 'month' ? totalRevenue * 1.1 : (current || weekRevenue) * 1.15
    const target = Math.max(fallbackTarget, current * 1.1, 5000)
    const progress = target > 0 ? clamp((current / target) * 100) : 0
    const trend = safeNumber(bookingsPayload.growth)
    return { current, target, progress, trend }
  }, [bookingsPayload, servicesPayload, timeframe])

  const totalBookings = safeNumber(bookingsPayload.total)
  const todayBookings = safeNumber(bookingsPayload.todayBookings)
  const pendingBookings = safeNumber(bookingsPayload.pending)
  const conversionRate = clamp(safeNumber(bookingsPayload.completionRate), 0, 100)

  const statusCounts = new Map<string, number>()
  ;(tasksPayload.byStatus || []).forEach((item) => {
    const key = String(item?.status ?? '').toUpperCase()
    statusCounts.set(key, (statusCounts.get(key) || 0) + safeNumber(item?._count?._all))
  })
  const overdueTasks = ['OVERDUE', 'PAST_DUE', 'LATE'].reduce((acc, key) => acc + (statusCounts.get(key) || 0), 0)
  const dueTodayCount = safeNumber((tasksPayload.dailyTotals || []).slice(-1)[0])
  const totalTasks = safeNumber(tasksPayload.total)
  const completedTasks = safeNumber(tasksPayload.completed)
  const productivity = totalTasks > 0 ? clamp((completedTasks / totalTasks) * 100) : 0

  const activeClients = safeNumber(usersPayload.clients)
  const newClients = safeNumber(usersPayload.newThisMonth)
  const retentionRate = activeClients > 0 ? clamp(((activeClients - newClients) / Math.max(activeClients, 1)) * 100) : 100
  const satisfactionScore = clamp(safeNumber(serviceRequestPayload.completionRate) / 20, 0, 5)

  const stats: DashboardStats = {
    revenue: {
      current: revenueMetrics.current,
      target: revenueMetrics.target,
      targetProgress: clamp(revenueMetrics.progress),
      trend: revenueMetrics.trend,
    },
    bookings: {
      total: totalBookings,
      today: todayBookings,
      pending: pendingBookings,
      conversion: conversionRate,
    },
    clients: {
      active: activeClients,
      new: newClients,
      retention: retentionRate,
      satisfaction: satisfactionScore,
    },
    tasks: {
      productivity,
      completed: completedTasks,
      overdue: overdueTasks,
      dueToday: dueTodayCount,
    },
  }

  const revenueTrendData = useMemo(() => {
    const timeSeries = servicesPayload.analytics?.revenueTimeSeries
    if (Array.isArray(timeSeries) && timeSeries.length > 0) {
      const monthLabels = timeSeries[0]?.monthly?.map((entry) => entry.month) || []
      if (monthLabels.length > 0) {
        return monthLabels.map((month, index) => {
          const revenue = timeSeries.reduce((sum, series) => sum + safeNumber(series.monthly?.[index]?.revenue), 0)
          return {
            month,
            revenue,
            target: index === monthLabels.length - 1 ? revenueMetrics.target : undefined,
          }
        })
      }
    }
    return analytics?.revenue_trend
  }, [servicesPayload, analytics, revenueMetrics.target])

  const combinedError = analyticsError || bookingStatsError || serviceRequestsError || tasksError || servicesError || usersError
  const errorMessage = combinedError ? 'Failed to load dashboard metrics' : null

  const primaryAction: ActionItem = {
    label: 'Quick Actions',
    icon: Calendar,
    href: '/admin/bookings/new',
    variant: 'default' as const
  }

  const secondaryActions: ActionItem[] = [
    {
      label: 'Export Report',
      icon: Download,
      onClick: () => handleExport(),
      variant: 'outline' as const
    },
    {
      label: 'Refresh Data',
      icon: RefreshCw,
      onClick: () => window.location.reload(),
      variant: 'ghost' as const
    }
  ].filter((action: ActionItem) => action.label && (action.onClick || action.href))

  const filters: FilterConfig[] = [
    {
      key: 'timeframe',
      label: 'Time Period',
      type: 'select',
      options: [
        { label: 'Today', value: 'today' },
        { label: 'This Week', value: 'week' },
        { label: 'This Month', value: 'month' }
      ],
      defaultValue: timeframe
    }
  ]

  const handleFilterChange = (key: string, value: string) => {
    if (key === 'timeframe') {
      setTimeframe(value as 'today' | 'week' | 'month')
    }
  }

  const handleExport = async () => {
    try {
      const blob = await fetchExportBlob({ entity: 'dashboard', format: 'csv' })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `dashboard-report-${new Date().toISOString().split('T')[0]}.csv`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      console.error('Export failed:', error)
    }
  }

  const isLoading = analyticsLoading || bookingStatsLoading || serviceRequestsLoading || tasksLoading || servicesStatsLoading || usersLoading

  const activityData = {
    recentBookings: (recentBookingsResp?.bookings || []).map((b: any) => ({
      id: b.id,
      clientName: b.clientName || b.client?.name,
      service: b.service?.name,
      scheduledAt: b.scheduledAt,
      duration: b.duration || b.service?.duration || 0,
      revenue: b.service?.price || 0,
      priority: 'normal',
      status: String(b.status || '').toLowerCase(),
      location: 'office',
      assignedTo: b.assignedTeamMember?.name || null,
      notes: b.notes || ''
    })),
    urgentTasks: (highPriorityTasks || [])
      .filter((t: any) => String(t.status || '').toUpperCase() !== 'DONE')
      .map((t: any) => ({
        id: t.id,
        title: t.title,
        priority: String(t.priority || 'HIGH').toLowerCase(),
        description: t.description || '',
        completionPercentage: Number(t.completionPercentage || 0),
        dueDate: t.dueAt || new Date().toISOString(),
        estimatedHours: t.estimatedHours || 0,
        category: t.category || 'General',
        assignee: t.assignee?.name || 'Unassigned',
        status: t.status || 'OPEN'
      })),
    upcomingDeadlines: (dueSoonTasks || [])
      .filter((t: any) => !!t.dueAt)
      .slice(0, 10)
      .map((t: any) => {
        const due = new Date(t.dueAt)
        const daysUntilDue = Math.ceil((due.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
        const importance = daysUntilDue <= 3 ? 'critical' : 'default'
        return {
          id: t.id,
          title: t.title,
          description: t.description || '',
          dueDate: t.dueAt,
          importance,
          clientName: t.clientName || '—',
          assignedTo: t.assignee?.name || 'Unassigned',
          progress: Number(t.completionPercentage || 0)
        }
      })
  }

  return (
    <AnalyticsPage
      title="Dashboard Overview"
      subtitle="Key performance indicators and business metrics"
      primaryAction={primaryAction}
      secondaryActions={secondaryActions}
      filters={filters}
      onFilterChange={handleFilterChange}
      searchPlaceholder="Search dashboard data..."
      loading={isLoading}
      error={errorMessage}
      stats={stats}
      revenueTrend={revenueTrendData}
    >
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">Recent Activity</h3>
          <IntelligentActivityFeed data={activityData} />
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">Quick Statistics</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white rounded-lg border p-4">
              <div className="flex items-center">
                <Users className="h-8 w-8 text-blue-600" />
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-500">Active Sessions</p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {usersPayload.activeUsers || 0}
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-lg border p-4">
              <div className="flex items-center">
                <Calendar className="h-8 w-8 text-green-600" />
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-500">This Week</p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {weekBookingsResp?.total || 0}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AnalyticsPage>
  )
}
```

---

## File: src/components/admin/settings/SettingsOverview.tsx

```tsx
'use client'

import React, { useState, useCallback, lazy, Suspense } from 'react'
import SettingsShell, { SettingsCard, SettingsSection } from '@/components/admin/settings/SettingsShell'
import SettingsNavigation from '@/components/admin/settings/SettingsNavigation'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { runDiagnostics, exportSettings, importSettings } from '@/services/settings.service'
import Link from 'next/link'
import { getFavorites, removeFavorite } from '@/services/favorites.service'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'

const RecentChanges = lazy(() => import('./RecentChanges'))

function PinnedSettingsList() {
  const [items, setItems] = React.useState<Array<{ settingKey: string; route: string; label: string }>>([])
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)

  const load = React.useCallback(async () => {
    try {
      setLoading(true)
      const data = await getFavorites()
      setItems(data.map(d => ({ settingKey: d.settingKey, route: d.route, label: d.label })))
    } catch (e) {
      setError('Failed to load pinned settings')
    } finally {
      setLoading(false)
    }
  }, [])

  React.useEffect(() => { load() }, [load])

  React.useEffect(() => {
    const handler = () => { load() }
    window.addEventListener('favorites:updated', handler as any)
    return () => { window.removeEventListener('favorites:updated', handler as any) }
  }, [load])

  if (loading) {
    return (
      <div className="mt-4 space-y-2" role="status" aria-live="polite">
        <div className="h-4 bg-gray-100 rounded w-1/2 animate-pulse" />
        <div className="h-4 bg-gray-100 rounded w-2/3 animate-pulse" />
        <div className="h-4 bg-gray-100 rounded w-1/3 animate-pulse" />
      </div>
    )
  }

  if (error) {
    return <div className="mt-4 text-sm text-red-600">{error}</div>
  }

  if (!items.length) {
    return <div className="mt-4 text-sm text-muted-foreground">No pinned settings yet.</div>
  }

  return (
    <ul className="mt-4 space-y-2">
      {items.map((it) => (
        <li key={it.settingKey} className="flex items-center justify-between">
          <Link href={it.route} className="text-sm text-gray-700 hover:underline">{it.label}</Link>
          <Badge className="bg-blue-100 text-blue-800">Pinned</Badge>
        </li>
      ))}
    </ul>
  )
}

function SettingsOverviewInner() {
  const [running, setRunning] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [importing, setImporting] = useState(false)
  const [manageOpen, setManageOpen] = useState(false)

  const handleRunDiagnostics = useCallback(async () => {
    try {
      setRunning(true)
      const res = await runDiagnostics()
      toast.success('Diagnostics completed')
      console.log('diagnostics', res)
      // Announce result via toast and ensure focus stays logical
    } catch (err) {
      toast.error('Diagnostics failed')
    } finally {
      setRunning(false)
    }
  }, [])

  const handleExport = useCallback(async () => {
    try {
      setExporting(true)
      const blob = await exportSettings()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'settings.json'
      a.rel = 'noopener'
      a.type = 'application/json'
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)
      toast.success('Export started')
    } catch (err) {
      toast.error('Export failed')
    } finally {
      setExporting(false)
    }
  }, [])

  const handleImport = useCallback(async () => {
    try {
      const input = document.createElement('input')
      input.type = 'file'
      input.accept = 'application/json'
      input.setAttribute('aria-label', 'Import settings file')
      input.onchange = async () => {
        const file = input.files?.[0]
        if (!file) return
        setImporting(true)
        const text = await file.text()
        try {
          const json = JSON.parse(text)
          await importSettings(json)
          toast.success('Import succeeded')
        } catch (e) {
          toast.error('Invalid JSON or import failed')
        } finally {
          setImporting(false)
        }
      }
      input.click()
    } catch (err) {
      toast.error('Import failed')
      setImporting(false)
    }
  }, [])

  return (
    <SettingsShell
      title="Settings Overview"
      description="System health, quick actions and recent changes"
      icon={undefined}
      sidebar={<SettingsNavigation />}
      showBackButton={false}
    >
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <SettingsCard className="h-full flex flex-col min-h-[180px]">
          <div className="flex-1">
            <h3 className="text-lg font-semibold">System Health</h3>
            <p className="text-sm text-muted-foreground mt-1">Database, authentication, and integrations status</p>

            <div className="mt-4 space-y-2" role="status" aria-live="polite">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-700">Database</span>
                <Badge className="bg-green-100 text-green-800">Connected</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-700">Authentication</span>
                <Badge className="bg-green-100 text-green-800">Configured</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-700">Integrations</span>
                <Badge className="bg-amber-100 text-amber-800">Partial</Badge>
              </div>
            </div>
          </div>

          <div className="mt-4 flex justify-end">
            <Button type="button" aria-label="Run diagnostics" onClick={handleRunDiagnostics} disabled={running}>
              {running ? 'Running…' : 'Run Diagnostics'}
            </Button>
          </div>
        </SettingsCard>

        <SettingsCard className="h-full flex flex-col min-h-[180px]">
          <div className="flex-1">
            <h3 className="text-lg font-semibold">Quick Actions</h3>
            <p className="text-sm text-muted-foreground mt-1">Export or import settings, run health checks</p>
          </div>

          <div className="mt-4 flex gap-2 justify-end">
            <Button type="button" aria-label="Export settings" onClick={handleExport} disabled={exporting}>{exporting ? 'Exporting…' : 'Export'}</Button>
            <Button variant="secondary" type="button" aria-label="Import settings" onClick={handleImport} disabled={importing}>{importing ? 'Importing…' : 'Import'}</Button>
          </div>
        </SettingsCard>

        <SettingsCard className="h-full flex flex-col min-h-[180px]">
          <div className="flex-1">
            <h3 className="text-lg font-semibold">Recent Changes</h3>
            <p className="text-sm text-muted-foreground mt-1">Latest configuration updates and audit events</p>

            <div className="mt-4 overflow-auto max-h-52">
              <Suspense fallback={<div className="text-sm text-gray-500">Loading recent changes…</div>}>
                <RecentChanges />
              </Suspense>
            </div>
          </div>
        </SettingsCard>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
        <SettingsCard className="h-full flex flex-col min-h-[180px]">
          <div className="flex-1">
            <h3 className="text-lg font-semibold">Pinned Settings</h3>
            <p className="text-sm text-muted-foreground mt-1">Quick access to frequently used configuration</p>

            <PinnedSettingsList />
          </div>
          <div className="mt-4 flex justify-end">
            <Button type="button" aria-label="Manage pinned settings" onClick={() => setManageOpen(true)}>Manage</Button>
          </div>
        </SettingsCard>
      </div>

      <Dialog open={manageOpen} onOpenChange={setManageOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Manage Pinned Settings</DialogTitle>
            <DialogDescription>Pin or unpin your frequently used settings.</DialogDescription>
          </DialogHeader>
          <ManagePinnedSettings onClose={() => setManageOpen(false)} />
          <DialogFooter>
            <Button type="button" variant="secondary" aria-label="Close manage pinned settings" onClick={() => setManageOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </SettingsShell>
  )
}

function ManagePinnedSettings({ onClose }: { onClose?: () => void }) {
  const [items, setItems] = React.useState<Array<{ settingKey: string; route: string; label: string }>>([])
  const [loading, setLoading] = React.useState(true)

  const load = React.useCallback(async () => {
    setLoading(true)
    try {
      const data = await getFavorites()
      setItems(data.map(d => ({ settingKey: d.settingKey, route: d.route, label: d.label })))
    } finally {
      setLoading(false)
    }
  }, [])

  React.useEffect(() => { load() }, [load])

  const handleUnpin = async (settingKey: string) => {
    const ok = await removeFavorite(settingKey)
    if (ok) {
      setItems(prev => prev.filter(i => i.settingKey !== settingKey))
      try { window.dispatchEvent(new Event('favorites:updated')) } catch {}
    }
  }

  if (loading) return <div className="p-4 text-sm text-gray-600">Loading…</div>

  if (!items.length) return <div className="p-4 text-sm text-muted-foreground">No pinned settings.</div>

  return (
    <div className="p-4">
      <ul className="space-y-2">
        {items.map(it => (
          <li key={it.settingKey} className="flex items-center justify-between">
            <Link href={it.route} onClick={onClose} className="text-sm text-gray-700 hover:underline">{it.label}</Link>
            <div className="flex items-center gap-2">
              <Badge className="bg-blue-100 text-blue-800">Pinned</Badge>
              <Button variant="outline" size="sm" onClick={() => handleUnpin(it.settingKey)} aria-label={`Unpin ${it.label}`}>Unpin</Button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}

export { PinnedSettingsList, ManagePinnedSettings }

export default React.memo(SettingsOverviewInner)
```

---

## File: src/components/admin/service-requests/overview.tsx

```tsx
"use client"

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Download } from 'lucide-react'
import { apiFetch } from '@/lib/api'
import RequestStatusDistribution from './request-status-distribution'
import TeamWorkloadChart from './team-workload-chart'
import BookingTypeDistribution from './booking-type-distribution'
import { usePermissions } from '@/lib/use-permissions'
import { PERMISSIONS } from '@/lib/permissions'

interface AnalyticsResponse {
  success?: boolean
  data?: {
    total: number
    newThisWeek: number
    completedThisMonth: number
    pipelineValue: number
    statusDistribution: Record<string, number>
    priorityDistribution: Record<string, number>
    activeRequests: number
    completionRate: number
    appointmentsCount?: number
    bookingTypeDistribution?: Record<string, number>
  }
}

export default function ServiceRequestsOverview() {
  const [analytics, setAnalytics] = useState<AnalyticsResponse['data'] | null>(null)
  const [loading, setLoading] = useState(true)
  const perms = usePermissions()

  useEffect(() => {
    let ignore = false
    ;(async () => {
      try {
        const r = await apiFetch('/api/admin/service-requests/analytics')
        const j = await r.json().catch(() => ({})) as AnalyticsResponse
        if (!ignore) setAnalytics(j?.data ?? null)
      } finally { if (!ignore) setLoading(false) }
    })()
    return () => { ignore = true }
  }, [])

  const exportCsv = async () => {
    const res = await apiFetch('/api/admin/service-requests/export')
    if (!res.ok) return
    const blob = await res.blob()
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `service-requests-${new Date().toISOString().slice(0,10)}.csv`
    document.body.appendChild(a)
    a.click()
    URL.revokeObjectURL(url)
    document.body.removeChild(a)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-gray-900">Service Requests</h2>
          <p className="text-gray-600">Overview and management</p>
        </div>
        {perms.has(PERMISSIONS.ANALYTICS_EXPORT) && (
          <Button variant="outline" onClick={exportCsv} className="flex items-center gap-2">
            <Download className="h-4 w-4" /> Export CSV
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Requests</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics?.total ?? (loading ? '—' : 0)}</div>
            <CardDescription>All time</CardDescription>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics?.activeRequests ?? (loading ? '—' : 0)}</div>
            <CardDescription>Assigned or in progress</CardDescription>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed This Month</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics?.completedThisMonth ?? (loading ? '—' : 0)}</div>
            <CardDescription>MTD</CardDescription>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pipeline Value</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${(analytics?.pipelineValue ?? 0).toLocaleString()}</div>
            <CardDescription>Budget max sum</CardDescription>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Appointments</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics?.appointmentsCount ?? (loading ? '—' : 0)}</div>
            <CardDescription>isBooking = true</CardDescription>
          </CardContent>
        </Card>
        <BookingTypeDistribution distribution={analytics?.bookingTypeDistribution || {}} loading={loading} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RequestStatusDistribution distribution={analytics?.statusDistribution || {}} loading={loading} />
        <TeamWorkloadChart />
      </div>
    </div>
  )
}
```
