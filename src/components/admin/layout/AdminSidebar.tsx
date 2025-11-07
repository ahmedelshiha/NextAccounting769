'use client'

import { useState, useEffect, useMemo } from 'react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { useSession } from 'next-auth/react'
import React from 'react'
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
  Building
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { useUnifiedData } from '@/hooks/useUnifiedData'
import { hasPermission, PERMISSIONS } from '@/lib/permissions'
import SETTINGS_REGISTRY from '@/lib/settings/registry'
import useRovingTabIndex from '@/hooks/useRovingTabIndex'
import SidebarHeader from './SidebarHeader'
import SidebarFooter from './SidebarFooter'
import { useSidebarCollapsed, useSidebarActions, useExpandedGroups } from '@/stores/admin/layout.store.selectors'
import { useMenuCustomizationStore } from '@/stores/admin/menuCustomization.store'
import { applyCustomizationToNavigation } from '@/lib/menu/menuUtils'

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
  onOpenMenuCustomization?: () => void
}

function AdminSidebar(props: AdminSidebarProps) {
  const { collapsed, isCollapsed: isCollapsedProp, isMobile = false, isOpen = false, onToggle, onClose, onOpenMenuCustomization } = props
  const pathname = usePathname()
  const { data: session } = useSession()

  // Fixed sidebar width (desktop) - resizing disabled
  const DEFAULT_WIDTH = 256
  const COLLAPSED_WIDTH = 64

  // Integrate with centralized Zustand store for state management
  // Use selectors to read/write sidebar state
  const storeCollapsed = useSidebarCollapsed()
  const { setCollapsed: storeSetCollapsed, setExpandedGroups } = useSidebarActions()
  const expandedSections = useExpandedGroups()

  // Fetch notification counts for badges
  const { data: counts } = useUnifiedData({
    key: 'stats/counts',
    events: ['booking-created', 'service-request-created', 'task-created'],
    revalidateOnEvents: true,
  })

  const userRole = (session?.user as any)?.role

  // Get menu customization from store
  const { customization } = useMenuCustomizationStore()

  const defaultNavigation: { section: string; items: NavigationItem[] }[] = [
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
        { name: 'Chat', href: '/admin/chat', icon: Mail },
        { name: 'Reminders', href: '/admin/reminders', icon: Bell },
      ]
    },
    {
      section: 'system',
      items: [
        { name: 'User Management', href: '/admin/users', icon: Users, permission: PERMISSIONS.USERS_MANAGE },
        { name: 'Audits', href: '/admin/audits', icon: FileText, permission: PERMISSIONS.ANALYTICS_VIEW },
        { name: 'Compliance', href: '/admin/compliance', icon: CheckSquare, permission: PERMISSIONS.SECURITY_COMPLIANCE_SETTINGS_VIEW },
        { name: 'Integrations', href: '/admin/integrations', icon: Briefcase, permission: PERMISSIONS.INTEGRATION_HUB_VIEW },
        { name: 'Security', href: '/admin/security', icon: Shield, permission: PERMISSIONS.SECURITY_COMPLIANCE_SETTINGS_VIEW },
        { name: 'Posts', href: '/admin/posts', icon: FileText, permission: PERMISSIONS.ANALYTICS_VIEW },
        { name: 'Newsletter', href: '/admin/newsletter', icon: Mail, permission: PERMISSIONS.COMMUNICATION_SETTINGS_VIEW },
        { name: 'Notifications', href: '/admin/notifications', icon: Bell, permission: PERMISSIONS.COMMUNICATION_SETTINGS_VIEW },
        { name: 'Performance Metrics', href: '/admin/perf-metrics', icon: BarChart3, permission: PERMISSIONS.ANALYTICS_VIEW },
      ]
    }
  ]

  // Apply customization to navigation with memoization for performance
  const navigation = useMemo(
    () => applyCustomizationToNavigation(defaultNavigation, customization),
    [customization]
  )

  const toggleSection = (section: string) => {
    const sections = expandedSections || []
    const newSections = sections.includes(section)
      ? sections.filter(s => s !== section)
      : [...sections, section]
    setExpandedGroups(newSections)
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
    const isExpanded = (expandedSections || []).includes(item.href.split('/').pop() || '')

    const baseStyles = `
      transition-all duration-200 flex items-center rounded-lg font-medium relative
      group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2
    `

    const expandedItemStyles = `
      w-full px-3 py-1.5 text-sm
      ${isActive
        ? 'bg-blue-100 text-blue-700 border-r-2 border-blue-500'
        : 'text-gray-700 hover:text-gray-900 hover:bg-gray-100 active:bg-gray-200'
      }
    `

    const collapsedItemStyles = `
      w-10 h-10 flex items-center justify-center flex-shrink-0
      ${isActive
        ? 'bg-blue-100 text-blue-600'
        : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100 active:bg-gray-200'
      }
    `

    return (
      <li key={item.href}>
        <div className="relative">
          {hasChildren ? (
            <button
              onClick={() => toggleSection(item.href.split('/').pop() || '')}
              aria-expanded={isExpanded}
              aria-controls={`nav-${(item.href.split('/').pop() || '').replace(/[^a-zA-Z0-9_-]/g, '')}`}
              data-roving
              {...(storeCollapsed ? { 'aria-label': item.name, title: item.name } : {})}
              className={`${baseStyles} ${storeCollapsed ? collapsedItemStyles : expandedItemStyles} ${depth > 0 ? 'ml-4' : ''}`}
            >
              <item.icon className={`flex-shrink-0 h-5 w-5 ${storeCollapsed ? '' : 'mr-3'} ${isActive ? 'text-blue-600' : 'text-gray-500'}`} />
              {!storeCollapsed && (
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
          ) : (
            <Link
              href={item.href}
              aria-current={isActive ? 'page' : undefined}
              onClick={isMobile ? onClose : undefined}
              data-roving
              {...(storeCollapsed ? { 'aria-label': item.name, title: item.name } : {})}
              className={`${baseStyles} ${storeCollapsed ? collapsedItemStyles : expandedItemStyles} ${depth > 0 ? 'ml-4' : ''}`}
            >
              <item.icon className={`flex-shrink-0 h-5 w-5 ${storeCollapsed ? '' : 'mr-3'} ${isActive ? 'text-blue-600' : 'text-gray-500'}`} />
              {!storeCollapsed && (
                <>
                  <span className="flex-1 text-left">{item.name}</span>
                  {item.badge && (
                    <Badge variant="secondary" className="ml-2">{item.badge}</Badge>
                  )}
                </>
              )}
            </Link>
          )}
        </div>

        {hasChildren && isExpanded && !storeCollapsed && (
          <ul id={`nav-${(item.href.split('/').pop() || '').replace(/[^a-zA-Z0-9_-]/g, '')}`} className="mt-1 space-y-1" role="group" aria-label={`${item.name} submenu`}>
            {item.children!.map(child => renderNavigationItem(child, depth + 1))}
          </ul>
        )}
      </li>
    )
  }

  const roving = useRovingTabIndex()

  // Sidebar positioning classes preserved
  const baseSidebarClasses = `fixed inset-y-0 left-0 z-30 bg-white border-r border-gray-200 transition-all duration-300 ease-in-out flex flex-col`

  const mobileSidebarClasses = isMobile ? 'fixed inset-y-0 left-0 z-50 bg-white shadow-xl transform transition-transform duration-300 ease-in-out' : ''

  const effectiveWidth = storeCollapsed ? COLLAPSED_WIDTH : DEFAULT_WIDTH

  return (
    <>
      {isMobile && isOpen && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75 z-40" onClick={onClose} />
      )}

      <div
        // role navigation preserved
        role="navigation"
        aria-label="Admin sidebar"
        className={`${baseSidebarClasses} ${isMobile ? mobileSidebarClasses : ''}`}
        style={{ width: `${effectiveWidth}px`, transition: 'width 300ms ease-in-out' }}
      >
        <div className="flex flex-col h-full w-full">
          <SidebarHeader collapsed={storeCollapsed} />

          <nav className={`flex-1 overflow-y-auto transition-all duration-300 ${storeCollapsed ? 'px-2 py-3 space-y-2' : 'px-4 py-4 space-y-4'}`} role="navigation" aria-label="Admin sidebar">
            {navigation.map(section => {
              const sectionItems = section.items.filter(item => hasAccess(item.permission))
              if (sectionItems.length === 0) return null

              return (
                <div key={section.section}>
                  {!storeCollapsed && (
                    <h3 className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">{section.section}</h3>
                  )}
                  <ul className={`${storeCollapsed ? 'space-y-1' : 'space-y-1'}`} ref={(el) => { try { if (el) (roving.setContainer as any)(el as any); } catch{} }} onKeyDown={(e:any) => { try { (roving.handleKeyDown as any)(e.nativeEvent || e); } catch{} }}>
                    {sectionItems.map(item => renderNavigationItem(item))}
                  </ul>
                </div>
              )
            })}
          </nav>

          <SidebarFooter collapsed={storeCollapsed} isMobile={isMobile} onClose={onClose} onOpenMenuCustomization={onOpenMenuCustomization} />
        </div>

        {/* Resizer - only on desktop and when not collapsed */}
        {/* Resizer disabled - fixed width sidebar */}
      </div>
    </>
  )
}

// Memoize the component for performance optimization
// Prevents unnecessary re-renders when parent components update
// but props and customization remain unchanged
export default React.memo(AdminSidebar)
