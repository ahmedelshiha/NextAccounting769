'use client'

import React, { useEffect, useRef } from 'react'
import { WorkstationLayoutProps } from '../../types/workstation'
import './workstation.css'

/**
 * WorkstationLayout Component
 * Main 3-column layout container inspired by Oracle Fusion
 * Responsive: Desktop (3 columns) → Tablet (2 columns + drawer) → Mobile (1 column + drawer)
 *
 * Features:
 * - CSS Grid-based responsive layout
 * - Sidebar drawer on tablet/mobile
 * - Overlay dismissal on mobile
 * - Focus management and keyboard navigation
 * - ARIA labels and semantic structure
 */
export function WorkstationLayout({
  sidebar,
  main,
  insights,
  sidebarWidth = 280,
  insightsPanelWidth = 300,
  onSidebarToggle,
  onInsightsToggle,
  className
}: WorkstationLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = React.useState(false)
  const [insightsOpen, setInsightsOpen] = React.useState(true)
  const [isDesktop, setIsDesktop] = React.useState(true)
  const sidebarRef = useRef<HTMLDivElement>(null)
  const overlayRef = useRef<HTMLDivElement>(null)

  // Handle sidebar toggle
  const handleSidebarToggle = (open: boolean) => {
    setSidebarOpen(open)
    onSidebarToggle?.(open)

    // Log when enabled
    if (process.env.WORKSTATION_LOGGING_ENABLED === 'true') {
      console.log('[Workstation] Sidebar toggled:', open ? 'open' : 'closed')
    }
  }

  // Handle insights toggle
  const handleInsightsToggle = (open: boolean) => {
    setInsightsOpen(open)
    onInsightsToggle?.(open)

    if (process.env.WORKSTATION_LOGGING_ENABLED === 'true') {
      console.log('[Workstation] Insights toggled:', open ? 'open' : 'closed')
    }
  }

  // Close sidebar on overlay click
  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === overlayRef.current) {
      handleSidebarToggle(false)
    }
  }

  // Handle Escape key to close sidebar
  useEffect(() => {
    const handleEscapeKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && sidebarOpen && !isDesktop) {
        handleSidebarToggle(false)
      }
    }

    if (!isDesktop && sidebarOpen) {
      document.addEventListener('keydown', handleEscapeKey)
      return () => document.removeEventListener('keydown', handleEscapeKey)
    }
  }, [sidebarOpen, isDesktop])

  // Detect desktop breakpoint
  useEffect(() => {
    const mediaQuery = window.matchMedia('(min-width: 1400px)')

    const handleChange = (e: MediaQueryListEvent) => {
      setIsDesktop(e.matches)
      // Auto-open sidebar on desktop, close on mobile
      if (e.matches) {
        setSidebarOpen(true)
      }
    }

    // Check initial state
    setIsDesktop(mediaQuery.matches)

    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [])

  // Performance tracking
  useEffect(() => {
    if (process.env.WORKSTATION_PERF_TRACKING === 'true') {
      performance.mark('workstation-layout-rendered')
    }
  }, [])

  return (
    <div
      className={`workstation-container ${className || ''}`}
      role="main"
      aria-label="Workstation layout"
    >
      {/* Overlay (Mobile) - Dismiss sidebar on click */}
      {!isDesktop && sidebarOpen && (
        <div
          ref={overlayRef}
          className="workstation-overlay"
          onClick={handleOverlayClick}
          aria-hidden="true"
        />
      )}

      {/* Sidebar (Left Column) */}
      <aside
        ref={sidebarRef}
        className={`workstation-sidebar ${sidebarOpen ? 'open' : ''}`}
        aria-label="Sidebar with filters and quick stats"
        style={{
          width: `${sidebarWidth}px`,
          zIndex: sidebarOpen ? 40 : 'auto'
        }}
      >
        {sidebar}
      </aside>

      {/* Main Content (Center Column) */}
      <main
        className="workstation-main"
        role="region"
        aria-label="Main content area with user management"
      >
        {main}
      </main>

      {/* Insights Panel (Right Column) */}
      {isDesktop && (
        <aside
          className="workstation-insights"
          aria-label="Insights panel with analytics and recommendations"
        >
          {insights}
        </aside>
      )}

      {/* Hidden Insights Panel for Mobile (Accessible) */}
      {!isDesktop && insightsOpen && (
        <div className="insights-mobile-modal" role="dialog" aria-labelledby="insights-title">
          <div className="insights-mobile-header">
            <h2 id="insights-title" className="insights-mobile-title">
              Insights
            </h2>
            <button
              onClick={() => handleInsightsToggle(false)}
              aria-label="Close insights panel"
              className="insights-mobile-close"
            >
              ✕
            </button>
          </div>
          {insights}
        </div>
      )}
    </div>
  )
}

export default WorkstationLayout
