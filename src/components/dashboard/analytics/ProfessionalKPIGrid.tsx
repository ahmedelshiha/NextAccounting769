"use client"

'use client'

import { useState } from 'react'
import { DollarSign, Calendar, Users, Target, TrendingUp, TrendingDown, Minimize2, Maximize2, AlertTriangle, ExternalLink } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

interface RevenueStats { current: number; target: number; targetProgress: number; trend: number }
interface BookingStats { total: number; today: number; pending: number; conversion: number }
interface ClientStats { active: number; new: number; retention: number; satisfaction: number }
interface TaskStats { productivity: number; completed: number; overdue: number; dueToday: number }

export interface KPIStatsProps {
  stats: {
    revenue: RevenueStats
    bookings: BookingStats
    clients: ClientStats
    tasks: TaskStats
  }
}

export default function ProfessionalKPIGrid({ stats }: KPIStatsProps) {
  const [selectedTimeframe, setSelectedTimeframe] = useState<'today' | 'week' | 'month'>('month')
  const [expandedKPI, setExpandedKPI] = useState<string | null>(null)

  const kpis = [
    {
      id: 'revenue',
      title: 'Revenue Performance',
      mainValue: `$${stats.revenue.current.toLocaleString()}`,
      targetValue: `$${stats.revenue.target.toLocaleString()}`,
      progress: stats.revenue.targetProgress,
      change: stats.revenue.trend,
      subtitle: `${stats.revenue.targetProgress.toFixed(1)}% of target`,
      icon: DollarSign,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200',
      trend: stats.revenue.trend > 0 ? 'up' : 'down',
      drillDown: '/admin/analytics/revenue',
      alerts: [] as string[],
    },
    {
      id: 'bookings',
      title: 'Booking Performance',
      mainValue: stats.bookings.total.toString(),
      secondaryValue: `${stats.bookings.conversion.toFixed(1)}% conversion`,
      subtitle: `${stats.bookings.today} today • ${stats.bookings.pending} pending`,
      icon: Calendar,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200',
      drillDown: '/admin/bookings',
      alerts: stats.bookings.pending > 10 ? ['High pending count'] : [],
    },
    {
      id: 'clients',
      title: 'Client Metrics',
      mainValue: stats.clients.active.toString(),
      secondaryValue: `${stats.clients.retention.toFixed(1)}% retention`,
      subtitle: `${stats.clients.new} new • ${stats.clients.satisfaction.toFixed(1)}/5 satisfaction`,
      icon: Users,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      borderColor: 'border-purple-200',
      drillDown: '/admin/users',
      alerts: stats.clients.satisfaction < 4.0 ? ['Low satisfaction score'] : [],
    },
    {
      id: 'productivity',
      title: 'Task Management',
      mainValue: `${stats.tasks.productivity.toFixed(1)}%`,
      secondaryValue: `${stats.tasks.completed} completed`,
      subtitle: `${stats.tasks.overdue} overdue • ${stats.tasks.dueToday} due today`,
      icon: Target,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
      borderColor: 'border-orange-200',
      drillDown: '/admin/tasks',
      alerts: stats.tasks.overdue > 0 ? [`${stats.tasks.overdue} overdue tasks`] : [],
    },
  ]

  return (
    <div className="space-y-4 mb-6">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold text-gray-900">Key Performance Indicators</h2>
        <div className="flex items-center gap-2">
          <label htmlFor="kpi-timeframe" className="text-sm text-gray-600">Period:</label>
          <select
            id="kpi-timeframe"
            value={selectedTimeframe}
            onChange={(e) => setSelectedTimeframe(e.target.value as 'today' | 'week' | 'month')}
            className="border rounded px-2 py-1 text-sm"
          >
            <option value="today">Today</option>
            <option value="week">This Week</option>
            <option value="month">This Month</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi) => {
          const IconComponent = kpi.icon
          const isExpanded = expandedKPI === kpi.id
          const hasAlerts = kpi.alerts?.length > 0

          return (
            <Card
              key={kpi.id}
              className={`transition-all duration-200 hover:shadow-lg cursor-pointer group relative ${
                hasAlerts ? `ring-2 ring-red-200 ${kpi.borderColor}` : 'hover:border-gray-300'
              } ${isExpanded ? 'lg:col-span-2' : ''}`}
              onClick={() => { if (typeof window !== 'undefined') { window.location.href = kpi.drillDown } }}
            >
              {hasAlerts && (
                <div className="absolute -top-2 -right-2 z-10">
                  <Badge variant="destructive" className="h-5 w-5 rounded-full p-0 flex items-center justify-center">
                    {kpi.alerts.length}
                  </Badge>
                </div>
              )}

              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div className={`p-1.5 rounded-lg ${kpi.bgColor} group-hover:scale-110 transition-transform`}>
                    <IconComponent className={`h-4 w-4 ${kpi.color}`} />
                  </div>
                  <div className="flex items-center gap-2">
                    {'change' in kpi && (
                      <div className="flex items-center gap-1">
                        {kpi.trend === 'up' ? (
                          <TrendingUp className="h-3 w-3 text-green-500" />
                        ) : (
                          <TrendingDown className="h-3 w-3 text-red-500" />
                        )}
                        <span className={`text-xs font-medium ${
                          kpi.trend === 'up' ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {kpi.change! > 0 ? '+' : ''}{kpi.change!.toFixed(1)}%
                        </span>
                      </div>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5"
                      onClick={(e) => {
                        e.stopPropagation()
                        setExpandedKPI(isExpanded ? null : kpi.id)
                      }}
                    >
                      {isExpanded ? <Minimize2 className="h-3 w-3" /> : <Maximize2 className="h-3 w-3" />}
                    </Button>
                  </div>
                </div>
                <CardTitle className="text-xs font-medium text-gray-600">{kpi.title}</CardTitle>
              </CardHeader>

              <CardContent className="pt-0">
                <div className="space-y-2">
                  <div className="flex items-baseline justify-between">
                    <h3 className="text-lg font-bold text-gray-900">{kpi.mainValue}</h3>
                    {'secondaryValue' in kpi && kpi.secondaryValue && (
                      <span className="text-xs font-medium text-gray-600">{kpi.secondaryValue}</span>
                    )}
                  </div>

                  {'progress' in kpi && kpi.progress !== undefined && (
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-gray-500">Target Progress</span>
                        <span className="font-medium">{kpi.progress!.toFixed(1)}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-1.5">
                        <div
                          className="bg-gradient-to-r from-green-500 to-green-600 h-1.5 rounded-full transition-all duration-300"
                          style={{ width: `${Math.min(kpi.progress as number, 100)}%` }}
                        />
                      </div>
                      {'targetValue' in kpi && kpi.targetValue && (
                        <div className="text-xs text-gray-500">Target: {kpi.targetValue}</div>
                      )}
                    </div>
                  )}

                  <p className="text-xs text-gray-600">{kpi.subtitle}</p>

                  {hasAlerts && (
                    <div className="space-y-0.5">
                      {kpi.alerts.map((alert, idx) => (
                        <div key={idx} className="flex items-center gap-1 text-xs text-red-600 bg-red-50 rounded p-1.5">
                          <AlertTriangle className="h-3 w-3 flex-shrink-0" />
                          <span>{alert}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="flex items-center text-xs text-blue-600 gap-1">
                      View details <ExternalLink className="h-3 w-3" />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
