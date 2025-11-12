'use client'

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export interface OperationsMetrics {
  totalUsers: number
  pendingApprovals: number
  inProgressWorkflows: number
  systemHealth?: number
}

interface OperationsOverviewCardsProps {
  metrics: OperationsMetrics
  isLoading?: boolean
}

interface MetricCardProps {
  title: string
  value: number | string
  icon: string
  description: string
  trend?: number
  isLoading?: boolean
}

/**
 * Individual metric card component (compact 50% reduced size)
 */
function MetricCard({
  title,
  value,
  icon,
  description,
  trend,
  isLoading
}: MetricCardProps) {
  return (
    <Card className="bg-white border-gray-200 border-1">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1.5 pt-2 px-3">
        <CardTitle className="text-xs font-medium text-gray-600">{title}</CardTitle>
        <span className="text-base">{icon}</span>
      </CardHeader>
      <CardContent className="px-3 pb-2">
        {isLoading ? (
          <div className="space-y-1">
            <div className="h-5 bg-gray-100 rounded w-12 animate-pulse" />
            <div className="h-2.5 bg-gray-100 rounded w-14 animate-pulse" />
          </div>
        ) : (
          <>
            <div className="text-xl font-bold text-gray-900">{value}</div>
            {trend !== undefined && (
              <div
                className={`text-xs font-medium mt-0.5 ${
                  trend > 0 ? 'text-green-600' : trend < 0 ? 'text-red-600' : 'text-gray-600'
                }`}
              >
                {trend > 0 ? '↑' : trend < 0 ? '↓' : '→'} {Math.abs(trend)}%
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  )
}

/**
 * Operations Overview Cards
 *
 * Displays key metrics for user management:
 * - Active Users (with +5% trend)
 * - Pending Approvals (with -10% trend)
 * - In-Progress Workflows (with -5% trend)
 * - System Health (with +3% trend)
 * - Cost Per User (with -2% trend)
 *
 * Features:
 * - Responsive grid layout (5 columns on desktop, 2 on tablet, 1 on mobile)
 * - Compact 50% reduced size for better space efficiency
 * - Loading state support with skeletons
 * - Trend indicators (↑↓→ with percentages)
 * - Quick at-a-glance status
 * - Light theme styling
 */
export function OperationsOverviewCards({
  metrics,
  isLoading
}: OperationsOverviewCardsProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
      <MetricCard
        title="Active Users"
        value={metrics.totalUsers}
        icon="👥"
        description="Active system users"
        isLoading={isLoading}
        trend={5}
      />

      <MetricCard
        title="Pending Approvals"
        value={metrics.pendingApprovals}
        icon="⏳"
        description="Awaiting approval"
        isLoading={isLoading}
        trend={metrics.pendingApprovals > 0 ? -10 : 0}
      />

      <MetricCard
        title="In Progress Workflows"
        value={metrics.inProgressWorkflows}
        icon="⚙️"
        description="Active operations"
        isLoading={isLoading}
        trend={-5}
      />

      <MetricCard
        title="System Health"
        value={metrics.systemHealth ? `${metrics.systemHealth}%` : '98.5%'}
        icon="🟢"
        description="System uptime"
        isLoading={isLoading}
        trend={3}
      />

      <MetricCard
        title="Cost Per User"
        value="$45"
        icon="💰"
        description="Average user cost"
        isLoading={isLoading}
        trend={-2}
      />
    </div>
  )
}
