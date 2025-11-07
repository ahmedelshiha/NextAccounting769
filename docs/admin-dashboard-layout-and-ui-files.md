# Admin Dashboard Layout & UI Files (Consolidated)

This file contains the full source code for the admin dashboard layout and UI components: the main AdminDashboardLayout, lazy wrapper, sidebar, header, footer, error boundary, and tenant switcher.

---

## File: src/components/admin/layout/AdminDashboardLayout.tsx

```tsx
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
import AdminFooter from './AdminFooter'
import AdminErrorBoundary from './AdminErrorBoundary'
import { useResponsive } from '@/hooks/admin/useResponsive'
import { useAdminLayoutHydrationSafe } from '@/stores/adminLayoutStoreHydrationSafe'
import type { AdminDashboardLayoutProps } from '@/types/admin/layout'

const AdminDashboardLayout: React.FC<AdminDashboardLayoutProps> = ({
  children,
  session,
  initialSidebarCollapsed = false,
  className = '',
}) => {
  const pathname = usePathname()
  
  // Add client-side hydration check to prevent SSR issues
  const [isClient, setIsClient] = useState(false)
  
  // Get responsive state and layout management - ALWAYS call hooks at the top level
  const responsive = useResponsive()
  const { sidebar, navigation, ui } = useAdminLayoutHydrationSafe()
  
  // Set client-side flag after hydration
  useEffect(() => {
    setIsClient(true)
  }, [])

  // HYDRATION-SAFE: Track if we're client-side and hydration is complete
  const [isHydrated, setIsHydrated] = useState(false)
  
  useEffect(() => {
    // Only set hydrated flag after client-side mount is complete
    setIsHydrated(true)
  }, [])

  // HYDRATION-SAFE: Sync responsive state with store ONLY after hydration
  useEffect(() => {
    if (!isHydrated) return // Prevent hydration mismatch
    
    const { isMobile, isTablet } = responsive
    // Update store with current responsive state (only after hydration)
    sidebar.setCollapsed(isMobile || isTablet ? true : sidebar.collapsed)
  }, [isHydrated, responsive.breakpoint, responsive.isMobile, responsive.isTablet, sidebar])

  // HYDRATION-SAFE: Set active navigation item ONLY after hydration
  useEffect(() => {
    if (!isHydrated) return // Prevent hydration mismatch
    
    // Simple active item detection - can be enhanced with more sophisticated matching
    const pathSegments = pathname.split('/').filter(Boolean)
    const activeItem = pathSegments.length > 1 ? pathSegments[1] : 'dashboard'
    navigation.setActiveItem(activeItem)
  }, [isHydrated, pathname, navigation])

  // HYDRATION-SAFE: Initialize collapsed state ONLY after hydration
  useEffect(() => {
    if (!isHydrated || initialSidebarCollapsed === undefined) return // Prevent hydration mismatch
    
    sidebar.setCollapsed(initialSidebarCollapsed)
  }, [isHydrated, initialSidebarCollapsed, sidebar])

  // Handle sidebar toggle
  const handleSidebarToggle = useCallback(() => {
    if (responsive.isMobile) {
      // On mobile, toggle open/close
      sidebar.setOpen(!sidebar.open)
    } else {
      // On desktop/tablet, toggle collapsed state
      sidebar.toggle()
    }
  }, [responsive.isMobile, sidebar])

  // Handle mobile sidebar close
  const handleMobileSidebarClose = useCallback(() => {
    sidebar.setOpen(false)
  }, [sidebar])

  // Calculate content area classes based on responsive state and sidebar state
  const getContentClasses = useCallback(() => {
    const { isMobile, isTablet, isDesktop, sidebarWidth } = responsive
    const { collapsed, open } = sidebar

    if (isMobile) {
      // On mobile, content takes full width (sidebar overlays)
      return 'ml-0'
    } else if (isTablet) {
      // On tablet, content adjusts based on collapsed state
      return collapsed ? 'ml-16' : 'ml-64'
    } else {
      // On desktop, content has fixed margin for sidebar
      return collapsed ? 'ml-16' : 'ml-64'
    }
  }, [responsive, sidebar])

  // Determine sidebar behavior
  const sidebarBehavior = responsive.isMobile ? 'overlay' : 'fixed'

  // Show loading skeleton during SSR/hydration
  if (!isClient) {
    return (
      <div className="h-screen bg-gray-50 flex">
        {/* Sidebar Skeleton */}
        <div className="w-64 bg-white border-r border-gray-200 flex-shrink-0">
          <div className="animate-pulse">
            <div className="p-4 border-b border-gray-200">
              <div className="h-8 bg-gray-300 rounded"></div>
            </div>
            <div className="p-4 space-y-2">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="h-8 bg-gray-300 rounded"></div>
              ))}
            </div>
          </div>
        </div>
        
        {/* Content Skeleton */}
        <div className="flex-1">
          <div className="h-16 bg-white border-b border-gray-200"></div>
          <div className="p-6">
            <div className="animate-pulse space-y-4">
              <div className="h-4 bg-gray-300 rounded w-1/4"></div>
              <div className="h-32 bg-gray-300 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <AdminErrorBoundary>
      <div className={`h-screen bg-gray-50 overflow-hidden ${className}`}>
        {/* Accessibility: Skip link for keyboard users */}
        <a
          href="#admin-main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:bg-white focus:text-blue-600 focus:ring-2 focus:ring-blue-600 focus:px-3 focus:py-2 focus:z-[60] rounded"
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
        isCollapsed={sidebar.collapsed}
        isMobile={responsive.isMobile}
        onClose={handleMobileSidebarClose}
      />

      {/* Mobile Backdrop */}
      {responsive.isMobile && sidebar.open && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity duration-300"
          onClick={handleMobileSidebarClose}
          aria-hidden="true"
        />
      )}

      {/* Main Content Area */}
      <div className={`min-h-full flex flex-col transition-all duration-300 ${getContentClasses()}`}>
        {/* Admin Header */}
        <AdminHeader
          onMenuToggle={handleSidebarToggle}
          isMobileMenuOpen={sidebar.open}
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
            {/* Loading State */}
            {ui.isLoading && (
              <div className="flex items-center justify-center py-12" role="status" aria-live="polite">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
                <span className="ml-3 text-gray-600">Loading...</span>
              </div>
            )}

            {/* Error State */}
            {ui.error && (
              <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-4" role="alert">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-red-800">Error</h3>
                    <p className="mt-1 text-sm text-red-700">{ui.error}</p>
                  </div>
                  <div className="ml-auto pl-3">
                    <div className="-mx-1.5 -my-1.5">
                      <button
                        type="button"
                        onClick={() => ui.setError(null)}
                        className="inline-flex bg-red-50 rounded-md p-1.5 text-red-500 hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-red-50 focus:ring-red-600"
                        aria-label="Dismiss error"
                      >
                        <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Main Content */}
            {children}
          </div>
        </main>

        {/* Admin Footer */}
        <AdminFooter
          sidebarCollapsed={sidebar.collapsed}
          isMobile={responsive.isMobile}
        />
      </div>

      {/* Debug Info (Development Only) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="fixed bottom-4 right-4 bg-black bg-opacity-75 text-white text-xs p-2 rounded z-50 font-mono">
          <div>Breakpoint: {responsive.breakpoint}</div>
          <div>Sidebar: {sidebar.collapsed ? 'collapsed' : 'expanded'}</div>
          <div>Mobile: {responsive.isMobile ? 'yes' : 'no'}</div>
        </div>
      )}
    </div>
    </AdminErrorBoundary>
  )
}

export default AdminDashboardLayout
```

