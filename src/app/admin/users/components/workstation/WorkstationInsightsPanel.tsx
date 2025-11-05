'use client'

import { memo, Suspense, lazy, useMemo } from 'react'
import { X, Loader2 } from 'lucide-react'
import type { WorkstationInsightsPanelProps } from '../../types/workstation'
import { useAnalyticsChartData } from '../../hooks/useRealtimeAnalytics'
import { useDashboardRecommendations } from '../../hooks/useDashboardMetrics'
import { RecommendedActionsPanel } from './RecommendedActionsPanel'
import './workstation.css'

/**
 * Lazy-loaded AnalyticsCharts component
 * Imported dynamically to reduce initial bundle size
 */
const AnalyticsCharts = lazy(() =>
  import('../AnalyticsCharts').then(m => ({ default: m.AnalyticsCharts }))
)

/**
 * Loading skeleton component for charts
 */
function ChartSkeleton() {
  return (
    <div className="chart-loading-skeleton">
      <div className="animate-pulse space-y-3">
        <div className="h-40 bg-gray-200 rounded" />
        <div className="flex gap-3">
          <div className="flex-1 h-32 bg-gray-200 rounded" />
          <div className="flex-1 h-32 bg-gray-200 rounded" />
        </div>
      </div>
    </div>
  )
}

/**
 * WorkstationInsightsPanel Component
 *
 * Phase 3: Right panel with analytics, charts, and recommendations
 * - Lazy-loaded analytics charts for performance
 * - Real-time analytics updates with filter awareness
 * - Recommended actions panel with dismissal
 * - Responsive design (hidden on mobile)
 *
 * Features:
 * - Chart lazy loading with Suspense
 * - Error boundaries
 * - Loading states
 * - Accessibility support
 * - Mobile responsive
 */
export const WorkstationInsightsPanel = memo(function WorkstationInsightsPanel({
  isOpen = true,
  onClose,
  stats,
  analyticsData,
}: WorkstationInsightsPanelProps) {
  // Fetch real-time analytics data
  const { data: chartData, isLoading: chartsLoading, error: chartsError } = useAnalyticsChartData()

  // Fetch recommendations
  const {
    data: recommendations,
    isLoading: recommendationsLoading,
    error: recommendationsError,
    mutate: refreshRecommendations,
  } = useDashboardRecommendations()

  /**
   * Fallback data if API calls fail
   */
  const fallbackChartData = useMemo(
    () => ({
      userGrowthTrend: [],
      departmentDistribution: [],
      roleDistribution: [],
      workflowEfficiency: 0,
      complianceScore: 0,
    }),
    []
  )

  const effectiveChartData = chartData || fallbackChartData

  // Normalize userGrowthTrend to match TimeSeriesData[] expected by AnalyticsCharts
  const normalizedUserGrowthTrend = (effectiveChartData.userGrowthTrend || []).map((d: any) => ({
    date: d.date,
    users: typeof d.users === 'number' ? d.users : (typeof d.value === 'number' ? d.value : 0),
  }))

  if (chartsError) {
    console.error('Failed to load analytics charts:', chartsError)
  }

  return (
    <div className="workstation-insights-panel">
      {/* Header */}
      <header className="insights-header">
        <h2 className="insights-title">Analytics & Insights</h2>
        <button
          className="insights-close-btn"
          onClick={onClose}
          aria-label="Close insights panel"
          title="Close insights panel (mobile)"
        >
          <X size={20} />
        </button>
      </header>

      {/* Content */}
      <div className="insights-content">
        {/* Summary Stats Section */}
        {stats && (
          <section className="insights-section" aria-label="Summary Statistics">
            <h3 className="section-title">Summary</h3>
            <div className="insights-stats-summary">
              <div className="summary-item">
                <span className="summary-label">Total</span>
                <span className="summary-value">{stats.total || 0}</span>
              </div>
              <div className="summary-item">
                <span className="summary-label">Clients</span>
                <span className="summary-value">{stats.clients || 0}</span>
              </div>
              <div className="summary-item">
                <span className="summary-label">Staff</span>
                <span className="summary-value">{stats.staff || 0}</span>
              </div>
            </div>
          </section>
        )}

        {/* Analytics Charts - Lazy Loaded */}
        <section className="insights-section" aria-label="Analytics Charts">
          {chartsError ? (
            <div className="chart-error">
              <p className="text-sm text-red-600">Failed to load analytics</p>
            </div>
          ) : (
            <Suspense fallback={<ChartSkeleton />}>
              <AnalyticsCharts
                userGrowthTrend={normalizedUserGrowthTrend}
                departmentDistribution={effectiveChartData.departmentDistribution}
                roleDistribution={effectiveChartData.roleDistribution}
                workflowEfficiency={effectiveChartData.workflowEfficiency}
                complianceScore={effectiveChartData.complianceScore}
              />
            </Suspense>
          )}
        </section>

        {/* Recommended Actions */}
        <section className="insights-section" aria-label="Recommended Actions">
          <RecommendedActionsPanel
            recommendations={recommendations}
            isLoading={recommendationsLoading}
            onRefresh={refreshRecommendations}
          />
        </section>
      </div>
    </div>
  )
})
