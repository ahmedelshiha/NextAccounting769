'use client'

import React, { useMemo } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useFilterAnalytics, useMostUsedFilters, usePresetAdoptionMetrics, useUserEngagementByRole } from '@/app/admin/users/hooks/useFilterAnalytics'
import { TrendingUp, Users, Filter, Target, Zap, AlertCircle } from 'lucide-react'

interface FilterAnalyticsDashboardProps {
  tenantId: string
  className?: string
  compact?: boolean
}

/**
 * Comprehensive filter analytics dashboard
 * Displays usage metrics, adoption rates, and performance insights
 */
export const FilterAnalyticsDashboard = React.memo(function FilterAnalyticsDashboard({
  tenantId,
  className,
  compact = false
}: FilterAnalyticsDashboardProps) {
  const {
    filterUsageStats,
    filterCombinations,
    userEngagementMetrics,
    performanceMetrics,
    isLoading,
    error
  } = useFilterAnalytics({ tenantId })

  const { metrics: presetMetrics } = usePresetAdoptionMetrics(tenantId)

  // Calculate summary statistics
  const summaryStats = useMemo(() => {
    const totalFilterUsage = filterUsageStats.reduce((sum, s) => sum + s.usageCount, 0)
    const avgFilterTime = performanceMetrics?.averageFilterTime ?? 0
    const totalEngagement = userEngagementMetrics.reduce((sum, m) => sum + m.filterUsageCount, 0)

    return {
      totalFilterUsage,
      uniqueFilters: filterUsageStats.length,
      avgFilterTime: avgFilterTime.toFixed(0),
      adoptionRate: presetMetrics?.adoptionRate ?? 0,
      totalEngagement
    }
  }, [filterUsageStats, performanceMetrics, userEngagementMetrics, presetMetrics])

  if (error) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4" />
            Analytics Error
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-red-600">{error}</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className={`grid gap-6 ${className}`}>
      {/* Summary Cards */}
      <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
        <SummaryCard
          title="Total Filter Usage"
          value={summaryStats.totalFilterUsage}
          icon={<Filter className="h-4 w-4" />}
          subtitle="Lifetime usage"
          isLoading={isLoading}
        />
        <SummaryCard
          title="Unique Filters"
          value={summaryStats.uniqueFilters}
          icon={<Target className="h-4 w-4" />}
          subtitle="Different filter types"
          isLoading={isLoading}
        />
        <SummaryCard
          title="Avg Filter Time"
          value={`${summaryStats.avgFilterTime}ms`}
          icon={<Zap className="h-4 w-4" />}
          subtitle="Average query time"
          isLoading={isLoading}
        />
        <SummaryCard
          title="Preset Adoption"
          value={`${summaryStats.adoptionRate.toFixed(1)}%`}
          icon={<TrendingUp className="h-4 w-4" />}
          subtitle="Of presets in use"
          isLoading={isLoading}
        />
      </div>

      {!compact && (
        <>
          {/* Most Used Filters */}
          <Card>
            <CardHeader>
              <CardTitle>Most Used Filters</CardTitle>
              <CardDescription>
                Filter usage over the last 30 days
              </CardDescription>
            </CardHeader>
            <CardContent>
              <MostUsedFiltersChart
                stats={filterUsageStats.slice(0, 5)}
                isLoading={isLoading}
              />
            </CardContent>
          </Card>

          {/* Filter Combinations */}
          {filterCombinations.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Common Filter Combinations</CardTitle>
                <CardDescription>
                  Filters used together in user workflows
                </CardDescription>
              </CardHeader>
              <CardContent>
                <FilterCombinationsTable
                  combinations={filterCombinations.slice(0, 5)}
                  isLoading={isLoading}
                />
              </CardContent>
            </Card>
          )}

          {/* User Engagement by Role */}
          {userEngagementMetrics.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  User Engagement by Role
                </CardTitle>
                <CardDescription>
                  Filter usage patterns across different user roles
                </CardDescription>
              </CardHeader>
              <CardContent>
                <UserEngagementTable
                  metrics={userEngagementMetrics}
                  isLoading={isLoading}
                />
              </CardContent>
            </Card>
          )}

          {/* Performance Insights */}
          {performanceMetrics && (
            <Card>
              <CardHeader>
                <CardTitle>Performance Insights</CardTitle>
                <CardDescription>
                  Filter query performance metrics
                </CardDescription>
              </CardHeader>
              <CardContent>
                <PerformanceMetricsPanel
                  metrics={performanceMetrics}
                  isLoading={isLoading}
                />
              </CardContent>
            </Card>
          )}

          {/* Preset Adoption */}
          {presetMetrics && (
            <Card>
              <CardHeader>
                <CardTitle>Preset Adoption</CardTitle>
                <CardDescription>
                  Filter preset usage and adoption rate
                </CardDescription>
              </CardHeader>
              <CardContent>
                <PresetAdoptionPanel
                  metrics={presetMetrics}
                  isLoading={isLoading}
                />
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  )
})

/**
 * Summary stat card component
 */
interface SummaryCardProps {
  title: string
  value: string | number
  icon: React.ReactNode
  subtitle?: string
  isLoading?: boolean
}

function SummaryCard({
  title,
  value,
  icon,
  subtitle,
  isLoading
}: SummaryCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <div className="text-muted-foreground">{icon}</div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">
          {isLoading ? '...' : value}
        </div>
        {subtitle && (
          <p className="text-xs text-muted-foreground">{subtitle}</p>
        )}
      </CardContent>
    </Card>
  )
}

