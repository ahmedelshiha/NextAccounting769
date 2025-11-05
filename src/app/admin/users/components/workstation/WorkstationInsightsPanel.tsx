'use client'

import { memo } from 'react'
import { X } from 'lucide-react'
import type { WorkstationInsightsPanelProps } from '../../types/workstation'
import './workstation.css'

export const WorkstationInsightsPanel = memo(function WorkstationInsightsPanel({
  isOpen = true,
  onClose,
  stats,
  analyticsData,
}: WorkstationInsightsPanelProps) {
  return (
    <div className="workstation-insights-panel">
      {/* Header */}
      <header className="insights-header">
        <h2 className="insights-title">Analytics</h2>
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

        {/* User Growth Chart */}
        <section className="insights-section" aria-label="User Growth">
          <h3 className="section-title">User Growth</h3>
          <div className="chart-placeholder">
            📈 User Growth Chart<br/>
            <small>(Lazy loaded in Phase 3)</small>
          </div>
        </section>

        {/* Role Distribution */}
        <section className="insights-section" aria-label="Role Distribution">
          <h3 className="section-title">Role Distribution</h3>
          <div className="chart-placeholder">
            🍰 Role Distribution<br/>
            <small>(Lazy loaded in Phase 3)</small>
          </div>
        </section>

        {/* Department Distribution */}
        <section className="insights-section" aria-label="Department Distribution">
          <h3 className="section-title">Department Distribution</h3>
          <div className="chart-placeholder">
            📊 Department Distribution<br/>
            <small>(Lazy loaded in Phase 3)</small>
          </div>
        </section>

        {/* Recommended Actions */}
        <section className="insights-section" aria-label="Recommended Actions">
          <h3 className="section-title">Recommended Actions</h3>
          <div className="actions-placeholder">
            💡 Recommended Actions<br/>
            <small>(Integrated in Phase 3)</small>
          </div>
        </section>
      </div>
    </div>
  )
})
