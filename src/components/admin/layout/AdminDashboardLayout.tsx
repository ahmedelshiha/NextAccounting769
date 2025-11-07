/**
 * AdminDashboardLayout Component
 * Main layout wrapper for admin dashboard with fixed sidebar architecture
 * 
 * @author NextAccounting Admin Dashboard
 * @version 1.0.0
 */

'use client'

import React, { useEffect, useCallback, useState } from 'react'
import { usePathname } from 'next/navigation'
import AdminSidebar from './AdminSidebar'
import AdminHeader from './AdminHeader'
import { AdminFooter } from './Footer'
import AdminErrorBoundary from './AdminErrorBoundary'
import { useResponsive } from '@/hooks/admin/useResponsive'
import { useSidebarCollapsed, useSidebarActions } from '@/stores/admin/layout.store.selectors'
import type { AdminDashboardLayoutProps } from '@/types/admin/layout'
import { MenuCustomizationModal } from './MenuCustomizationModal'

/**
 * AdminDashboardLayout - The main layout component for admin dashboard
 * 
 * This component implements the new fixed sidebar architecture that resolves
 * navigation conflicts by providing a dedicated admin-only layout system.
 * 
 * Key Features:
 * - Fixed sidebar navigation (no longer floating)
 * - Responsive design with mobile/tablet/desktop variants
 * - State management integration with Zustand store
 * - Proper content area management without layout shifts
 * - Accessibility compliance with ARIA labels and focus management
 * 
 * Architecture:
 * - Desktop: Fixed sidebar (256px) + content area with margin-left
 * - Tablet: Collapsible sidebar with push behavior
 * - Mobile: Overlay sidebar with backdrop
 */
const AdminDashboardLayout: React.FC<AdminDashboardLayoutProps> = ({
  children,
  session,
  initialSidebarCollapsed = false,
  className = '',
}) => {
  const pathname = usePathname()

  // Get responsive state and use unified sidebar store
  const responsive = useResponsive()
  const sidebarCollapsed = useSidebarCollapsed()
  const { setCollapsed } = useSidebarActions()

  // Add client-side hydration check to prevent SSR issues
  const [isClient, setIsClient] = useState(false)

  // Set client-side flag after hydration
  useEffect(() => {
    setIsClient(true)
  }, [])

  // Auto-collapse sidebar on mobile/tablet breakpoints
  useEffect(() => {
    const { isMobile, isTablet } = responsive
    if (isMobile || isTablet) {
      setCollapsed(true)
    }
  }, [responsive.breakpoint, responsive.isMobile, responsive.isTablet, setCollapsed])

  // Initialize collapsed state if provided as prop
  useEffect(() => {
    if (initialSidebarCollapsed !== undefined) {
      setCollapsed(initialSidebarCollapsed)
    }
  }, [initialSidebarCollapsed, setCollapsed])

  // Handle sidebar toggle
  const handleSidebarToggle = useCallback(() => {
    setCollapsed(!sidebarCollapsed)
  }, [sidebarCollapsed, setCollapsed])

  // Handle mobile sidebar close
  const handleMobileSidebarClose = useCallback(() => {
    // On mobile, close is handled by collapsing
    setCollapsed(true)
  }, [setCollapsed])

  // Calculate content area classes based on responsive state and sidebar state
  const getContentClasses = useCallback(() => {
    const { isMobile } = responsive

    if (isMobile) {
      // On mobile, content takes full width (sidebar overlays)
      return 'ml-0'
    } else {
      // On desktop/tablet, content adjusts based on collapsed state with smooth transition
      return `transition-all duration-300 ease-in-out ${sidebarCollapsed ? 'ml-16' : 'ml-64'}`
    }
  }, [responsive, sidebarCollapsed])

  // Local state for menu customization modal
  const [isMenuModalOpen, setIsMenuModalOpen] = useState(false)

  // Show loading skeleton during SSR/hydration
  if (!isClient) {
    return (
      <div className="h-screen bg-background flex">
        {/* Sidebar Skeleton */}
        <div className="w-64 bg-card border-r border-border flex-shrink-0">
          <div className="animate-pulse">
            <div className="p-4 border-b border-border">
              <div className="h-8 bg-muted rounded"></div>
            </div>
            <div className="p-4 space-y-2">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="h-8 bg-muted rounded"></div>
              ))}
            </div>
          </div>
        </div>

        {/* Content Skeleton */}
        <div className="flex-1">
          <div className="h-16 bg-card border-b border-border"></div>
          <div className="p-6">
            <div className="animate-pulse space-y-4">
              <div className="h-4 bg-muted rounded w-1/4"></div>
              <div className="h-32 bg-muted rounded"></div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <AdminErrorBoundary>
      <div className={`h-screen bg-background overflow-hidden ${className}`}>
        {/* Accessibility: Skip link for keyboard users */}
        <a
          href="#admin-main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:bg-card focus:text-blue-600 focus:ring-2 focus:ring-blue-600 focus:px-3 focus:py-2 focus:z-[60] rounded"
          onClick={(e) => {
            e.preventDefault()
            const el = document.getElementById('admin-main-content')
            if (el) {
              el.focus({ preventScroll: false })
            }
          }}
        >
          Skip to main content
        </a>

        {/* Admin Sidebar - Fixed positioning with responsive behavior */}
        <AdminSidebar
          isCollapsed={sidebarCollapsed}
          isMobile={responsive.isMobile}
          onClose={handleMobileSidebarClose}
          onOpenMenuCustomization={() => setIsMenuModalOpen(true)}
        />

        {/* Main Content Area */}
        <div className={`min-h-full flex flex-col transition-all duration-300 ${getContentClasses()}`}>
          {/* Admin Header */}
          <AdminHeader
            onMenuToggle={handleSidebarToggle}
            isMobileMenuOpen={false}
          />

          {/* Scrollable Content */}
          <main
            id="admin-main-content"
            tabIndex={-1}
            className="flex-1 overflow-y-auto px-6 py-4 focus:outline-none"
            role="main"
            aria-label="Admin dashboard content"
          >
            <div className="max-w-7xl mx-auto">
              {/* Main Content */}
              {children}
            </div>
          </main>

          {/* Admin Footer */}
          <AdminFooter />
        </div>

        {/* Menu Customization Modal - Fixed positioning overlay */}
        {isMenuModalOpen && (
          <MenuCustomizationModal
            isOpen={isMenuModalOpen}
            onClose={() => setIsMenuModalOpen(false)}
          />
        )}
      </div>
    </AdminErrorBoundary>
  )
}

export default AdminDashboardLayout