---

## File: src/components/admin/layout/AdminDashboardLayoutLazy.tsx

```tsx
/**
 * Lazy-loaded Admin Dashboard Layout
 * Implements dynamic imports and code splitting for optimal performance
 * 
 * @author NextAccounting Admin Dashboard
 * @version 1.0.0
 */

'use client'

import React, { Suspense, lazy } from 'react'
import type { AdminDashboardLayoutProps } from '@/types/admin/layout'

// Lazy load heavy admin components
const AdminDashboardLayout = lazy(() => import('./AdminDashboardLayout'))

/**
 * Loading Skeleton for Admin Dashboard
 * Shows while the main admin layout is being loaded
 */
const AdminLayoutSkeleton: React.FC = () => (
  <div className="min-h-screen bg-gray-50 flex">
    {/* Sidebar Skeleton */}
    <div className="w-64 bg-white border-r border-gray-200 flex-shrink-0">
      {/* Brand Section Skeleton */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center">
          <div className="w-8 h-8 bg-gray-300 rounded-lg animate-pulse" />
          <div className="ml-3">
            <div className="w-16 h-4 bg-gray-300 rounded animate-pulse mb-1" />
            <div className="w-24 h-3 bg-gray-200 rounded animate-pulse" />
          </div>
        </div>
      </div>

      {/* Quick Actions Skeleton */}
      <div className="p-4 border-b border-gray-200">
        <div className="w-full h-9 bg-gray-300 rounded-lg animate-pulse" />
      </div>

      {/* Navigation Skeleton */}
      <div className="p-4 space-y-2">
        {[1, 2, 3, 4, 5, 6].map((item) => (
          <div key={item} className="flex items-center gap-3 px-3 py-2">
            <div className="w-5 h-5 bg-gray-300 rounded animate-pulse" />
            <div className="w-20 h-4 bg-gray-300 rounded animate-pulse" />
          </div>
        ))}
      </div>
    </div>

    {/* Main Content Skeleton */}
    <div className="flex-1">
      {/* Header Skeleton */}
      <div className="h-16 bg-white border-b border-gray-200 px-6 flex items-center">
        <div className="flex items-center gap-4 flex-1">
          <div className="w-6 h-6 bg-gray-300 rounded animate-pulse" />
          <div className="flex items-center gap-2">
            <div className="w-12 h-4 bg-gray-300 rounded animate-pulse" />
            <div className="w-4 h-4 bg-gray-300 rounded animate-pulse" />
            <div className="w-16 h-4 bg-gray-300 rounded animate-pulse" />
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="w-64 h-9 bg-gray-300 rounded-lg animate-pulse" />
          <div className="w-8 h-8 bg-gray-300 rounded-full animate-pulse" />
          <div className="w-24 h-8 bg-gray-300 rounded animate-pulse" />
        </div>
      </div>

      {/* Page Content Skeleton */}
      <div className="p-6">
        <div className="max-w-7xl mx-auto">
          <div className="w-32 h-6 bg-gray-300 rounded animate-pulse mb-4" />
          <div className="space-y-4">
            <div className="w-full h-40 bg-gray-300 rounded-lg animate-pulse" />
            <div className="grid grid-cols-3 gap-4">
              <div className="w-full h-24 bg-gray-300 rounded-lg animate-pulse" />
              <div className="w-full h-24 bg-gray-300 rounded-lg animate-pulse" />
              <div className="w-full h-24 bg-gray-300 rounded-lg animate-pulse" />
            </div>
            <div className="w-full h-60 bg-gray-300 rounded-lg animate-pulse" />
          </div>
        </div>
      </div>
    </div>
  </div>
)

/**
 * Error Boundary for Admin Layout
 * Handles lazy loading errors gracefully
 */
class AdminLayoutErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(): { hasError: boolean } {
    return { hasError: true }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Admin Layout failed to load:', error)
    
    // Send error to monitoring if available
    if (typeof window !== 'undefined' && 'gtag' in window) {
      const gtag = (window as any).gtag
      gtag('event', 'admin_layout_error', {
        event_category: 'error',
        event_label: error.message,
        value: 1,
      })
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="max-w-md text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">
              Admin Dashboard Loading Error
            </h2>
            <p className="text-gray-600 mb-4">
              There was an error loading the admin dashboard. Please try refreshing the page.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
            >
              Refresh Page
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

const AdminDashboardLayoutLazy: React.FC<AdminDashboardLayoutProps> = (props) => {
  return (
    <AdminLayoutErrorBoundary>
      <Suspense fallback={<AdminLayoutSkeleton />}>
        <AdminDashboardLayout {...props} />
      </Suspense>
    </AdminLayoutErrorBoundary>
  )
}

export default AdminDashboardLayoutLazy
```

