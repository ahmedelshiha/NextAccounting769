'use client'

import { memo, useCallback, useState } from 'react'
import { AlertCircle, CheckCircle, Info, Lightbulb, RefreshCw, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { Recommendation } from '@/services/recommendation-engine.service'

interface RecommendedActionsPanelProps {
  recommendations?: Recommendation[]
  isLoading?: boolean
  onRefresh?: () => Promise<void>
  onActionClick?: (actionId: string) => Promise<void>
  onDismiss?: (actionId: string) => void
}

const ICON_MAP: Record<string, React.ComponentType<any>> = {
  critical: AlertCircle,
  high: AlertCircle,
  medium: Info,
  low: Lightbulb,
  success: CheckCircle,
}

/**
 * RecommendedActionsPanel Component
 *
 * Phase 3: Displays AI-generated recommendations for user management
 * - Shows impact level with icons and colors
 * - Allows dismissing individual recommendations
 * - Supports clicking actions to execute recommendations
 * - Refresh button to fetch new recommendations
 *
 * Features:
 * - Responsive layout
 * - Loading states
 * - Empty state handling
 * - Accessibility support
 */
export const RecommendedActionsPanel = memo(function RecommendedActionsPanel({
  recommendations = [],
  isLoading = false,
  onRefresh,
  onActionClick,
  onDismiss,
}: RecommendedActionsPanelProps) {
  const [refreshing, setRefreshing] = useState(false)
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set())

  const handleRefresh = useCallback(async () => {
    if (onRefresh && !refreshing) {
      setRefreshing(true)
      try {
        await onRefresh()
      } finally {
        setRefreshing(false)
      }
    }
  }, [onRefresh, refreshing])

  const handleDismiss = useCallback((id: string) => {
    setDismissedIds(prev => new Set([...prev, id]))
    if (onDismiss) {
      onDismiss(id)
    }
  }, [onDismiss])

  const handleAction = useCallback(async (id: string) => {
    if (onActionClick) {
      try {
        await onActionClick(id)
        handleDismiss(id)
      } catch (error) {
        console.error('Failed to execute recommendation action:', error)
      }
    }
  }, [onActionClick, handleDismiss])

  const visibleRecommendations = recommendations.filter(
    r => !dismissedIds.has(r.id)
  )

  if (isLoading && recommendations.length === 0) {
    return (
      <div className="recommendations-loading">
        <div className="animate-pulse space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-16 bg-gray-200 rounded" />
          ))}
        </div>
      </div>
    )
  }

  if (visibleRecommendations.length === 0) {
    return (
      <div className="recommendations-empty">
        <Lightbulb size={24} className="text-gray-400" />
        <p className="empty-state-text">No recommendations at this time</p>
        <Button
          size="sm"
          variant="outline"
          onClick={handleRefresh}
          disabled={refreshing}
          className="mt-2"
        >
          {refreshing ? (
            <>
              <RefreshCw size={14} className="animate-spin mr-1" />
              Refreshing...
            </>
          ) : (
            <>
              <RefreshCw size={14} className="mr-1" />
              Refresh
            </>
          )}
        </Button>
      </div>
    )
  }

  return (
    <div className="recommendations-container">
      <div className="recommendations-header">
        <h3 className="recommendations-title">Recommended Actions</h3>
        <Button
          size="sm"
          variant="ghost"
          onClick={handleRefresh}
          disabled={refreshing || isLoading}
          aria-label="Refresh recommendations"
        >
          <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />
        </Button>
      </div>

      <div className="recommendations-list" role="region" aria-label="Recommended actions">
        {visibleRecommendations.map(rec => {
          const ImpactIcon = ICON_MAP[rec.impact] || Info
          const impactClass = `impact-${rec.impact.toLowerCase()}`

          return (
            <div
              key={rec.id}
              className={`recommendation-item ${impactClass}`}
              role="article"
            >
              <div className="recommendation-header">
                <div className="recommendation-icon-title">
                  <ImpactIcon size={18} className={`impact-icon ${impactClass}`} />
                  <span className="recommendation-title">{rec.title}</span>
                </div>
                <button
                  className="recommendation-dismiss"
                  onClick={() => handleDismiss(rec.id)}
                  aria-label={`Dismiss: ${rec.title}`}
                  title="Dismiss recommendation"
                >
                  <X size={16} />
                </button>
              </div>

              <p className="recommendation-description">{rec.description}</p>

              {rec.actions?.[0] && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleAction(rec.id)}
                  className="recommendation-action-btn"
                >
                  {rec.actions[0].label}
                </Button>
              )}

              {(rec.estimatedBenefit || rec.estimatedSavings) && (
                <div className="recommendation-metrics">
                  {rec.estimatedBenefit && (
                    <span className="metric">Benefit: {rec.estimatedBenefit}</span>
                  )}
                  {rec.estimatedSavings?.time && (
                    <span className="metric">Saves {rec.estimatedSavings.time}</span>
                  )}
                  {rec.estimatedSavings?.cost && (
                    <span className="metric">Saves {rec.estimatedSavings.cost}</span>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {visibleRecommendations.length > 3 && (
        <div className="recommendations-pagination">
          <small>Showing {visibleRecommendations.length} recommendations</small>
        </div>
      )}
    </div>
  )
})

RecommendedActionsPanel.displayName = 'RecommendedActionsPanel'
