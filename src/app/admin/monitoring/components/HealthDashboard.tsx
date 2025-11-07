'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { CheckCircle, AlertTriangle, AlertCircle, Activity } from 'lucide-react'

interface HealthStatus {
  component: string
  status: 'HEALTHY' | 'DEGRADED' | 'DOWN'
  uptime: number
  lastCheck: Date
  metrics?: Record<string, any>
}

interface HealthDashboardProps {
  autoRefresh?: boolean
  refreshInterval?: number
}

export function HealthDashboard({
  autoRefresh = true,
  refreshInterval = 30000
}: HealthDashboardProps) {
  const [health, setHealth] = useState<HealthStatus[]>(DEFAULT_HEALTH_STATUS)
  const [lastRefresh, setLastRefresh] = useState(new Date())
  const [isRefreshing, setIsRefreshing] = useState(false)

  useEffect(() => {
    if (!autoRefresh) return

    const interval = setInterval(() => {
      refreshHealth()
    }, refreshInterval)

    return () => clearInterval(interval)
  }, [autoRefresh, refreshInterval])

  const refreshHealth = async () => {
    setIsRefreshing(true)
    try {
      // Simulate health check
      setHealth(prevHealth =>
        prevHealth.map(h => ({
          ...h,
          lastCheck: new Date(),
          // Simulate occasional degradation
          status: Math.random() > 0.95 ? 'DEGRADED' : h.status
        }))
      )
    } finally {
      setIsRefreshing(false)
      setLastRefresh(new Date())
    }
  }

  const healthyCounts = {
    healthy: health.filter(h => h.status === 'HEALTHY').length,
    degraded: health.filter(h => h.status === 'DEGRADED').length,
    down: health.filter(h => h.status === 'DOWN').length
  }

  const overallHealth =
    healthyCounts.down > 0 ? 'DOWN' : healthyCounts.degraded > 0 ? 'DEGRADED' : 'HEALTHY'

  return (
    <div className="space-y-6">
      {/* Overall Status */}
      <Card className={
        overallHealth === 'HEALTHY' ? 'border-green-200 bg-green-50' :
        overallHealth === 'DEGRADED' ? 'border-amber-200 bg-amber-50' :
        'border-red-200 bg-red-50'
      }>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5" />
            System Health
            <Badge className={
              overallHealth === 'HEALTHY' ? 'bg-green-100 text-green-800' :
              overallHealth === 'DEGRADED' ? 'bg-amber-100 text-amber-800' :
              'bg-red-100 text-red-800'
            }>
              {overallHealth}
            </Badge>
          </CardTitle>
          <CardDescription>
            Last checked: {lastRefresh.toLocaleTimeString()}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600">{healthyCounts.healthy}</div>
              <div className="text-sm text-muted-foreground">Healthy</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-amber-600">{healthyCounts.degraded}</div>
              <div className="text-sm text-muted-foreground">Degraded</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-red-600">{healthyCounts.down}</div>
              <div className="text-sm text-muted-foreground">Down</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Alerts */}
      {health.filter(h => h.status !== 'HEALTHY').length > 0 && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            {health.filter(h => h.status === 'DOWN').length} component(s) down,{' '}
            {health.filter(h => h.status === 'DEGRADED').length} degraded
          </AlertDescription>
        </Alert>
      )}

      {/* Component Status */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Component Status</CardTitle>
          <CardDescription>Real-time component health metrics</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {health.map(component => (
            <HealthStatusItem key={component.component} health={component} />
          ))}
        </CardContent>
      </Card>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {health.map(component => (
          component.metrics && (
            <MetricsCard key={component.component} component={component} />
          )
        ))}
      </div>
    </div>
  )
}

/**
 * Health Status Item Component
 */
function HealthStatusItem({ health }: { health: HealthStatus }) {
  const statusIcon =
    health.status === 'HEALTHY'
      ? <CheckCircle className="w-5 h-5 text-green-600" />
      : health.status === 'DEGRADED'
      ? <AlertTriangle className="w-5 h-5 text-amber-600" />
      : <AlertCircle className="w-5 h-5 text-red-600" />

  const statusColor =
    health.status === 'HEALTHY'
      ? 'bg-green-50 border-green-200'
      : health.status === 'DEGRADED'
      ? 'bg-amber-50 border-amber-200'
      : 'bg-red-50 border-red-200'

  return (
    <div className={`border rounded p-4 flex items-center justify-between ${statusColor}`}>
      <div className="flex items-center gap-3 flex-1">
        {statusIcon}
        <div className="flex-1">
          <p className="font-medium">{health.component}</p>
          <p className="text-xs text-muted-foreground">
            Uptime: {(health.uptime * 100).toFixed(2)}%
          </p>
        </div>
      </div>
      <Badge variant={
        health.status === 'HEALTHY' ? 'default' :
        health.status === 'DEGRADED' ? 'secondary' :
        'destructive'
      }>
        {health.status}
      </Badge>
    </div>
  )
}

/**
 * Metrics Card Component
 */
function MetricsCard({ component }: { component: HealthStatus }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">{component.component}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {Object.entries(component.metrics || {}).map(([key, value]) => (
          <div key={key} className="flex justify-between text-xs">
            <span className="text-muted-foreground">{key}</span>
            <span className="font-medium">
              {typeof value === 'number' ? value.toFixed(2) : value}
            </span>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}

// Default health status data
const DEFAULT_HEALTH_STATUS: HealthStatus[] = [
  {
    component: 'API Server',
    status: 'HEALTHY',
    uptime: 0.9999,
    lastCheck: new Date(),
    metrics: {
      'Response Time': '45ms',
      'Requests/s': 1250,
      'Error Rate': '0.01%'
    }
  },
  {
    component: 'Database',
    status: 'HEALTHY',
    uptime: 0.99999,
    lastCheck: new Date(),
    metrics: {
      'Connections': 145,
      'Query Time': '8ms',
      'Replication Lag': '0s'
    }
  },
  {
    component: 'Cache (Redis)',
    status: 'HEALTHY',
    uptime: 0.99995,
    lastCheck: new Date(),
    metrics: {
      'Memory Usage': '2.3GB',
      'Hit Rate': '94.2%',
      'Evictions/s': 12
    }
  },
  {
    component: 'Message Queue',
    status: 'HEALTHY',
    uptime: 0.9998,
    lastCheck: new Date(),
    metrics: {
      'Queue Length': 342,
      'Throughput': '850/s',
      'Consumer Lag': '2.1s'
    }
  },
  {
    component: 'Search Engine',
    status: 'HEALTHY',
    uptime: 0.99985,
    lastCheck: new Date(),
    metrics: {
      'Index Size': '12GB',
      'Query Time': '120ms',
      'Documents': '5.2M'
    }
  },
  {
    component: 'File Storage',
    status: 'HEALTHY',
    uptime: 0.99999,
    lastCheck: new Date(),
    metrics: {
      'Usage': '45.3%',
      'Latency': '2ms',
      'Replication': 'Synced'
    }
  },
  {
    component: 'Auth Service',
    status: 'HEALTHY',
    uptime: 0.99992,
    lastCheck: new Date(),
    metrics: {
      'Sessions': 2847,
      'Auth Time': '12ms',
      'Failures/h': 3
    }
  },
  {
    component: 'Notification Service',
    status: 'DEGRADED',
    uptime: 0.9985,
    lastCheck: new Date(),
    metrics: {
      'Queue Size': 1250,
      'Delivery Time': '850ms',
      'Success Rate': '98.5%'
    }
  }
]