/**
 * Most used filters chart
 */
interface MostUsedFiltersChartProps {
  stats: any[]
  isLoading?: boolean
}

function MostUsedFiltersChart({
  stats,
  isLoading
}: MostUsedFiltersChartProps) {
  if (isLoading || !stats.length) {
    return (
      <div className="h-48 flex items-center justify-center text-gray-400">
        {isLoading ? 'Loading...' : 'No filter usage data'}
      </div>
    )
  }

  const maxUsage = Math.max(...stats.map(s => s.usageCount))

  return (
    <div className="space-y-4">
      {stats.map((stat, idx) => (
        <div key={idx} className="space-y-1">
          <div className="flex justify-between text-sm">
            <span className="font-medium">{stat.filterType}</span>
            <span className="text-muted-foreground">{stat.usageCount} uses</span>
          </div>
          <div className="w-full bg-gray-200 rounded h-2">
            <div
              className="bg-blue-500 h-2 rounded transition-all"
              style={{ width: `${(stat.usageCount / maxUsage) * 100}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  )
}

/**
 * Filter combinations table
 */
interface FilterCombinationsTableProps {
  combinations: any[]
  isLoading?: boolean
}

function FilterCombinationsTable({
  combinations,
  isLoading
}: FilterCombinationsTableProps) {
  if (isLoading || !combinations.length) {
    return (
      <div className="h-48 flex items-center justify-center text-gray-400">
        {isLoading ? 'Loading...' : 'No combination data'}
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="border-b">
          <tr>
            <th className="text-left py-2 px-3">Filter Combination</th>
            <th className="text-right py-2 px-3">Frequency</th>
            <th className="text-right py-2 px-3">Avg Results</th>
          </tr>
        </thead>
        <tbody>
          {combinations.map((combo, idx) => (
            <tr key={idx} className="border-b hover:bg-gray-50">
              <td className="py-2 px-3">{combo.combination}</td>
              <td className="text-right py-2 px-3">{combo.frequency}</td>
              <td className="text-right py-2 px-3">
                {combo.avgResultCount.toFixed(0)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

/**
 * User engagement table
 */
interface UserEngagementTableProps {
  metrics: any[]
  isLoading?: boolean
}

function UserEngagementTable({
  metrics,
  isLoading
}: UserEngagementTableProps) {
  if (isLoading || !metrics.length) {
    return (
      <div className="h-48 flex items-center justify-center text-gray-400">
        {isLoading ? 'Loading...' : 'No engagement data'}
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="border-b">
          <tr>
            <th className="text-left py-2 px-3">Role</th>
            <th className="text-right py-2 px-3">Filter Usage</th>
            <th className="text-right py-2 px-3">Filters/Session</th>
            <th className="text-right py-2 px-3">Unique Filters</th>
          </tr>
        </thead>
        <tbody>
          {metrics.map((metric, idx) => (
            <tr key={idx} className="border-b hover:bg-gray-50">
              <td className="py-2 px-3">{metric.role}</td>
              <td className="text-right py-2 px-3">{metric.filterUsageCount}</td>
              <td className="text-right py-2 px-3">
                {metric.averageFiltersPerSession.toFixed(1)}
              </td>
              <td className="text-right py-2 px-3">{metric.uniqueFiltersUsed}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

/**
 * Performance metrics panel
 */
interface PerformanceMetricsPanelProps {
  metrics: any
  isLoading?: boolean
}

function PerformanceMetricsPanel({
  metrics,
  isLoading
}: PerformanceMetricsPanelProps) {
  if (isLoading) {
    return <div className="text-center text-gray-400">Loading...</div>
  }

  const isOptimal = metrics.averageFilterTime < 500

  return (
    <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
      <div className="space-y-2">
        <p className="text-sm text-muted-foreground">Average Filter Time</p>
        <p className="text-2xl font-bold">{metrics.averageFilterTime.toFixed(0)}ms</p>
      </div>
      <div className="space-y-2">
        <p className="text-sm text-muted-foreground">95th Percentile</p>
        <p className="text-2xl font-bold">{metrics.p95FilterTime.toFixed(0)}ms</p>
      </div>
      <div className="space-y-2">
        <p className="text-sm text-muted-foreground">99th Percentile</p>
        <p className="text-2xl font-bold">{metrics.p99FilterTime.toFixed(0)}ms</p>
      </div>
      <div className="space-y-2">
        <p className="text-sm text-muted-foreground">Slow Queries</p>
        <p className="text-2xl font-bold">{metrics.slowFilterCount}</p>
      </div>
      <div className="col-span-full">
        <p className={`text-sm font-medium ${isOptimal ? 'text-green-600' : 'text-amber-600'}`}>
          {isOptimal
            ? '✓ Performance is optimal'
            : '⚠ Some slow filters detected'}
        </p>
      </div>
    </div>
  )
}

/**
 * Preset adoption panel
 */
interface PresetAdoptionPanelProps {
  metrics: any
  isLoading?: boolean
}

function PresetAdoptionPanel({
  metrics,
  isLoading
}: PresetAdoptionPanelProps) {
  if (isLoading) {
    return <div className="text-center text-gray-400">Loading...</div>
  }

  return (
    <div className="space-y-6">
      {/* Adoption Rate Overview */}
      <div>
        <div className="flex justify-between items-center mb-2">
          <p className="text-sm font-medium">Adoption Rate</p>
          <span className="text-2xl font-bold">
            {metrics.adoptionRate.toFixed(1)}%
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-blue-500 h-2 rounded-full transition-all"
            style={{ width: `${metrics.adoptionRate}%` }}
          />
        </div>
      </div>

      {/* Preset Stats */}
      <div className="grid gap-4 grid-cols-3">
        <div>
          <p className="text-sm text-muted-foreground">Total Presets</p>
          <p className="text-2xl font-bold">{metrics.totalPresets}</p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Used</p>
          <p className="text-2xl font-bold">{metrics.usedPresets}</p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Unused</p>
          <p className="text-2xl font-bold">{metrics.unusedPresets}</p>
        </div>
      </div>

      {/* Top Presets */}
      {metrics.topPresets.length > 0 && (
        <div>
          <p className="text-sm font-medium mb-3">Top Presets</p>
          <div className="space-y-2">
            {metrics.topPresets.map((preset: any, idx: number) => (
              <div key={idx} className="flex justify-between items-center text-sm p-2 bg-gray-50 rounded">
                <span>{preset.name}</span>
                <span className="font-medium">{preset.usageCount} uses</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