---

## File: src/components/admin/layout/AdminSidebar.tsx

```tsx
'use client'

import { useState, useEffect, useRef } from 'react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { useSession } from 'next-auth/react'
import { 
  BarChart3,
  Calendar,
  Users,
  Briefcase,
  FileText,
  CreditCard,
  Receipt,
  CheckSquare,
  TrendingUp,
  Settings,
  UserCog,
  Shield,
  Upload,
  Bell,
  Mail,
  HelpCircle,
  ChevronDown,
  ChevronRight,
  Home,
  DollarSign,
  Clock,
  Target,
  Building,
  Zap
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { useUnifiedData } from '@/hooks/useUnifiedData'
import { hasPermission, PERMISSIONS } from '@/lib/permissions'
import SETTINGS_REGISTRY from '@/lib/settings/registry'
import useRovingTabIndex from '@/hooks/useRovingTabIndex'

interface NavigationItem {
  name: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  badge?: string | number
  permission?: string
  children?: NavigationItem[]
}

interface AdminSidebarProps {
  // legacy and preferred prop names supported for compatibility
  collapsed?: boolean
  isCollapsed?: boolean
  isMobile?: boolean
  isOpen?: boolean
  onToggle?: () => void
  onClose?: () => void
}

export default function AdminSidebar(props: AdminSidebarProps) {
  const { collapsed, isCollapsed: isCollapsedProp, isMobile = false, isOpen = false, onToggle, onClose } = props
  const pathname = usePathname()
  const { data: session } = useSession()

  const collapsedEffective = typeof isCollapsedProp === 'boolean' ? isCollapsedProp : (typeof collapsed === 'boolean' ? collapsed : false)

  // Persisted sidebar width (desktop)
  const DEFAULT_WIDTH = 256
  const COLLAPSED_WIDTH = 64
  const MIN_WIDTH = 160
  const MAX_WIDTH = 420

  const [sidebarWidth, setSidebarWidth] = useState<number>(() => {
    try {
      if (typeof window === 'undefined') return DEFAULT_WIDTH
      const raw = window.localStorage.getItem('admin:sidebar:width')
      if (raw) {
        const parsed = parseInt(raw, 10)
        if (!Number.isNaN(parsed)) return Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, parsed))
      }
    } catch (e) {}
    return DEFAULT_WIDTH
  })

  const [isDragging, setIsDragging] = useState(false)
  const dragRef = useRef<{ startX: number; startWidth: number } | null>(null)
  const resizerRef = useRef<HTMLDivElement | null>(null)

  // Save width
  useEffect(() => {
    try {
      if (typeof window !== 'undefined') window.localStorage.setItem('admin:sidebar:width', String(sidebarWidth))
    } catch (e) {}
  }, [sidebarWidth])

  useEffect(() => {
    function onMouseMove(e: MouseEvent) {
      if (!dragRef.current) return
      const dx = e.clientX - dragRef.current.startX
      const newWidth = Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, dragRef.current.startWidth + dx))
      setSidebarWidth(newWidth)
    }
    function onMouseUp() {
      if (isDragging) setIsDragging(false)
      dragRef.current = null
      document.body.style.cursor = ''
      document.removeEventListener('mousemove', onMouseMove)
      document.removeEventListener('mouseup', onMouseUp)
    }
    if (isDragging) {
      document.addEventListener('mousemove', onMouseMove)
      document.addEventListener('mouseup', onMouseUp)
      document.body.style.cursor = 'col-resize'
    }
    return () => {
      document.removeEventListener('mousemove', onMouseMove)
      document.removeEventListener('mouseup', onMouseUp)
      document.body.style.cursor = ''
    }
  }, [isDragging])

  // Touch support
  useEffect(() => {
    function onTouchMove(e: TouchEvent) {
      if (!dragRef.current) return
      const touch = e.touches[0]
      const dx = touch.clientX - dragRef.current.startX
      const newWidth = Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, dragRef.current.startWidth + dx))
      setSidebarWidth(newWidth)
    }
    function onTouchEnd() {
      if (isDragging) setIsDragging(false)
      dragRef.current = null
      document.removeEventListener('touchmove', onTouchMove)
      document.removeEventListener('touchend', onTouchEnd)
    }
    if (isDragging) {
      document.addEventListener('touchmove', onTouchMove)
      document.addEventListener('touchend', onTouchEnd)
    }
    return () => {
      document.removeEventListener('touchmove', onTouchMove)
      document.removeEventListener('touchend', onTouchEnd)
    }
  }, [isDragging])

  const startDrag = (clientX: number) => {
    if (collapsedEffective) return
    dragRef.current = { startX: clientX, startWidth: sidebarWidth }
    setIsDragging(true)
  }

  const onResizerMouseDown = (e: React.MouseEvent) => {
    e.preventDefault()
    startDrag(e.clientX)
  }
  const onResizerTouchStart = (e: React.TouchEvent) => {
    startDrag(e.touches[0].clientX)
  }

  const onResizerKeyDown = (e: React.KeyboardEvent) => {
    if (collapsedEffective) return
    if (e.key === 'ArrowLeft') {
      setSidebarWidth(w => Math.max(MIN_WIDTH, w - 16))
    } else if (e.key === 'ArrowRight') {
      setSidebarWidth(w => Math.min(MAX_WIDTH, w + 16))
    } else if (e.key === 'Home') {
      setSidebarWidth(MIN_WIDTH)
    } else if (e.key === 'End') {
      setSidebarWidth(MAX_WIDTH)
    }
  }

  // Expand/collapse based on width threshold
  useEffect(() => {
    try {
      if (sidebarWidth <= 80) {
        if (typeof window !== 'undefined') window.localStorage.setItem('admin:sidebar:collapsed', '1')
      } else {
        if (typeof window !== 'undefined') window.localStorage.removeItem('admin:sidebar:collapsed')
      }
    } catch (e) {}
  }, [sidebarWidth])

  // Fetch notification counts for badges
  const { data: counts } = useUnifiedData({
    key: 'stats/counts',
    events: ['booking-created', 'service-request-created', 'task-created'],
    revalidateOnEvents: true,
  })

  const userRole = (session?.user as any)?.role

  const navigation: { section: string; items: NavigationItem[] }[] = [
    {
      section: 'dashboard',
      items: [
        { name: 'Overview', href: '/admin', icon: Home },
        { name: 'Analytics', href: '/admin/analytics', icon: BarChart3, permission: PERMISSIONS.ANALYTICS_VIEW },
        { name: 'Reports', href: '/admin/reports', icon: TrendingUp, permission: PERMISSIONS.ANALYTICS_VIEW },
      ]
    },
    {
      section: 'business',
      items: [
        { name: 'Bookings', href: '/admin/bookings', icon: Calendar, badge: counts?.pendingBookings, children: [
          { name: 'All Bookings', href: '/admin/bookings', icon: Calendar },
          { name: 'Calendar View', href: '/admin/calendar', icon: Calendar },
          { name: 'Availability', href: '/admin/availability', icon: Clock },
          { name: 'New Booking', href: '/admin/bookings/new', icon: Calendar },
        ] },
        { name: 'Clients', href: '/admin/clients', icon: Users, badge: counts?.newClients, children: [
          { name: 'All Clients', href: '/admin/clients', icon: Users },
          { name: 'Profiles', href: '/admin/clients/profiles', icon: Users },
          { name: 'Invitations', href: '/admin/clients/invitations', icon: Mail },
          { name: 'Add Client', href: '/admin/clients/new', icon: Users },
        ] },
        { name: 'Services', href: '/admin/services', icon: Briefcase, permission: PERMISSIONS.SERVICES_VIEW, children: [
          { name: 'All Services', href: '/admin/services', icon: Briefcase },
          { name: 'Categories', href: '/admin/services/categories', icon: Target },
          { name: 'Analytics', href: '/admin/services/analytics', icon: BarChart3 },
        ] },
        { name: 'Service Requests', href: '/admin/service-requests', icon: FileText, badge: counts?.pendingServiceRequests, permission: PERMISSIONS.SERVICE_REQUESTS_READ_ALL },
      ]
    },
    {
      section: 'financial',
      items: [
        { name: 'Invoices', href: '/admin/invoices', icon: FileText, children: [
          { name: 'All Invoices', href: '/admin/invoices', icon: FileText },
          { name: 'Sequences', href: '/admin/invoices/sequences', icon: FileText },
          { name: 'Templates', href: '/admin/invoices/templates', icon: FileText },
        ] },
        { name: 'Payments', href: '/admin/payments', icon: CreditCard },
        { name: 'Expenses', href: '/admin/expenses', icon: Receipt },
        { name: 'Taxes', href: '/admin/taxes', icon: DollarSign },
      ]
    },
    {
      section: 'operations',
      items: [
        { name: 'Tasks', href: '/admin/tasks', icon: CheckSquare, badge: counts?.overdueTasks, permission: PERMISSIONS.TASKS_READ_ALL },
        { name: 'Team', href: '/admin/team', icon: UserCog, permission: PERMISSIONS.TEAM_VIEW },
        { name: 'Chat', href: '/admin/chat', icon: Mail },
        { name: 'Reminders', href: '/admin/reminders', icon: Bell },
      ]
    },
    {
      section: 'system',
      items: [
        { name: 'Settings', href: '/admin/settings', icon: Settings, children: [] },
        { name: 'Cron Telemetry', href: '/admin/cron-telemetry', icon: Zap },
      ]
    }
  ]

  const [expandedSections, setExpandedSections] = useState<string[]>(() => {
    try {
      const fromLs = typeof window !== 'undefined' ? window.localStorage.getItem('admin:sidebar:expanded') : null
      if (fromLs) {
        const parsed = JSON.parse(fromLs) as string[]
        if (Array.isArray(parsed)) return parsed
      }
    } catch (e) {}
    return ['dashboard', 'business']
  })

  useEffect(() => {
    try {
      if (typeof window !== 'undefined') window.localStorage.setItem('admin:sidebar:expanded', JSON.stringify(expandedSections))
    } catch (e) {}
  }, [expandedSections])

  const toggleSection = (section: string) => {
    setExpandedSections(prev => prev.includes(section) ? prev.filter(s => s !== section) : [...prev, section])
  }

  const isActiveRoute = (href: string) => {
    if (href === '/admin') return pathname === '/admin'
    return pathname.startsWith(href)
  }

  const hasAccess = (permission?: string) => {
    if (!permission) return true
    return hasPermission(userRole, permission as any)
  }

  const renderNavigationItem = (item: NavigationItem, depth = 0) => {
    if (!hasAccess(item.permission)) return null

    const isActive = isActiveRoute(item.href)
    const hasChildren = item.children && item.children.length > 0
    const isExpanded = expandedSections.includes(item.href.split('/').pop() || '')
    const isSettingsParent = item.href === '/admin/settings'

    return (
      <li key={item.href}>
        <div className="relative">
          {hasChildren ? (
            isSettingsParent ? (
              <div
                aria-expanded={true}
                data-roving
                {...(collapsedEffective ? { 'aria-label': item.name, title: item.name } : {})}
                className={`
                  w-full flex items-center px-3 py-2 text-sm font-medium rounded-lg group transition-colors
                  ${isActive
                    ? 'bg-blue-100 text-blue-700 border-r-2 border-blue-500'
                    : 'text-gray-700 hover:text-gray-900 hover:bg-gray-100'
                  }
                  ${depth > 0 ? 'ml-4' : ''}
                `}
              >
                <item.icon className={`flex-shrink-0 h-5 w-5 mr-3 ${isActive ? 'text-blue-500' : 'text-gray-400'}`} />
                {!collapsedEffective && (
                  <>
                    <span className="flex-1 text-left">{item.name}</span>
                    {item.badge && (
                      <Badge variant="secondary" className="ml-2">
                        {item.badge}
                      </Badge>
                    )}
                  </>
                )}
              </div>
            ) : (
              <button
                onClick={() => toggleSection(item.href.split('/').pop() || '')}
                aria-expanded={isExpanded}
                aria-controls={`nav-${(item.href.split('/').pop() || '').replace(/[^a-zA-Z0-9_-]/g, '')}`}
                data-roving
                {...(collapsedEffective ? { 'aria-label': item.name, title: item.name } : {})}
                className={`
                  w-full flex items-center px-3 py-2 text-sm font-medium rounded-lg group transition-colors
                  ${isActive
                    ? 'bg-blue-100 text-blue-700 border-r-2 border-blue-500'
                    : 'text-gray-700 hover:text-gray-900 hover:bg-gray-100'
                  }
                  ${depth > 0 ? 'ml-4' : ''}
                `}
              >
                <item.icon className={`flex-shrink-0 h-5 w-5 mr-3 ${isActive ? 'text-blue-500' : 'text-gray-400'}`} />
                {!collapsedEffective && (
                  <>
                    <span className="flex-1 text-left">{item.name}</span>
                    {item.badge && (
                      <Badge variant="secondary" className="ml-2">
                        {item.badge}
                      </Badge>
                    )}
                    {isExpanded ? (
                      <ChevronDown className="h-4 w-4 ml-2" />
                    ) : (
                      <ChevronRight className="h-4 w-4 ml-2" />
                    )}
                  </>
                )}
              </button>
            )
          ) : (
            <Link
              href={item.href}
              aria-current={isActive ? 'page' : undefined}
              onClick={isMobile ? onClose : undefined}
              data-roving
              {...(collapsedEffective ? { 'aria-label': item.name, title: item.name } : {})}
              className={`flex items-center px-3 py-2 text-sm font-medium rounded-lg group transition-colors ${isActive ? 'bg-blue-100 text-blue-700 border-r-2 border-blue-500' : 'text-gray-700 hover:text-gray-900 hover:bg-gray-100'} ${depth > 0 ? 'ml-4' : ''}`}
            >
              <item.icon className={`flex-shrink-0 h-5 w-5 mr-3 ${isActive ? 'text-blue-500' : 'text-gray-400'}`} />
              {!collapsedEffective && (
                <>
                  <span className="flex-1">{item.name}</span>
                  {item.badge && (
                    <Badge variant="secondary" className="ml-2">{item.badge}</Badge>
                  )}
                </>
              )}
            </Link>
          )}
        </div>

        {hasChildren && (isSettingsParent || isExpanded) && !collapsedEffective && (
          <ul id={`nav-${(item.href.split('/').pop() || '').replace(/[^a-zA-Z0-9_-]/g, '')}`} className="mt-1 space-y-1" role="group" aria-label={`${item.name} submenu`}>
            {item.children!.map(child => renderNavigationItem(child, depth + 1))}
          </ul>
        )}
      </li>
    )
  }

  const roving = useRovingTabIndex()

  // Sidebar positioning classes preserved
  const baseSidebarClasses = `fixed inset-y-0 left-0 z-30 bg-white border-r border-gray-200 transition-all duration-150 flex`

  const mobileSidebarClasses = isMobile ? 'fixed inset-y-0 left-0 z-50 bg-white shadow-lg transform transition-transform' : ''

  const effectiveWidth = collapsedEffective ? COLLAPSED_WIDTH : sidebarWidth

  return (
    <nav aria-label="Admin sidebar" className={`${baseSidebarClasses} ${isMobile ? mobileSidebarClasses : ''}`} style={{ width: effectiveWidth }}>
      <div className="flex-1 overflow-y-auto py-4">
        <div className="px-4 pb-4 border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold">NA</div>
              {!collapsedEffective && <div className="text-sm font-semibold">NextAccounting</div>}
            </div>
            {!collapsedEffective && (
              <div className="flex items-center gap-2">
                <button className="text-xs text-gray-500 hover:text-gray-700">Docs</button>
                <button className="text-xs text-gray-500 hover:text-gray-700">Support</button>
              </div>
            )}
          </div>
        </div>

        <div className="px-2 py-4 space-y-4">
          {navigation.map(section => (
            <div key={section.section}>
              {!collapsedEffective && <div className="px-3 text-xs text-gray-500 uppercase tracking-wide mb-2">{section.section}</div>}
              <ul className="space-y-1">
                {section.items.map(item => renderNavigationItem(item))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* Resizer */}
      {!isMobile && !collapsedEffective && (
        <div
          ref={resizerRef}
          role="separator"
          aria-orientation="vertical"
          tabIndex={0}
          onKeyDown={onResizerKeyDown}
          onMouseDown={onResizerMouseDown}
          onTouchStart={onResizerTouchStart}
          className="absolute right-0 top-0 h-full w-1 cursor-col-resize"
        />
      )}
    </nav>
  )
}
```

