'use client'

import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { TimeSeriesData } from '@/services/dashboard-metrics.service'

interface AnalyticsChartsProps {
  userGrowthTrend: TimeSeriesData[]
  departmentDistribution: Array<{ name: string; value: number }>
  roleDistribution: Array<{ name: string; value: number }>
  workflowEfficiency: number
  complianceScore: number
}

export function AnalyticsCharts({
  userGrowthTrend,
  departmentDistribution,
  roleDistribution,
  workflowEfficiency,
  complianceScore
}: AnalyticsChartsProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {/* User Growth Trend */}
      <Card className="col-span-full md:col-span-1">
        <CardHeader>
          <CardTitle>User Growth Trend</CardTitle>
          <CardDescription>90-day historical comparison</CardDescription>
        </CardHeader>
        <CardContent>
          <SimpleLineChart data={userGrowthTrend} />
        </CardContent>
      </Card>

      {/* Department Distribution */}
      <Card>
        <CardHeader>
          <CardTitle>Department Distribution</CardTitle>
          <CardDescription>Users per department</CardDescription>
        </CardHeader>
        <CardContent>
          <SimplePieChart data={departmentDistribution} />
        </CardContent>
      </Card>

      {/* Role Distribution */}
      <Card>
        <CardHeader>
          <CardTitle>Role Distribution</CardTitle>
          <CardDescription>Users per role</CardDescription>
        </CardHeader>
        <CardContent>
          <SimpleBarChart data={roleDistribution} />
        </CardContent>
      </Card>

      {/* Workflow & Compliance Metrics */}
      <Card>
        <CardHeader>
          <CardTitle>System Efficiency Metrics</CardTitle>
          <CardDescription>Key performance indicators</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <MetricGauge label="Workflow Efficiency" value={workflowEfficiency} target={95} />
          <MetricGauge label="Compliance Score" value={complianceScore} target={100} />
        </CardContent>
      </Card>
    </div>
  )
}

/**
 * Simple Line Chart Component
 * Renders a basic line chart without external dependencies
 */
function SimpleLineChart({ data }: { data: TimeSeriesData[] }) {
  if (!data || data.length === 0) {
    return <div className="text-center text-muted-foreground py-8">No data available</div>
  }

  const maxValue = Math.max(...data.map(d => d.users))
  const minValue = Math.min(...data.map(d => d.users))
  const range = maxValue - minValue || 1
  const height = 200

  // Sample every Nth point to avoid overcrowding
  const step = Math.ceil(data.length / 30)
  const sampledData = data.filter((_, i) => i % step === 0)

  return (
    <div className="space-y-4">
      <svg viewBox="0 0 800 200" className="w-full border rounded bg-gray-50">
        {/* Grid lines */}
        {[0, 1, 2, 3, 4].map((i) => (
          <line
            key={`grid-${i}`}
            x1="50"
            y1={50 + i * 30}
            x2="780"
            y2={50 + i * 30}
            stroke="#e5e7eb"
            strokeWidth="1"
          />
        ))}

        {/* Axes */}
        <line x1="50" y1="50" x2="50" y2="180" stroke="#374151" strokeWidth="2" />
        <line x1="50" y1="180" x2="780" y2="180" stroke="#374151" strokeWidth="2" />

        {/* Data line */}
        <polyline
          points={sampledData
            .map((d, i) => {
              const x = 50 + (i / (sampledData.length - 1 || 1)) * 730
              const y = 180 - ((d.users - minValue) / range) * 130
              return `${x},${y}`
            })
            .join(' ')}
          fill="none"
          stroke="#3b82f6"
          strokeWidth="2"
        />

        {/* Data points */}
        {sampledData.map((d, i) => {
          const x = 50 + (i / (sampledData.length - 1 || 1)) * 730
          const y = 180 - ((d.users - minValue) / range) * 130
          return (
            <circle
              key={`point-${i}`}
              cx={x}
              cy={y}
              r="3"
              fill="#3b82f6"
            />
          )
        })}
      </svg>

      {/* Legend */}
      <div className="grid grid-cols-2 gap-4 text-sm">
        <div className="flex items-center gap-2">
          <span className="inline-block w-3 h-3 rounded-full bg-blue-500"></span>
          <span>Current Trend</span>
        </div>
        <div className="text-muted-foreground">
          Latest: {data[data.length - 1]?.users.toLocaleString()}
        </div>
      </div>
    </div>
  )
}

