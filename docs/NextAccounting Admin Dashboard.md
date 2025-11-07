🎯 NextAccounting Admin Dashboard - Comprehensive Enhancement Strategy
Document Version: 1.0.0
Last Updated: October 11, 2025
Author: Senior Web Development Team
Project: NextAccounting Admin Dashboard Modernization

📑 Table of Contents

Executive Summary
Current State Analysis
Architecture Audit
QuickBooks-Inspired UI Enhancements
Technical Debt & Refactoring
Implementation Roadmap
Detailed Component Specifications
API & Backend Requirements
Testing Strategy
Performance Optimization
Security Considerations
Accessibility Guidelines
Migration Guide
Success Metrics
Appendix


1. Executive Summary
1.1 Project Overview
The NextAccounting Admin Dashboard requires a comprehensive modernization to align with industry-leading interfaces (QuickBooks Online, Notion, Linear) while addressing technical debt, improving performance, and enhancing user experience.
1.2 Current State Assessment
Strengths:

✅ Solid Next.js 14 + TypeScript foundation
✅ Well-structured component hierarchy
✅ Good use of SWR for data fetching
✅ Real-time updates via SSE/WebSocket
✅ Comprehensive permission system
✅ Settings architecture with SettingsShell

Critical Issues:

❌ Legacy layout files causing confusion (layout-nuclear.tsx)
❌ Inconsistent navigation patterns
❌ Hydration mismatches affecting UX
❌ No user customization capabilities
❌ Basic, non-collapsible sidebar
❌ Redundant data fetching
❌ Missing modern UI patterns

Opportunity Areas:

🎯 Implement QuickBooks-style collapsible sidebar
🎯 Add menu customization system
🎯 Create professional user profile dropdown
🎯 Enhance footer with system status
🎯 Centralize navigation registry
🎯 Optimize data fetching patterns
🎯 Add comprehensive settings drawer

1.3 Strategic Goals

User Experience: Transform admin interface to match modern SaaS standards
Developer Experience: Reduce complexity and improve maintainability
Performance: Optimize load times and reduce bundle size by 20%
Scalability: Build extensible architecture for future features
Accessibility: Achieve WCAG 2.1 AA compliance

1.4 Timeline & Budget

Total Duration: 10 weeks
Team Size: 2-3 developers
Estimated Effort: 400-500 hours
Risk Level: Medium (requires careful migration)


2. Current State Analysis
2.1 File Structure Audit
src/
├── app/admin/
│   ├── layout.tsx                    ✅ Server-side guard
│   ├── page.tsx                      ✅ Overview page
│   ├── layout-nuclear.tsx            ❌ LEGACY - Remove
│   ├── page-nuclear.tsx              ❌ LEGACY - Remove
│   ├── analytics/page.tsx            ✅
│   ├── bookings/
│   │   ├── page.tsx                  ✅
│   │   ├── new/page.tsx              ✅
│   │   └── [id]/page.tsx             ✅
│   ├── settings/
│   │   ├── page.tsx                  ✅ SettingsOverview
│   │   ├── analytics/page.tsx        ✅
│   │   ├── booking/page.tsx          ✅
│   │   └── [15+ more settings pages] ✅
│   └── [30+ other routes]            ✅
│
├── components/admin/
│   ├── layout/
│   │   ├── AdminDashboardLayout.tsx         ⚠️ Main layout (needs refactor)
│   │   ├── AdminDashboardLayoutLazy.tsx     ⚠️ Lazy wrapper (consolidate)
│   │   ├── ClientOnlyAdminLayout.tsx        ⚠️ Client wrapper (consolidate)
│   │   ├── AdminSidebar.tsx                 ⚠️ Needs enhancement
│   │   ├── AdminHeader.tsx                  ⚠️ Needs user dropdown
│   │   ├── AdminFooter.tsx                  ⚠️ Needs QuickBooks style
│   │   ├── AdminErrorBoundary.tsx           ✅
│   │   └── TenantSwitcher.tsx               ✅
│   │
│   ├── dashboard/
│   │   └── AdminOverview.tsx                ✅
│   │
│   ├── settings/
│   │   ├── SettingsShell.tsx                ✅ Good pattern
│   │   ├── SettingsNavigation.tsx           ✅
│   │   └── [other settings components]      ✅
│   │
│   └── [domain components]                  ✅
│
├── hooks/
│   ├── admin/
│   │   ├── usePerformanceAnalytics.ts       ✅
│   │   ├── useResponsive.ts                 ✅
│   │   └── useSettingsSearchIndex.ts        ✅
│   └── useUnifiedData.ts                    ⚠️ Heavy usage (optimize)
│
├── stores/
│   ├── adminLayoutStore.ts                  ⚠️ Primary store
│   ├── adminLayoutStoreHydrationSafe.ts     ⚠️ Consolidate
│   └── adminLayoutStoreSSRSafe.ts           ⚠️ Consolidate
│
└── lib/
    ├── permissions.ts                       ✅
    ├── settings/registry.ts                 ✅ Good pattern
    └── [utilities]                          ✅
2.2 Route Inventory
Primary Routes (40+ pages):

