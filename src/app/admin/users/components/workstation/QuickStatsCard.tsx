'use client'

import { memo, useEffect, useState } from 'react'
import { RefreshCw } from 'lucide-react'
import type { QuickStatsData } from '../../types/workstation'
import './workstation.css'

interface QuickStatsCardProps {
  stats?: QuickStatsData
  isRefreshing?: boolean
  onRefresh?: () => Promise<void>
  className?: string
}

export const QuickStatsCard = memo(function QuickStatsCard({
  stats,
  isRefreshing = false,
  onRefresh,
  className = '',
}: QuickStatsCardProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(stats?.refreshedAt || null)

  useEffect(() => {
    if (stats?.refreshedAt) {
      setLastUpdated(stats.refreshedAt)
    }
  }, [stats?.refreshedAt])

  const handleRefresh = async () => {
    if (!onRefresh || isLoading) return

    setIsLoading(true)
    try {
      await onRefresh()
    } catch (error) {
      console.error('Failed to refresh stats:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const formatTime = (date: Date | null) => {
    if (!date) return 'Never'
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const seconds = Math.floor(diff / 1000)
    const minutes = Math.floor(seconds / 60)
    const hours = Math.floor(minutes / 60)

    if (seconds < 60) return 'Just now'
    if (minutes < 60) return `${minutes}m ago`
    if (hours < 24) return `${hours}h ago`
    return date.toLocaleDateString()
  }

  if (!stats) {
    return (
      <div className={`quick-stats-card ${className}`}>
        <div className="stat-item">
          <span className="stat-label">Loading...</span>
        </div>
      </div>
    )
  }

  return (
    <div className={`quick-stats-card ${className}`}>
      {/* Refresh Button */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
        <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--muted-foreground)' }}>
          Quick Stats
        </span>
        <button
          onClick={handleRefresh}
          disabled={isLoading || isRefreshing}
          className="stats-refresh-btn"
          title={`Last updated: ${formatTime(lastUpdated)}`}
          aria-label="Refresh statistics"
        >
          <RefreshCw size={14} className={isLoading || isRefreshing ? 'animate-spin' : ''} />
        </button>
      </div>

      {/* Stats Items */}
      <div className="sidebar-stats-container">
        <div className="stat-item">
          <span className="stat-label">Total Users</span>
          <span className="stat-value">{stats.totalUsers}</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">Active</span>
          <span className="stat-value">{stats.activeUsers}</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">Pending</span>
          <span className="stat-value">{stats.pendingApprovals}</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">Workflows</span>
          <span className="stat-value">{stats.inProgressWorkflows}</span>
        </div>
      </div>

      {/* Last Updated Info */}
      <div style={{
        marginTop: '0.75rem',
        paddingTop: '0.75rem',
        borderTop: '1px solid var(--border)',
        fontSize: '0.75rem',
        color: 'var(--muted-foreground)',
        textAlign: 'center',
      }}>
        Updated {formatTime(lastUpdated)}
      </div>
    </div>
  )
})

// Additional styles
const additionalStyles = `
.stats-refresh-btn {
  padding: 0.25rem;
  background: none;
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  cursor: pointer;
  color: var(--muted-foreground);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}

.stats-refresh-btn:hover:not(:disabled) {
  background: var(--muted);
  color: var(--foreground);
  border-color: var(--primary);
}

.stats-refresh-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.animate-spin {
  animation: spin 1s linear infinite;
}
`