---

## File: src/components/admin/layout/AdminHeader.tsx

```tsx
/**
 * Admin Header Component
 * 
 * Professional header for the admin dashboard with:
 * - Breadcrumb navigation
 * - User profile dropdown
 * - Notifications bell
 * - Search functionality
 * - Mobile menu toggle
 */

'use client'

import { useState } from 'react'
import { usePathname } from 'next/navigation'
import { useSession, signOut } from 'next-auth/react'
import { 
  Bell, 
  Search, 
  Menu, 
  User, 
  Settings, 
  LogOut, 
  HelpCircle,
  ChevronDown,
  Home
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useClientNotifications } from '@/hooks/useClientNotifications'
import Link from 'next/link'
import TenantSwitcher from '@/components/admin/layout/TenantSwitcher'

interface AdminHeaderProps {
  onMenuToggle?: () => void
  isMobileMenuOpen?: boolean
}

function useBreadcrumbs() {
  const pathname = usePathname()
  
  const segments = pathname.split('/').filter(Boolean)
  const breadcrumbs = segments.map((segment, index) => {
    const href = '/' + segments.slice(0, index + 1).join('/')
    const label = segment.charAt(0).toUpperCase() + segment.slice(1).replace(/-/g, ' ')
    
    return { href, label, isLast: index === segments.length - 1 }
  })
  
  return breadcrumbs
}

export default function AdminHeader({ onMenuToggle, isMobileMenuOpen }: AdminHeaderProps) {
  const { data: session } = useSession()
  const [searchQuery, setSearchQuery] = useState('')
  const { unreadCount } = useClientNotifications()
  const breadcrumbs = useBreadcrumbs()

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      // TODO: Implement global search functionality
      console.log('Searching for:', searchQuery)
    }
  }

  const handleSignOut = async () => {
    await signOut({ callbackUrl: '/login' })
  }

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Left section - Mobile menu + Breadcrumbs */}
          <div className="flex items-center flex-1">
            {/* Mobile menu button */}
            <Button
              variant="ghost"
              size="sm"
              className="lg:hidden mr-2"
              onClick={onMenuToggle}
              aria-label="Toggle mobile menu"
            >
              <Menu className="h-5 w-5" />
            </Button>

            {/* Breadcrumbs */}
            <nav className="flex" aria-label="Breadcrumb">
              <ol className="flex items-center space-x-2 text-sm">
                <li>
                  <Link 
                    href="/admin" 
                    className="text-gray-500 hover:text-gray-700 flex items-center"
                  >
                    <Home className="h-4 w-4" />
                  </Link>
                </li>
                {breadcrumbs.map((breadcrumb, index) => (
                  <li key={breadcrumb.href} className="flex items-center">
                    <ChevronDown className="h-4 w-4 text-gray-400 rotate-[-90deg] mx-1" />
                    {breadcrumb.isLast ? (
                      <span className="text-gray-900 font-medium">
                        {breadcrumb.label}
                      </span>
                    ) : (
                      <Link
                        href={breadcrumb.href}
                        className="text-gray-500 hover:text-gray-700"
                      >
                        {breadcrumb.label}
                      </Link>
                    )}
                  </li>
                ))}
              </ol>
            </nav>
          </div>

          {/* Center section - Search */}
          <div className="hidden md:flex flex-1 max-w-md mx-8">
            <form onSubmit={handleSearch} className="w-full">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search admin panel..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                />
              </div>
            </form>
          </div>

          {/* Right section - Tenant + Notifications + User menu */}
          <div className="flex items-center space-x-4">
            <TenantSwitcher />
            {/* Notifications */}
            <Button
              variant="ghost"
              size="sm"
              className="relative"
              aria-label={`Notifications ${unreadCount ? `(${unreadCount} unread)` : ''}`}
            >
              <Bell className="h-5 w-5" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </Button>

            {/* Help */}
            <Button
              variant="ghost"
              size="sm"
              aria-label="Help"
              asChild
            >
              <Link href="/admin/help">
                <HelpCircle className="h-5 w-5" />
              </Link>
            </Button>

            {/* User menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center space-x-2 px-3">
                  <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center">
                    {session?.user?.image ? (
                      <img
                        src={session.user.image}
                        alt={session.user.name || 'User'}
                        className="h-8 w-8 rounded-full"
                      />
                    ) : (
                      <User className="h-4 w-4 text-gray-600" />
                    )}
                  </div>
                  <div className="hidden md:block text-left">
                    <div className="text-sm font-medium text-gray-900">
                      {session?.user?.name || 'Admin'}
                    </div>
                    <div className="text-xs text-gray-500">
                      {(session?.user as any)?.role || 'ADMIN'}
                    </div>
                  </div>
                  <ChevronDown className="h-4 w-4 text-gray-400" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuItem asChild>
                  <Link href="/admin/settings" className="flex items-center">
                    <User className="mr-2 h-4 w-4" />
                    Profile
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/admin/settings" className="flex items-center">
                    <Settings className="mr-2 h-4 w-4" />
                    Settings
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={handleSignOut}
                  className="flex items-center text-red-600 focus:text-red-600"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </header>
  )
}
```

