'use client'

import React, { useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { HealthDashboard } from './components/HealthDashboard'
import { Activity, AlertTriangle, TrendingUp, Settings } from 'lucide-react'

export default function MonitoringPage() {
  const [autoRefresh, setAutoRefresh] = useState(true)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Activity className="w-8 h-8" />
            System Monitoring & Health
          </h1>
          <p className="text-muted-foreground mt-1">
            Real-time infrastructure and service health monitoring
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant={autoRefresh ? 'default' : 'outline'}
            onClick={() => setAutoRefresh(!autoRefresh)}
          >
            {autoRefresh ? '🔄 Auto-Refresh' : '⏸️ Manual Refresh'}
          </Button>
          <Button variant="outline">
            <Settings className="w-4 h-4 mr-2" />
            Configure
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="health" className="space-y-4">
        <TabsList className="grid w-full max-w-md grid-cols-3">
          <TabsTrigger value="health">Health Status</TabsTrigger>
          <TabsTrigger value="alerts">Alerts</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        {/* Health Status Tab */}
        <TabsContent value="health" className="space-y-4">
          <HealthDashboard autoRefresh={autoRefresh} />
        </TabsContent>

        {/* Alerts Tab */}
        <TabsContent value="alerts" className="space-y-4">
          <AlertsPanel />
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-4">
          <AnalyticsPanel />
        </TabsContent>
      </Tabs>
    </div>
  )
}

/**
 * Alerts Panel Component
 */
function AlertsPanel() {
  const alerts = [
    {
      id: '1',
      component: 'Notification Service',
      severity: 'WARNING',
      message: 'Queue depth exceeding threshold (1250/1000)',
      timestamp: new Date(Date.now() - 5 * 60000)
    },
    {
      id: '2',
      component: 'Database',
      severity: 'INFO',
      message: 'Maintenance window scheduled for 2:00 AM',
      timestamp: new Date(Date.now() - 2 * 60000)
    },
    {
      id: '3',
      component: 'API Server',
      severity: 'CRITICAL',
      message: 'CPU usage at 92% (threshold: 80%)',
      timestamp: new Date(Date.now() - 30000)
    }
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="w-5 h-5" />
          Active Alerts
        </CardTitle>
        <CardDescription>System alerts and notifications</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {alerts.map(alert => (
          <div
            key={alert.id}
            className={`p-4 rounded border ${
              alert.severity === 'CRITICAL'
                ? 'bg-red-50 border-red-200'
                : alert.severity === 'WARNING'
                ? 'bg-amber-50 border-amber-200'
                : 'bg-blue-50 border-blue-200'
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="font-medium">{alert.component}</p>
                <p className="text-sm text-muted-foreground mt-1">{alert.message}</p>
                <p className="text-xs text-muted-foreground mt-2">
                  {alert.timestamp.toLocaleTimeString()}
                </p>
              </div>
              <span
                className={`text-xs font-bold px-2 py-1 rounded ${
                  alert.severity === 'CRITICAL'
                    ? 'bg-red-200 text-red-900'
                    : alert.severity === 'WARNING'
                    ? 'bg-amber-200 text-amber-900'
                    : 'bg-blue-200 text-blue-900'
                }`}
              >
                {alert.severity}
              </span>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}

/**
 * Analytics Panel Component
 */
function AnalyticsPanel() {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          icon="📊"
          label="Avg Response Time"
          value="45ms"
          change="+2ms"
          color="blue"
        />
        <StatCard
          icon="💾"
          label="Memory Usage"
          value="62%"
          change="+3%"
          color="green"
        />
        <StatCard
          icon="🔄"
          label="Request Rate"
          value="1,250/s"
          change="+150/s"
          color="purple"
        />
        <StatCard
          icon="⚠️"
          label="Error Rate"
          value="0.02%"
          change="-0.01%"
          color="red"
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Performance Trends
          </CardTitle>
          <CardDescription>Last 24 hours</CardDescription>
        </CardHeader>
        <CardContent className="h-64 bg-gray-50 rounded flex items-center justify-center text-muted-foreground">
          📈 Chart visualization would go here
        </CardContent>
      </Card>
    </div>
  )
}

/**
 * Stat Card Component
 */
function StatCard({
  icon,
  label,
  value,
  change,
  color
}: {
  icon: string
  label: string
  value: string
  change: string
  color: 'blue' | 'green' | 'purple' | 'red'
}) {
  const colorMap = {
    blue: 'bg-blue-50',
    green: 'bg-green-50',
    purple: 'bg-purple-50',
    red: 'bg-red-50'
  }

  return (
    <Card className={colorMap[color]}>
      <CardContent className="pt-6">
        <div className="text-3xl mb-2">{icon}</div>
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="text-2xl font-bold mt-1">{value}</p>
        <p className="text-xs text-muted-foreground mt-2">{change} from last hour</p>
      </CardContent>
    </Card>
  )
}