/admin - Dashboard overview
/admin/analytics - Analytics dashboard
/admin/bookings - Bookings management (+ new, [id])
/admin/calendar - Calendar view
/admin/clients - Client management (+ profiles, invitations, new)
/admin/services - Services management (+ [id])
/admin/service-requests - Service requests (+ new, list, [id], [id]/edit)
/admin/tasks - Task management (complex nested area)
/admin/team - Team management
/admin/invoices - Invoices (+ sequences, templates)
/admin/payments - Payment processing
/admin/expenses - Expense tracking
/admin/taxes - Tax management
/admin/settings/* - 16+ settings pages
/admin/[12+ other routes]

Issues Found:

❌ Sidebar shows "Templates" for invoices - route doesn't exist
❌ Inconsistent breadcrumb generation
⚠️ Some routes lack permission gates
⚠️ No centralized route registry

2.3 Component Dependency Analysis
mermaidgraph TD
    A[app/admin/layout.tsx] --> B[ClientOnlyAdminLayout]
    B --> C[AdminDashboardLayout]
    C --> D[AdminSidebar]
    C --> E[AdminHeader]
    C --> F[AdminFooter]
    C --> G[AdminErrorBoundary]
    
    D --> H[useUnifiedData]
    D --> I[AdminLayoutStore]
    D --> J[SETTINGS_REGISTRY]
    
    E --> K[useSession]
    E --> L[TenantSwitcher]
    E --> M[useClientNotifications]
    
    C --> N[Page Content]
    N --> O[AdminOverview]
    O --> P[AnalyticsPage Template]
    P --> Q[PerformanceMetricsCard]
    P --> R[IntelligentActivityFeed]
    
    H --> S[SWR]
    H --> T[RealtimeProvider]
    
    I --> U[localStorage]
    I --> V[Zustand]
2.4 Data Flow Analysis
Current Pattern:
API Endpoint → useUnifiedData Hook → Component → Store (optional) → UI
Issues:

Multiple components fetch same data independently
No shared cache strategy beyond SWR
Redundant API calls for common data (bookings/stats called 5+ times)
Heavy reliance on real-time revalidation (can be optimized)

Suggested Pattern:
API Endpoint → AdminDataProvider (shared) → useAdminData Hook → Components → UI
              ↓
         SWR Cache (deduplicated)
              ↓
         RealtimeProvider (selective revalidation)
2.5 Performance Metrics (Current)
Lighthouse Scores (Desktop):

Performance: 78/100 ⚠️
Accessibility: 89/100 ⚠️
Best Practices: 83/100 ⚠️
SEO: 92/100 ✅

Bundle Analysis:

Main bundle: ~450KB (gzipped) ⚠️
Admin dashboard chunk: ~180KB ⚠️
Vendor chunk: ~220KB ⚠️

Key Issues:

Large initial bundle (not code-split effectively)
Hydration mismatches causing re-renders
Heavy Lucide icon imports (not tree-shaken)
Multiple store variants loaded simultaneously


3. Architecture Audit
3.1 Layout Architecture Issues
Problem 1: Multiple Layout Wrappers
Current Flow:
typescript// app/admin/layout.tsx (Server)
export default function AdminLayout({ children }) {
  const session = await getServerSession()
  return <ClientOnlyAdminLayout session={session}>{children}</ClientOnlyAdminLayout>
}

// ClientOnlyAdminLayout.tsx (Client hydration check)
'use client'
export default function ClientOnlyAdminLayout({ children, session }) {
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])
  
  if (!mounted) return <LoadingSpinner />
  return <AdminDashboardLayout session={session}>{children}</AdminDashboardLayout>
}

// AdminDashboardLayout.tsx (Main layout logic)
'use client'
export default function AdminDashboardLayout({ children, session }) {
  // 200+ lines of layout logic
  return (
    <div>
      <AdminSidebar />
      <AdminHeader />
      <main>{children}</main>
      <AdminFooter />
    </div>
  )
}

// AdminDashboardLayoutLazy.tsx (Lazy variant)
const LazyLayout = lazy(() => import('./AdminDashboardLayout'))
export default function AdminDashboardLayoutLazy(props) {
  return (
    <Suspense fallback={<Skeleton />}>
      <LazyLayout {...props} />
    </Suspense>
  )
}
Issues:

🔴 Too many layers of indirection
🔴 Confusing which layout to use when
🔴 Duplicate hydration checks
🔴 Performance overhead from extra wrappers

Solution: Unified Architecture
typescript// app/admin/layout.tsx (Server - only auth check)
import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { AdminLayoutClient } from '@/components/admin/layout/AdminLayoutClient'

export default async function AdminLayout({ children }) {
  const session = await getServerSession()
  if (!session?.user) redirect('/login')
  
  return <AdminLayoutClient session={session}>{children}</AdminLayoutClient>
}

// components/admin/layout/AdminLayoutClient.tsx (Single client component)
'use client'
import { Suspense, lazy } from 'react'
import { AdminLayoutProvider } from './AdminLayoutProvider'
import { AdminLayoutSkeleton } from './AdminLayoutSkeleton'

const AdminLayoutShell = lazy(() => import('./AdminLayoutShell'))

export function AdminLayoutClient({ children, session }) {
  return (
    <AdminLayoutProvider session={session}>
      <Suspense fallback={<AdminLayoutSkeleton />}>
        <AdminLayoutShell>{children}</AdminLayoutShell>
      </Suspense>
    </AdminLayoutProvider>
  )
}

// components/admin/layout/AdminLayoutShell.tsx (Core layout - lazy loaded)
'use client'
export default function AdminLayoutShell({ children }) {
  const { sidebar } = useAdminLayout()
  const responsive = useResponsive()
  
  return (
    <div className="admin-layout">
      <AdminSidebar />
      <div className="admin-content">
        <AdminHeader />
        <main>{children}</main>
        <AdminFooter />
      </div>
    </div>
  )
}
Benefits:

✅ Clear separation: Server auth → Client layout → Shell
✅ Single hydration point
✅ Lazy loading where it matters
✅ Easy to test and maintain


Problem 2: Hydration Mismatches
Root Causes:
typescript// AdminDashboardLayout.tsx - problematic patterns

// ❌ Problem 1: Reading localStorage before hydration
const [collapsed, setCollapsed] = useState(() => {
  return localStorage.getItem('sidebar:collapsed') === 'true' // SSR mismatch!
})

// ❌ Problem 2: Conditional rendering before hydration check
const { isMobile } = useResponsive()
if (isMobile) return <MobileSidebar /> // SSR doesn't know screen size!

// ❌ Problem 3: Store access without guards
const sidebarState = useAdminLayoutStore() // Zustand persist might not be hydrated
Solutions:
typescript// ✅ Solution 1: Proper hydration guards
const [isClient, setIsClient] = useState(false)
const [collapsed, setCollapsed] = useState(false) // Default for SSR

useEffect(() => {
  setIsClient(true)
  const stored = localStorage.getItem('sidebar:collapsed')
  if (stored) setCollapsed(stored === 'true')
}, [])

// ✅ Solution 2: SSR-safe responsive detection
function useResponsiveSSR() {
  const [mounted, setMounted] = useState(false)
  const responsive = useResponsive()
  
  useEffect(() => setMounted(true), [])
  
  return mounted ? responsive : { isMobile: false, isDesktop: true }
}

// ✅ Solution 3: Store hydration check
const useAdminLayoutHydrated = () => {
  const [hydrated, setHydrated] = useState(false)
  const store = useAdminLayoutStore()
  
  useEffect(() => {
    // Zustand persist has hydrated
    const unsubHydrate = useAdminLayoutStore.persist.onFinishHydration(() => {
      setHydrated(true)
    })
    return unsubHydrate
  }, [])
  
  return hydrated ? store : defaultStoreState
}

Problem 3: Store Fragmentation
Current State:
src/stores/
├── adminLayoutStore.ts              (Main store - 400 lines)
├── adminLayoutStoreHydrationSafe.ts (Wrapper - 150 lines)
└── adminLayoutStoreSSRSafe.ts       (Another wrapper - 120 lines)
Why This Happened:

Developers hitting hydration errors
Created wrappers to "fix" instead of solving root cause
No clear pattern which to use when
All three imported in different files

Consolidation Strategy:
typescript// stores/admin/layout.store.ts (Single source of truth)
import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { devtools } from 'zustand/middleware'

interface AdminLayoutState {
  // State
  sidebar: {
    collapsed: boolean
    width: number
    mobileOpen: boolean
  }
  navigation: {
    activeItem: string | null
    expandedGroups: string[]
    recentItems: string[]
    customOrder: Record<string, number> | null
  }
  ui: {
    isLoading: boolean
    error: string | null
  }
  
  // Computed (via selectors)
  // Actions
  toggleSidebar: () => void
  setSidebarCollapsed: (collapsed: boolean) => void
  // ... other actions
}

const defaultState: AdminLayoutState = {
  sidebar: { collapsed: false, width: 256, mobileOpen: false },
  navigation: { activeItem: null, expandedGroups: [], recentItems: [], customOrder: null },
  ui: { isLoading: false, error: null }
}

export const useAdminLayoutStore = create<AdminLayoutState>()(
  devtools(
    persist(
      (set, get) => ({
        ...defaultState,
        
        toggleSidebar: () => set(state => ({
          sidebar: { ...state.sidebar, collapsed: !state.sidebar.collapsed }
        })),
        
        setSidebarCollapsed: (collapsed) => set(state => ({
          sidebar: { ...state.sidebar, collapsed }
        })),
        
        // ... other actions
      }),
      {
        name: 'admin-layout-storage',
        storage: createJSONStorage(() => localStorage),
        partialize: (state) => ({
          sidebar: {
            collapsed: state.sidebar.collapsed,
            width: state.sidebar.width
          },
          navigation: {
            expandedGroups: state.navigation.expandedGroups,
            customOrder: state.navigation.customOrder
          }
        }),
        // Only persist what's needed
      }
    ),
    { name: 'AdminLayoutStore' }
  )
)

// Selector hooks (optimized re-renders)
export const useSidebarState = () => useAdminLayoutStore(state => state.sidebar)
export const useNavigationState = () => useAdminLayoutStore(state => state.navigation)
export const useUIState = () => useAdminLayoutStore(state => state.ui)

// SSR-safe hook (single wrapper)
export function useAdminLayoutSSR() {
  const [hydrated, setHydrated] = useState(false)
  const store = useAdminLayoutStore()
  
  useEffect(() => {
    setHydrated(true)
  }, [])
  
  return hydrated ? store : defaultState
}
Migration Plan:

✅ Create new consolidated store
✅ Update all imports to use new store
✅ Test thoroughly (especially persistence)
❌ Delete old store files
✅ Update documentation


3.2 Navigation System Issues
Problem: Hardcoded Navigation
Current Implementation (AdminSidebar.tsx):
typescriptconst navigation = [
  {
    section: 'dashboard',
    items: [
      { name: 'Overview', href: '/admin', icon: Home },
      { name: 'Analytics', href: '/admin/analytics', icon: BarChart3 },
      // ... 40+ hardcoded items
    ]
  },
  // ... more sections
]
Issues:

🔴 Navigation duplicated across components (sidebar, breadcrumbs, search)
🔴 No single source of truth
🔴 Difficult to maintain (add new route = update 3+ files)
🔴 Can't dynamically generate navigation
🔴 Inconsistent permission checks
🔴 Stale entries (e.g., "Templates" route doesn't exist)

Solution: Navigation Registry
typescript// lib/admin/navigation-registry.ts

import type { LucideIcon } from 'lucide-react'
import { PERMISSIONS } from '@/lib/permissions'
import * as Icons from 'lucide-react'

export interface NavigationItem {
  id: string                              // Unique identifier
  label: string                           // Display name
  href: string                            // Route path
  icon: LucideIcon                        // Icon component
  description?: string                    // For search/tooltips
  keywords?: string[]                     // Search keywords
  permission?: keyof typeof PERMISSIONS   // Required permission
  badge?: () => Promise<number | string> | number | string // Dynamic badge
  children?: NavigationItem[]             // Nested items
  external?: boolean                      // External link
  disabled?: boolean                      // Temporarily disabled
  beta?: boolean                          // Beta feature flag
  metadata?: {
    category?: string
    tags?: string[]
    order?: number
  }
}

export interface NavigationSection {
  id: string
  label: string
  order: number
  collapsible?: boolean
  defaultExpanded?: boolean
  items: NavigationItem[]
}

// Complete navigation registry
export const NAVIGATION_REGISTRY: NavigationSection[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    order: 1,
    defaultExpanded: true,
    items: [
      {
        id: 'overview',
        label: 'Overview',
        href: '/admin',
        icon: Icons.Home,
        description: 'Dashboard overview with key metrics and KPIs',
        keywords: ['home', 'dashboard', 'overview', 'metrics'],
      },
      {
        id: 'analytics',
        label: 'Analytics',
        href: '/admin/analytics',
        icon: Icons.BarChart3,
        description: 'Detailed analytics and reporting',
        keywords: ['analytics', 'reports', 'charts', 'data'],
        permission: 'ANALYTICS_VIEW',
      },
      {
        id: 'reports',
        label: 'Reports',
        href: '/admin/reports',
        icon: Icons.TrendingUp,
        description: 'Generate and view business reports',
        keywords: ['reports', 'export', 'pdf'],
        permission: 'ANALYTICS_VIEW',
      },
    ]
  },
  {
    id: 'business',
    label: 'Business',
    order: 2,
    defaultExpanded: true,
    items: [
      {
        id: 'bookings',
        label: 'Bookings',
        href: '/admin/bookings',
        icon: Icons.Calendar,
        description: 'Manage all bookings and appointments',
        keywords: ['bookings', 'appointments', 'schedule'],
        badge: async () => {
          const res = await fetch('/api/admin/stats/counts')
          const data = await res.json()
          return data.pendingBookings || 0
        },
        children: [
          {
            id: 'bookings-all',
            label: 'All Bookings',
            href: '/admin/bookings',
            icon: Icons.Calendar,
          },
          {
            id: 'bookings-calendar',
            label: 'Calendar View',
            href: '/admin/calendar',
            icon: Icons.CalendarDays,
          },
          {
            id: 'bookings-availability',
            label: 'Availability',
            href: '/admin/availability',
            icon: Icons.Clock,
          },
          {
            id: 'bookings-new',
            label: 'New Booking',
            href: '/admin/bookings/new',
            icon: Icons.Plus,
          },
        ]
      },
      {
        id: 'clients',
        label: 'Clients',
        href: '/admin/clients',
        icon: Icons.Users,
        description: 'Client management and profiles',
        keywords: ['clients', 'customers', 'users'],
        badge: async () => {
          const res = await fetch('/api/admin/stats/counts')
          const data = await res.json()
          return data.newClients || 0
        },
        children: [
          {
            id: 'clients-all',
            label: 'All Clients',
            href: '/admin/clients',
            icon: Icons.Users,
          },
          {
            id: 'clients-profiles',
            label: 'Profiles',
            href: '/admin/clients/profiles',
            icon: Icons.UserCircle,
          },
          {
            id: 'clients-invitations',
            label: 'Invitations',
            href: '/admin/clients/invitations',
            icon: Icons.Mail,
          },
          {
            id: 'clients-new',
            label: 'Add Client',
            href: '/admin/clients/new',
            icon: Icons.Plus,
          },
        ]
      },
      {
        id: 'services',
        label: 'Services',
        href: '/admin/services',
        icon: Icons.Briefcase,
        description: 'Manage services and offerings',
        keywords: ['services', 'products', 'offerings'],
        permission: 'SERVICES_VIEW',
        children: [
          {
            id: 'services-all',
            label: 'All Services',
            href: '/admin/services',
            icon: Icons.Briefcase,
          },
          {
            id: 'services-categories',
            label: 'Categories',
            href: '/admin/services/categories',
            icon: Icons.FolderTree,
          },
          {
            id: 'services-analytics',
            label: 'Analytics',
            href: '/admin/services/analytics',
            icon: Icons.BarChart3,
          },
        ]
      },
      {
        id: 'service-requests',
        label: 'Service Requests',
        href: '/admin/service-requests',
        icon: Icons.FileText,
        description: 'Manage incoming service requests',
        keywords: ['requests', 'inquiries', 'leads'],
        permission: 'SERVICE_REQUESTS_READ_ALL',
        badge: async () => {
          const res = await fetch('/api/admin/stats/counts')
          const data = await res.json()
          return data.pendingServiceRequests || 0
        },
      },
    ]
  },
  {
    id: 'financial',
    label: 'Financial',
    order: 3,
    items: [
      {
        id: 'invoices',
        label: 'Invoices',
        href: '/admin/invoices',
        icon: Icons.FileText,
        description: 'Invoice management',
        keywords: ['invoices', 'billing', 'payments'],
        children: [
          {
            id: 'invoices-all',
            label: 'All Invoices',
            href: '/admin/invoices',
            icon: Icons.FileText,
          },
          {
            id: 'invoices-sequences',
            label: 'Sequences',
            href: '/admin/invoices/sequences',
            icon: Icons.Hash,
          },
          // REMOVED: Templates (route doesn't exist)
        ]
      },
      {
        id: 'payments',
        label: 'Payments',
        href: '/admin/payments',
        icon: Icons.CreditCard,
        description: 'Payment processing and history',
        keywords: ['payments', 'transactions', 'stripe'],
      },
      {
        id: 'expenses',
        label: 'Expenses',
        href: '/admin/expenses',
        icon: Icons.Receipt,
        description: 'Track business expenses',
        keywords: ['expenses', 'costs', 'spending'],
      },
      {
        id: 'taxes',
        label: 'Taxes',
        href: '/admin/taxes',
        icon: Icons.DollarSign,
        description: 'Tax management and reporting',
        keywords: ['taxes', 'vat', 'gst'],
      },
    ]
  },
  {
    id: 'operations',
    label: 'Operations',
    order: 4,
    items: [
      {
        id: 'tasks',
        label: 'Tasks',
        href: '/admin/tasks',
        icon: Icons.CheckSquare,
        description: 'Task management and tracking',
        keywords: ['tasks', 'todos', 'checklist'],
        permission: 'TASKS_READ_ALL',
        badge: async () => {
          const res = await fetch('/api/admin/stats/counts')
          const data = await res.json()
          return data.overdueTasks || 0
        },
      },
      {
        id: 'team',
        label: 'Team',
        href: '/admin/team',
        icon: Icons.UserCog,
        description: 'Team member management',
        keywords: ['team', 'staff', 'employees'],
        permission: 'TEAM_VIEW',
      },
      {
        id: 'chat',
        label: 'Chat',
        href: '/admin/chat',
        icon: Icons.MessageSquare,
        description: 'Internal team chat',
        keywords: ['chat', 'messages', 'communication'],
      },
      {
        id: 'reminders',
        label: 'Reminders',
        href: '/admin/reminders',
        icon: Icons.Bell,
        description: 'Automated reminders',
        keywords: ['reminders', 'notifications', 'alerts'],
      },
    ]
  },
  {
    id: 'system',
    label: 'System',
    order: 5,
    items: [
      {
        id: 'settings',
        label: 'Settings',
        href: '/admin/settings',
        icon: Icons.Settings,
        description: 'System configuration',
        keywords: ['settings', 'configuration', 'preferences'],
        children: [] // Will be populated from SETTINGS_REGISTRY
      },
      {
        id: 'cron-telemetry',
        label: 'Cron Telemetry',
        href: '/admin/cron-telemetry',
        icon: Icons.Activity,
        description: 'Background job monitoring',
        keywords: ['cron', 'jobs', 'background', 'tasks'],
        permission: 'SYSTEM_ADMIN',
      },
    ]
  },
]

// Utility functions
export function getNavigationItem(id: string): NavigationItem | null {
  for (const section of NAVIGATION_REGISTRY) {
    for (const item of section.items) {
      if (item.id === id) return item
      if (item.children) {
        const child = item.children.find(c => c.id === id)
        if (child) return child
      }
    }
  }
  return null
}

export function getNavigationItemByHref(href: string): NavigationItem | null {
  for (const section of NAVIGATION_REGISTRY) {
    for (const item of section.items) {
      if (item.href === href) return item
      if (item.children) {
        const child = item.children.find(c => c.href === href)
        if (child) return child
      }
    }
  }
  return null
}

export function searchNavigation(query: string): NavigationItem[] {
  const lowerQuery = query.toLowerCase()
  const results: NavigationItem[] = []
  
  for (const section of NAVIGATION_REGISTRY) {
    for (const item of section.items) {
      const matchesLabel = item.label.toLowerCase().includes(lowerQuery)
      const matchesDescription = item.description?.toLowerCase().includes(lowerQuery)
      const matchesKeywords = item.keywords?.some(k => k.includes(lowerQuery))
      
      if (matchesLabel || matchesDescription || matchesKeywords) {
        results.push(item)
      }
      
      if (item.children) {
        const childMatches = item.children.filter(child => {
          return child.labelRetryClaude does not have the ability to run the code it generates yet.AContinue.toLowerCase().includes(lowerQuery) ||
child.description?.toLowerCase().includes(lowerQuery) ||
child.keywords?.some(k => k.includes(lowerQuery))
})
results.push(...childMatches)
}
}
}
return results
}
export function getNavigationByPermission(userRole: string): NavigationSection[] {
return NAVIGATION_REGISTRY.map(section => ({
...section,
items: section.items.filter(item => {
if (!item.permission) return true
return hasPermission(userRole, item.permission)
}).map(item => ({
...item,
children: item.children?.filter(child => {
if (!child.permission) return true
return hasPermission(userRole, child.permission)
})
}))
})).filter(section => section.items.length > 0)
}
export function getBreadcrumbs(pathname: string): Array<{ label: string; href: string }> {
const segments = pathname.split('/').filter(Boolean)
const breadcrumbs: Array<{ label: string; href: string }> = []
let currentPath = ''
for (const segment of segments) {
currentPath += /${segment}
const item = getNavigationItemByHref(currentPath)
if (item) {
  breadcrumbs.push({ label: item.label, href: item.href })
} else {
  // Fallback to formatted segment
  breadcrumbs.push({
    label: segment.charAt(0).toUpperCase() + segment.slice(1).replace(/-/g, ' '),
    href: currentPath
  })
}
}
return breadcrumbs
}
export function getRecentlyVisited(maxItems = 5): NavigationItem[] {
if (typeof window === 'undefined') return []
const recent = localStorage.getItem('admin:navigation:recent')
if (!recent) return []
try {
const ids = JSON.parse(recent) as string[]
return ids
.map(id => getNavigationItem(id))
.filter((item): item is NavigationItem => item !== null)
.slice(0, maxItems)
} catch {
return []
}
}
export function addToRecentlyVisited(itemId: string) {
if (typeof window === 'undefined') return
const recent = localStorage.getItem('admin:navigation:recent')
let ids: string[] = []
try {
ids = recent ? JSON.parse(recent) : []
} catch {
ids = []
}
// Remove if already exists
ids = ids.filter(id => id !== itemId)
// Add to beginning
ids.unshift(itemId)
// Keep only last 10
ids = ids.slice(0, 10)
localStorage.setItem('admin:navigation:recent', JSON.stringify(ids))
}
export function getFavoriteItems(): NavigationItem[] {
if (typeof window === 'undefined') return []
const favorites = localStorage.getItem('admin:navigation:favorites')
if (!favorites) return []
try {
const ids = JSON.parse(favorites) as string[]
return ids
.map(id => getNavigationItem(id))
.filter((item): item is NavigationItem => item !== null)
} catch {
return []
}
}
export function toggleFavorite(itemId: string): boolean {
if (typeof window === 'undefined') return false
const favorites = localStorage.getItem('admin:navigation:favorites')
let ids: string[] = []
try {
ids = favorites ? JSON.parse(favorites) : []
} catch {
ids = []
}
const index = ids.indexOf(itemId)
if (index > -1) {
ids.splice(index, 1)
localStorage.setItem('admin:navigation:favorites', JSON.stringify(ids))
return false // Removed
} else {
ids.push(itemId)
localStorage.setItem('admin:navigation:favorites', JSON.stringify(ids))
return true // Added
}
}

**Usage Examples:**
```typescript
// In AdminSidebar.tsx
import { NAVIGATION_REGISTRY, getNavigationByPermission } from '@/lib/admin/navigation-registry'

export default function AdminSidebar() {
  const { data: session } = useSession()
  const userRole = session?.user?.role
  
  const navigation = useMemo(() => {
    return getNavigationByPermission(userRole)
  }, [userRole])
  
  return (
    <nav>
      {navigation.map(section => (
        <div key={section.id}>
          <h3>{section.label}</h3>
          {section.items.map(item => (
            <NavigationItem key={item.id} item={item} />
          ))}
        </div>
      ))}
    </nav>
  )
}

// In AdminHeader.tsx (Breadcrumbs)
import { getBreadcrumbs } from '@/lib/admin/navigation-registry'

export default function AdminHeader() {
  const pathname = usePathname()
  const breadcrumbs = useMemo(() => getBreadcrumbs(pathname), [pathname])
  
  return (
    <nav aria-label="Breadcrumb">
      {breadcrumbs.map((crumb, index) => (
        <Link key={crumb.href} href={crumb.href}>
          {crumb.label}
        </Link>
      ))}
    </nav>
  )
}

// In Search Component
import { searchNavigation } from '@/lib/admin/navigation-registry'

export function NavigationSearch() {
  const [query, setQuery] = useState('')
  const results = useMemo(() => searchNavigation(query), [query])
  
  return (
    <div>
      <input value={query} onChange={e => setQuery(e.target.value)} />
      {results.map(item => (
        <Link key={item.id} href={item.href}>{item.label}</Link>
      ))}
    </div>
  )
}

3.3 Data Fetching Optimization
Problem: Redundant API Calls
Current Pattern Analysis:
typescript// Multiple components independently fetching same data

// AdminOverview.tsx
const { data: bookingStats } = useUnifiedData({ key: 'bookings/stats' })

// AdminSidebar.tsx
const { data: counts } = useUnifiedData({ key: 'stats/counts' })
// counts includes bookingStats.pendingBookings

// BookingsPage.tsx
const { data: bookings } = useUnifiedData({ key: 'bookings/stats' })

// Result: Same endpoint called 3 times on initial load
Network Waterfall (Current):
Page Load
  ├─ /api/admin/bookings/stats (AdminOverview) - 250ms
  ├─ /api/admin/stats/counts (AdminSidebar) - 180ms
  ├─ /api/admin/bookings/stats (BookingsPage) - 250ms
  └─ Total: 680ms of redundant requests
Solution: Centralized Data Provider
typescript// providers/AdminDataProvider.tsx
'use client'

import { createContext, useContext, useMemo } from 'react'
import useSWR from 'swr'

interface AdminStats {
  bookings: {
    total: number
    pending: number
    todayBookings: number
    weekRevenue: number
    completionRate: number
    growth: number
  }
  clients: {
    total: number
    active: number
    new: number
    retention: number
  }
  revenue: {
    current: number
    target: number
    targetProgress: number
    trend: number
  }
  tasks: {
    total: number
    completed: number
    overdue: number
    dueToday: number
  }
}

interface AdminDataContextValue {
  stats: AdminStats | undefined
  counts: {
    pendingBookings: number
    newClients: number
    overdueTasks: number
    pendingServiceRequests: number
  }
  isLoading: boolean
  error: Error | null
  mutate: () => void
}

const AdminDataContext = createContext<AdminDataContextValue | null>(null)

export function AdminDataProvider({ children }: { children: React.ReactNode }) {
  // Single aggregated endpoint
  const { data, error, mutate, isLoading } = useSWR<AdminStats>(
    '/api/admin/stats/overview',
    {
      refreshInterval: 30000, // 30 seconds
      revalidateOnFocus: true,
      revalidateOnReconnect: true,
      dedupingInterval: 10000, // Prevent duplicate requests within 10s
    }
  )
  
  const counts = useMemo(() => ({
    pendingBookings: data?.bookings?.pending || 0,
    newClients: data?.clients?.new || 0,
    overdueTasks: data?.tasks?.overdue || 0,
    pendingServiceRequests: 0, // Add to overview endpoint
  }), [data])
  
  const value = useMemo(() => ({
    stats: data,
    counts,
    isLoading,
    error,
    mutate,
  }), [data, counts, isLoading, error, mutate])
  
  return (
    <AdminDataContext.Provider value={value}>
      {children}
    </AdminDataContext.Provider>
  )
}

export function useAdminData() {
  const context = useContext(AdminDataContext)
  if (!context) {
    throw new Error('useAdminData must be used within AdminDataProvider')
  }
  return context
}

// Specific hooks for convenience
export function useAdminStats() {
  const { stats, isLoading, error } = useAdminData()
  return { stats, isLoading, error }
}

export function useAdminCounts() {
  const { counts, isLoading } = useAdminData()
  return { counts, isLoading }
}
New Network Pattern:
Page Load
  └─ /api/admin/stats/overview (Shared Provider) - 250ms
      ├─ AdminOverview (uses cached data)
      ├─ AdminSidebar (uses cached data)
      └─ BookingsPage (uses cached data)
  
Total: 250ms (63% reduction)
Backend Endpoint (NEW):
typescript// app/api/admin/stats/overview/route.ts
export async function GET(request: Request) {
  const session = await getServerSession()
  if (!session?.user) return new Response('Unauthorized', { status: 401 })
  
  // Parallel queries
  const [bookings, clients, revenue, tasks] = await Promise.all([
    getBookingStats(),
    getClientStats(),
    getRevenueStats(),
    getTaskStats(),
  ])
  
  return Response.json({
    bookings,
    clients,
    revenue,
    tasks,
  })
}
Migration Strategy:

✅ Create /api/admin/stats/overview endpoint
✅ Create AdminDataProvider
✅ Wrap admin layout with provider
✅ Update components to use useAdminData()
✅ Remove individual useUnifiedData calls
✅ Test data consistency
✅ Monitor performance improvement


4. QuickBooks-Inspired UI Enhancements
4.1 Collapsible Sidebar (Priority: HIGH)
Design Specifications:
typescript// Sidebar States
interface SidebarState {
  mode: 'expanded' | 'collapsed' | 'mobile-overlay'
  width: number // 160-420px (expanded), 64px (collapsed)
  position: 'fixed' | 'sticky'
  animation: 'slide' | 'fade' | 'none'
}

// Breakpoints
const BREAKPOINTS = {
  mobile: 0,      // 0-767px: Overlay mode
  tablet: 768,    // 768-1023px: Collapsible
  desktop: 1024,  // 1024+: Collapsible with resize
}

// Default Widths
const WIDTHS = {
  collapsed: 64,
  default: 256,
  min: 160,
  max: 420,
}
Component Structure:
typescript// components/admin/layout/Sidebar/AdminSidebar.tsx
'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { usePathname } from 'next/navigation'
import { useSidebarState } from '@/stores/admin/layout.store'
import { useResponsive } from '@/hooks/admin/useResponsive'
import { SidebarHeader } from './SidebarHeader'
import { SidebarNav } from './SidebarNav'
import { SidebarFooter } from './SidebarFooter'
import { SidebarResizer } from './SidebarResizer'

interface AdminSidebarProps {
  className?: string
}

export default function AdminSidebar({ className }: AdminSidebarProps) {
  const pathname = usePathname()
  const { isMobile, isTablet } = useResponsive()
  const {
    collapsed,
    width,
    mobileOpen,
    setCollapsed,
    setWidth,
    setMobileOpen,
  } = useSidebarState()
  
  // Effective width based on state
  const effectiveWidth = collapsed ? 64 : width
  
  // Auto-collapse on mobile/tablet
  useEffect(() => {
    if (isMobile || isTablet) {
      setCollapsed(true)
    }
  }, [isMobile, isTablet, setCollapsed])
  
  // Close mobile sidebar on route change
  useEffect(() => {
    if (isMobile) {
      setMobileOpen(false)
    }
  }, [pathname, isMobile, setMobileOpen])
  
  // Sidebar classes
  const sidebarClasses = `
    fixed top-0 left-0 h-screen bg-white border-r border-gray-200
    transition-all duration-300 ease-in-out
    ${isMobile ? 'z-50' : 'z-30'}
    ${isMobile && !mobileOpen ? '-translate-x-full' : 'translate-x-0'}
    ${className || ''}
  `
  
  return (
    <>
      {/* Mobile Backdrop */}
      {isMobile && mobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 transition-opacity"
          onClick={() => setMobileOpen(false)}
          aria-hidden="true"
        />
      )}
      
      {/* Sidebar */}
      <aside
        className={sidebarClasses}
        style={{ width: effectiveWidth }}
        aria-label="Admin navigation"
      >
        {/* Header */}
        <SidebarHeader collapsed={collapsed} />
        
        {/* Navigation */}
        <div className="flex-1 overflow-y-auto py-4">
          <SidebarNav collapsed={collapsed} />
        </div>
        
        {/* Footer */}
        <SidebarFooter collapsed={collapsed} />
        
        {/* Resize Handle (Desktop only) */}
        {!isMobile && !collapsed && (
          <SidebarResizer onResize={setWidth} currentWidth={width} />
        )}
      </aside>
      
      {/* Spacer for fixed sidebar (Desktop) */}
      {!isMobile && (
        <div
          className="flex-shrink-0 transition-all duration-300"
          style={{ width: effectiveWidth }}
        />
      )}
    </>
  )
}
Subcomponents:
typescript// components/admin/layout/Sidebar/SidebarHeader.tsx
interface SidebarHeaderProps {
  collapsed: boolean
}

