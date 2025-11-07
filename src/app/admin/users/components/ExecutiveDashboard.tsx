'use client'

import React, { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { AlertTriangle, RefreshCw, TrendingDown, TrendingUp } from 'lucide-react'
import { DashboardMetrics } from '@/services/dashboard-metrics.service'
import { Recommendation } from '@/services/recommendation-engine.service'

interface ExecutiveDashboardProps {
  initialMetrics?: Partial<DashboardMetrics>
  initialRecommendations: Recommendation[]
  onRefresh?: () => void
}

export function ExecutiveDashboard({
  initialMetrics,
  initialRecommendations,
  onRefresh
}: ExecutiveDashboardProps) {
  const defaultMetrics: DashboardMetrics = {
    totalUsers: { id: 'total-users', label: 'Total Users', value: 0, trend: 0, trendDirection: 'stable', icon: '👥', change: '↑ 0%' },
    activeUsers: { id: 'active-users', label: 'Active Users', value: 0, trend: 0, trendDirection: 'stable', icon: '✅', change: '↑ 0%' },
    pendingApprovals: { id: 'pending-approvals', label: 'Pending Approvals', value: 0, trend: 0, trendDirection: 'stable', icon: '⏳', change: '↑ 0%' },
    workflowVelocity: { id: 'workflow-velocity', label: 'Workflow Velocity', value: 0, trend: 0, trendDirection: 'stable', icon: '⚡', change: '↑ 0%' },
    systemHealth: { id: 'system-health', label: 'System Health', value: 0, trend: 0, trendDirection: 'stable', icon: '🟢', change: '↑ 0%' },
    costPerUser: { id: 'cost-per-user', label: 'Cost Per User', value: 0, trend: 0, trendDirection: 'stable', icon: '💰', change: '↑ 0%' }
  }
  const [metrics, setMetrics] = useState<DashboardMetrics>(Object.assign({}, defaultMetrics, initialMetrics) as DashboardMetrics)
  const [recommendations, setRecommendations] = useState(initialRecommendations)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date())

  const handleRefresh = async () => {
    setIsRefreshing(true)
    try {
      const [metricsRes, recsRes] = await Promise.all([
        fetch('/api/admin/dashboard/metrics'),
        fetch('/api/admin/dashboard/recommendations')
      ])

      if (metricsRes.ok) {
        const data = await metricsRes.json()
        setMetrics((data.metrics as DashboardMetrics) || data)
      }

      if (recsRes.ok) {
        const data = await recsRes.json()
        setRecommendations(data.recommendations || data)
      }

      setLastUpdate(new Date())
      onRefresh?.()
    } catch (error) {
      console.error('Failed to refresh dashboard:', error)
    } finally {
      setIsRefreshing(false)
    }
  }

  // Auto-refresh every 5 minutes
  useEffect(() => {
    const interval = setInterval(handleRefresh, 5 * 60 * 1000)
    return () => clearInterval(interval)
  }, [])

  const criticalRecommendations = recommendations.filter(r => r.impact === 'critical')

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Executive Dashboard</h1>
          <p className="text-muted-foreground">
            Real-time system metrics and insights. Last updated: {lastUpdate.toLocaleTimeString()}
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          {isRefreshing ? 'Refreshing...' : 'Refresh'}
        </Button>
      </div>

      {/* Critical Alerts */}
      {criticalRecommendations.length > 0 && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Critical Issues Detected</AlertTitle>
          <AlertDescription>
            {criticalRecommendations.length} critical issue{criticalRecommendations.length !== 1 ? 's' : ''} require immediate attention
          </AlertDescription>
        </Alert>
      )}

      {/* Key Metrics Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {Object.values(metrics).map((metric) => (
          <MetricCard key={metric.id} metric={metric} />
        ))}
      </div>

      {/* Recommendations Section */}
      {recommendations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Smart Recommendations</CardTitle>
            <CardDescription>
              AI-powered insights to optimize your system
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {recommendations.slice(0, 5).map((rec) => (
              <RecommendationCard key={rec.id} recommendation={rec} />
            ))}
            {recommendations.length > 5 && (
              <Button variant="outline" className="w-full">
                View All {recommendations.length} Recommendations
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* System Health Details */}
      <Card>
        <CardHeader>
          <CardTitle>System Health Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <HealthIndicator label="API Response Time" value="45ms" target="<100ms" status="good" />
            <HealthIndicator label="Database Health" value="99.2%" target="99.9%" status="good" />
            <HealthIndicator label="Error Rate" value="0.02%" target="<0.1%" status="good" />
            <HealthIndicator label="Cache Hit Rate" value="87.3%" target=">85%" status="good" />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

/**
 * Metric Card Component
 */
function MetricCard({ metric }: { metric: any }) {
  const TrendIcon = metric.trendDirection === 'up' ? TrendingUp : TrendingDown

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <span className="text-2xl">{metric.icon}</span>
          {metric.trendDirection !== 'neutral' && (
            <TrendIcon
              className={`h-4 w-4 ${
                metric.trendDirection === 'up' ? 'text-green-500' : 'text-red-500'
              }`}
            />
          )}
        </div>
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {metric.label}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-1">
          <div className="text-2xl font-bold">{metric.value.toLocaleString()}</div>
          <div className="flex items-center gap-2">
            <span
              className={`text-xs font-semibold ${
                metric.trendDirection === 'up'
                  ? 'text-green-600'
                  : metric.trendDirection === 'down'
                  ? 'text-red-600'
                  : 'text-gray-600'
              }`}
            >
              {metric.change}
            </span>
          </div>
          <p className="text-xs text-muted-foreground">{metric.comparison}</p>
        </div>
      </CardContent>
    </Card>
  )
}

/**
 * Recommendation Card Component
 */
function RecommendationCard({ recommendation }: { recommendation: Recommendation }) {
  const impactColors = {
    critical: 'bg-red-50 border-red-200',
    high: 'bg-orange-50 border-orange-200',
    medium: 'bg-yellow-50 border-yellow-200',
    low: 'bg-blue-50 border-blue-200'
  }

  const impactBadgeColors = {
    critical: 'bg-red-100 text-red-800',
    high: 'bg-orange-100 text-orange-800',
    medium: 'bg-yellow-100 text-yellow-800',
    low: 'bg-blue-100 text-blue-800'
  }

  return (
    <div className={`border rounded-lg p-4 ${impactColors[recommendation.impact]}`}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <h4 className="font-semibold">{recommendation.title}</h4>
            <span className={`text-xs font-semibold px-2 py-1 rounded ${impactBadgeColors[recommendation.impact]}`}>
              {recommendation.impact.toUpperCase()}
            </span>
            <span className="text-xs text-muted-foreground">
              Confidence: {Math.round(recommendation.confidence * 100)}%
            </span>
          </div>
          <p className="text-sm text-gray-700 mb-3">{recommendation.description}</p>

          {recommendation.estimatedSavings && (
            <div className="text-sm mb-3 space-y-1">
              {recommendation.estimatedSavings.time && (
                <p className="text-green-700">⏱️ Est. Time Savings: {recommendation.estimatedSavings.time}</p>
              )}
              {recommendation.estimatedSavings.cost && (
                <p className="text-green-700">💰 Est. Cost Savings: {recommendation.estimatedSavings.cost}</p>
              )}
            </div>
          )}

          <div className="flex gap-2 flex-wrap">
            {recommendation.actions.map((action, idx) => (
              <Button
                key={idx}
                variant="outline"
                size="sm"
                className="text-xs"
                onClick={() => handleAction(action)}
              >
                {action.label}
              </Button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

/**
 * Health Indicator Component
 */
function HealthIndicator({
  label,
  value,
  target,
  status
}: {
  label: string
  value: string
  target: string
  status: 'good' | 'warning' | 'critical'
}) {
  const statusColors = {
    good: 'text-green-600',
    warning: 'text-yellow-600',
    critical: 'text-red-600'
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">{label}</span>
        <span className={`text-lg font-bold ${statusColors[status]}`}>{value}</span>
      </div>
      <div className="text-xs text-muted-foreground">Target: {target}</div>
      <div className={`h-2 rounded-full ${
        status === 'good'
          ? 'bg-green-200'
          : status === 'warning'
          ? 'bg-yellow-200'
          : 'bg-red-200'
      }`} />
    </div>
  )
}

/**
 * Handle recommendation actions
 */
function handleAction(action: any) {
  switch (action.action) {
    case 'navigate':
      window.location.href = action.target
      break
    case 'filter':
      // Would dispatch filter event to parent
      console.log('Apply filter:', action.data)
      break
    case 'bulk_action':
      // Would show bulk action dialog
      console.log('Bulk action:', action.data)
      break
    case 'generate_report':
      // Would trigger report generation
      console.log('Generate report:', action.data)
      break
    default:
      console.log('Action:', action)
  }
}