---

## File: src/components/admin/layout/AdminFooter.tsx

```tsx
import React from 'react'
import Link from 'next/link'
import { BookOpen, Settings, ExternalLink } from 'lucide-react'

interface AdminFooterProps {
  sidebarCollapsed?: boolean
  isMobile?: boolean
  className?: string
}

export default function AdminFooter({ sidebarCollapsed = false, isMobile = false, className = '' }: AdminFooterProps) {
  const primaryLinks = [
    { label: 'Analytics', href: '/admin/analytics', icon: BookOpen },
    { label: 'Settings', href: '/admin/settings', icon: Settings },
    { label: 'Back to Main Site', href: '/', icon: ExternalLink, external: true },
  ]

  const APP_VERSION = 'v2.3.2'
  const RELEASE_DATE = 'Sept 26, 2025'
  const environment = process.env.NODE_ENV || 'development'

  if (isMobile) {
    return (
      <footer className={`bg-white border-t border-gray-200 px-4 py-3 mt-auto ${className}`} role="contentinfo" aria-label="Admin dashboard footer">
        <div className="max-w-7xl mx-auto flex flex-col items-center gap-2 text-sm text-gray-600">
          <div className="font-medium">NextAccounting Admin {APP_VERSION}</div>
          <div className="flex items-center gap-3">
            {primaryLinks.map((link) => {
              const Icon = link.icon as any
              return (
                <Link key={link.href} href={link.href} className="flex items-center gap-1.5 hover:text-gray-900">
                  <Icon className="w-4 h-4 text-gray-500" />
                  <span>{link.label}</span>
                </Link>
              )
            })}
          </div>
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <span className={`w-2 h-2 rounded-full ${environment === 'production' ? 'bg-green-500' : 'bg-yellow-400'}`} />
            <span>System Operational</span>
            <span aria-label="environment">{environment}</span>
          </div>
          <div className="text-xs text-gray-400">© 2025 NextAccounting. All rights reserved.</div>
        </div>
      </footer>
    )
  }

  return (
    <footer className={`bg-white border-t border-gray-200 px-4 py-2 mt-auto ${className}`} role="contentinfo" aria-label="Admin dashboard footer">
      <div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-3 items-center gap-4 text-sm text-gray-600">
        <div className="flex items-center gap-3">
          <div className="flex flex-col">
            <span className="font-medium">NextAccounting Admin</span>
            <span className="text-xs text-gray-500">{APP_VERSION} · {RELEASE_DATE}</span>
          </div>
          <div className="hidden sm:flex items-center gap-3 pl-4 border-l border-gray-200">
            {primaryLinks.map((link) => {
              const Icon = link.icon as any
              return (
                <Link key={link.href} href={link.href} className="flex items-center gap-1.5 hover:text-gray-900">
                  <Icon className="w-4 h-4 text-gray-500" />
                  <span>{link.label}</span>
                </Link>
              )
            })}
          </div>
        </div>

        <div className="hidden sm:flex items-center justify-center gap-2 text-xs text-gray-500">
          <span className={`w-2 h-2 rounded-full ${environment === 'production' ? 'bg-green-500' : 'bg-yellow-400'}`} />
          <span>System Operational</span>
          <span aria-label="environment">{environment}</span>
        </div>

        <div className="flex items-center justify-end gap-6">
          <div className="hidden sm:flex flex-col items-end">
            <span className="text-sm font-medium">Support</span>
            <div className="flex items-center gap-3 text-sm">
              <Link href="/admin/help" className="hover:text-gray-900">Admin Help</Link>
              <Link href="/docs" className="hover:text-gray-900">Documentation</Link>
            </div>
          </div>
          <div className="text-xs text-gray-400">© 2025 NextAccounting. All rights reserved.</div>
        </div>
      </div>
    </footer>
  )
}
```