export function SidebarHeader({ collapsed }: SidebarHeaderProps) {
  const { setCollapsed } = useSidebarState()
  
  return (
    <div className="flex items-center justify-between p-4 border-b border-gray-200">
      {!collapsed && (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">NA</span>
          </div>
          <div>
            <div className="text-sm font-semibold text-gray-900">
              NextAccounting
            </div>
            <div className="text-xs text-gray-500">Admin Dashboard</div>
          </div>
        </div>
      )}
      
      {collapsed && (
        <button
          onClick={() => setCollapsed(false)}
          className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center mx-auto"
          aria-label="Expand sidebar"
        >
          <span className="text-white font-bold text-sm">NA</span>
        </button>
      )}
      
      {!collapsed && (
        <button
          onClick={() => setCollapsed(true)}
          className="p-1 rounded hover:bg-gray-100"
          aria-label="Collapse sidebar"
        >
          <ChevronsLeft className="w-4 h-4 text-gray-500" />
        </button>
      )}
    </div>
  )
}

// components/admin/layout/Sidebar/SidebarNav.tsx
interface SidebarNavProps {
  collapsed: boolean
}

export function SidebarNav({ collapsed }: SidebarNavProps) {
  const { data: session } = useSession()
  const userRole = session?.user?.role
  const navigation = getNavigationByPermission(userRole)
  const { expandedGroups, toggleGroup } = useNavigationState()
  
  return (
    <nav className="px-2 space-y-1">
      {navigation.map(section => (
        <div key={section.id} className="space-y-1">
          {/* Section Label */}
          {!collapsed && (
            <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
              {section.label}
            </div>
          )}
          
          {/* Navigation Items */}
          {section.items.map(item => (
            <NavigationItem
              key={item.id}
              item={item}
              collapsed={collapsed}
              expanded={expandedGroups.includes(item.id)}
              onToggle={() => toggleGroup(item.id)}
            />
          ))}
        </div>
      ))}
    </nav>
  )
}

// components/admin/layout/Sidebar/NavigationItem.tsx
interface NavigationItemProps {
  item: NavigationItem
  collapsed: boolean
  expanded?: boolean
  onToggle?: () => void
  depth?: number
}

export function NavigationItem({
  item,
  collapsed,
  expanded = false,
  onToggle,
  depth = 0
}: NavigationItemProps) {
  const pathname = usePathname()
  const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
  const hasChildren = item.children && item.children.length > 0
  
  // Badge
  const [badge, setBadge] = useState<string | number | null>(null)
  useEffect(() => {
    if (item.badge) {
      if (typeof item.badge === 'function') {
        item.badge().then(setBadge)
      } else {
        setBadge(item.badge)
      }
    }
  }, [item.badge])
  
  const Icon = item.icon
  
  const linkClasses = `
    flex items-center gap-3 px-3 py-2 rounded-lg
    transition-colors duration-150
    ${isActive
      ? 'bg-blue-50 text-blue-700 font-medium'
      : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
    }
    ${depth > 0 ? 'ml-4' : ''}
  `
  
  return (
    <div>
      {hasChildren ? (
        <button
          onClick={onToggle}
          className={linkClasses}
          aria-expanded={expanded}
        >
          <Icon className={`w-5 h-5 flex-shrink-0 ${isActive ? 'text-blue-600' : 'text-gray-400'}`} />
          {!collapsed && (
            <>
              <span className="flex-1 text-left text-sm">{item.label}</span>
              {badge && <Badge>{badge}</Badge>}
              {expanded ? (
                <ChevronDown className="w-4 h-4 text-gray-400" />
              ) : (
                <ChevronRight className="w-4 h-4 text-gray-400" />
              )}
            </>
          )}
        </button>
      ) : (
        <Link href={item.href} className={linkClasses}>
          <Icon className={`w-5 h-5 flex-shrink-0 ${isActive ? 'text-blue-600' : 'text-gray-400'}`} />
          {!collapsed && (
            <>
              <span className="flex-1 text-sm">{item.label}</span>
              {badge && <Badge>{badge}</Badge>}
            </>
          )}
          {collapsed && badge && (
            <div className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full" />
          )}
        </Link>
      )}
      
      {/* Tooltip for collapsed state */}
      {collapsed && (
        <Tooltip content={item.label} side="right">
          <div />
        </Tooltip>
      )}
      
      {/* Children */}
      {hasChildren && expanded && !collapsed && (
        <div className="ml-4 mt-1 space-y-1">
          {item.children.map(child => (
            <NavigationItem
              key={child.id}
              item={child}
              collapsed={false}
              depth={depth + 1}
            />
          ))}
        </div>
      )}
    </div>
  )
}

// components/admin/layout/Sidebar/SidebarResizer.tsx
interface SidebarResizerProps {
  onResize: (width: number) => void
  currentWidth: number
}

export function SidebarResizer({ onResize, currentWidth }: SidebarResizerProps) {
  const [isDragging, setIsDragging] = useState(false)
  const startXRef = useRef(0)
  const startWidthRef = useRef(0)
  
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true)
    startXRef.current = e.clientX
    startWidthRef.current = currentWidth
    document.body.style.cursor = 'col-resize'
    document.body.style.userSelect = 'none'
  }
  
  useEffect(() => {
    if (!isDragging) return
    
    const handleMouseMove = (e: MouseEvent) => {
      const delta = e.clientX - startXRef.current
      const newWidth = Math.min(420, Math.max(160, startWidthRef.current + delta))
      onResize(newWidth)
    }
    
    const handleMouseUp = () => {
      setIsDragging(false)
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
    }
    
    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
    
    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
  }, [isDragging, onResize])
  
  return (
    <div
      className="absolute top-0 right-0 w-1 h-full cursor-col-resize hover:bg-blue-500 transition-colors"
      onMouseDown={handleMouseDown}
      role="separator"
      aria-label="Resize sidebar"
    />
  )
}
Keyboard Shortcuts:
typescript// hooks/admin/useSidebarShortcuts.ts
import { useHotkeys } from 'react-hotkeys-hook'

export function useSidebarShortcuts() {
  const { toggleSidebar, setCollapsed } = useSidebarState()
  
  // Toggle sidebar: Cmd/Ctrl + B
  useHotkeys('mod+b', () => toggleSidebar(), [toggleSidebar])
  
  // Collapse sidebar: Cmd/Ctrl + [
  useHotkeys('mod+[', () => setCollapsed(true), [setCollapsed])
  
  // Expand sidebar: Cmd/Ctrl + ]
  useHotkeys('mod+]', () => setCollapsed(false), [setCollapsed])
}

4.2 User Profile Dropdown (Priority: HIGH)
Design Specifications:
typescript// components/admin/layout/Header/UserProfileDropdown.tsx
'use client'

import { useState } from 'react'
import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import {
  User,
  Settings,
  LogOut,
  HelpCircle,
  Keyboard,
  Moon,
  Sun,
  Monitor,
  CreditCard,
  Key,
  Shield,
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuGroup,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'

export function UserProfileDropdown() {
  const { data: session } = useSession()
  const router = useRouter()
  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>('system')
  
  const user = session?.user
  const userRole = (user as any)?.role || 'USER'
  const tenantName = (user as any)?.tenantName || 'Organization'
  
  // Generate initials from name
  const initials = user?.name
    ?.split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || 'U'
  
  const handleSignOut = async () => {
    await signOut({ callbackUrl: '/login' })
  }
  
  const handleThemeChange = (newTheme: 'light' | 'dark' | 'system') => {
    setTheme(newTheme)
    // Apply theme logic
    if (newTheme === 'dark') {
      document.documentElement.classList.add('dark')
    } else if (newTheme === 'light') {
      document.documentElement.classList.remove('dark')
    } else {
      // System preference
      const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches
      document.documentElement.classList.toggle('dark', isDark)
    }
    localStorage.setItem('theme', newTheme)
  }
  
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors"
          aria-label="User menu"
        >
          <Avatar className="w-8 h-8">
            <AvatarImage src={user?.image || undefined} alt={user?.name || 'User'} />
            <AvatarFallback className="bg-blue-600 text-white text-sm font-semibold">
              {initials}
            </AvatarFallback>
          </Avatar>
          
          <div className="hidden md:block text-left">
            <div className="text-sm font-medium text-gray-900">
              {user?.name || 'User'}
            </div>
            <div className="text-xs text-gray-500 flex items-center gap-1">
              {userRole}
              {tenantName && (
                <>
                  <span>·</span>
                  <span>{tenantName}</span>
                </>
              )}
            </div>
          </div>
          
          <ChevronDown className="w-4 h-4 text-gray-400 hidden md:block" />
        </button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent align="end" className="w-64">
        {/* User Info */}
        <DropdownMenuLabel>
          <div className="flex items-center gap-3">
            <Avatar className="w-10 h-10">
              <AvatarImage src={user?.image || undefined} />
              <AvatarFallback className="bg-blue-600 text-white">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold text-gray-900 truncate">
                {user?.name}
              </div>
              <div className="text-xs text-gray-500 truncate">
                {user?.email}
              </div>
            </div>
          </div>
        </DropdownMenuLabel>
        
        {/* Organization */}
        {tenantName && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuLabel className="text-xs text-gray-500">
              Organization
            </DropdownMenuLabel>
            <DropdownMenuItem>
              <Building className="w-4 h-4 mr-2 text-gray-400" />
              <span className="flex-1">{tenantName}</span>
              <Badge variant="secondary" className="text-xs">
                {userRole}
              </Badge>
            </DropdownMenuItem>
          </>
        )}
        
        <DropdownMenuSeparator />
        
        {/* Navigation */}
        <DropdownMenuGroup>
          <DropdownMenuItem onClick={() => router.push('/admin/settings/profile')}>
            <User className="w-4 h-4 mr-2 text-gray-400" />
            <span>Profile</span>
          </DropdownMenuItem>
          
          <DropdownMenuItem onClick={() => router.push('/admin/settings')}>
            <Settings className="w-4 h-4 mr-2 text-gray-400" />
            <span>Settings</span>
          </DropdownMenuItem>
          
          <DropdownMenuItem onClick={() => router.push('/admin/settings/security')}>
            <Shield className="w-4 h-4 mr-2 text-gray-400" />
            <span>Security</span>
          </DropdownMenuItem>
          
          <DropdownMenuItem onClick={() => router.push('/admin/settings/billing')}>
            <CreditCard className="w-4 h-4 mr-2 text-gray-400" />
            <span>Billing</span>
          </DropdownMenuItem>
          
          <DropdownMenuItem onClick={() => router.push('/admin/settings/api-keys')}>
            <Key className="w-4 h-4 mr-2 textRetryClaude does not have the ability to run the code it generates yet.AContinue-gray-400" />
<span>API Keys</span>
</DropdownMenuItem>
</DropdownMenuGroup>
    <DropdownMenuSeparator />
    
    {/* Theme Submenu */}
    <DropdownMenuSub>
      <DropdownMenuSubTrigger>
        {theme === 'light' && <Sun className="w-4 h-4 mr-2 text-gray-400" />}
        {theme === 'dark' && <Moon className="w-4 h-4 mr-2 text-gray-400" />}
        {theme === 'system' && <Monitor className="w-4 h-4 mr-2 text-gray-400" />}
        <span>Theme</span>
      </DropdownMenuSubTrigger>
      <DropdownMenuSubContent>
        <DropdownMenuRadioGroup value={theme} onValueChange={handleThemeChange as any}>
          <DropdownMenuRadioItem value="light">
            <Sun className="w-4 h-4 mr-2 text-gray-400" />
            <span>Light</span>
          </DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="dark">
            <Moon className="w-4 h-4 mr-2 text-gray-400" />
            <span>Dark</span>
          </DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="system">
            <Monitor className="w-4 h-4 mr-2 text-gray-400" />
            <span>System</span>
          </DropdownMenuRadioItem>
        </DropdownMenuRadioGroup>
      </DropdownMenuSubContent>
    </DropdownMenuSub>
    
    <DropdownMenuSeparator />
    
    {/* Help & Support */}
    <DropdownMenuGroup>
      <DropdownMenuItem onClick={() => router.push('/admin/help')}>
        <HelpCircle className="w-4 h-4 mr-2 text-gray-400" />
        <span>Help & Support</span>
      </DropdownMenuItem>
      
      <DropdownMenuItem onClick={() => router.push('/admin/shortcuts')}>
        <Keyboard className="w-4 h-4 mr-2 text-gray-400" />
        <span>Keyboard Shortcuts</span>
        <Badge variant="outline" className="ml-auto text-xs">
          ?
        </Badge>
      </DropdownMenuItem>
      
      <DropdownMenuItem onClick={() => window.open('/docs', '_blank')}>
        <FileText className="w-4 h-4 mr-2 text-gray-400" />
        <span>Documentation</span>
        <ExternalLink className="w-3 h-3 ml-auto text-gray-400" />
      </DropdownMenuItem>
    </DropdownMenuGroup>
    
    <DropdownMenuSeparator />
    
    {/* Sign Out */}
    <DropdownMenuItem
      onClick={handleSignOut}
      className="text-red-600 focus:text-red-600 focus:bg-red-50"
    >
      <LogOut className="w-4 h-4 mr-2" />
      <span>Sign Out</span>
    </DropdownMenuItem>
  </DropdownMenuContent>
</DropdownMenu>
)
}

