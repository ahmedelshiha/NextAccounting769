'use client'

import React from 'react'
import { WorkstationInsightsPanelProps } from '../../types/workstation'
import './workstation.css'

/**
 * WorkstationInsightsPanel Component
 * Right panel (300px fixed) containing:
 * - User growth chart
 * - Role distribution chart
 * - Department distribution chart
 * - Recommended actions
 */
export function WorkstationInsightsPanel({
  isOpen = true,
  onClose,
  stats,
  analyticsData,
  className
}: WorkstationInsightsPanelProps) {
  return (
    <div className={`workstation-insights-panel ${className || ''}`}>
      {/* Close Button (Mobile Only) */}
      <div className="insights-header">
        <h3 className="insights-title">Insights</h3>
        {onClose && (
          <button
            onClick={onClose}
            className="insights-close-btn"
            aria-label="Close insights panel"
          >
            ✕
          </button>
        )}
      </div>

      {/* Charts Section */}
      <div className="insights-content">
        {/* User Growth Chart */}
        <section className="insights-section">
          <h4 className="section-title">User Growth</h4>
          <div className="chart-placeholder">Chart will be loaded here</div>
        </section>

        {/* Role Distribution Chart */}
        <section className="insights-section">
          <h4 className="section-title">By Role</h4>
          <div className="chart-placeholder">Chart will be loaded here</div>
        </section>

        {/* Department Distribution Chart */}
        <section className="insights-section">
          <h4 className="section-title">By Department</h4>
          <div className="chart-placeholder">Chart will be loaded here</div>
        </section>

        {/* Recommended Actions */}
        <section className="insights-section">
          <h4 className="section-title">Recommended Actions</h4>
          <div className="actions-placeholder">Actions will be listed here</div>
        </section>
      </div>
    </div>
  )
}

export default WorkstationInsightsPanel