---

## File: src/components/admin/layout/AdminErrorBoundary.tsx

```tsx
'use client'

import React from 'react'
import { AlertTriangle, RefreshCw } from 'lucide-react'

interface AdminErrorBoundaryState {
  hasError: boolean
  error: Error | null
  errorInfo: React.ErrorInfo | null
}

interface AdminErrorBoundaryProps {
  children: React.ReactNode
  fallback?: React.ComponentType<{ error: Error; resetError: () => void }>
}

/**
 * Enhanced Error Boundary for Admin Dashboard
 * Catches React errors including hydration mismatches
 */
class AdminErrorBoundary extends React.Component<AdminErrorBoundaryProps, AdminErrorBoundaryState> {
  constructor(props: AdminErrorBoundaryProps) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    }
  }

  static getDerivedStateFromError(error: Error): Partial<AdminErrorBoundaryState> {
    return {
      hasError: true,
      error
    }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    this.setState({
      error,
      errorInfo
    })

    // Log error details
    console.error('Admin Dashboard Error:', error)
    console.error('Component Stack:', errorInfo.componentStack)
    
    // Check if it's a hydration error (React Error #185)
    if (error.message?.includes('Minified React error #185')) {
      console.error('🚨 HYDRATION MISMATCH DETECTED:', {
        error: error.message,
        stack: error.stack,
        componentStack: errorInfo.componentStack
      })
    }
  }

  resetError = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    })
  }

  render() {
    if (this.state.hasError) {
      // Custom fallback component
      if (this.props.fallback) {
        const FallbackComponent = this.props.fallback
        return <FallbackComponent error={this.state.error!} resetError={this.resetError} />
      }

      // Default error UI
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex-shrink-0">
                <AlertTriangle className="h-8 w-8 text-red-500" />
              </div>
              <div>
                <h1 className="text-lg font-semibold text-gray-900">
                  Admin Dashboard Loading Error
                </h1>
                <p className="text-sm text-gray-600">
                  There was an error loading the admin dashboard. Please try refreshing the page.
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <button
                onClick={this.resetError}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                <RefreshCw className="h-4 w-4" />
                Try Again
              </button>

              <button
                onClick={() => window.location.reload()}
                className="w-full px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
              >
                Refresh Page
              </button>
            </div>

            {/* Development Error Details */}
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className="mt-4 p-4 bg-red-50 rounded-md">
                <summary className="text-sm font-medium text-red-800 cursor-pointer">
                  Error Details (Development Only)
                </summary>
                <div className="mt-2 text-xs text-red-700">
                  <div className="font-medium">Error Message:</div>
                  <div className="mb-2 p-2 bg-red-100 rounded text-red-900 font-mono">
                    {this.state.error.message}
                  </div>

                  {this.state.error.stack && (
                    <>
                      <div className="font-medium">Stack Trace:</div>
                      <pre className="mb-2 p-2 bg-red-100 rounded text-red-900 font-mono text-xs whitespace-pre-wrap overflow-auto max-h-32">
                        {this.state.error.stack}
                      </pre>
                    </>
                  )}

                  {this.state.errorInfo?.componentStack && (
                    <>
                      <div className="font-medium">Component Stack:</div>
                      <pre className="p-2 bg-red-100 rounded text-red-900 font-mono text-xs whitespace-pre-wrap overflow-auto max-h-32">
                        {this.state.errorInfo.componentStack}
                      </pre>
                    </>
                  )}
                </div>
              </details>
            )}
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

export default AdminErrorBoundary
```