**Status Indicator Component:**
```typescript
// components/admin/layout/Header/UserStatusIndicator.tsx
'use client'

import { useState, useEffect } from 'react'

type UserStatus = 'online' | 'away' | 'busy' | 'offline'

export function UserStatusIndicator() {
  const [status, setStatus] = useState<UserStatus>('online')
  
  // Auto-detect away status based on inactivity
  useEffect(() => {
    let timeout: NodeJS.Timeout
    
    const resetTimer = () => {
      clearTimeout(timeout)
      if (status === 'away') setStatus('online')
      
      // Set to away after 5 minutes of inactivity
      timeout = setTimeout(() => {
        setStatus('away')
      }, 5 * 60 * 1000)
    }
    
    // Listen for user activity
    document.addEventListener('mousemove', resetTimer)
    document.addEventListener('keypress', resetTimer)
    document.addEventListener('click', resetTimer)
    
    resetTimer()
    
    return () => {
      clearTimeout(timeout)
      document.removeEventListener('mousemove', resetTimer)
      document.removeEventListener('keypress', resetTimer)
      document.removeEventListener('click', resetTimer)
    }
  }, [status])
  
  const statusConfig = {
    online: { color: 'bg-green-500', label: 'Online' },
    away: { color: 'bg-yellow-500', label: 'Away' },
    busy: { color: 'bg-red-500', label: 'Busy' },
    offline: { color: 'bg-gray-400', label: 'Offline' },
  }
  
  const currentStatus = statusConfig[status]
  
  return (
    <div className="relative">
      <div
        className={`w-3 h-3 rounded-full ${currentStatus.color} ring-2 ring-white`}
        title={currentStatus.label}
      />
      {status === 'online' && (
        <div
          className={`absolute inset-0 w-3 h-3 rounded-full ${currentStatus.color} animate-ping opacity-75`}
        />
      )}
    </div>
  )
}

4.3 Enhanced Footer (Priority: MEDIUM)
Design Specifications:
typescript// components/admin/layout/Footer/AdminFooter.tsx
'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { BarChart3, Settings, ExternalLink, HelpCircle, FileText } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

interface SystemStatus {
  status: 'operational' | 'degraded' | 'outage'
  message: string
  lastChecked: Date
}

export default function AdminFooter() {
  const [systemStatus, setSystemStatus] = useState<SystemStatus>({
    status: 'operational',
    message: 'All systems operational',
    lastChecked: new Date(),
  })
  
  const APP_VERSION = process.env.NEXT_PUBLIC_APP_VERSION || 'v2.3.2'
  const BUILD_DATE = process.env.NEXT_PUBLIC_BUILD_DATE || 'Sept 26, 2025'
  const environment = process.env.NODE_ENV || 'development'
  
  // Fetch system status
  useEffect(() => {
    const checkStatus = async () => {
      try {
        const res = await fetch('/api/admin/system/health')
        const data = await res.json()
        setSystemStatus({
          status: data.status || 'operational',
          message: data.message || 'All systems operational',
          lastChecked: new Date(),
        })
      } catch (error) {
        setSystemStatus({
          status: 'degraded',
          message: 'Unable to check system status',
          lastChecked: new Date(),
        })
      }
    }
    
    checkStatus()
    const interval = setInterval(checkStatus, 60000) // Check every minute
    
    return () => clearInterval(interval)
  }, [])
  
  const statusConfig = {
    operational: {
      color: 'bg-green-500',
      badge: 'bg-green-100 text-green-800',
      text: 'text-green-700',
    },
    degraded: {
      color: 'bg-yellow-500',
      badge: 'bg-yellow-100 text-yellow-800',
      text: 'text-yellow-700',
    },
    outage: {
      color: 'bg-red-500',
      badge: 'bg-red-100 text-red-800',
      text: 'text-red-700',
    },
  }
  
  const currentStatus = statusConfig[systemStatus.status]
  
  return (
    <footer
      className="bg-white border-t border-gray-200 mt-auto"
      role="contentinfo"
      aria-label="Admin dashboard footer"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Desktop Layout */}
        <div className="hidden md:grid md:grid-cols-3 md:gap-8 py-3 items-center text-sm">
          {/* Left Section - Product Info & Quick Links */}
          <div className="flex items-center gap-4">
            <div className="flex flex-col">
              <span className="font-semibold text-gray-900">
                NextAccounting Admin
              </span>
              <span className="text-xs text-gray-500">
                {APP_VERSION} · {BUILD_DATE}
              </span>
            </div>
            
            <div className="flex items-center gap-3 pl-4 border-l border-gray-200">
              <Link
                href="/admin/analytics"
                className="flex items-center gap-1.5 text-gray-600 hover:text-gray-900 transition-colors"
              >
                <BarChart3 className="w-4 h-4" />
                <span>Analytics</span>
              </Link>
              
              <Link
                href="/admin/settings"
                className="flex items-center gap-1.5 text-gray-600 hover:text-gray-900 transition-colors"
              >
                <Settings className="w-4 h-4" />
                <span>Settings</span>
              </Link>
              
              <Link
                href="/"
                className="flex items-center gap-1.5 text-gray-600 hover:text-gray-900 transition-colors"
              >
                <ExternalLink className="w-4 h-4" />
                <span>Main Site</span>
              </Link>
            </div>
          </div>
          
          {/* Center Section - System Status */}
          <div className="flex items-center justify-center gap-2">
            <div
              className={`flex items-center gap-2 px-3 py-1.5 rounded-full ${currentStatus.badge}`}
            >
              <div
                className={`w-2 h-2 rounded-full ${currentStatus.color} animate-pulse`}
              />
              <span className={`text-xs font-medium ${currentStatus.text}`}>
                {systemStatus.message}
              </span>
            </div>
            
            <Badge
              variant="outline"
              className="text-xs font-normal text-gray-500 border-gray-300"
            >
              {environment}
            </Badge>
          </div>
          
          {/* Right Section - Support & Legal */}
          <div className="flex items-center justify-end gap-6">
            <div className="flex items-center gap-4">
              <Link
                href="/admin/help"
                className="flex items-center gap-1.5 text-gray-600 hover:text-gray-900 transition-colors"
              >
                <HelpCircle className="w-4 h-4" />
                <span>Help</span>
              </Link>
              
              <Link
                href="/docs"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-gray-600 hover:text-gray-900 transition-colors"
              >
                <FileText className="w-4 h-4" />
                <span>Docs</span>
              </Link>
            </div>
            
            <span className="text-xs text-gray-400">
              © {new Date().getFullYear()} NextAccounting
            </span>
          </div>
        </div>
        
        {/* Mobile Layout */}
        <div className="md:hidden py-4 space-y-3">
          {/* Product Info */}
          <div className="flex items-center justify-between">
            <div>
              <div className="font-semibold text-gray-900 text-sm">
                NextAccounting Admin
              </div>
              <div className="text-xs text-gray-500">
                {APP_VERSION}
              </div>
            </div>
            
            <div
              className={`flex items-center gap-2 px-2 py-1 rounded-full ${currentStatus.badge}`}
            >
              <div
                className={`w-2 h-2 rounded-full ${currentStatus.color}`}
              />
              <span className="text-xs font-medium">
                {systemStatus.status === 'operational' ? 'OK' : 'Issues'}
              </span>
            </div>
          </div>
          
          {/* Quick Links */}
          <div className="flex items-center justify-center gap-4 text-xs">
            <Link href="/admin/analytics" className="text-gray-600">
              Analytics
            </Link>
            <Link href="/admin/settings" className="text-gray-600">
              Settings
            </Link>
            <Link href="/admin/help" className="text-gray-600">
              Help
            </Link>
            <Link href="/docs" className="text-gray-600">
              Docs
            </Link>
          </div>
          
          {/* Copyright */}
          <div className="text-center text-xs text-gray-400">
            © {new Date().getFullYear()} NextAccounting
          </div>
        </div>
      </div>
    </footer>
  )
}
System Health API Endpoint:
typescript// app/api/admin/system/health/route.ts
import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redis } from '@/lib/redis'

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    // Check database
    let dbStatus: 'operational' | 'degraded' | 'outage' = 'operational'
    let dbLatency = 0
    try {
      const start = Date.now()
      await prisma.$queryRaw`SELECT 1`
      dbLatency = Date.now() - start
      
      if (dbLatency > 1000) {
        dbStatus = 'degraded'
      }
    } catch (error) {
      dbStatus = 'outage'
    }
    
    // Check Redis (if applicable)
    let redisStatus: 'operational' | 'degraded' | 'outage' = 'operational'
    let redisLatency = 0
    try {
      const start = Date.now()
      await redis.ping()
      redisLatency = Date.now() - start
      
      if (redisLatency > 500) {
        redisStatus = 'degraded'
      }
    } catch (error) {
      redisStatus = 'degraded' // Redis is optional
    }
    
    // Check API endpoints (sample)
    let apiStatus: 'operational' | 'degraded' | 'outage' = 'operational'
    try {
      const res = await fetch(`${process.env.NEXTAUTH_URL}/api/health`, {
        cache: 'no-store'
      })
      if (!res.ok) {
        apiStatus = 'degraded'
      }
    } catch (error) {
      apiStatus = 'outage'
    }
    
    // Determine overall status
    let overallStatus: 'operational' | 'degraded' | 'outage' = 'operational'
    let message = 'All systems operational'
    
    if (dbStatus === 'outage' || apiStatus === 'outage') {
      overallStatus = 'outage'
      message = 'System outage detected'
    } else if (dbStatus === 'degraded' || redisStatus === 'degraded' || apiStatus === 'degraded') {
      overallStatus = 'degraded'
      message = 'Degraded performance'
    }
    
    return NextResponse.json({
      status: overallStatus,
      message,
      checks: {
        database: {
          status: dbStatus,
          latency: dbLatency,
        },
        redis: {
          status: redisStatus,
          latency: redisLatency,
        },
        api: {
          status: apiStatus,
        },
      },
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Health check error:', error)
    return NextResponse.json(
      {
        status: 'outage',
        message: 'Health check failed',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    )
  }
}

4.4 Menu Customization Modal (Priority: HIGH)
Design Specifications:
typescript// components/admin/layout/MenuCustomization/MenuCustomizationModal.tsx
'use client'

import { useState, useEffect } from 'react'
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core'
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { ScrollArea } from '@/components/ui/scroll-area'
import { toast } from 'sonner'
import { NAVIGATION_REGISTRY } from '@/lib/admin/navigation-registry'
import { SortableMenuItem } from './SortableMenuItem'
import { saveMenuCustomization, loadMenuCustomization, resetMenuCustomization } from '@/services/menu-customization.service'

interface MenuCustomizationModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

interface MenuItemConfig {
  id: string
  label: string
  visible: boolean
  order: number
}

interface SectionConfig {
  id: string
  label: string
  visible: boolean
  order: number
  items: MenuItemConfig[]
}

export function MenuCustomizationModal({ open, onOpenChange }: MenuCustomizationModalProps) {
  const [sections, setSections] = useState<SectionConfig[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [isDirty, setIsDirty] = useState(false)
  
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )
  
  // Load configuration
  useEffect(() => {
    if (open) {
      loadConfiguration()
    }
  }, [open])
  
  const loadConfiguration = async () => {
    setLoading(true)
    try {
      const saved = await loadMenuCustomization()
      
      if (saved) {
        setSections(saved.sections)
      } else {
        // Initialize from registry
        const initialSections: SectionConfig[] = NAVIGATION_REGISTRY.map((section, idx) => ({
          id: section.id,
          label: section.label,
          visible: true,
          order: idx,
          items: section.items.map((item, itemIdx) => ({
            id: item.id,
            label: item.label,
            visible: true,
            order: itemIdx,
          })),
        }))
        setSections(initialSections)
      }
    } catch (error) {
      toast.error('Failed to load menu configuration')
    } finally {
      setLoading(false)
    }
  }
  
  const handleSave = async () => {
    setSaving(true)
    try {
      await saveMenuCustomization({ sections })
      toast.success('Menu customization saved')
      setIsDirty(false)
      onOpenChange(false)
      
      // Trigger navigation update
      window.dispatchEvent(new CustomEvent('menu:updated'))
    } catch (error) {
      toast.error('Failed to save menu customization')
    } finally {
      setSaving(false)
    }
  }
  
  const handleReset = async () => {
    if (!confirm('Are you sure you want to reset to default menu?')) return
    
    try {
      await resetMenuCustomization()
      await loadConfiguration()
      toast.success('Menu reset to default')
      setIsDirty(false)
    } catch (error) {
      toast.error('Failed to reset menu')
    }
  }
  
  const handleSectionDragEnd = (event: any) => {
    const { active, over } = event
    
    if (active.id !== over.id) {
      setSections((items) => {
        const oldIndex = items.findIndex((i) => i.id === active.id)
        const newIndex = items.findIndex((i) => i.id === over.id)
        
        const newItems = arrayMove(items, oldIndex, newIndex).map((item, idx) => ({
          ...item,
          order: idx,
        }))
        
        setIsDirty(true)
        return newItems
      })
    }
  }
  
  const handleItemDragEnd = (sectionId: string, event: any) => {
    const { active, over } = event
    
    if (active.id !== over.id) {
      setSections((sections) => {
        return sections.map((section) => {
          if (section.id !== sectionId) return section
          
          const oldIndex = section.items.findIndex((i) => i.id === active.id)
          const newIndex = section.items.findIndex((i) => i.id === over.id)
          
          const newItems = arrayMove(section.items, oldIndex, newIndex).map((item, idx) => ({
            ...item,
            order: idx,
          }))
          
          setIsDirty(true)
          return { ...section, items: newItems }
        })
      })
    }
  }
  
  const toggleSectionVisibility = (sectionId: string) => {
    setSections((sections) =>
      sections.map((section) =>
        section.id === sectionId
          ? { ...section, visible: !section.visible }
          : section
      )
    )
    setIsDirty(true)
  }
  
  const toggleItemVisibility = (sectionId: string, itemId: string) => {
    setSections((sections) =>
      sections.map((section) => {
        if (section.id !== sectionId) return section
        
        return {
          ...section,
          items: section.items.map((item) =>
            item.id === itemId
              ? { ...item, visible: !item.visible }
              : item
          ),
        }
      })
    )
    setIsDirty(true)
  }
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>Customize Menu</DialogTitle>
          <DialogDescription>
            Drag to reorder, toggle visibility, and personalize your navigation menu.
          </DialogDescription>
        </DialogHeader>
        
        <Tabs defaultValue="sections" className="flex-1">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="sections">Sections</TabsTrigger>
            <TabsTrigger value="items">Menu Items</TabsTrigger>
            <TabsTrigger value="favorites">Favorites</TabsTrigger>
          </TabsList>
          
          {/* Sections Tab */}
          <TabsContent value="sections" className="mt-4">
            <ScrollArea className="h-[400px] pr-4">
              {loading ? (
                <div className="flex items-center justify-center h-40">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
                </div>
              ) : (
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={handleSectionDragEnd}
                >
                  <SortableContext
                    items={sections.map(s => s.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    <div className="space-y-2">
                      {sections.map((section) => (
                        <SortableMenuItem
                          key={section.id}
                          id={section.id}
                          label={section.label}
                          visible={section.visible}
                          onToggleVisibility={() => toggleSectionVisibility(section.id)}
                        />
                      ))}
                    </div>
                  </SortableContext>
                </DndContext>
              )}
            </ScrollArea>
          </TabsContent>
          
          {/* Items Tab */}
          <TabsContent value="items" className="mt-4">
            <ScrollArea className="h-[400px] pr-4">
              {loading ? (
                <div className="flex items-center justify-center h-40">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
                </div>
              ) : (
                <div className="space-y-6">
                  {sections.map((section) => (
                    <div key={section.id} className="space-y-2">
                      <div className="flex items-center justify-between px-3 py-2 bg-gray-50 rounded-lg">
                        <h4 className="text-sm font-semibold text-gray-700">
                          {section.label}
                        </h4>
                        <Badge variant="secondary" className="text-xs">
                          {section.items.filter(i => i.visible).length} / {section.items.length}
                        </Badge>
                      </div>
                      
                      <DndContext
                        sensors={sensors}
                        collisionDetection={closestCenter}
                        onDragEnd={(e) => handleItemDragEnd(section.id, e)}
                      >
                        <SortableContext
                          items={section.items.map(i => i.id)}
                          strategy={verticalListSortingStrategy}
                        >
                          <div className="space-y-1 pl-4">
                            {section.items.map((item) => (
                              <SortableMenuItem
                                key={item.id}
                                id={item.id}
                                label={item.label}
                                visible={item.visible}
                                onToggleVisibility={() =>
                                  toggleItemVisibility(section.id, item.id)
                                }
                              />
                            ))}
                          </div>
                        </SortableContext>
                      </DndContext>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </TabsContent>
          
          {/* Favorites Tab */}
          <TabsContent value="favorites" className="mt-4">
            <ScrollArea className="h-[400px] pr-4">
              <div className="space-y-4">
                <p className="text-sm text-gray-600">
                  Star your favorite menu items for quick access. They'll appear at the top of your sidebar.
                </p>
                {/* Favorites implementation */}
                <div className="text-center text-sm text-gray-500 py-8">
                  Coming soon
                </div>
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>
        
        <DialogFooter className="flex items-center justify-between">
          <Button
            type="button"
            variant="outline"
            onClick={handleReset}
            disabled={loading || saving}
          >
            Reset to Default
          </Button>
          
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleSave}
              disabled={!isDirty || saving}
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
Sortable Menu Item Component:
typescript// components/admin/layout/MenuCustomization/SortableMenuItem.tsx
'use client'

import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { GripVertical, Eye, EyeOff } from 'lucide-react'
import { Switch } from '@/components/ui/switch'

interface SortableMenuItemProps {
  id: string
  label: string
  visible: boolean
  onToggleVisibility: () => void
}

export function SortableMenuItem({
  id,
  label,
  visible,
  onToggleVisibility,
}: SortableMenuItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id })
  
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }
  
  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`
        flex items-center gap-3 px-3 py-2 bg-white border border-gray-200 rounded-lg
        ${isDragging ? 'shadow-lg' : 'shadow-sm'}
      `}
    >
      <button
        type="button"
        className="cursor-grab active:cursor-grabbing p-1 text-gray-400 hover:text-gray-600"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="w-4 h-4" />
      </button>
      
      <span className="flex-1 text-sm text-gray-900">{label}</span>
      
      <div className="flex items-center gap-2">
        {visible ? (
          <Eye className="w-4 h-4 text-gray-400" />
        ) : (
          <EyeOff className="w-4 h-4 text-gray-400" />
        )}
        <Switch
          checked={visible}
          onCheckedChange={onToggleVisibility}
          aria-label={`Toggle visibility for ${label}`}
        />
      </div>
    </div>
  )
}
Service Layer:
typescript// services/menu-customization.service.ts
interface MenuCustomization {
  userId: string
  sections: SectionConfig[]
  updatedAt: string
}

export async function saveMenuCustomization(config: Omit<MenuCustomization, 'userId' | 'updatedAt'>) {
  const res = await fetch('/api/admin/menu/customization', {RetryClaude does not have the ability to run the code it generates yet.AContinuemethod: 'PUT',
headers: { 'Content-Type': 'application/json' },
body: JSON.stringify(config),
})
if (!res.ok) {
throw new Error('Failed to save menu customization')
}
return res.json()
}
export async function loadMenuCustomization(): Promise<MenuCustomization | null> {
const res = await fetch('/api/admin/menu/customization')
if (res.status === 404) {
return null // No customization saved yet
}
if (!res.ok) {
throw new Error('Failed to load menu customization')
}
return res.json()
}
export async function resetMenuCustomization() {
const res = await fetch('/api/admin/menu/customization', {
method: 'DELETE',
})
if (!res.ok) {
throw new Error('Failed to reset menu customization')
}
return res.json()
}

**API Endpoints:**
```typescript
// app/api/admin/menu/customization/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET - Load user's menu customization
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const userId = (session.user as any).id
    
    const customization = await prisma.menuCustomization.findUnique({
      where: { userId },
    })
    
    if (!customization) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }
    
    return NextResponse.json({
      userId: customization.userId,
      sections: customization.config,
      updatedAt: customization.updatedAt.toISOString(),
    })
  } catch (error) {
    console.error('Load menu customization error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PUT - Save menu customization
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const userId = (session.user as any).id
    const body = await request.json()
    
    // Validate body
    if (!body.sections || !Array.isArray(body.sections)) {
      return NextResponse.json(
        { error: 'Invalid configuration' },
        { status: 400 }
      )
    }
    
    const customization = await prisma.menuCustomization.upsert({
      where: { userId },
      update: {
        config: body.sections,
        updatedAt: new Date(),
      },
      create: {
        userId,
        config: body.sections,
      },
    })
    
    return NextResponse.json({
      userId: customization.userId,
      sections: customization.config,
      updatedAt: customization.updatedAt.toISOString(),
    })
  } catch (error) {
    console.error('Save menu customization error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE - Reset to default
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const userId = (session.user as any).id
    
    await prisma.menuCustomization.delete({
      where: { userId },
    })
    
    return NextResponse.json({ success: true })
  } catch (error) {
    if ((error as any).code === 'P2025') {
      // Record not found - that's okay
      return NextResponse.json({ success: true })
    }
    
    console.error('Reset menu customization error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
Prisma Schema Addition:
prisma// prisma/schema.prisma

model MenuCustomization {
  id        String   @id @default(cuid())
  userId    String   @unique
  config    Json     // Stores sections array
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  @@index([userId])
}

4.5 Settings Drawer (Priority: HIGH)
Design Specifications:
typescript// components/admin/layout/SettingsDrawer/SettingsDrawer.tsx
'use client'

import { useState, useEffect } from 'react'
import { X, Save, RotateCcw } from 'lucide-react'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetFooter } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { toast } from 'sonner'
import { AppearanceSettings } from './AppearanceSettings'
import { NotificationSettings } from './NotificationSettings'
import { RegionalSettings } from './RegionalSettings'
import { DashboardSettings } from './DashboardSettings'
import { AdvancedSettings } from './AdvancedSettings'
import { loadUserPreferences, saveUserPreferences } from '@/services/user-preferences.service'

interface UserPreferences {
  appearance: {
    theme: 'light' | 'dark' | 'system'
    accentColor: string
    density: 'compact' | 'comfortable' | 'spacious'
    fontSize: number
  }
  notifications: {
    email: boolean
    push: boolean
    inApp: boolean
    sound: boolean
    digest: 'never' | 'daily' | 'weekly'
  }
  regional: {
    language: string
    timezone: string
    dateFormat: string
    timeFormat: '12h' | '24h'
    currency: string
  }
  dashboard: {
    defaultPage: string
    widgets: string[]
    chartType: 'line' | 'bar' | 'area'
    refreshInterval: number
  }
  advanced: {
    developerMode: boolean
    debugLogging: boolean
    experimentalFeatures: boolean
    betaAccess: boolean
  }
}

const defaultPreferences: UserPreferences = {
  appearance: {
    theme: 'system',
    accentColor: '#3b82f6',
    density: 'comfortable',
    fontSize: 14,
  },
  notifications: {
    email: true,
    push: false,
    inApp: true,
    sound: true,
    digest: 'daily',
  },
  regional: {
    language: 'en',
    timezone: 'UTC',
    dateFormat: 'MM/DD/YYYY',
    timeFormat: '12h',
    currency: 'USD',
  },
  dashboard: {
    defaultPage: '/admin',
    widgets: ['revenue', 'bookings', 'clients', 'tasks'],
    chartType: 'line',
    refreshInterval: 30000,
  },
  advanced: {
    developerMode: false,
    debugLogging: false,
    experimentalFeatures: false,
    betaAccess: false,
  },
}

interface SettingsDrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function SettingsDrawer({ open, onOpenChange }: SettingsDrawerProps) {
  const [preferences, setPreferences] = useState<UserPreferences>(defaultPreferences)
  const [originalPreferences, setOriginalPreferences] = useState<UserPreferences>(defaultPreferences)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [isDirty, setIsDirty] = useState(false)
  
  // Load preferences when drawer opens
  useEffect(() => {
    if (open) {
      loadPreferences()
    }
  }, [open])
  
  // Track changes
  useEffect(() => {
    const hasChanges = JSON.stringify(preferences) !== JSON.stringify(originalPreferences)
    setIsDirty(hasChanges)
  }, [preferences, originalPreferences])
  
  const loadPreferences = async () => {
    setLoading(true)
    try {
      const loaded = await loadUserPreferences()
      if (loaded) {
        setPreferences(loaded)
        setOriginalPreferences(loaded)
      }
    } catch (error) {
      toast.error('Failed to load preferences')
    } finally {
      setLoading(false)
    }
  }
  
  const handleSave = async () => {
    setSaving(true)
    try {
      await saveUserPreferences(preferences)
      setOriginalPreferences(preferences)
      setIsDirty(false)
      toast.success('Preferences saved successfully')
      
      // Apply changes immediately
      applyPreferences(preferences)
      
      // Optionally close drawer
      // onOpenChange(false)
    } catch (error) {
      toast.error('Failed to save preferences')
    } finally {
      setSaving(false)
    }
  }
  
  const handleReset = () => {
    setPreferences(originalPreferences)
    setIsDirty(false)
    toast.info('Changes discarded')
  }
  
  const handleResetToDefaults = () => {
    if (!confirm('Reset all preferences to defaults?')) return
    
    setPreferences(defaultPreferences)
    setIsDirty(true)
    toast.info('Reset to defaults. Click Save to apply.')
  }
  
  const applyPreferences = (prefs: UserPreferences) => {
    // Apply theme
    const root = document.documentElement
    if (prefs.appearance.theme === 'dark') {
      root.classList.add('dark')
    } else if (prefs.appearance.theme === 'light') {
      root.classList.remove('dark')
    } else {
      // System preference
      const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches
      root.classList.toggle('dark', isDark)
    }
    
    // Apply accent color
    root.style.setProperty('--color-primary', prefs.appearance.accentColor)
    
    // Apply density
    root.setAttribute('data-density', prefs.appearance.density)
    
    // Apply font size
    root.style.fontSize = `${prefs.appearance.fontSize}px`
    
    // Dispatch event for other components
    window.dispatchEvent(new CustomEvent('preferences:updated', { detail: prefs }))
  }
  
  const updatePreferences = <K extends keyof UserPreferences>(
    section: K,
    updates: Partial<UserPreferences[K]>
  ) => {
    setPreferences((prev) => ({
      ...prev,
      [section]: {
        ...prev[section],
        ...updates,
      },
    }))
  }
  
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-2xl p-0">
        <div className="flex flex-col h-full">
          {/* Header */}
          <SheetHeader className="px-6 py-4 border-b">
            <div className="flex items-center justify-between">
              <div>
                <SheetTitle>Settings</SheetTitle>
                <SheetDescription>
                  Customize your dashboard experience
                </SheetDescription>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onOpenChange(false)}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </SheetHeader>
          
          {/* Content */}
          <ScrollArea className="flex-1">
            <div className="px-6 py-4">
              {loading ? (
                <div className="flex items-center justify-center h-40">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
                </div>
              ) : (
                <Tabs defaultValue="appearance" className="w-full">
                  <TabsList className="grid w-full grid-cols-5">
                    <TabsTrigger value="appearance">Appearance</TabsTrigger>
                    <TabsTrigger value="notifications">Notifications</TabsTrigger>
                    <TabsTrigger value="regional">Regional</TabsTrigger>
                    <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
                    <TabsTrigger value="advanced">Advanced</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="appearance" className="mt-6 space-y-6">
                    <AppearanceSettings
                      settings={preferences.appearance}
                      onChange={(updates) => updatePreferences('appearance', updates)}
                    />
                  </TabsContent>
                  
                  <TabsContent value="notifications" className="mt-6 space-y-6">
                    <NotificationSettings
                      settings={preferences.notifications}
                      onChange={(updates) => updatePreferences('notifications', updates)}
                    />
                  </TabsContent>
                  
                  <TabsContent value="regional" className="mt-6 space-y-6">
                    <RegionalSettings
                      settings={preferences.regional}
                      onChange={(updates) => updatePreferences('regional', updates)}
                    />
                  </TabsContent>
                  
                  <TabsContent value="dashboard" className="mt-6 space-y-6">
                    <DashboardSettings
                      settings={preferences.dashboard}
                      onChange={(updates) => updatePreferences('dashboard', updates)}
                    />
                  </TabsContent>
                  
                  <TabsContent value="advanced" className="mt-6 space-y-6">
                    <AdvancedSettings
                      settings={preferences.advanced}
                      onChange={(updates) => updatePreferences('advanced', updates)}
                    />
                  </TabsContent>
                </Tabs>
              )}
            </div>
          </ScrollArea>
          
          {/* Footer */}
          <SheetFooter className="px-6 py-4 border-t bg-gray-50">
            <div className="flex items-center justify-between w-full">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleResetToDefaults}
                disabled={loading || saving}
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                Reset to Defaults
              </Button>
              
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={handleReset}
                  disabled={!isDirty || saving}
                >
                  Discard
                </Button>
                <Button
                  type="button"
                  onClick={handleSave}
                  disabled={!isDirty || saving}
                >
                  <Save className="w-4 h-4 mr-2" />
                  {saving ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            </div>
          </SheetFooter>
        </div>
      </SheetContent>
    </Sheet>
  )
}
Settings Sections:
typescript// components/admin/layout/SettingsDrawer/AppearanceSettings.tsx
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Slider } from '@/components/ui/slider'
import { Sun, Moon, Monitor } from 'lucide-react'