/**
 * Simple Pie Chart Component
 */
function SimplePieChart({ data }: { data: Array<{ name: string; value: number }> }) {
  if (!data || data.length === 0) {
    return <div className="text-center text-muted-foreground py-8">No data available</div>
  }

  const total = data.reduce((sum, d) => sum + d.value, 0)
  const colors = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6']

  let currentAngle = 0
  const segments = data.map((d, i) => {
    const percentage = (d.value / total) * 100
    const angle = (d.value / total) * 360
    const isLarge = angle > 180 ? 1 : 0

    const startAngle = currentAngle
    const endAngle = currentAngle + angle

    const startRad = (startAngle * Math.PI) / 180
    const endRad = (endAngle * Math.PI) / 180
    const r = 60

    const x1 = 100 + r * Math.cos(startRad)
    const y1 = 100 + r * Math.sin(startRad)
    const x2 = 100 + r * Math.cos(endRad)
    const y2 = 100 + r * Math.sin(endRad)

    const path = `M 100 100 L ${x1} ${y1} A ${r} ${r} 0 ${isLarge} 1 ${x2} ${y2} Z`

    currentAngle = endAngle

    return { path, color: colors[i % colors.length], percentage, name: d.name, value: d.value }
  })

  return (
    <div className="space-y-4">
      <svg viewBox="0 0 200 200" className="w-full">
        {segments.map((segment, i) => (
          <path
            key={`segment-${i}`}
            d={segment.path}
            fill={segment.color}
            stroke="white"
            strokeWidth="2"
          />
        ))}
      </svg>

      <div className="space-y-2">
        {segments.map((segment, i) => (
          <div key={`legend-${i}`} className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <span
                className="inline-block w-3 h-3 rounded"
                style={{ backgroundColor: segment.color }}
              ></span>
              <span>{segment.name}</span>
            </div>
            <span className="text-muted-foreground">{segment.value} ({segment.percentage.toFixed(1)}%)</span>
          </div>
        ))}
      </div>
    </div>
  )
}

/**
 * Simple Bar Chart Component
 */
function SimpleBarChart({ data }: { data: Array<{ name: string; value: number }> }) {
  if (!data || data.length === 0) {
    return <div className="text-center text-muted-foreground py-8">No data available</div>
  }

  const maxValue = Math.max(...data.map(d => d.value))

  return (
    <div className="space-y-4">
      {data.map((item, i) => (
        <div key={`bar-${i}`} className="space-y-1">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium">{item.name}</span>
            <span className="text-muted-foreground">{item.value}</span>
          </div>
          <div className="w-full h-2 rounded-full bg-gray-200 overflow-hidden">
            <div
              className="h-full bg-blue-500"
              style={{ width: `${(item.value / maxValue) * 100}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  )
}

/**
 * Metric Gauge Component
 */
function MetricGauge({
  label,
  value,
  target
}: {
  label: string
  value: number
  target: number
}) {
  const percentage = Math.min(100, (value / target) * 100)
  const statusColor =
    percentage >= 90 ? 'bg-green-500' : percentage >= 70 ? 'bg-yellow-500' : 'bg-red-500'

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">{label}</span>
        <span className="text-lg font-bold">{value}%</span>
      </div>
      <div className="w-full h-3 rounded-full bg-gray-200 overflow-hidden">
        <div className={`h-full transition-all ${statusColor}`} style={{ width: `${percentage}%` }} />
      </div>
      <div className="text-xs text-muted-foreground">Target: {target}%</div>
    </div>
  )
}