---

## File: src/components/admin/layout/TenantSwitcher.tsx

```tsx
'use client'

import { useEffect, useMemo, useState } from 'react'
import { useSession } from 'next-auth/react'
import { Button } from '@/components/ui/button'

function getCookie(name: string): string | null {
  try {
    const m = document.cookie.split(';').map(s => s.trim()).find(s => s.startsWith(name + '='))
    return m ? decodeURIComponent(m.split('=')[1]) : null
  } catch {
    return null
  }
}

function setCookie(name: string, value: string, days = 365) {
  try {
    const expires = new Date(Date.now() + days*24*60*60*1000).toUTCString()
    document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/; SameSite=Lax`
  } catch {}
}

export default function TenantSwitcher() {
  const { data: session } = useSession()
  const availableTenants: Array<{ id: string; slug: string | null; name: string | null; role: string | null }>
    = (session?.user as any)?.availableTenants || []

  const [tenant, setTenant] = useState('')
  const [initialized, setInitialized] = useState(false)

  useEffect(() => {
    try {
      const currentFromSession = (session?.user as any)?.tenantId || ''
      const cookieTenant = getCookie('tenant')
      const lsTenant = typeof window !== 'undefined' ? window.localStorage.getItem('adminTenant') : null
      const current = currentFromSession || cookieTenant || lsTenant || ''
      setTenant(current)
    } finally {
      setInitialized(true)
    }
  }, [session])

  const canSave = useMemo(() => initialized && (!!tenant && tenant.length > 0), [initialized, tenant])

  const save = async () => {
    if (!canSave) return
    const val = tenant.trim()
    if (!val) return

    try {
      const res = await fetch('/api/tenant/switch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tenantId: val })
      })
      if (res.ok) {
        try { window.localStorage.setItem('adminTenant', val) } catch {}
        window.location.reload()
        return
      }
    } catch {
      try { window.localStorage.setItem('adminTenant', val) } catch {}
      setCookie('tenant', val)
      window.location.reload()
    }
  }

  const hasChoices = Array.isArray(availableTenants) && availableTenants.length > 0

  return (
    <div className="flex items-center gap-2">
      {hasChoices ? (
        <select
          value={tenant}
          onChange={(e) => setTenant(e.target.value)}
          className="w-40 md:w-56 px-2 py-1 border border-gray-300 rounded text-sm bg-white"
          aria-label="Select tenant"
        >
          {availableTenants.map(t => (
            <option key={t.id} value={t.id}>
              {(t.name || t.slug || t.id)}{t.role ? ` · ${t.role}` : ''}
            </option>
          ))}
        </select>
      ) : (
        <input
          value={tenant}
          onChange={(e) => setTenant(e.target.value)}
          placeholder="tenant id"
          className="w-28 md:w-36 px-2 py-1 border border-gray-300 rounded text-sm"
          aria-label="Tenant ID"
        />
      )}
      <Button variant="outline" size="sm" onClick={save} aria-label="Set tenant">Set</Button>
    </div>
  )
}
```

---

If you'd like I can also:
- Add a new AdminLayout index file that exports these components and a usage example.
- Create a README describing how to use AdminDashboardLayoutLazy in app/admin/layout.tsx.

Tell me which of those you'd like next.