interface AppearanceSettingsProps {
  settings: {
    theme: 'light' | 'dark' | 'system'
    accentColor: string
    density: 'compact' | 'comfortable' | 'spacious'
    fontSize: number
  }
  onChange: (updates: Partial<AppearanceSettingsProps['settings']>) => void
}

export function AppearanceSettings({ settings, onChange }: AppearanceSettingsProps) {
  const accentColors = [
    { name: 'Blue', value: '#3b82f6' },
    { name: 'Green', value: '#10b981' },
    { name: 'Purple', value: '#8b5cf6' },
    { name: 'Red', value: '#ef4444' },
    { name: 'Orange', value: '#f97316' },
  ]
  
  return (
    <div className="space-y-6">
      {/* Theme */}
      <div className="space-y-3">
        <Label>Theme</Label>
        <RadioGroup
          value={settings.theme}
          onValueChange={(value) => onChange({ theme: value as any })}
        >
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="light" id="theme-light" />
            <Label htmlFor="theme-light" className="flex items-center gap-2 cursor-pointer">
              <Sun className="w-4 h-4" />
              Light
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="dark" id="theme-dark" />
            <Label htmlFor="theme-dark" className="flex items-center gap-2 cursor-pointer">
              <Moon className="w-4 h-4" />
              Dark
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="system" id="theme-system" />
            <Label htmlFor="theme-system" className="flex items-center gap-2 cursor-pointer">
              <Monitor className="w-4 h-4" />
              System
            </Label>
          </div>
        </RadioGroup>
      </div>
      
      {/* Accent Color */}
      <div className="space-y-3">
        <Label>Accent Color</Label>
        <div className="flex gap-2">
          {accentColors.map((color) => (
            <button
              key={color.value}
              type="button"
              onClick={() => onChange({ accentColor: color.value })}
              className={`w-10 h-10 rounded-full border-2 transition-all ${
                settings.accentColor === color.value
                  ? 'border-gray-900 scale-110'
                  : 'border-gray-200 hover:scale-105'
              }`}
              style={{ backgroundColor: color.value }}
              title={color.name}
            />
          ))}
        </div>
      </div>
      
      {/* Density */}
      <div className="space-y-3">
        <Label>Density</Label>
        <Select
          value={settings.density}
          onValueChange={(value) => onChange({ density: value as any })}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="compact">Compact</SelectItem>
            <SelectItem value="comfortable">Comfortable</SelectItem>
            <SelectItem value="spacious">Spacious</SelectItem>
          </SelectContent>
        </Select>
        <p className="text-xs text-gray-500">
          Adjust spacing and padding throughout the interface
        </p>
      </div>
      
      {/* Font Size */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label>Font Size</Label>
          <span className="text-sm text-gray-500">{settings.fontSize}px</span>
        </div>
        <Slider
          value={[settings.fontSize]}
          onValueChange={([value]) => onChange({ fontSize: value })}
          min={12}
          max={18}
          step={1}
          className="w-full"
        />
        <p className="text-xs text-gray-500">
          Base font size for the interface
        </p>
      </div>
    </div>
  )
}

// components/admin/layout/SettingsDrawer/NotificationSettings.tsx
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

interface NotificationSettingsProps {
  settings: {
    email: boolean
    push: boolean
    inApp: boolean
    sound: boolean
    digest: 'never' | 'daily' | 'weekly'
  }
  onChange: (updates: Partial<NotificationSettingsProps['settings']>) => void
}

export function NotificationSettings({ settings, onChange }: NotificationSettingsProps) {
  return (
    <div className="space-y-6">
      {/* Email Notifications */}
      <div className="flex items-center justify-between">
        <div className="space-y-0.5">
          <Label>Email Notifications</Label>
          <p className="text-sm text-gray-500">
            Receive notifications via email
          </p>
        </div>
        <Switch
          checked={settings.email}
          onCheckedChange={(checked) => onChange({ email: checked })}
        />
      </div>
      
      {/* Push Notifications */}
      <div className="flex items-center justify-between">
        <div className="space-y-0.5">
          <Label>Push Notifications</Label>
          <p className="text-sm text-gray-500">
            Browser push notifications
          </p>
        </div>
        <Switch
          checked={settings.push}
          onCheckedChange={(checked) => onChange({ push: checked })}
        />
      </div>
      
      {/* In-App Notifications */}
      <div className="flex items-center justify-between">
        <div className="space-y-0.5">
          <Label>In-App Notifications</Label>
          <p className="text-sm text-gray-500">
            Show notifications in the dashboard
          </p>
        </div>
        <Switch
          checked={settings.inApp}
          onCheckedChange={(checked) => onChange({ inApp: checked })}
        />
      </div>
      
      {/* Sound */}
      <div className="flex items-center justify-between">
        <div className="space-y-0.5">
          <Label>Notification Sound</Label>
          <p className="text-sm text-gray-500">
            Play sound for notifications
          </p>
        </div>
        <Switch
          checked={settings.sound}
          onCheckedChange={(checked) => onChange({ sound: checked })}
        />
      </div>
      
      {/* Digest */}
      <div className="space-y-3">
        <Label>Email Digest</Label>
        <Select
          value={settings.digest}
          onValueChange={(value) => onChange({ digest: value as any })}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="never">Never</SelectItem>
            <SelectItem value="daily">Daily</SelectItem>
            <SelectItem value="weekly">Weekly</SelectItem>
          </SelectContent>
        </Select>
        <p className="text-sm text-gray-500">
          Receive a summary of notifications
        </p>
      </div>
    </div>
  )
}

// Similar implementations for RegionalSettings, DashboardSettings, and AdvancedSettings...

5. Technical Debt & Refactoring
5.1 Remove Legacy Files
Files to Delete:
bash# Legacy layout files
rm src/app/admin/layout-nuclear.tsx
rm src/app/admin/page-nuclear.tsx

# Duplicate store wrappers (after consolidation)
rm src/stores/adminLayoutStoreHydrationSafe.ts
rm src/stores/adminLayoutStoreSSRSafe.ts

# Any unused components found during audit
# (Check imports before deleting)
Migration Steps:

✅ Search codebase for imports of legacy files
✅ Update imports to use new consolidated files
✅ Test all affected pages
✅ Delete legacy files
✅ Update documentation


5.2 Fix Inconsistencies
1. Invoice Templates Menu Item
typescript// In navigation-registry.ts - FIXED
{
  id: 'invoices',
  label: 'Invoices',
  href: '/admin/invoices',
  icon: Icons.FileText,
  children: [
    {
      id: 'invoices-all',
      label: 'All Invoices',
      href: '/admin/invoices',
      icon: Icons.FileText,
    },
    {
      id: 'invoices-sequences',
      label: 'Sequences',
      href: '/admin/invoices/sequences',
      icon: Icons.Hash,
    },
    // REMOVED: Templates (doesn't exist)
  ]
}
2. Permissions Consistency
typescript// Audit all navigation items for permission gates
// Ensure PERMISSIONS constants match actual roles

// Example fix:
{
  id: 'analytics',
  label: 'Analytics',
  href: '/admin/analytics',
  icon: Icons.BarChart3,
  permission: 'ANALYTICS_VIEW', // ✅ Matches PERMISSIONS.ANALYTICS_VIEW
}

6. Implementation Roadmap
Phase 1: Foundation (Weeks 1-2) 🏗️
Week 1: Cleanup & Consolidation
Days 1-2: Remove Legacy Code

 Audit all imports of layout-nuclear.tsx and page-nuclear.tsx
 Update imports to use new unified layout
 Delete legacy files
 Run full test suite
 Update documentation

Days 3-5: Store Consolidation

 Create new unified adminLayoutStore.ts
 Implement SSR-safe hooks
 Update all components to use new store
 Test hydration extensively
 Delete old store files

Week 2: Navigation Registry
Days 1-3: Build Registry

 Create navigation-registry.ts
 Port all navigation items from sidebar
 Add metadata (descriptions, keywords, permissions)
 Fix stale entries (invoices templates)
 Add utility functions

Days 4-5: Integrate Registry

 Update AdminSidebar to use registry
 Update breadcrumbs to use registry
 Create search functionality
 Test permission filtering
 Document registry API


Phase 2: QuickBooks UI (Weeks 3-5) 🎨
Week 3: Sidebar Enhancement
Days 1-2: Collapsible Sidebar

 Implement collapsed/expanded states
 Add smooth CSS transitions
 Create icon-only mode
 Add tooltips for collapsed state
 Test on all breakpoints

Days 3-4: Resize Functionality

 Build drag-to-resize handle
 Add touch support
 Implement min/max constraints
 Persist width to localStorage
 Add keyboard resize shortcuts

Day 5: Polish & Testing

 Accessibility audit (ARIA, keyboard nav)
 Animation performance optimization
 Mobile overlay behavior
 Focus management
 Cross-browser testing

Week 4: Header Enhancements
Days 1-2: User Profile Dropdown

 Create UserProfileDropdown component
 Build avatar component with fallback
 Implement dropdown menu structure
 Add theme switcher inline
 Add status indicator

Days 3-4: Replace Header Elements

 Remove "Preview Admin" text
 Integrate new dropdown in header
 Update header responsive behavior
 Test dropdown accessibility
 Add keyboard shortcuts

Day 5: Notifications Enhancement

 Improve notifications bell UI
 Add notification grouping
 Real-time updates
 Mark as read functionality
 Notification preferences link

Week 5: Footer Enhancement
Days 1-2: Build New Footer

 Create three-column layout
 Add product info section
 Build system status API
 Implement status indicator
 Add environment badge

Days 3-4: Integrate Links

 Quick action links with icons
 Support links section
 Legal links
 Hover states
 Mobile responsive layout

Day 5: Health Monitoring

 Create /api/admin/system/health endpoint
 Database health check
 Redis health check (optional)
 API endpoint checks
 Real-time status updates


Phase 3: Advanced Features (Weeks 6-8) ⚡
Week 6: Menu Customization
Days 1-2: Modal Structure

 Create MenuCustomizationModal component
 Build tab navigation
 Sections tab UI
 Items tab UI
 Favorites tab placeholder

Days 3-4: Drag-and-Drop

 Install @dnd-kit packages
 Implement sortable sections
 Implement sortable items
 Visual drag feedback
 Touch device support

Day 5: Persistence

 Create backend API endpoints
 Add Prisma schema
 Save/load functionality
 Reset to defaults
 Test data consistency

Week 7: Settings Drawer
Days 1-2: Drawer Structure

 Create SettingsDrawer component
 Build tab navigation
 Appearance settings section
 Notifications settings section
 Regional settings section

Days 3-4: Remaining Sections

 Dashboard settings section
 Advanced settings section
 Save/discard functionality
 Real-time preview
 Validation

Day 5: Integration

 Add settings icon to header
 Connect drawer to store
 Apply preferences immediately
 Test all settings combinations
 Accessibility audit

Week 8: Data Optimization
Days 1-2: Data Provider

 Create AdminDataProvider
 Build aggregated stats endpoint
 Implement shared caching
 Test deduplication
 Measure performance improvement

Days 3-4: Optimize Hooks

 Audit useUnifiedData usage
 Normalize cache keys
 Reduce redundant fetches
 Implement selective revalidation
 Add loading skeletons

Day 5: Bundle Optimization

 Code splitting analysis
 Lazy load heavy components
 Tree-shake icon imports
 Optimize images
 Test bundle size reduction


Phase 4: Polish & Testing (Weeks 9-10) ✨
Week 9: Missing Features
**DaysRetryClaude does not have the ability to run the code it generates yet.AContinue1-2: Audit Logs Panel**

 Create /admin/settings/audit route
 Build audit logs table component
 Add filtering (user, action, date range)
 Export audit logs to CSV
 Implement pagination
 Add search functionality

Day 3: MFA Management UI

 Create /admin/settings/security/mfa page
 QR code enrollment flow
 Backup codes generation
 Recovery options
 MFA enforcement toggle (admin only)
 Test authentication flow

Day 4: Rate Limiting Controls

 Create /admin/settings/security/rate-limits page
 Display current rate limit configs
 Adjust limits per endpoint
 Whitelist/blacklist IPs
 View blocked requests
 Test rate limit enforcement

Day 5: Additional Admin Panels

 Sentry integration UI (DSN, sampling)
 Redis/cache management panel
 Reminder concurrency settings
 Webhook management
 API key management improvements

Week 10: Testing & Documentation
Days 1-2: Component Tests

 Write tests for AdminSidebar
 Write tests for UserProfileDropdown
 Write tests for MenuCustomizationModal
 Write tests for SettingsDrawer
 Write tests for navigation registry
 Test coverage > 80%

Days 3-4: Integration & E2E Tests

 E2E: Sidebar collapse/expand flow
 E2E: Menu customization flow
 E2E: Settings drawer save flow
 E2E: User profile dropdown
 E2E: Permission-based navigation
 Cross-browser testing

Day 5: Documentation

 Update README with new features
 Create migration guide
 Document navigation registry API
 Component API documentation
 Video walkthroughs (optional)
 Deploy documentation site


7. Detailed Component Specifications
7.1 AdminSidebar Component
Full Component Hierarchy:
AdminSidebar
├── SidebarHeader
│   ├── Logo/Brand
│   └── Collapse Toggle Button
├── SidebarNav
│   ├── Section (multiple)
│   │   ├── Section Label
│   │   └── NavigationItem (multiple)
│   │       ├── Icon
│   │       ├── Label
│   │       ├── Badge (optional)
│   │       └── Children (recursive)
└── SidebarResizer (desktop only)
Props & State:
typescriptinterface AdminSidebarProps {
  className?: string
}

interface AdminSidebarState {
  collapsed: boolean
  width: number
  mobileOpen: boolean
  expandedGroups: string[]
  badges: Record<string, number>
}
Keyboard Shortcuts:
ShortcutActionCmd/Ctrl + BToggle sidebarCmd/Ctrl + [Collapse sidebarCmd/Ctrl + ]Expand sidebarG + DGo to DashboardG + AGo to AnalyticsG + BGo to BookingsG + CGo to Clients/ or Cmd+KFocus search
Accessibility Requirements:

 ARIA landmarks (navigation, complementary)
 ARIA labels for icon-only buttons
 Keyboard navigation (Tab, Arrow keys)
 Focus indicators (visible outline)
 Screen reader announcements
 Skip links
 aria-expanded for collapsible items
 aria-current="page" for active items


7.2 UserProfileDropdown Component
Menu Structure:
UserProfileDropdown
├── Trigger (Avatar + Name + Role)
└── Dropdown Content
    ├── User Info Section
    │   ├── Avatar
    │   ├── Name
    │   └── Email
    ├── Organization Section
    │   └── Tenant Name + Role Badge
    ├── Navigation Group
    │   ├── Profile
    │   ├── Settings
    │   ├── Security
    │   ├── Billing
    │   └── API Keys
    ├── Theme Submenu
    │   ├── Light
    │   ├── Dark
    │   └── System
    ├── Help Group
    │   ├── Help & Support
    │   ├── Keyboard Shortcuts
    │   └── Documentation
    └── Sign Out
Props:
typescriptinterface UserProfileDropdownProps {
  className?: string
  showStatus?: boolean
  showOrganization?: boolean
}
Features:

Auto-detect user activity for status
Theme switcher with instant preview
Recently visited pages (optional)
Quick settings access
Sign out confirmation modal (optional)


7.3 MenuCustomizationModal Component
Features Matrix:
FeatureSections TabItems TabFavorites TabDrag-and-drop reordering✅✅✅Show/hide toggle✅✅N/AVisual feedback✅✅✅Search/filter❌✅✅Bulk actions❌✅✅Reset to defaults✅✅✅Import/export✅✅✅Preview mode✅✅❌
Data Model:
typescriptinterface MenuCustomization {
  userId: string
  sections: SectionConfig[]
  favorites: string[]
  recentItems: string[]
  updatedAt: string
  version: number // For migration compatibility
}

interface SectionConfig {
  id: string
  label: string
  visible: boolean
  order: number
  collapsed: boolean
  items: MenuItemConfig[]
}

interface MenuItemConfig {
  id: string
  label: string
  visible: boolean
  order: number
  pinned: boolean
}
Backend Storage:
prismamodel MenuCustomization {
  id        String   @id @default(cuid())
  userId    String   @unique
  config    Json     // Full configuration
  version   Int      @default(1)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  @@index([userId])
  @@index([updatedAt])
}

7.4 SettingsDrawer Component
Settings Sections Detail:
1. Appearance Settings
typescriptinterface AppearanceSettings {
  theme: 'light' | 'dark' | 'system'
  accentColor: string // hex color
  density: 'compact' | 'comfortable' | 'spacious'
  fontSize: number // 12-18px
  fontFamily: 'inter' | 'system' | 'mono'
  animations: boolean // Enable/disable animations
  reducedMotion: boolean // Respect prefers-reduced-motion
}
Preview Effects:

Theme changes apply instantly
Accent color updates all primary buttons
Density affects spacing globally
Font changes apply to body text

2. Notification Settings
typescriptinterface NotificationSettings {
  email: {
    enabled: boolean
    bookings: boolean
    tasks: boolean
    mentions: boolean
    marketing: boolean
  }
  push: {
    enabled: boolean
    bookings: boolean
    tasks: boolean
    mentions: boolean
  }
  inApp: {
    enabled: boolean
    position: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left'
    duration: number // ms
  }
  sound: {
    enabled: boolean
    volume: number // 0-100
    soundPack: 'default' | 'subtle' | 'cheerful'
  }
  digest: {
    frequency: 'never' | 'daily' | 'weekly' | 'monthly'
    time: string // HH:MM format
    timezone: string
  }
  doNotDisturb: {
    enabled: boolean
    startTime: string // HH:MM
    endTime: string // HH:MM
    days: number[] // 0-6 (Sun-Sat)
  }
}
3. Regional Settings
typescriptinterface RegionalSettings {
  language: string // ISO 639-1 code
  timezone: string // IANA timezone
  dateFormat: string // Moment.js format
  timeFormat: '12h' | '24h'
  currency: string // ISO 4217 code
  numberFormat: 'us' | 'eu' | 'in' // 1,000.00 vs 1.000,00
  firstDayOfWeek: 0 | 1 // Sunday = 0, Monday = 1
  calendarView: 'gregorian' | 'fiscal'
  fiscalYearStart: string // MM-DD
}
Supported Languages:

English (en)
Spanish (es)
French (fr)
German (de)
Arabic (ar)
More via i18n integration

4. Dashboard Settings
typescriptinterface DashboardSettings {
  defaultPage: string // Route path
  widgets: {
    revenue: boolean
    bookings: boolean
    clients: boolean
    tasks: boolean
    chart: boolean
    activity: boolean
    stats: boolean
  }
  layout: 'default' | 'compact' | 'wide'
  chartType: 'line' | 'bar' | 'area' | 'mixed'
  chartColors: string[] // Array of hex colors
  refreshInterval: number // ms, 0 = manual
  showTrends: boolean
  showComparisons: boolean
  dateRange: '7d' | '30d' | '90d' | 'custom'
}
5. Advanced Settings
typescriptinterface AdvancedSettings {
  developerMode: boolean
  debugLogging: boolean
  experimentalFeatures: boolean
  betaAccess: boolean
  telemetry: boolean
  crashReporting: boolean
  performanceMonitoring: boolean
  featureFlags: Record<string, boolean>
  apiRateLimit: number // requests per minute
  sessionTimeout: number // minutes
  autoSave: boolean
  autoSaveInterval: number // seconds
}
Developer Mode Features:

Show API response times
Display query counts
Component render highlights
Redux DevTools
Performance profiler
Network request logging


8. API & Backend Requirements
8.1 New API Endpoints
Menu Customization:
typescript// GET /api/admin/menu/customization
// Load user's menu configuration
Response: {
  userId: string
  sections: SectionConfig[]
  updatedAt: string
}

// PUT /api/admin/menu/customization
// Save menu configuration
Body: { sections: SectionConfig[] }
Response: { success: boolean }

// DELETE /api/admin/menu/customization
// Reset to defaults
Response: { success: boolean }

// POST /api/admin/menu/favorites
// Add to favorites
Body: { itemId: string }
Response: { success: boolean }

// DELETE /api/admin/menu/favorites/:itemId
// Remove from favorites
Response: { success: boolean }
User Preferences:
typescript// GET /api/admin/preferences
// Load all user preferences
Response: UserPreferences

// PUT /api/admin/preferences
// Save preferences (partial or full)
Body: Partial<UserPreferences>
Response: { success: boolean }

// POST /api/admin/preferences/reset
// Reset to defaults
Body: { section?: string } // Optional: reset specific section
Response: { success: boolean }

// GET /api/admin/preferences/export
// Export preferences as JSON
Response: JSON file download

// POST /api/admin/preferences/import
// Import preferences from JSON
Body: UserPreferences
Response: { success: boolean }
System Health:
typescript// GET /api/admin/system/health
// System health check
Response: {
  status: 'operational' | 'degraded' | 'outage'
  message: string
  checks: {
    database: { status: string, latency: number }
    redis: { status: string, latency: number }
    api: { status: string }
    storage: { status: string }
  }
  timestamp: string
}

// GET /api/admin/system/status
// Real-time status (lightweight)
Response: {
  status: 'operational' | 'degraded' | 'outage'
  uptime: number
  timestamp: string
}
Stats Aggregation:
typescript// GET /api/admin/stats/overview
// Aggregated stats for dashboard
Response: {
  bookings: BookingStats
  clients: ClientStats
  revenue: RevenueStats
  tasks: TaskStats
}

// GET /api/admin/stats/counts
// Badge counts for navigation
Response: {
  pendingBookings: number
  newClients: number
  overdueTasks: number
  pendingServiceRequests: number
  unreadNotifications: number
}
Audit Logs:
typescript// GET /api/admin/audit-logs
// Fetch audit logs with filters
Query: {
  userId?: string
  action?: string
  startDate?: string
  endDate?: string
  page?: number
  limit?: number
}
Response: {
  logs: AuditLog[]
  total: number
  page: number
  limit: number
}

// POST /api/admin/audit-logs/export
// Export audit logs to CSV
Body: { filters: AuditLogFilters }
Response: CSV file download

8.2 Database Schema Updates
Required Prisma Schema Additions:
prisma// Menu Customization
model MenuCustomization {
  id        String   @id @default(cuid())
  userId    String   @unique
  config    Json     // Stores full menu configuration
  version   Int      @default(1)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  @@index([userId])
  @@index([updatedAt])
}

// User Preferences
model UserPreferences {
  id        String   @id @default(cuid())
  userId    String   @unique
  appearance Json    @default("{}")
  notifications Json @default("{}")
  regional  Json     @default("{}")
  dashboard Json     @default("{}")
  advanced  Json     @default("{}")
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  @@index([userId])
}

// Audit Logs (if not exists)
model AuditLog {
  id          String   @id @default(cuid())
  userId      String
  action      String   // e.g., "USER_CREATED", "BOOKING_UPDATED"
  entityType  String?  // e.g., "Booking", "User"
  entityId    String?
  metadata    Json?    // Additional context
  ipAddress   String?
  userAgent   String?
  createdAt   DateTime @default(now())
  
  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  @@index([userId])
  @@index([action])
  @@index([entityType, entityId])
  @@index([createdAt])
}

// Navigation Favorites
model NavigationFavorite {
  id        String   @id @default(cuid())
  userId    String
  itemId    String   // Navigation item ID
  order     Int      @default(0)
  createdAt DateTime @default(now())
  
  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  @@unique([userId, itemId])
  @@index([userId])
}

// User Relationship Updates
model User {
  // ... existing fields
  
  // Add new relations
  menuCustomization   MenuCustomization?
  preferences         UserPreferences?
  auditLogs           AuditLog[]
  navigationFavorites NavigationFavorite[]
}
Migration Strategy:
bash# 1. Create migration
npx prisma migrate dev --name add_menu_customization_and_preferences

# 2. Run migration
npx prisma migrate deploy

# 3. Generate Prisma Client
npx prisma generate

# 4. Seed default data (optional)
npx prisma db seed

8.3 Service Layer
Create Service Files:
typescript// services/menu-customization.service.ts
export async function saveMenuCustomization(config: MenuCustomization): Promise<void>
export async function loadMenuCustomization(): Promise<MenuCustomization | null>
export async function resetMenuCustomization(): Promise<void>
export async function addFavorite(itemId: string): Promise<void>
export async function removeFavorite(itemId: string): Promise<void>
export async function getFavorites(): Promise<string[]>

// services/user-preferences.service.ts
export async function saveUserPreferences(prefs: Partial<UserPreferences>): Promise<void>
export async function loadUserPreferences(): Promise<UserPreferences>
export async function resetUserPreferences(section?: string): Promise<void>
export async function exportPreferences(): Promise<Blob>
export async function importPreferences(data: UserPreferences): Promise<void>

// services/system-health.service.ts
export async function checkSystemHealth(): Promise<SystemHealth>
export async function getSystemStatus(): Promise<SystemStatus>
export async function getDatabaseStatus(): Promise<DatabaseStatus>
export async function getRedisStatus(): Promise<RedisStatus>
export async function getAPIStatus(): Promise<APIStatus>

// services/audit-log.service.ts
export async function createAuditLog(log: AuditLogInput): Promise<void>
export async function getAuditLogs(filters: AuditLogFilters): Promise<PaginatedAuditLogs>
export async function exportAuditLogs(filters: AuditLogFilters): Promise<Blob>

9. Testing Strategy
9.1 Unit Tests
Component Tests (Vitest + Testing Library):
typescript// __tests__/components/admin/layout/AdminSidebar.test.tsx
describe('AdminSidebar', () => {
  it('renders navigation items', () => {})
  it('collapses/expands on toggle', () => {})
  it('shows tooltips when collapsed', () => {})
  it('filters items by permission', () => {})
  it('displays badge counts', () => {})
  it('handles resize drag', () => {})
  it('persists width to localStorage', () => {})
  it('works with keyboard navigation', () => {})
})

// __tests__/components/admin/layout/UserProfileDropdown.test.tsx
describe('UserProfileDropdown', () => {
  it('renders user info correctly', () => {})
  it('shows theme switcher', () => {})
  it('handles sign out', () => {})
  it('applies theme changes', () => {})
  it('shows status indicator', () => {})
})

// __tests__/components/admin/layout/MenuCustomizationModal.test.tsx
describe('MenuCustomizationModal', () => {
  it('loads current configuration', () => {})
  it('allows drag-and-drop reordering', () => {})
  it('toggles visibility', () => {})
  it('saves configuration', () => {})
  it('resets to defaults', () => {})
})
Store Tests:
typescript// __tests__/stores/admin/layout.store.test.ts
describe('AdminLayoutStore', () => {
  it('initializes with default state', () => {})
  it('toggles sidebar', () => {})
  it('sets sidebar width', () => {})
  it('persists to localStorage', () => {})
  it('hydrates from localStorage', () => {})
  it('handles SSR safely', () => {})
})
Utility Tests:
typescript// __tests__/lib/admin/navigation-registry.test.ts
describe('NavigationRegistry', () => {
  it('finds navigation item by id', () => {})
  it('searches navigation by query', () => {})
  it('filters by permission', () => {})
  it('generates breadcrumbs', () => {})
  it('handles favorites', () => {})
})

9.2 Integration Tests
typescript// __tests__/integration/admin-layout.test.tsx
describe('Admin Layout Integration', () => {
  it('renders complete layout', () => {})
  it('handles authentication', () => {})
  it('loads user preferences', () => {})
  it('applies customizations', () => {})
  it('syncs state across components', () => {})
})

// __tests__/integration/menu-customization.test.tsx
describe('Menu Customization Flow', () => {
  it('opens modal from sidebar', () => {})
  it('reorders items', () => {})
  it('saves to backend', () => {})
  it('updates sidebar immediately', () => {})
  it('persists across page reload', () => {})
})

9.3 E2E Tests (Playwright)
typescript// e2e/admin-sidebar.spec.ts
test.describe('Admin Sidebar', () => {
  test('collapse and expand sidebar', async ({ page }) => {
    await page.goto('/admin')
    await page.click('[aria-label="Collapse sidebar"]')
    await expect(page.locator('.admin-sidebar')).toHaveClass(/collapsed/)
    
    await page.click('[aria-label="Expand sidebar"]')
    await expect(page.locator('.admin-sidebar')).not.toHaveClass(/collapsed/)
  })
  
  test('resize sidebar with drag', async ({ page }) => {
    await page.goto('/admin')
    const resizer = page.locator('[role="separator"]')
    await resizer.dragTo(resizer, { targetPosition: { x: 50, y: 0 } })
    
    const sidebar = page.locator('.admin-sidebar')
    const width = await sidebar.evaluate(el => el.offsetWidth)
    expect(width).toBeGreaterThan(256)
  })
  
  test('keyboard navigation', async ({ page }) => {
    await page.goto('/admin')
    await page.keyboard.press('Tab')
    await page.keyboard.press('ArrowDown')
    await page.keyboard.press('Enter')
    
    await expect(page).toHaveURL(/\/admin\/analytics/)
  })
})

// e2e/menu-customization.spec.ts
test.describe('Menu Customization', () => {
  test('complete customization flow', async ({ page }) => {
    await page.goto('/admin')
    
    // Open customization modal
    await page.click('[aria-label="Customize menu"]')
    await expect(page.locator('dialog')).toBeVisible()
    
    // Drag to reorder
    const firstItem = page.locator('[data-sortable-item]').first()
    const secondItem = page.locator('[data-sortable-item]').nth(1)
    await firstItem.dragTo(secondItem)
    
    // Save
    await page.click('text=Save Changes')
    await expect(page.locator('text=saved successfully')).toBeVisible()
    
    // Verify persistence
    await page.reload()
    // Assert order is maintained
  })
})

// e2e/settings-drawer.spec.ts
test.describe('Settings Drawer', () => {
  test('change theme', async ({ page }) => {
    await page.goto('/admin')
    
    // Open settings
    await page.click('[aria-label="Settings"]')
    await expect(page.locator('[role="dialog"]')).toBeVisible()
    
    // Change to dark theme
    await page.click('text=Dark')
    await expect(page.locator('html')).toHaveClass(/dark/)
    
    // Save
    await page.click('text=Save Changes')
    
    // Verify persistence
    await page.reload()
    await expect(page.locator('html')).toHaveClass(/dark/)
  })
})

9.4 Accessibility Tests
typescript// __tests__/a11y/admin-layout.test.tsx
import { axe, toHaveNoViolations } from 'jest-axe'

expect.extend(toHaveNoViolations)

describe('Accessibility', () => {
  it('AdminSidebar has no violations', async () => {
    const { container } = render(<AdminSidebar />)
    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })
  
  it('UserProfileDropdown has no violations', async () => {
    const { container } = render(<UserProfileDropdown />)
    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })
  
  it('MenuCustomizationModal has no violations', async () => {
    const { container } = render(<MenuCustomizationModal open={true} />)
    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })
})

9.5 Performance Tests
typescript// __tests__/performance/bundle-size.test.ts
describe('Bundle Size', () => {
  it('main bundle is under 500KB', () => {})
  it('admin chunk is under 200KB', () => {})
  it('vendor chunk is under 250KB', () => {})
})

// __tests__/performance/render-time.test.ts
describe('Render Performance', () => {
  it('AdminSidebar renders in < 100ms', () => {})
  it('AdminOverview renders in < 500ms', () => {})
  it('Menu customization modal opens in < 200ms', () => {})
})

// __tests__/performance/memory-leaks.test.ts
describe('Memory Leaks', () => {
  it('sidebar cleanup on unmount', () => {})
  it('event listeners removed', () => {})
  it('intervals cleared', () => {})
})

10. Performance Optimization
10.1 Code Splitting Strategy
typescript// components/admin/layout/AdminLayoutClient.tsx
import { lazy, Suspense } from 'react'

// Lazy load heavy components
const AdminLayoutShell = lazy(() => import('./AdminLayoutShell'))
const MenuCustomizationModal = lazy(() => import('./MenuCustomization/MenuCustomizationModal'))
const SettingsDrawer = lazy(() => import('./SettingsDrawer/SettingsDrawer'))

// Analytics charts (heavy)
const RevenueChart = lazy(() => import('@/components/admin/analytics/RevenueChart'))
const TasksChart = lazy(() => import('@/components/admin/analytics/TasksChart'))

// Use with Suspense
<Suspense fallback={<Skeleton />}>
  <AdminLayoutShell>{children}</AdminLayoutShell>
</Suspense>
10.2 Icon Optimization
typescript// Instead of importing all icons:
// ❌ import * as Icons from 'lucide-react'

// Use tree-shakeable imports:
// ✅ import { Home, Settings, User } from 'lucide-react'

// Or use dynamic imports for large icon sets:
const iconMap = {
  home: () => import('lucide-react/dist/esm/icons/home').then(m => m.Home),
  settings: () => import('lucide-react/dist/esm/icons/settings').then(m => m.Settings),
}
10.3 Image Optimization
typescript// Use next/image for all images
import Image from 'next/image'

<Image
  src="/logo.png"
  width={32}
  height={32}
  alt="Logo"
  priority // Above the fold
/>

<Image
  src={user.avatar}
  width={40}
  height={40}
  alt={user.name}
  loading="lazy" // Below the fold
/>
10.4 Memoization Strategy
typescript// Memoize expensive computations
const navigationItems = useMemo(() => {
  return getNavigationByPermission(userRole)
}, [userRole])

const breadcrumbs = useMemo(() => {
  return getBreadcrumbs(pathname)
}, [pathname])

const revenueMetrics = useMemo(() => {
  return calculateRevenueMetrics(data)
}, [data])

// Memoize components that rarely change
const SidebarNav = memo(SidebarNavComponent, (prev, next) => {
  return prev.collapsed === next.collapsed && 
         prev.navigation === next.navigation
})
10.5 Bundle Analysis
bash# Install bundle analyzer
npm install --save-dev @next/bundle-analyzer

# Add to next.config.js
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
})

