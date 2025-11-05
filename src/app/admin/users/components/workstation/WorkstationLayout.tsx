'use client'

import type { ReactNode } from 'react'
import { memo } from 'react'
import type { WorkstationLayoutProps } from '../../types/workstation'
import { SIDEBAR_WIDTH, INSIGHTS_PANEL_WIDTH } from '../../types/workstation'
import './workstation-layout.css'

export const WorkstationLayout = memo(function WorkstationLayout({
  sidebar,
  main,
  insights,
  sidebarWidth = SIDEBAR_WIDTH,
  insightsPanelWidth = INSIGHTS_PANEL_WIDTH,
  onSidebarToggle,
  onInsightsToggle,
}: WorkstationLayoutProps) {
  return (
    <div
      className="workstation-container"
      style={{
        '--sidebar-width': `${sidebarWidth}px`,
        '--insights-width': `${insightsPanelWidth}px`,
      } as React.CSSProperties}
    >
      <aside className="workstation-sidebar">
        {sidebar}
      </aside>

      <main className="workstation-main-content">
        {main}
      </main>

      <aside className="workstation-insights-panel">
        {insights}
      </aside>

      <div className="workstation-overlay" />
    </div>
  )
})
