'use client'

import React, { memo } from 'react'
import { Skeleton } from '@/components/ui/skeleton'
import { TrendingUp, TrendingDown } from 'lucide-react'

interface MetricCardProps {
  title: string
  value: string | number
  delta?: string
  positive?: boolean
  icon?: React.ReactNode
  loading?: boolean
  subtitle?: string
  onClick?: () => void
  trend?: 'up' | 'down'
}

/**
 * Individual KPI metric card component
 * 
 * Features:
 * - Large value display with title
 * - Trend indicator (green up / red down)
 * - Optional icon emoji or React component
 * - Skeleton loading state
 * - Clickable for drill-down
 * - Responsive with hover effects
 */
const MetricCard = memo(function MetricCard({
  title,
  value,
  delta,
  positive = true,
  icon,
  loading = false,
  subtitle,
  onClick,
  trend
}: MetricCardProps) {
  if (loading) {
    return (
      <div className="metric-card-container">
        <Skeleton className="h-4 w-24 mb-2" />
        <Skeleton className="h-8 w-16 mb-1" />
        <Skeleton className="h-3 w-20" />
      </div>
    )
  }

  return (
    <div
      className="metric-card-wrapper"
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={
        onClick
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                onClick()
              }
            }
          : undefined
      }
    >
      <div className="metric-card-header">
        <div className="metric-card-title-section">
          <p className="metric-card-title">{title}</p>
          {subtitle && <p className="metric-card-subtitle">{subtitle}</p>}
        </div>
        {icon && <span className="metric-card-icon">{icon}</span>}
      </div>

      <div className="metric-card-value-section">
        <p className="metric-card-value">{value}</p>
        {delta && (
          <div
            className={`metric-card-delta ${
              positive ? 'metric-delta-positive' : 'metric-delta-negative'
            }`}
          >
            {trend === 'up' && <TrendingUp className="w-3 h-3" />}
            {trend === 'down' && <TrendingDown className="w-3 h-3" />}
            {!trend && (positive ? '↑' : '↓')}
            <span>{delta}</span>
          </div>
        )}
      </div>
    </div>
  )
})

export default MetricCard