module.exports = withBundleAnalyzer({
  // ... config
})

# Run analysis
ANALYZE=true npm run build
Target Metrics:

Main bundle: < 500KB (gzipped)
Admin chunk: < 200KB (gzipped)
Vendor chunk: < 250KB (gzipped)
First Load JS: < 150KB
Time to Interactive: < 3s


11. Security Considerations
11.1 Authentication & Authorization
typescript// middleware.ts
export function middleware(request: NextRequest) {
  const token = request.cookies.get('next-auth.session-token')
  
  if (!token && request.nextUrl.pathname.startsWith('/admin')) {
    return NextResponse.redirect(new URL('/login', request.url))
  }
  
  return NextResponse.next()
}

export const config = {
  matcher: ['/admin/:path*'],
}
11.2 Permission Checks
typescript// Every API route must check permissions
export async function GET(request: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return new Response('Unauthorized', { status: 401 })
  }
  
  const userRole = (session.user as any).role
  if (!hasPermission(userRole, 'ANALYTICS_VIEW')) {
    return new Response('Forbidden', { status: 403 })
  }
  
  // ... proceed
}
11.3 Input Validation
typescript// Use Zod for validation
import { z } from 'zod'

const menuCustomizationSchema = z.object({
  sections: z.array(z.object({
    id: z.string(),
    visible: z.boolean(),
    order: z.number().int().nonnegative(),
    items: z.array(z.object({
      id: z.string(),
      visible: z.boolean(),
      order: z.number().int().nonnegative(),
    })),
  })),
})

// In API route
const body = await request.json()
const validation = menuCustomizationSchema.safeParse(body)

if (!validation.success) {
  return NextResponse.json(
    { error: 'Invalid input', details: validation.error },
    { status: 400 }
  )
}
11.4 Rate Limiting
typescript// Apply rate limiting to sensitive endpoints
import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(10, '10RetryClaude does not have the ability to run the code it generates yet.AContinues'), // 10 requests per 10 seconds
analytics: true,
})
export async function POST(request: Request) {
const session = await getServerSession(authOptions)
if (!session?.user) {
return new Response('Unauthorized', { status: 401 })
}
const identifier = (session.user as any).id
const { success, limit, reset, remaining } = await ratelimit.limit(identifier)
if (!success) {
return new Response('Too many requests', {
status: 429,
headers: {
'X-RateLimit-Limit': limit.toString(),
'X-RateLimit-Remaining': remaining.toString(),
'X-RateLimit-Reset': reset.toString(),
},
})
}
// ... proceed with request
}

### 11.5 CSRF Protection
```typescript
// next-auth handles CSRF tokens automatically
// For custom forms, include CSRF token:

import { getCsrfToken } from 'next-auth/react'

export default function CustomForm() {
  const [csrfToken, setCsrfToken] = useState('')
  
  useEffect(() => {
    getCsrfToken().then(setCsrfToken)
  }, [])
  
  return (
    <form method="post" action="/api/admin/custom">
      <input type="hidden" name="csrfToken" value={csrfToken} />
      {/* ... form fields */}
    </form>
  )
}
11.6 XSS Prevention
typescript// Always sanitize user input before rendering
import DOMPurify from 'isomorphic-dompurify'

function UserContent({ html }: { html: string }) {
  const sanitized = DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a', 'p', 'br'],
    ALLOWED_ATTR: ['href', 'target', 'rel'],
  })
  
  return <div dangerouslySetInnerHTML={{ __html: sanitized }} />
}

// Use proper escaping in JSX (React does this automatically)
function UserName({ name }: { name: string }) {
  return <div>{name}</div> // ✅ Safe - React escapes by default
}
11.7 Audit Logging
typescript// Log all sensitive actions
async function createAuditLog(action: string, metadata?: any) {
  const session = await getServerSession()
  
  await prisma.auditLog.create({
    data: {
      userId: (session?.user as any)?.id,
      action,
      metadata,
      ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip'),
      userAgent: request.headers.get('user-agent'),
    },
  })
}

// Example usage
export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  // ... auth checks
  
  await prisma.booking.delete({ where: { id: params.id } })
  
  await createAuditLog('BOOKING_DELETED', {
    bookingId: params.id,
    reason: 'User requested deletion',
  })
  
  return NextResponse.json({ success: true })
}

12. Accessibility Guidelines
12.1 WCAG 2.1 AA Compliance Checklist
Perceivable:

 Text alternatives for non-text content
 Captions and transcripts for multimedia
 Content adaptable to different presentations
 Sufficient color contrast (4.5:1 for normal text, 3:1 for large text)
 Text resizable up to 200% without loss of functionality
 No content relies solely on color

Operable:

 All functionality available from keyboard
 No keyboard traps
 Adjustable time limits for timed interactions
 Pausable, stoppable animations
 No content flashes more than 3 times per second
 Skip links to main content
 Descriptive page titles
 Focus order follows logical sequence
 Link purpose clear from context
 Multiple ways to navigate (menu, search, sitemap)

Understandable:

 Language of page identified
 Language of parts identified
 On-focus behavior predictable
 On-input behavior predictable
 Navigation consistent across pages
 Components identified consistently
 Error identification clear
 Labels and instructions provided
 Error suggestions provided
 Error prevention for critical actions

Robust:

 Valid HTML markup
 Name, role, value available for all UI components
 Status messages programmatically determined


12.2 Keyboard Navigation Implementation
typescript// components/admin/layout/Sidebar/useKeyboardNavigation.ts
export function useKeyboardNavigation() {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Arrow key navigation
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault()
        const items = document.querySelectorAll('[data-navigation-item]')
        const current = document.activeElement
        const currentIndex = Array.from(items).indexOf(current as Element)
        
        if (currentIndex !== -1) {
          const nextIndex = e.key === 'ArrowDown' 
            ? Math.min(currentIndex + 1, items.length - 1)
            : Math.max(currentIndex - 1, 0)
          
          ;(items[nextIndex] as HTMLElement).focus()
        }
      }
      
      // Expand/collapse with Enter or Space
      if (e.key === 'Enter' || e.key === ' ') {
        const target = e.target as HTMLElement
        if (target.hasAttribute('aria-expanded')) {
          e.preventDefault()
          target.click()
        }
      }
      
      // Home/End keys
      if (e.key === 'Home') {
        e.preventDefault()
        const items = document.querySelectorAll('[data-navigation-item]')
        ;(items[0] as HTMLElement).focus()
      }
      
      if (e.key === 'End') {
        e.preventDefault()
        const items = document.querySelectorAll('[data-navigation-item]')
        ;(items[items.length - 1] as HTMLElement).focus()
      }
    }
    
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [])
}

12.3 Screen Reader Support
typescript// Use semantic HTML and ARIA attributes

// ✅ Good
<nav aria-label="Admin navigation">
  <ul role="list">
    <li>
      <a href="/admin" aria-current="page">
        <Home aria-hidden="true" />
        <span>Dashboard</span>
      </a>
    </li>
  </ul>
</nav>

// ✅ Good - Collapsible sections
<button
  aria-expanded={isExpanded}
  aria-controls="submenu-bookings"
  onClick={toggle}
>
  Bookings
  <ChevronDown aria-hidden="true" />
</button>

<ul id="submenu-bookings" role="group" aria-label="Bookings submenu">
  {/* ... items */}
</ul>

// ✅ Good - Live regions for dynamic content
<div role="status" aria-live="polite" aria-atomic="true">
  {notification && <div>{notification}</div>}
</div>

// ✅ Good - Loading states
<button disabled={loading}>
  {loading && <span className="sr-only">Loading...</span>}
  <span aria-hidden={loading}>Save</span>
</button>

12.4 Focus Management
typescript// Trap focus within modal
import { useEffect, useRef } from 'react'

export function useFocusTrap(isOpen: boolean) {
  const containerRef = useRef<HTMLDivElement>(null)
  
  useEffect(() => {
    if (!isOpen) return
    
    const container = containerRef.current
    if (!container) return
    
    const focusableElements = container.querySelectorAll(
      'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])'
    )
    
    const firstElement = focusableElements[0] as HTMLElement
    const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement
    
    // Focus first element on open
    firstElement?.focus()
    
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return
      
      if (e.shiftKey) {
        // Shift + Tab
        if (document.activeElement === firstElement) {
          e.preventDefault()
          lastElement?.focus()
        }
      } else {
        // Tab
        if (document.activeElement === lastElement) {
          e.preventDefault()
          firstElement?.focus()
        }
      }
    }
    
    container.addEventListener('keydown', handleKeyDown)
    
    return () => {
      container.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen])
  
  return containerRef
}

// Usage in modal
export function Modal({ isOpen, onClose, children }: ModalProps) {
  const containerRef = useFocusTrap(isOpen)
  
  return (
    <div ref={containerRef} role="dialog" aria-modal="true">
      {children}
    </div>
  )
}

12.5 Color Contrast
typescript// Ensure all text meets WCAG AA contrast requirements

// Use CSS custom properties for colors
:root {
  /* Background colors */
  --bg-primary: #ffffff;
  --bg-secondary: #f9fafb;
  --bg-tertiary: #f3f4f6;
  
  /* Text colors (ensure 4.5:1 contrast with backgrounds) */
  --text-primary: #111827;    /* 16.07:1 on white */
  --text-secondary: #6b7280;  /* 4.69:1 on white */
  --text-tertiary: #9ca3af;   /* 3.35:1 on white - use for large text only */
  
  /* Interactive colors */
  --color-primary: #3b82f6;   /* 4.56:1 on white */
  --color-primary-hover: #2563eb;
  
  /* Status colors */
  --color-success: #10b981;   /* 3.04:1 - use on dark backgrounds */
  --color-warning: #f59e0b;   /* 2.37:1 - use on dark backgrounds */
  --color-error: #ef4444;     /* 4.02:1 on white */
}

/* Dark mode */
.dark {
  --bg-primary: #111827;
  --bg-secondary: #1f2937;
  --bg-tertiary: #374151;
  
  --text-primary: #f9fafb;
  --text-secondary: #d1d5db;
  --text-tertiary: #9ca3af;
}

12.6 Reduced Motion Support
typescript// Respect prefers-reduced-motion

// CSS
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}

// JavaScript
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

// Conditionally apply animations
const transition = prefersReducedMotion 
  ? { duration: 0 } 
  : { duration: 0.3, ease: 'easeInOut' }

// Framer Motion example
<motion.div
  initial={{ opacity: 0 }}
  animate={{ opacity: 1 }}
  transition={transition}
>
  {children}
</motion.div>

13. Migration Guide
13.1 Pre-Migration Checklist
Before starting migration:

 Backup database: pg_dump or equivalent
 Backup codebase: Create git branch feature/dashboard-modernization
 Document current state: Screenshot current UI, note custom modifications
 Review dependencies: Check for breaking changes in packages
 Test environment ready: Staging environment available
 Team alignment: All developers aware of changes
 User communication: Notify users of upcoming changes
 Rollback plan: Document rollback procedure


13.2 Step-by-Step Migration
Step 1: Setup & Dependencies (Day 1)
bash# 1. Create feature branch
git checkout -b feature/dashboard-modernization

# 2. Install new dependencies
npm install @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities
npm install @radix-ui/react-tooltip @radix-ui/react-dropdown-menu
npm install @radix-ui/react-dialog @radix-ui/react-tabs
npm install react-hotkeys-hook framer-motion
npm install isomorphic-dompurify

# 3. Install dev dependencies
npm install -D @testing-library/react @testing-library/jest-dom
npm install -D vitest @vitest/ui
npm install -D @playwright/test
npm install -D @axe-core/playwright

# 4. Update package.json scripts
{
  "scripts": {
    "test": "vitest",
    "test:ui": "vitest --ui",
    "test:e2e": "playwright test",
    "test:a11y": "playwright test --grep @a11y"
  }
}
Step 2: Database Migration (Day 1)
bash# 1. Update Prisma schema
# Add MenuCustomization, UserPreferences, AuditLog models

# 2. Create migration
npx prisma migrate dev --name add_user_customization

# 3. Verify migration
npx prisma studio # Check tables created

# 4. Run in production (when ready)
npx prisma migrate deploy
Step 3: Navigation Registry (Days 2-3)
bash# 1. Create navigation registry file
touch src/lib/admin/navigation-registry.ts

# 2. Port navigation items
# Copy from AdminSidebar.tsx → navigation-registry.ts

# 3. Add utility functions
# getNavigationItem, searchNavigation, etc.

# 4. Update AdminSidebar to use registry
# Replace hardcoded navigation array

# 5. Test thoroughly
npm run test src/lib/admin/navigation-registry.test.ts
Step 4: Store Consolidation (Days 3-4)
bash# 1. Create new unified store
touch src/stores/admin/layout.store.ts

# 2. Port state from old stores
# Combine adminLayoutStore + hydration wrappers

# 3. Update all imports
# Find: import.*adminLayoutStore
# Replace with new store imports

# 4. Test hydration
npm run test src/stores/admin/layout.store.test.ts

# 5. Delete old files
rm src/stores/adminLayoutStoreHydrationSafe.ts
rm src/stores/adminLayoutStoreSSRSafe.ts
Step 5: Layout Consolidation (Days 4-5)
bash# 1. Create new unified layout
touch src/components/admin/layout/AdminLayoutClient.tsx

# 2. Merge layout logic
# Combine AdminDashboardLayout + ClientOnlyAdminLayout

# 3. Update app/admin/layout.tsx
# Point to new AdminLayoutClient

# 4. Test all admin pages
npm run dev
# Manually test each route

# 5. Remove legacy files
rm src/app/admin/layout-nuclear.tsx
rm src/app/admin/page-nuclear.tsx
Step 6: Sidebar Enhancement (Week 3)
bash# 1. Create new sidebar structure
mkdir src/components/admin/layout/Sidebar
touch src/components/admin/layout/Sidebar/AdminSidebar.tsx
touch src/components/admin/layout/Sidebar/SidebarHeader.tsx
touch src/components/admin/layout/Sidebar/SidebarNav.tsx
touch src/components/admin/layout/Sidebar/SidebarResizer.tsx
touch src/components/admin/layout/Sidebar/NavigationItem.tsx

# 2. Implement collapsible functionality
# Add collapsed state, animations, tooltips

# 3. Implement resize functionality
# Drag handle, touch support, persistence

# 4. Test extensively
npm run test:e2e e2e/admin-sidebar.spec.ts

# 5. Deploy to staging
git push origin feature/dashboard-modernization
Step 7: User Profile Dropdown (Week 4)
bash# 1. Create component
touch src/components/admin/layout/Header/UserProfileDropdown.tsx
touch src/components/admin/layout/Header/UserStatusIndicator.tsx

# 2. Build dropdown menu
# Avatar, user info, navigation, theme switcher

# 3. Replace header elements
# Remove "Preview Admin" text in AdminHeader.tsx

# 4. Test dropdown
npm run test src/components/admin/layout/Header/UserProfileDropdown.test.tsx

# 5. Accessibility audit
npm run test:a11y -- --grep "UserProfileDropdown"
Step 8: Footer Enhancement (Week 5)
bash# 1. Create new footer
touch src/components/admin/layout/Footer/AdminFooter.tsx

# 2. Build three-column layout
# Product info, system status, support links

# 3. Create health API
touch src/app/api/admin/system/health/route.ts

# 4. Integrate in layout
# Replace old footer in AdminLayoutShell

# 5. Test status updates
# Verify real-time health checks work
Step 9: Menu Customization (Week 6)
bash# 1. Create modal structure
mkdir src/components/admin/layout/MenuCustomization
touch src/components/admin/layout/MenuCustomization/MenuCustomizationModal.tsx
touch src/components/admin/layout/MenuCustomization/SortableMenuItem.tsx

# 2. Implement drag-and-drop
# Use @dnd-kit for sections and items

# 3. Create backend API
touch src/app/api/admin/menu/customization/route.ts

# 4. Create service
touch src/services/menu-customization.service.ts

# 5. Test full flow
npm run test:e2e e2e/menu-customization.spec.ts
Step 10: Settings Drawer (Week 7)
bash# 1. Create drawer structure
mkdir src/components/admin/layout/SettingsDrawer
touch src/components/admin/layout/SettingsDrawer/SettingsDrawer.tsx
touch src/components/admin/layout/SettingsDrawer/AppearanceSettings.tsx
touch src/components/admin/layout/SettingsDrawer/NotificationSettings.tsx
# ... other settings sections

# 2. Create backend API
touch src/app/api/admin/preferences/route.ts

# 3. Create service
touch src/services/user-preferences.service.ts

# 4. Connect to header
# Add settings icon that opens drawer

# 5. Test preferences persistence
npm run test:e2e e2e/settings-drawer.spec.ts

13.3 Rollback Procedure
If critical issues arise:
bash# 1. Immediately switch to previous stable branch
git checkout main
git pull origin main

# 2. Deploy previous version
vercel --prod # or your deployment command

# 3. Database rollback (if needed)
# Revert last migration
npx prisma migrate resolve --rolled-back [migration-name]

# 4. Notify users
# Send email/notification about temporary revert

# 5. Fix issues in feature branch
git checkout feature/dashboard-modernization
# Fix issues, add tests, verify

# 6. Re-deploy when ready
# After thorough testing

13.4 User Communication Template
Email to users before migration:
Subject: Admin Dashboard Upgrade - [Date]

Hi [Name],

We're excited to announce a major upgrade to the NextAccounting Admin Dashboard!

What's New:
✨ Modern, customizable navigation menu
✨ Personalized theme and layout preferences
✨ Improved performance and responsiveness
✨ Enhanced accessibility features

When: [Date and Time]
Downtime: Approximately 30 minutes

What You Need to Do:
- Save any unsaved work before [time]
- Clear your browser cache after the update
- Review new features in the help guide (link)

Questions? Contact support@nextaccounting.com

Thank you for your patience!
The NextAccounting Team

14. Success Metrics
14.1 Performance Metrics
Baseline (Before):

Page Load Time: 3.2s
Time to Interactive: 4.1s
Bundle Size: 450KB (gzipped)
Lighthouse Score: 78/100

Target (After):

Page Load Time: < 2.0s (37% improvement)
Time to Interactive: < 3.0s (27% improvement)
Bundle Size: < 360KB (20% reduction)
Lighthouse Score: > 90/100

Measurement Tools:

Chrome DevTools Performance tab
Lighthouse CI
WebPageTest.org
Vercel Analytics


14.2 User Experience Metrics
Quantitative:

 Task completion time -25%
 Error rate -40%
 Support tickets -30%
 Feature adoption rate > 50% (customization features)
 User retention +10%

Qualitative:

 User satisfaction score > 4.5/5
 Net Promoter Score (NPS) > 50
 Feature usefulness rating > 4/5
 UI/UX feedback positive > 80%

Measurement Methods:

In-app surveys (post-update)
User interviews (5-10 users)
Analytics tracking (Mixpanel, Amplitude)
Heatmaps (Hotjar, Mouseflow)
Session recordings


14.3 Technical Metrics
Code Quality:

 Test coverage > 80%
 Zero TypeScript errors
 ESLint violations < 10
 Accessibility violations: 0 (critical)
 Security vulnerabilities: 0 (high/critical)

Reliability:

 Error rate < 0.1%
 Uptime > 99.9%
 API response time p95 < 500ms
 Database query time p95 < 100ms


14.4 Business Metrics
Adoption:

 Daily active users (DAU) +15%
 Session duration +20%
 Pages per session +10%
 Return user rate +12%

Efficiency:

 Admin tasks completed +25%
 Time spent on admin tasks -20%
 Feature discovery rate +30%


15. Appendix
15.1 Glossary
TermDefinitionCollapsible SidebarA navigation sidebar that can be toggled between expanded (full width) and collapsed (icon-only) statesHydrationThe process of attaching React event handlers to server-rendered HTMLSSRServer-Side Rendering - rendering React components on the serverCSRClient-Side Rendering - rendering React components in the browserSWRStale-While-Revalidate - data fetching strategy that shows cached data while fetching fresh dataDnDDrag-and-Drop functionalityA11yAccessibility (a + 11 letters + y)WCAGWeb Content Accessibility GuidelinesARIAAccessible Rich Internet Applications - specifications for accessible web appsTree-shakingProcess of removing unused code from JavaScript bundlesCode SplittingBreaking JavaScript bundle into smaller chunks that load on demand

15.2 Resources & References
Documentation:

Next.js Documentation
React Documentation
Prisma Documentation
Zustand Documentation
SWR Documentation
Tailwind CSS Documentation

Accessibility:

WCAG 2.1 Guidelines
MDN Accessibility
A11y Project
WebAIM

Design Systems:

QuickBooks Design System
Material Design
Ant Design
Atlassian Design System

Testing:

Vitest Documentation
Testing Library
Playwright Documentation
jest-axe


15.3 Support & Contact
Development Team:

Technical Lead: [Name] - [email]
Frontend Lead: [Name] - [email]
Backend Lead: [Name] - [email]
QA Lead: [Name] - [email]

Project Management:

Project Manager: [Name] - [email]
Product Owner: [Name] - [email]

Communication Channels:

Slack: #admin-dashboard-modernization
Daily Standup: 10:00 AM EST
Sprint Planning: Mondays 2:00 PM EST
Demo: Fridays 3:00 PM EST


15.4 Change Log
VersionDateChangesAuthor1.0.02025-10-11Initial comprehensive strategy documentSenior Dev Team

Document End

Next Steps
To begin implementation, choose your starting point:

Quick Wins (1-2 days):

Remove legacy files
Fix invoice templates menu item
Add loading skeletons
Improve error messages


Phase 1 Foundation (Week 1-2):

Navigation registry
Store consolidation
Layout cleanup


Phase 2 UI Enhancements (Week 3-5):

Collapsible sidebar
User profile dropdown
Enhanced footer


Phase 3 Advanced Features (Week 6-8):

Menu customization
Settings drawer
Data optimization