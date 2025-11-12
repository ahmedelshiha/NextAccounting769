NextAccounting Admin Dashboard Modernization - Action Plan
Project: NextAccounting Admin Dashboard Enhancement
Timeline: 10 Weeks
Team: Builder.io AI + Senior Developer Review
Goal: Transform admin interface to modern SaaS standards with QuickBooks-inspired UI

📋 Executive Summary
This action plan converts the comprehensive strategy document into executable tasks for Builder.io automation. Each task includes clear acceptance criteria, test requirements, and dependencies.
Key Deliverables:

✅ Modern collapsible sidebar with resize functionality
✅ QuickBooks-inspired user profile dropdown
✅ Enhanced footer with system health monitoring
✅ Menu customization system with drag-and-drop
✅ Comprehensive settings drawer
✅ Navigation registry system
✅ Performance optimization (20% bundle reduction)
✅ WCAG 2.1 AA accessibility compliance


🎯 Phase 1: Foundation & Cleanup (Weeks 1-2)
Task 1.1: Environment Setup
Priority: HIGH
Estimated Time: 2 hours
Dependencies: None
Actions:
bash# Create feature branch
git checkout -b feature/dashboard-modernization

# Install dependencies
npm install @dnd-kit/core@6.0.8 @dnd-kit/sortable@7.0.2 @dnd-kit/utilities@3.2.1
npm install @radix-ui/react-dropdown-menu@2.0.6
npm install @radix-ui/react-dialog@1.0.5
npm install @radix-ui/react-tabs@1.0.4
npm install react-hotkeys-hook@4.4.1
npm install isomorphic-dompurify@1.9.0

# Install dev dependencies
npm install -D vitest@1.0.4 @vitest/ui@1.0.4
npm install -D @playwright/test@1.40.0
npm install -D @axe-core/playwright@4.8.2
npm install -D @testing-library/react@14.1.2
npm install -D @testing-library/jest-dom@6.1.5
Acceptance Criteria:

✅ All dependencies installed without conflicts
✅ Feature branch created
✅ Test scripts added to package.json
✅ TypeScript compiles without errors

Test Command:
bashnpm install && npm run build && npm run type-check

Task 1.2: Remove Legacy Layout Files
Priority: HIGH
Estimated Time: 3 hours
Dependencies: Task 1.1
Actions:
bash# 1. Audit all imports
grep -r "layout-nuclear" src/
grep -r "page-nuclear" src/

# 2. Update imports to use standard layout
# Replace all references in affected files

# 3. Delete legacy files
rm src/app/admin/layout-nuclear.tsx
rm src/app/admin/page-nuclear.tsx

# 4. Verify no broken imports
npm run build
Files to Update:

src/app/admin/layout.tsx - Ensure using correct layout
Any components importing legacy files

Acceptance Criteria:

✅ No references to legacy files in codebase
✅ All pages render correctly
✅ Build completes without errors
✅ No TypeScript errors

Test Command:
bashnpm run build && npm run lint

Task 1.3: Create Unified Navigation Registry
Priority: HIGH
Estimated Time: 8 hours
Dependencies: Task 1.2
Actions:
Step 1: Create registry file
typescript// src/lib/admin/navigation-registry.ts
import { type LucideIcon } from 'lucide-react'
import * as Icons from 'lucide-react'

export interface NavigationItem {
  id: string
  label: string
  href: string
  icon: LucideIcon
  description?: string
  keywords?: string[]
  permission?: string
  badge?: () => Promise<number> | number
  children?: NavigationItem[]
  external?: boolean
  disabled?: boolean
  beta?: boolean
}

export interface NavigationSection {
  id: string
  label: string
  order: number
  collapsible?: boolean
  defaultExpanded?: boolean
  items: NavigationItem[]
}

// Define complete registry
export const NAVIGATION_REGISTRY: NavigationSection[] = [
  // ... (copy full structure from document)
]

// Utility functions
export function getNavigationItem(id: string): NavigationItem | null { }
export function getNavigationItemByHref(href: string): NavigationItem | null { }
export function searchNavigation(query: string): NavigationItem[] { }
export function getNavigationByPermission(userRole: string): NavigationSection[] { }
export function getBreadcrumbs(pathname: string): Array<{ label: string; href: string }> { }
Step 2: Port all navigation items

Copy current navigation from AdminSidebar.tsx
Add metadata (descriptions, keywords)
Add permissions checks
FIX: Remove "Invoice Templates" entry (doesn't exist)

Step 3: Create tests
typescript// src/lib/admin/__tests__/navigation-registry.test.ts
describe('NavigationRegistry', () => {
  it('finds navigation item by id', () => {})
  it('searches navigation by query', () => {})
  it('filters by permission', () => {})
  it('generates correct breadcrumbs', () => {})
  it('handles missing items gracefully', () => {})
})
Acceptance Criteria:

✅ All 40+ navigation items ported to registry
✅ All utility functions implemented
✅ Invoice Templates entry removed
✅ Test coverage > 90%
✅ TypeScript types fully defined
✅ Documentation added

Test Command:
bashnpm run test src/lib/admin/__tests__/navigation-registry.test.ts

Task 1.4: Consolidate Admin Layout Store
Priority: HIGH
Estimated Time: 6 hours
Dependencies: Task 1.3
Actions:
Step 1: Create unified store
typescript// src/stores/admin/layout.store.ts
import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { devtools } from 'zustand/middleware'

interface AdminLayoutState {
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
  
  // Actions
  toggleSidebar: () => void
  setSidebarCollapsed: (collapsed: boolean) => void
  setSidebarWidth: (width: number) => void
  // ... other actions
}

export const useAdminLayoutStore = create<AdminLayoutState>()(
  devtools(
    persist(
      (set, get) => ({
        // ... implementation
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
      }
    )
  )
)

// Selector hooks
export const useSidebarState = () => useAdminLayoutStore(state => state.sidebar)
export const useNavigationState = () => useAdminLayoutStore(state => state.navigation)

// SSR-safe hook
export function useAdminLayoutSSR() {
  const [hydrated, setHydrated] = useState(false)
  const store = useAdminLayoutStore()
  
  useEffect(() => setHydrated(true), [])
  
  return hydrated ? store : defaultState
}
Step 2: Update all imports
bash# Find all usages
grep -r "adminLayoutStore" src/

# Update imports systematically
# From: import { useAdminLayoutStore } from '@/stores/adminLayoutStoreHydrationSafe'
# To: import { useAdminLayoutStore } from '@/stores/admin/layout.store'
Step 3: Delete old files
bashrm src/stores/adminLayoutStoreHydrationSafe.ts
rm src/stores/adminLayoutStoreSSRSafe.ts
Acceptance Criteria:

✅ Single source of truth for layout state
✅ SSR-safe with proper hydration
✅ All imports updated
✅ Old store files deleted
✅ Persistence working correctly
✅ No hydration mismatches
✅ Tests passing

Test Command:
bashnpm run test src/stores/admin/__tests__/layout.store.test.ts

Task 1.5: Consolidate Layout Components
Priority: HIGH
Estimated Time: 6 hours
Dependencies: Task 1.4
Actions:
Step 1: Create unified client layout
typescript// src/components/admin/layout/AdminLayoutClient.tsx
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
Step 2: Create layout shell
typescript// src/components/admin/layout/AdminLayoutShell.tsx
'use client'
export default function AdminLayoutShell({ children }) {
  const { sidebar } = useAdminLayout()
  
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
Step 3: Update server layout
typescript// src/app/admin/layout.tsx
import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { AdminLayoutClient } from '@/components/admin/layout/AdminLayoutClient'

export default async function AdminLayout({ children }) {
  const session = await getServerSession()
  if (!session?.user) redirect('/login')
  
  return <AdminLayoutClient session={session}>{children}</AdminLayoutClient>
}
Step 4: Delete redundant wrappers
bashrm src/components/admin/layout/AdminDashboardLayoutLazy.tsx
rm src/components/admin/layout/ClientOnlyAdminLayout.tsx
Acceptance Criteria:

✅ Clear separation: Server auth → Client layout → Shell
✅ Single hydration point
✅ Lazy loading implemented
✅ All admin pages render correctly
✅ No hydration warnings
✅ Performance improved

Test Command:
bashnpm run dev
# Manually test: /admin, /admin/analytics, /admin/bookings
# Check console for hydration errors

Task 1.6: Database Schema Updates
Priority: HIGH
Estimated Time: 4 hours
Dependencies: Task 1.5
Actions:
Step 1: Update Prisma schema
prisma// prisma/schema.prisma

model MenuCustomization {
  id        String   @id @default(cuid())
  userId    String   @unique
  config    Json
  version   Int      @default(1)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  @@index([userId])
  @@index([updatedAt])
}

model UserPreferences {
  id            String   @id @default(cuid())
  userId        String   @unique
  appearance    Json     @default("{}")
  notifications Json     @default("{}")
  regional      Json     @default("{}")
  dashboard     Json     @default("{}")
  advanced      Json     @default("{}")
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  
  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  @@index([userId])
}

model AuditLog {
  id         String   @id @default(cuid())
  userId     String
  action     String
  entityType String?
  entityId   String?
  metadata   Json?
  ipAddress  String?
  userAgent  String?
  createdAt  DateTime @default(now())
  
  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  @@index([userId])
  @@index([action])
  @@index([entityType, entityId])
  @@index([createdAt])
}

model NavigationFavorite {
  id        String   @id @default(cuid())
  userId    String
  itemId    String
  order     Int      @default(0)
  createdAt DateTime @default(now())
  
  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  @@unique([userId, itemId])
  @@index([userId])
}

// Update User model
model User {
  // ... existing fields
  
  menuCustomization   MenuCustomization?
  preferences         UserPreferences?
  auditLogs           AuditLog[]
  navigationFavorites NavigationFavorite[]
}
Step 2: Create and run migration
bash# Create migration
npx prisma migrate dev --name add_user_customization

# Generate Prisma Client
npx prisma generate

# Verify in Prisma Studio
npx prisma studio
Acceptance Criteria:

✅ All tables created successfully
✅ Indexes added
✅ Relations configured correctly
✅ Prisma Client regenerated
✅ No migration errors

Test Command:
bashnpx prisma migrate dev --name add_user_customization && npx prisma generate

🎨 Phase 2: QuickBooks-Inspired UI (Weeks 3-5)
Task 2.1: Collapsible Sidebar - Structure
Priority: HIGH
Estimated Time: 8 hours
Dependencies: Task 1.6
Actions:
Step 1: Create sidebar component structure
bashmkdir -p src/components/admin/layout/Sidebar
touch src/components/admin/layout/Sidebar/AdminSidebar.tsx
touch src/components/admin/layout/Sidebar/SidebarHeader.tsx
touch src/components/admin/layout/Sidebar/SidebarNav.tsx
touch src/components/admin/layout/Sidebar/SidebarFooter.tsx
touch src/components/admin/layout/Sidebar/SidebarResizer.tsx
touch src/components/admin/layout/Sidebar/NavigationItem.tsx
Step 2: Implement AdminSidebar
typescript// src/components/admin/layout/Sidebar/AdminSidebar.tsx
'use client'

export default function AdminSidebar({ className }: { className?: string }) {
  const pathname = usePathname()
  const { isMobile } = useResponsive()
  const {
    collapsed,
    width,
    mobileOpen,
    setCollapsed,
    setMobileOpen,
  } = useSidebarState()
  
  const effectiveWidth = collapsed ? 64 : width
  
  // Auto-collapse on mobile/tablet
  useEffect(() => {
    if (isMobile) setCollapsed(true)
  }, [isMobile, setCollapsed])
  
  // Close mobile sidebar on route change
  useEffect(() => {
    if (isMobile) setMobileOpen(false)
  }, [pathname, isMobile, setMobileOpen])
  
  return (
    <>
      {/* Mobile Backdrop */}
      {isMobile && mobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40"
          onClick={() => setMobileOpen(false)}
        />
      )}
      
      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 h-screen bg-white border-r border-gray-200
          transition-all duration-300 ease-in-out z-30
          ${isMobile && !mobileOpen ? '-translate-x-full' : 'translate-x-0'}
          ${className || ''}`}
        style={{ width: effectiveWidth }}
      >
        <SidebarHeader collapsed={collapsed} />
        
        <div className="flex-1 overflow-y-auto py-4">
          <SidebarNav collapsed={collapsed} />
        </div>
        
        <SidebarFooter collapsed={collapsed} />
        
        {!isMobile && !collapsed && (
          <SidebarResizer currentWidth={width} />
        )}
      </aside>
      
      {/* Spacer for fixed sidebar */}
      {!isMobile && (
        <div style={{ width: effectiveWidth }} className="flex-shrink-0 transition-all duration-300" />
      )}
    </>
  )
}
Step 3: Implement SidebarHeader
typescript// src/components/admin/layout/Sidebar/SidebarHeader.tsx
export function SidebarHeader({ collapsed }: { collapsed: boolean }) {
  const { setCollapsed } = useSidebarState()
  
  return (
    <div className="flex items-center justify-between p-4 border-b">
      {!collapsed && (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">NA</span>
          </div>
          <div>
            <div className="text-sm font-semibold text-gray-900">NextAccounting</div>
            <div className="text-xs text-gray-500">Admin Dashboard</div>
          </div>
        </div>
      )}
      
      {collapsed && (
        <button
          onClick={() => setCollapsed(false)}
          className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center mx-auto"
        >
          <span className="text-white font-bold text-sm">NA</span>
        </button>
      )}
      
      {!collapsed && (
        <button
          onClick={() => setCollapsed(true)}
          className="p-1 rounded hover:bg-gray-100"
        >
          <ChevronsLeft className="w-4 h-4 text-gray-500" />
        </button>
      )}
    </div>
  )
}
Acceptance Criteria:

✅ Sidebar structure created
✅ Collapsed/expanded states work
✅ Mobile overlay implemented
✅ Smooth transitions
✅ No layout shifts
✅ TypeScript types complete

Test Command:
bashnpm run dev
# Test on desktop, tablet, mobile viewports
# Verify collapse/expand animation

Task 2.2: Sidebar Navigation with Registry
Priority: HIGH
Estimated Time: 6 hours
Dependencies: Task 2.1
Actions:
Step 1: Implement SidebarNav
typescript// src/components/admin/layout/Sidebar/SidebarNav.tsx
export function SidebarNav({ collapsed }: { collapsed: boolean }) {
  const { data: session } = useSession()
  const userRole = session?.user?.role
  
  const navigation = useMemo(() => {
    return getNavigationByPermission(userRole)
  }, [userRole])
  
  const { expandedGroups, toggleGroup } = useNavigationState()
  
  return (
    <nav className="px-2 space-y-1">
      {navigation.map(section => (
        <div key={section.id} className="space-y-1">
          {!collapsed && (
            <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase">
              {section.label}
            </div>
          )}
          
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
Step 2: Implement NavigationItem
typescript// src/components/admin/layout/Sidebar/NavigationItem.tsx
export function NavigationItem({ item, collapsed, expanded, onToggle, depth = 0 }) {
  const pathname = usePathname()
  const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
  const hasChildren = item.children?.length > 0
  
  // Badge loading
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
  
  return (
    <div>
      {hasChildren ? (
        <button
          onClick={onToggle}
          className={`flex items-center gap-3 px-3 py-2 rounded-lg w-full
            ${isActive ? 'bg-blue-50 text-blue-700' : 'text-gray-700 hover:bg-gray-100'}`}
        >
          <Icon className="w-5 h-5" />
          {!collapsed && (
            <>
              <span className="flex-1 text-left text-sm">{item.label}</span>
              {badge && <Badge>{badge}</Badge>}
              {expanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            </>
          )}
        </button>
      ) : (
        <Link
          href={item.href}
          className={`flex items-center gap-3 px-3 py-2 rounded-lg
            ${isActive ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-700 hover:bg-gray-100'}`}
        >
          <Icon className="w-5 h-5" />
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
        <Tooltip content={item.label} side="right" />
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
Acceptance Criteria:

✅ Navigation uses registry
✅ Permission filtering works
✅ Active states correct
✅ Badge counts display
✅ Expandable groups work
✅ Tooltips show when collapsed
✅ Keyboard navigation works

Test Command:
bashnpm run test src/components/admin/layout/Sidebar/__tests__/SidebarNav.test.tsx

Task 2.3: Sidebar Resize Functionality
Priority: MEDIUM
Estimated Time: 4 hours
Dependencies: Task 2.2
Actions:
Step 1: Implement SidebarResizer
typescript// src/components/admin/layout/Sidebar/SidebarResizer.tsx
export function SidebarResizer({ currentWidth }: { currentWidth: number }) {
  const { setWidth } = useSidebarState()
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
      setWidth(newWidth)
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
  }, [isDragging, setWidth])
  
  return (
    <div
      className="absolute top-0 right-0 w-1 h-full cursor-col-resize hover:bg-blue-500 transition-colors"
      onMouseDown={handleMouseDown}
      role="separator"
      aria-label="Resize sidebar"
    />
  )
}
Step 2: Add keyboard shortcuts
typescript// src/hooks/admin/useSidebarShortcuts.ts
import { useHotkeys } from 'react-hotkeys-hook'

export function useSidebarShortcuts() {
  const { toggleSidebar, setCollapsed } = useSidebarState()
  
  useHotkeys('mod+b', () => toggleSidebar())
  useHotkeys('mod+[', () => setCollapsed(true))
  useHotkeys('mod+]', () => setCollapsed(false))
}
Acceptance Criteria:

✅ Drag to resize works smoothly
✅ Min/max width constraints enforced (160px - 420px)
✅ Width persists to localStorage
✅ Touch support (optional for Phase 2)
✅ Keyboard shortcuts work
✅ Visual feedback during drag

Test Command:
bashnpm run test:e2e e2e/admin-sidebar.spec.ts

Task 2.4: User Profile Dropdown
Priority: HIGH
Estimated Time: 6 hours
Dependencies: Task 2.3
Actions:
Step 1: Create component structure
bashmkdir -p src/components/admin/layout/Header
touch src/components/admin/layout/Header/UserProfileDropdown.tsx
touch src/components/admin/layout/Header/UserStatusIndicator.tsx
Step 2: Implement UserProfileDropdown
typescript// src/components/admin/layout/Header/UserProfileDropdown.tsx
export function UserProfileDropdown() {
  const { data: session } = useSession()
  const router = useRouter()
  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>('system')
  
  const user = session?.user
  const initials = user?.name
    ?.split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || 'U'
  
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-100">
          <Avatar className="w-8 h-8">
            <AvatarImage src={user?.image || undefined} />
            <AvatarFallback className="bg-blue-600 text-white">
              {initials}
            </AvatarFallback>
          </Avatar>
          
          <div className="hidden md:block text-left">
            <div className="text-sm font-medium">{user?.name}</div>
            <div className="text-xs text-gray-500">{userRole}</div>
          </div>
          
          <ChevronDown className="w-4 h-4" />
        </button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent align="end" className="w-64">
        {/* User Info */}
        <DropdownMenuLabel>
          <div className="flex items-center gap-3">
            <Avatar className="w-10 h-10">
              <AvatarImage src={user?.image || undefined} />
              <AvatarFallback>{initials}</AvatarFallback>
            </Avatar>
            <div>
              <div className="font-semibold">{user?.name}</div>
              <div className="text-xs text-gray-500">{user?.email}</div>
            </div>
          </div>
        </DropdownMenuLabel>
        
        <DropdownMenuSeparator />
        
        {/* Navigation */}
        <DropdownMenuGroup>
          <DropdownMenuItem onClick={() => router.push('/admin/settings/profile')}>
            <User className="w-4 h-4 mr-2" />
            Profile
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => router.push('/admin/settings')}>
            <Settings className="w-4 h-4 mr-2" />
            Settings
          </DropdownMenuItem>
          {/* ... more items */}
        </DropdownMenuGroup>
        
        <DropdownMenuSeparator />
        
        {/* Theme Submenu */}
        <DropdownMenuSub>
          <DropdownMenuSubTrigger>
            <Sun className="w-4 h-4 mr-2" />
            Theme
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent>
            <DropdownMenuRadioGroup value={theme} onValueChange={setTheme}>
              <DropdownMenuRadioItem value="light">Light</DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="dark">Dark</DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="system">System</DropdownMenuRadioItem>
            </DropdownMenuRadioGroup>
          </DropdownMenuSubContent>
        </DropdownMenuSub>
        
        <DropdownMenuSeparator />
        
        {/* Sign Out */}
        <DropdownMenuItem
          onClick={() => signOut({ callbackUrl: '/login' })}RetryAEContinuetypescript          className="text-red-600"
        >
          <LogOut className="w-4 h-4 mr-2" />
          Sign Out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
Step 3: Implement UserStatusIndicator
typescript// src/components/admin/layout/Header/UserStatusIndicator.tsx
export function UserStatusIndicator() {
  const [status, setStatus] = useState<'online' | 'away' | 'busy'>('online')
  
  useEffect(() => {
    let timeout: NodeJS.Timeout
    
    const resetTimer = () => {
      clearTimeout(timeout)
      if (status === 'away') setStatus('online')
      
      timeout = setTimeout(() => setStatus('away'), 5 * 60 * 1000)
    }
    
    document.addEventListener('mousemove', resetTimer)
    document.addEventListener('keypress', resetTimer)
    
    return () => {
      clearTimeout(timeout)
      document.removeEventListener('mousemove', resetTimer)
      document.removeEventListener('keypress', resetTimer)
    }
  }, [status])
  
  const colors = {
    online: 'bg-green-500',
    away: 'bg-yellow-500',
    busy: 'bg-red-500',
  }
  
  return (
    <div className="relative">
      <div className={`w-3 h-3 rounded-full ${colors[status]} ring-2 ring-white`} />
      {status === 'online' && (
        <div className="absolute inset-0 w-3 h-3 rounded-full bg-green-500 animate-ping opacity-75" />
      )}
    </div>
  )
}
Step 4: Update AdminHeader
typescript// src/components/admin/layout/AdminHeader.tsx
export default function AdminHeader() {
  // Remove "Preview Admin" text
  // Replace with UserProfileDropdown
  
  return (
    <header className="sticky top-0 z-20 bg-white border-b border-gray-200">
      <div className="flex items-center justify-between px-4 py-3">
        {/* Left: Breadcrumbs */}
        <Breadcrumbs />
        
        {/* Right: Actions + Profile */}
        <div className="flex items-center gap-4">
          <TenantSwitcher />
          <NotificationsDropdown />
          <UserProfileDropdown />
        </div>
      </div>
    </header>
  )
}
Acceptance Criteria:

✅ Dropdown displays user info correctly
✅ Avatar with fallback initials works
✅ Theme switcher applies instantly
✅ Status indicator shows activity
✅ All navigation links work
✅ Sign out functionality works
✅ Accessible (keyboard navigation, ARIA labels)
✅ "Preview Admin" text removed

Test Command:
bashnpm run test src/components/admin/layout/Header/__tests__/UserProfileDropdown.test.tsx
npm run test:e2e e2e/user-profile-dropdown.spec.ts

Task 2.5: Enhanced Footer with System Health
Priority: MEDIUM
Estimated Time: 6 hours
Dependencies: Task 2.4
Actions:
Step 1: Create health check API
typescript// src/app/api/admin/system/health/route.ts
import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: Request) {
  try {
    const session = await getServerSession()
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
      if (dbLatency > 1000) dbStatus = 'degraded'
    } catch {
      dbStatus = 'outage'
    }
    
    // Determine overall status
    let overallStatus: 'operational' | 'degraded' | 'outage' = 'operational'
    let message = 'All systems operational'
    
    if (dbStatus === 'outage') {
      overallStatus = 'outage'
      message = 'System outage detected'
    } else if (dbStatus === 'degraded') {
      overallStatus = 'degraded'
      message = 'Degraded performance'
    }
    
    return NextResponse.json({
      status: overallStatus,
      message,
      checks: {
        database: { status: dbStatus, latency: dbLatency },
      },
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    return NextResponse.json(
      { status: 'outage', message: 'Health check failed' },
      { status: 500 }
    )
  }
}
Step 2: Create enhanced footer
typescript// src/components/admin/layout/Footer/AdminFooter.tsx
export default function AdminFooter() {
  const [systemStatus, setSystemStatus] = useState({
    status: 'operational' as const,
    message: 'All systems operational',
  })
  
  const APP_VERSION = process.env.NEXT_PUBLIC_APP_VERSION || 'v2.3.2'
  
  useEffect(() => {
    const checkStatus = async () => {
      try {
        const res = await fetch('/api/admin/system/health')
        const data = await res.json()
        setSystemStatus({ status: data.status, message: data.message })
      } catch {
        setSystemStatus({
          status: 'degraded',
          message: 'Unable to check status',
        })
      }
    }
    
    checkStatus()
    const interval = setInterval(checkStatus, 60000)
    return () => clearInterval(interval)
  }, [])
  
  const statusColors = {
    operational: 'bg-green-500',
    degraded: 'bg-yellow-500',
    outage: 'bg-red-500',
  }
  
  return (
    <footer className="bg-white border-t border-gray-200 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Desktop Layout */}
        <div className="hidden md:grid md:grid-cols-3 md:gap-8 py-3 items-center text-sm">
          {/* Left: Product Info */}
          <div className="flex items-center gap-4">
            <div>
              <div className="font-semibold">NextAccounting Admin</div>
              <div className="text-xs text-gray-500">{APP_VERSION}</div>
            </div>
            
            <div className="flex gap-3 pl-4 border-l">
              <Link href="/admin/analytics" className="text-gray-600 hover:text-gray-900">
                <BarChart3 className="w-4 h-4" />
              </Link>
              <Link href="/admin/settings" className="text-gray-600 hover:text-gray-900">
                <Settings className="w-4 h-4" />
              </Link>
            </div>
          </div>
          
          {/* Center: System Status */}
          <div className="flex justify-center">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-gray-100">
              <div className={`w-2 h-2 rounded-full ${statusColors[systemStatus.status]} animate-pulse`} />
              <span className="text-xs font-medium">{systemStatus.message}</span>
            </div>
          </div>
          
          {/* Right: Support */}
          <div className="flex items-center justify-end gap-6">
            <Link href="/admin/help" className="text-gray-600 hover:text-gray-900">
              Help
            </Link>
            <Link href="/docs" target="_blank" className="text-gray-600 hover:text-gray-900">
              Docs
            </Link>
            <span className="text-xs text-gray-400">
              © {new Date().getFullYear()} NextAccounting
            </span>
          </div>
        </div>
        
        {/* Mobile Layout */}
        <div className="md:hidden py-4 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-semibold text-sm">NextAccounting Admin</div>
              <div className="text-xs text-gray-500">{APP_VERSION}</div>
            </div>
            <div className={`w-2 h-2 rounded-full ${statusColors[systemStatus.status]}`} />
          </div>
          <div className="text-center text-xs text-gray-400">
            © {new Date().getFullYear()} NextAccounting
          </div>
        </div>
      </div>
    </footer>
  )
}
Acceptance Criteria:

✅ System health API working
✅ Footer displays status indicator
✅ Status updates every 60 seconds
✅ Three-column desktop layout
✅ Responsive mobile layout
✅ All links functional
✅ Version number displays correctly

Test Command:
bashnpm run test src/app/api/admin/system/health/__tests__/route.test.ts
curl http://localhost:3000/api/admin/system/health

⚡ Phase 3: Advanced Features (Weeks 6-8)
Task 3.1: Menu Customization - Backend
Priority: HIGH
Estimated Time: 6 hours
Dependencies: Task 2.5
Actions:
Step 1: Create API endpoints
typescript// src/app/api/admin/menu/customization/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'
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

// GET - Load menu customization
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession()
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
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}

// PUT - Save menu customization
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const userId = (session.user as any).id
    const body = await request.json()
    
    // Validate
    const validation = menuCustomizationSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: validation.error },
        { status: 400 }
      )
    }
    
    const customization = await prisma.menuCustomization.upsert({
      where: { userId },
      update: {
        config: validation.data.sections,
        updatedAt: new Date(),
      },
      create: {
        userId,
        config: validation.data.sections,
      },
    })
    
    return NextResponse.json({
      userId: customization.userId,
      sections: customization.config,
      updatedAt: customization.updatedAt.toISOString(),
    })
  } catch (error) {
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}

// DELETE - Reset to defaults
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const userId = (session.user as any).id
    await prisma.menuCustomization.delete({ where: { userId } })
    
    return NextResponse.json({ success: true })
  } catch (error) {
    if ((error as any).code === 'P2025') {
      return NextResponse.json({ success: true })
    }
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
Step 2: Create service layer
typescript// src/services/menu-customization.service.ts
export async function saveMenuCustomization(config: { sections: any[] }) {
  const res = await fetch('/api/admin/menu/customization', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(config),
  })
  if (!res.ok) throw new Error('Failed to save')
  return res.json()
}

export async function loadMenuCustomization() {
  const res = await fetch('/api/admin/menu/customization')
  if (res.status === 404) return null
  if (!res.ok) throw new Error('Failed to load')
  return res.json()
}

export async function resetMenuCustomization() {
  const res = await fetch('/api/admin/menu/customization', { method: 'DELETE' })
  if (!res.ok) throw new Error('Failed to reset')
  return res.json()
}
Acceptance Criteria:

✅ GET endpoint returns user's config
✅ PUT endpoint saves and validates
✅ DELETE endpoint resets config
✅ Input validation with Zod
✅ Proper error handling
✅ Service layer created

Test Command:
bashnpm run test src/app/api/admin/menu/customization/__tests__/route.test.ts

Task 3.2: Menu Customization - Frontend
Priority: HIGH
Estimated Time: 10 hours
Dependencies: Task 3.1
Actions:
Step 1: Create modal structure
bashmkdir -p src/components/admin/layout/MenuCustomization
touch src/components/admin/layout/MenuCustomization/MenuCustomizationModal.tsx
touch src/components/admin/layout/MenuCustomization/SortableMenuItem.tsx
Step 2: Implement SortableMenuItem
typescript// src/components/admin/layout/MenuCustomization/SortableMenuItem.tsx
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { GripVertical, Eye, EyeOff } from 'lucide-react'
import { Switch } from '@/components/ui/switch'

export function SortableMenuItem({ id, label, visible, onToggleVisibility }) {
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
      className={`flex items-center gap-3 px-3 py-2 bg-white border rounded-lg
        ${isDragging ? 'shadow-lg' : 'shadow-sm'}`}
    >
      <button
        type="button"
        className="cursor-grab active:cursor-grabbing p-1 text-gray-400"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="w-4 h-4" />
      </button>
      
      <span className="flex-1 text-sm">{label}</span>
      
      <div className="flex items-center gap-2">
        {visible ? <Eye className="w-4 h-4 text-gray-400" /> : <EyeOff className="w-4 h-4 text-gray-400" />}
        <Switch checked={visible} onCheckedChange={onToggleVisibility} />
      </div>
    </div>
  )
}
Step 3: Implement MenuCustomizationModal
typescript// src/components/admin/layout/MenuCustomization/MenuCustomizationModal.tsx
import { useState, useEffect } from 'react'
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors } from '@dnd-kit/core'
import { arrayMove, SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import { toast } from 'sonner'
import { NAVIGATION_REGISTRY } from '@/lib/admin/navigation-registry'
import { SortableMenuItem } from './SortableMenuItem'
import { saveMenuCustomization, loadMenuCustomization, resetMenuCustomization } from '@/services/menu-customization.service'

export function MenuCustomizationModal({ open, onOpenChange }) {
  const [sections, setSections] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [isDirty, setIsDirty] = useState(false)
  
  const sensors = useSensors(useSensor(PointerSensor))
  
  useEffect(() => {
    if (open) loadConfiguration()
  }, [open])
  
  const loadConfiguration = async () => {
    setLoading(true)
    try {
      const saved = await loadMenuCustomization()
      if (saved) {
        setSections(saved.sections)
      } else {
        // Initialize from registry
        const initialSections = NAVIGATION_REGISTRY.map((section, idx) => ({
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
      toast.error('Failed to load configuration')
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
      window.dispatchEvent(new CustomEvent('menu:updated'))
    } catch (error) {
      toast.error('Failed to save')
    } finally {
      setSaving(false)
    }
  }
  
  const handleReset = async () => {
    if (!confirm('Reset to default menu?')) return
    try {
      await resetMenuCustomization()
      await loadConfiguration()
      toast.success('Menu reset to default')
      setIsDirty(false)
    } catch (error) {
      toast.error('Failed to reset')
    }
  }
  
  const handleSectionDragEnd = (event) => {
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
  
  const toggleSectionVisibility = (sectionId) => {
    setSections((sections) =>
      sections.map((section) =>
        section.id === sectionId
          ? { ...section, visible: !section.visible }
          : section
      )
    )
    setIsDirty(true)
  }
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>Customize Menu</DialogTitle>
        </DialogHeader>
        
        <Tabs defaultValue="sections">
          <TabsList>
            <TabsTrigger value="sections">Sections</TabsTrigger>
            <TabsTrigger value="items">Menu Items</TabsTrigger>
          </TabsList>
          
          <TabsContent value="sections">
            <ScrollArea className="h-[400px]">
              {loading ? (
                <div className="flex justify-center p-8">
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
          
          <TabsContent value="items">
            <ScrollArea className="h-[400px]">
              {/* Items tab implementation */}
              <p className="text-sm text-gray-500 p-4">
                Items customization - drag to reorder within sections
              </p>
            </ScrollArea>
          </TabsContent>
        </Tabs>
        
        <DialogFooter>
          <Button variant="outline" onClick={handleReset} disabled={loading || saving}>
            Reset to Default
          </Button>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={!isDirty || saving}>
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
Step 4: Add trigger button to sidebar
typescript// Add to AdminSidebar.tsx or SidebarFooter.tsx
<button
  onClick={() => setCustomizeModalOpen(true)}
  className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg"
>
  <Settings className="w-4 h-4" />
  {!collapsed && <span>Customize Menu</span>}
</button>
Acceptance Criteria:

✅ Modal opens from sidebar
✅ Loads saved configuration
✅ Drag-and-drop reordering works
✅ Toggle visibility works
✅ Saves to backend successfully
✅ Reset to defaults works
✅ Navigation updates immediately after save
✅ Touch device support

Test Command:
bashnpm run test:e2e e2e/menu-customization.spec.ts

Task 3.3: Settings Drawer - Backend
Priority: HIGH
Estimated Time: 4 hours
Dependencies: Task 3.2
Actions:
Step 1: Create preferences API
typescript// src/app/api/admin/preferences/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const preferencesSchema = z.object({
  appearance: z.object({
    theme: z.enum(['light', 'dark', 'system']).optional(),
    accentColor: z.string().optional(),
    density: z.enum(['compact', 'comfortable', 'spacious']).optional(),
    fontSize: z.number().min(12).max(18).optional(),
  }).optional(),
  notifications: z.object({
    email: z.boolean().optional(),
    push: z.boolean().optional(),
    inApp: z.boolean().optional(),
    sound: z.boolean().optional(),
    digest: z.enum(['never', 'daily', 'weekly']).optional(),
  }).optional(),
  regional: z.object({
    language: z.string().optional(),
    timezone: z.string().optional(),
    dateFormat: z.string().optional(),
    timeFormat: z.enum(['12h', '24h']).optional(),
    currency: z.string().optional(),
  }).optional(),
  dashboard: z.object({
    defaultPage: z.string().optional(),
    widgets: z.array(z.string()).optional(),
    chartType: z.enum(['line', 'bar', 'area']).optional(),
    refreshInterval: z.number().optional(),
  }).optional(),
  advanced: z.object({
    developerMode: z.boolean().optional(),
    debugLogging: z.boolean().optional(),
    experimentalFeatures: z.boolean().optional(),
  }).optional(),
})

// GET - Load preferences
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const userId = (session.user as any).id
    const prefs = await prisma.userPreferences.findUnique({ where: { userId } })
    
    if (!prefs) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }
    
    return NextResponse.json({
      appearance: prefs.appearance,
      notifications: prefs.notifications,
      regional: prefs.regional,
      dashboard: prefs.dashboard,
      advanced: prefs.advanced,
    })
  } catch (error) {
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}

// PUT - Save preferences
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const userId = (session.user as any).id
    const body = await request.json()
    
    const validation = preferencesSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: validation.error },
        { status: 400 }
      )
    }
    
    const prefs = await prisma.userPreferences.upsert({
      where: { userId },
      update: validation.data,
      create: {
        userId,
        ...validation.data,
      },
    })
    
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
Step 2: Create service layer
typescript// src/services/user-preferences.service.ts
export async function loadUserPreferences() {
  const res = await fetch('/api/admin/preferences')
  if (res.status === 404) return null
  if (!res.ok) throw new Error('Failed to load')
  return res.json()
}

export async function saveUserPreferences(prefs: any) {
  const res = await fetch('/api/admin/preferences', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(prefs),
  })
  if (!res.ok) throw new Error('Failed to save')
  return res.json()
}
Acceptance Criteria:

✅ GET endpoint returns preferences
✅ PUT endpoint saves with validation
✅ Partial updates supported
✅ Proper error handling
✅ Service layer created

Test Command:
bashnpm run test src/app/api/admin/preferences/__tests__/route.test.ts

Task 3.4: Settings Drawer - Frontend
Priority: HIGH
Estimated Time: 12 hours
Dependencies: Task 3.3
Actions:
Step 1: Create drawer structure
bashmkdir -p src/components/admin/layout/SettingsDrawer
touch src/components/admin/layout/SettingsDrawer/SettingsDrawer.tsx
touch src/components/admin/layout/SettingsDrawer/AppearanceSettings.tsx
touch src/components/admin/layout/SettingsDrawer/NotificationSettings.tsx
touch src/components/admin/layout/SettingsDrawer/RegionalSettings.tsx
touch src/components/admin/layout/SettingsDrawer/DashboardSettings.tsx
touch src/components/admin/layout/SettingsDrawer/AdvancedSettings.tsx
Step 2: Implement SettingsDrawer
typescript// src/components/admin/layout/SettingsDrawer/SettingsDrawer.tsx
export function SettingsDrawer({ open, onOpenChange }) {
  const [preferences, setPreferences] = useState(defaultPreferences)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [isDirty, setIsDirty] = useState(false)
  
  useEffect(() => {
    if (open) loadPreferences()
  }, [open])
  
  const loadPreferences = async () => {
    setLoading(true)
    try {
      const loaded = await loadUserPreferences()
      if (loaded) setPreferences(loaded)
    } catch (error) {
      toast.error('Failed to load preferences')
    } finally {RetryAEContinuetypescript      setLoading(false)
    }
  }
  
  const handleSave = async () => {
    setSaving(true)
    try {
      await saveUserPreferences(preferences)
      setIsDirty(false)
      toast.success('Preferences saved')
      applyPreferences(preferences)
    } catch (error) {
      toast.error('Failed to save preferences')
    } finally {
      setSaving(false)
    }
  }
  
  const applyPreferences = (prefs) => {
    const root = document.documentElement
    
    // Apply theme
    if (prefs.appearance.theme === 'dark') {
      root.classList.add('dark')
    } else if (prefs.appearance.theme === 'light') {
      root.classList.remove('dark')
    } else {
      const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches
      root.classList.toggle('dark', isDark)
    }
    
    // Apply accent color
    root.style.setProperty('--color-primary', prefs.appearance.accentColor)
    
    // Apply density
    root.setAttribute('data-density', prefs.appearance.density)
    
    // Apply font size
    root.style.fontSize = `${prefs.appearance.fontSize}px`
    
    // Dispatch event
    window.dispatchEvent(new CustomEvent('preferences:updated', { detail: prefs }))
  }
  
  const updatePreferences = (section, updates) => {
    setPreferences((prev) => ({
      ...prev,
      [section]: { ...prev[section], ...updates },
    }))
    setIsDirty(true)
  }
  
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-2xl p-0">
        <div className="flex flex-col h-full">
          <SheetHeader className="px-6 py-4 border-b">
            <SheetTitle>Settings</SheetTitle>
            <SheetDescription>Customize your dashboard experience</SheetDescription>
          </SheetHeader>
          
          <ScrollArea className="flex-1">
            <div className="px-6 py-4">
              {loading ? (
                <div className="flex justify-center p-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
                </div>
              ) : (
                <Tabs defaultValue="appearance">
                  <TabsList className="grid w-full grid-cols-5">
                    <TabsTrigger value="appearance">Appearance</TabsTrigger>
                    <TabsTrigger value="notifications">Notifications</TabsTrigger>
                    <TabsTrigger value="regional">Regional</TabsTrigger>
                    <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
                    <TabsTrigger value="advanced">Advanced</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="appearance" className="mt-6">
                    <AppearanceSettings
                      settings={preferences.appearance}
                      onChange={(updates) => updatePreferences('appearance', updates)}
                    />
                  </TabsContent>
                  
                  <TabsContent value="notifications" className="mt-6">
                    <NotificationSettings
                      settings={preferences.notifications}
                      onChange={(updates) => updatePreferences('notifications', updates)}
                    />
                  </TabsContent>
                  
                  <TabsContent value="regional" className="mt-6">
                    <RegionalSettings
                      settings={preferences.regional}
                      onChange={(updates) => updatePreferences('regional', updates)}
                    />
                  </TabsContent>
                  
                  <TabsContent value="dashboard" className="mt-6">
                    <DashboardSettings
                      settings={preferences.dashboard}
                      onChange={(updates) => updatePreferences('dashboard', updates)}
                    />
                  </TabsContent>
                  
                  <TabsContent value="advanced" className="mt-6">
                    <AdvancedSettings
                      settings={preferences.advanced}
                      onChange={(updates) => updatePreferences('advanced', updates)}
                    />
                  </TabsContent>
                </Tabs>
              )}
            </div>
          </ScrollArea>
          
          <SheetFooter className="px-6 py-4 border-t bg-gray-50">
            <div className="flex items-center justify-between w-full">
              <Button variant="outline" size="sm" onClick={() => {}}>
                Reset to Defaults
              </Button>
              <div className="flex gap-2">
                <Button variant="ghost" onClick={() => onOpenChange(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSave} disabled={!isDirty || saving}>
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
Step 3: Implement AppearanceSettings
typescript// src/components/admin/layout/SettingsDrawer/AppearanceSettings.tsx
export function AppearanceSettings({ settings, onChange }) {
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
        <RadioGroup value={settings.theme} onValueChange={(value) => onChange({ theme: value })}>
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
        <Select value={settings.density} onValueChange={(value) => onChange({ density: value })}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="compact">Compact</SelectItem>
            <SelectItem value="comfortable">Comfortable</SelectItem>
            <SelectItem value="spacious">Spacious</SelectItem>
          </SelectContent>
        </Select>
        <p className="text-xs text-gray-500">Adjust spacing throughout the interface</p>
      </div>
      
      {/* Font Size */}
      <div className="space-y-3">
        <div className="flex justify-between">
          <Label>Font Size</Label>
          <span className="text-sm text-gray-500">{settings.fontSize}px</span>
        </div>
        <Slider
          value={[settings.fontSize]}
          onValueChange={([value]) => onChange({ fontSize: value })}
          min={12}
          max={18}
          step={1}
        />
        <p className="text-xs text-gray-500">Base font size for the interface</p>
      </div>
    </div>
  )
}
Step 4: Implement NotificationSettings
typescript// src/components/admin/layout/SettingsDrawer/NotificationSettings.tsx
export function NotificationSettings({ settings, onChange }) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Label>Email Notifications</Label>
          <p className="text-sm text-gray-500">Receive notifications via email</p>
        </div>
        <Switch
          checked={settings.email}
          onCheckedChange={(checked) => onChange({ email: checked })}
        />
      </div>
      
      <div className="flex items-center justify-between">
        <div>
          <Label>Push Notifications</Label>
          <p className="text-sm text-gray-500">Browser push notifications</p>
        </div>
        <Switch
          checked={settings.push}
          onCheckedChange={(checked) => onChange({ push: checked })}
        />
      </div>
      
      <div className="flex items-center justify-between">
        <div>
          <Label>In-App Notifications</Label>
          <p className="text-sm text-gray-500">Show notifications in dashboard</p>
        </div>
        <Switch
          checked={settings.inApp}
          onCheckedChange={(checked) => onChange({ inApp: checked })}
        />
      </div>
      
      <div className="flex items-center justify-between">
        <div>
          <Label>Notification Sound</Label>
          <p className="text-sm text-gray-500">Play sound for notifications</p>
        </div>
        <Switch
          checked={settings.sound}
          onCheckedChange={(checked) => onChange({ sound: checked })}
        />
      </div>
      
      <div className="space-y-3">
        <Label>Email Digest</Label>
        <Select value={settings.digest} onValueChange={(value) => onChange({ digest: value })}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="never">Never</SelectItem>
            <SelectItem value="daily">Daily</SelectItem>
            <SelectItem value="weekly">Weekly</SelectItem>
          </SelectContent>
        </Select>
        <p className="text-sm text-gray-500">Receive a summary of notifications</p>
      </div>
    </div>
  )
}
Step 5: Add trigger to header
typescript// Add to AdminHeader.tsx
<button
  onClick={() => setSettingsDrawerOpen(true)}
  className="p-2 rounded-lg hover:bg-gray-100"
  aria-label="Settings"
>
  <Settings className="w-5 h-5 text-gray-600" />
</button>
Acceptance Criteria:

✅ Drawer opens from header
✅ All 5 tabs implemented
✅ Settings load from backend
✅ Changes apply immediately (theme, colors)
✅ Saves to backend on click
✅ Dirty state tracking works
✅ Reset to defaults works
✅ Responsive layout

Test Command:
bashnpm run test:e2e e2e/settings-drawer.spec.ts

Task 3.5: Data Optimization - Aggregated Stats
Priority: MEDIUM
Estimated Time: 6 hours
Dependencies: Task 3.4
Actions:
Step 1: Create aggregated stats endpoint
typescript// src/app/api/admin/stats/overview/route.ts
import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'

async function getBookingStats() {
  const [total, pending, today] = await Promise.all([
    prisma.booking.count(),
    prisma.booking.count({ where: { status: 'PENDING' } }),
    prisma.booking.count({
      where: {
        createdAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) },
      },
    }),
  ])
  
  return { total, pending, todayBookings: today, growth: 12.5 }
}

async function getClientStats() {
  const [total, active, newClients] = await Promise.all([
    prisma.user.count({ where: { role: 'CLIENT' } }),
    prisma.user.count({ where: { role: 'CLIENT', isActive: true } }),
    prisma.user.count({
      where: {
        role: 'CLIENT',
        createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
      },
    }),
  ])
  
  return { total, active, new: newClients, retention: 89.3 }
}

async function getRevenueStats() {
  // Implement revenue calculations
  return {
    current: 45230,
    target: 50000,
    targetProgress: 90.5,
    trend: 8.2,
  }
}

async function getTaskStats() {
  const [total, completed, overdue] = await Promise.all([
    prisma.task.count(),
    prisma.task.count({ where: { status: 'COMPLETED' } }),
    prisma.task.count({
      where: {
        status: { not: 'COMPLETED' },
        dueDate: { lt: new Date() },
      },
    }),
  ])
  
  return { total, completed, overdue, dueToday: 3 }
}

export async function GET(request: Request) {
  try {
    const session = await getServerSession()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    // Parallel queries for performance
    const [bookings, clients, revenue, tasks] = await Promise.all([
      getBookingStats(),
      getClientStats(),
      getRevenueStats(),
      getTaskStats(),
    ])
    
    return NextResponse.json({
      bookings,
      clients,
      revenue,
      tasks,
    })
  } catch (error) {
    console.error('Stats overview error:', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
Step 2: Create AdminDataProvider
typescript// src/providers/AdminDataProvider.tsx
'use client'

import { createContext, useContext, useMemo } from 'react'
import useSWR from 'swr'

interface AdminDataContextValue {
  stats: any
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

export function AdminDataProvider({ children }) {
  const { data, error, mutate, isLoading } = useSWR(
    '/api/admin/stats/overview',
    {
      refreshInterval: 30000, // 30 seconds
      revalidateOnFocus: true,
      dedupingInterval: 10000,
    }
  )
  
  const counts = useMemo(() => ({
    pendingBookings: data?.bookings?.pending || 0,
    newClients: data?.clients?.new || 0,
    overdueTasks: data?.tasks?.overdue || 0,
    pendingServiceRequests: 0,
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

export function useAdminStats() {
  const { stats, isLoading, error } = useAdminData()
  return { stats, isLoading, error }
}

export function useAdminCounts() {
  const { counts, isLoading } = useAdminData()
  return { counts, isLoading }
}
Step 3: Wrap layout with provider
typescript// src/components/admin/layout/AdminLayoutClient.tsx
export function AdminLayoutClient({ children, session }) {
  return (
    <AdminLayoutProvider session={session}>
      <AdminDataProvider>
        <Suspense fallback={<AdminLayoutSkeleton />}>
          <AdminLayoutShell>{children}</AdminLayoutShell>
        </Suspense>
      </AdminDataProvider>
    </AdminLayoutProvider>
  )
}
Step 4: Update components to use provider
typescript// Replace in AdminSidebar.tsx, AdminOverview.tsx, etc.
// OLD:
const { data: bookingStats } = useUnifiedData({ key: 'bookings/stats' })

// NEW:
const { counts } = useAdminCounts()
const pendingBookings = counts.pendingBookings
Acceptance Criteria:

✅ Single aggregated API endpoint
✅ Parallel database queries
✅ Provider wraps layout
✅ Components use shared data
✅ SWR deduplication works
✅ Reduced API calls by 60%+
✅ Badge counts update automatically

Test Command:
bashnpm run dev
# Check Network tab - should see single /api/admin/stats/overview call
# Verify badge counts display correctly

✨ Phase 4: Polish & Testing (Weeks 9-10)
Task 4.1: Comprehensive Testing - Unit Tests
Priority: HIGH
Estimated Time: 12 hours
Dependencies: Task 3.5
Actions:
Step 1: Write component tests
typescript// src/components/admin/layout/__tests__/AdminSidebar.test.tsx
import { render, screen, fireEvent } from '@testing-library/react'
import { AdminSidebar } from '../Sidebar/AdminSidebar'

describe('AdminSidebar', () => {
  it('renders navigation items', () => {
    render(<AdminSidebar />)
    expect(screen.getByText('Overview')).toBeInTheDocument()
    expect(screen.getByText('Analytics')).toBeInTheDocument()
  })
  
  it('collapses on toggle', () => {
    render(<AdminSidebar />)
    const collapseBtn = screen.getByLabelText('Collapse sidebar')
    fireEvent.click(collapseBtn)
    expect(screen.getByRole('aside')).toHaveClass('collapsed')
  })
  
  it('shows tooltips when collapsed', () => {
    render(<AdminSidebar />)
    // Collapse sidebar
    const collapseBtn = screen.getByLabelText('Collapse sidebar')
    fireEvent.click(collapseBtn)
    // Hover over icon
    const overviewLink = screen.getByRole('link', { name: /overview/i })
    fireEvent.mouseEnter(overviewLink)
    expect(screen.getByRole('tooltip')).toHaveTextContent('Overview')
  })
  
  it('displays badge counts', async () => {
    render(<AdminSidebar />)
    await screen.findByText('5') // Pending bookings badge
  })
})
typescript// src/components/admin/layout/__tests__/UserProfileDropdown.test.tsx
import { render, screen, fireEvent } from '@testing-library/react'
import { UserProfileDropdown } from '../Header/UserProfileDropdown'

describe('UserProfileDropdown', () => {
  it('renders user info', () => {
    render(<UserProfileDropdown />)
    expect(screen.getByText('John Doe')).toBeInTheDocument()
    expect(screen.getByText('john@example.com')).toBeInTheDocument()
  })
  
  it('opens dropdown on click', () => {
    render(<UserProfileDropdown />)
    const trigger = screen.getByRole('button')
    fireEvent.click(trigger)
    expect(screen.getByText('Profile')).toBeVisible()
    expect(screen.getByText('Settings')).toBeVisible()
  })
  
  it('changes theme', () => {
    render(<UserProfileDropdown />)
    fireEvent.click(screen.getByRole('button'))
    fireEvent.click(screen.getByText('Dark'))
    expect(document.documentElement).toHaveClass('dark')
  })
})
typescript// src/lib/admin/__tests__/navigation-registry.test.ts
import {
  getNavigationItem,
  searchNavigation,
  getBreadcrumbs,
} from '../navigation-registry'

describe('NavigationRegistry', () => {
  it('finds item by id', () => {
    const item = getNavigationItem('overview')
    expect(item).toBeDefined()
    expect(item?.label).toBe('Overview')
  })
  
  it('searches navigation', () => {
    const results = searchNavigation('book')
    expect(results.length).toBeGreaterThan(0)
    expect(results[0].label).toContain('Booking')
  })
  
  it('generates breadcrumbs', () => {
    const crumbs = getBreadcrumbs('/admin/bookings/123')
    expect(crumbs).toHaveLength(3)
    expect(crumbs[0].label).toBe('Admin')
    expect(crumbs[1].label).toBe('Bookings')
  })
})
Step 2: Write store tests
typescript// src/stores/admin/__tests__/layout.store.test.ts
import { renderHook, act } from '@testing-library/react'
import { useAdminLayoutStore } from '../layout.store'

describe('AdminLayoutStore', () => {
  it('initializes with default state', () => {
    const { result } = renderHook(() => useAdminLayoutStore())
    expect(result.current.sidebar.collapsed).toBe(false)
    expect(result.current.sidebar.width).toBe(256)
  })
  
  it('toggles sidebar', () => {
    const { result } = renderHook(() => useAdminLayoutStore())
    act(() => {
      result.current.toggleSidebar()
    })
    expect(result.current.sidebar.collapsed).toBe(true)
  })
  
  it('persists to localStorage', () => {
    const { result } = renderHook(() => useAdminLayoutStore())
    act(() => {
      result.current.setSidebarWidth(300)
    })
    expect(localStorage.getItem('admin-layout-storage')).toContain('300')
  })
})
Acceptance Criteria:

✅ Test coverage > 80%
✅ All critical components tested
✅ All utility functions tested
✅ Store persistence tested
✅ Tests pass in CI/CD
✅ No console errors in tests

Test Command:
bashnpm run test -- --coverage

Task 4.2: E2E Testing with Playwright
Priority: HIGH
Estimated Time: 10 hours
Dependencies: Task 4.1
Actions:
Step 1: Setup Playwright
bash# Install Playwright
npm install -D @playwright/test
npx playwright install

# Create config
touch playwright.config.ts
typescript// playwright.config.ts
import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    { name: 'webkit', use: { ...devices['Desktop Safari'] } },
    { name: 'mobile', use: { ...devices['iPhone 13'] } },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
  },
})
Step 2: Write E2E tests
typescript// e2e/admin-sidebar.spec.ts
import { test, expect } from '@playwright/test'

test.describe('Admin Sidebar', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/admin')
    await page.waitForSelector('[data-testid="admin-sidebar"]')
  })
  
  test('collapse and expand', async ({ page }) => {
    const sidebar = page.locator('[data-testid="admin-sidebar"]')
    const collapseBtn = page.locator('[aria-label="Collapse sidebar"]')
    
    await collapseBtn.click()
    await expect(sidebar).toHaveCSS('width', '64px')
    
    const expandBtn = page.locator('[aria-label="Expand sidebar"]')
    await expandBtn.click()
    await expect(sidebar).toHaveCSS('width', '256px')
  })
  
  test('resize with drag', async ({ page }) => {
    const resizer = page.locator('[role="separator"]')
    const sidebar = page.locator('[data-testid="admin-sidebar"]')
    
    const box = await resizer.boundingBox()
    await page.mouse.move(box!.x, box!.y)
    await page.mouse.down()
    await page.mouse.move(box!.x + 50, box!.y)
    await page.mouse.up()
    
    const width = await sidebar.evaluate(el => el.offsetWidth)
    expect(width).toBeGreaterThan(256)
  })
  
  test('keyboard navigation', async ({ page }) => {
    await page.keyboard.press('Tab')
    await page.keyboard.press('ArrowDown')
    await page.keyboard.press('Enter')
    await expect(page).toHaveURL(/\/admin\/analytics/)
  })
  
  test('mobile overlay', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 })
    const sidebar = page.locator('[data-testid="admin-sidebar"]')
    await expect(sidebar).toHaveCSS('transform', 'translateX(-100%)')
    
    const menuBtn = page.locator('[aria-label="Open menu"]')
    await menuBtn.click()
    await expect(sidebar).toHaveCSS('transform', 'translateX(0)')
  })
})
typescript// e2e/menu-customization.spec.ts
import { test, expect } from '@playwright/test'

test.describe('Menu Customization', () => {
  test('complete flow', async ({ page }) => {
    await page.goto('/admin')
    
    // Open modal
    await page.click('[aria-label="Customize menu"]')
    await expect(page.locator('[role="dialog"]')).toBeVisible()
    
    // Drag to reorder
    const firstItem = page.locator('[data-sortable-item]').first()
    const secondItem = page.locator('[data-sortable-item]').nth(1)
    await firstItem.dragTo(secondItem)
    
    // Save
    await page.click('text=Save Changes')
    await expect(page.locator('text=saved successfully')).toBeVisible()
    
    // Verify persistence
    await page.reload()
    // Check order is maintained
  })
})
typescript// e2e/settings-drawer.spec.ts
import { test, expect } from '@playwright/test'

test.describe('Settings Drawer', () => {
  test('change theme', async ({ page }) => {
    await page.goto('/admin')
    
    await page.click('[aria-label="Settings"]')
    await expect(page.locator('[role="dialog"]')).toBeVisible()
    
    await page.click('text=Dark')
    await expect(page.locator('html')).toHaveClass(/dark/)
    
    await page.click('text=Save Changes')
    await page.reload()
    await expect(page.locator('html')).toHaveClass(/dark/)
  })
  
  test('adjust font size', async ({ page }) => {
    await page.goto('/admin')
    await page.click('[aria-label="Settings"]')
    
    const slider = page.locator('[role="slider"]')
    await slider.fill('16')
    
    await page.click('text=Save Changes')
    const fontSize = await page.locator('html').evaluate(el => 
      window.getComputedStyle(el).fontSize
    )
    expect(fontSize).toBe('16px')
  })
})
Acceptance Criteria:

✅ E2E tests pass on Chrome, Firefox, Safari
✅ Mobile tests pass
✅ All critical user flows covered
✅ Tests run in CI/CD
✅ No flaky tests

Test Command:
bashnpm run test:e2e
npm run test:e2e -- --project=mobile

Task 4.3: Accessibility Audit
Priority: HIGH
Estimated Time: 8 hours
Dependencies: Task 4.2
Actions:
Step 1: Automated accessibility testing
typescript// e2e/a11y.spec.ts
import { test, expect } from '@playwright/test'
import { injectAxe, checkA11y } from 'axe-playwright'

test.describe('Accessibility @a11y', () => {
  test('admin sidebar has no violations', async ({ page }) => {
    await page.goto('/admin')
    await injectAxe(page)
    await checkA11y(page, '[data-testid="admin-sidebar"]', {
      detailedReport: true,
      detailedReportOptions: { html: true },
    })
  })
  
  test('user profile dropdown has no violations', async ({ page }) => {
    await page.goto('/admin')
    await injectAxe(page)
    await page.click('[data-testid="user-profile-button"]')
    await checkARetryAEContinuetypescript11y(page, '[role="menu"]', {
      detailedReport: true,
    })
  })
  
  test('menu customization modal has no violations', async ({ page }) => {
    await page.goto('/admin')
    await injectAxe(page)
    await page.click('[aria-label="Customize menu"]')
    await checkA11y(page, '[role="dialog"]')
  })
  
  test('settings drawer has no violations', async ({ page }) => {
    await page.goto('/admin')
    await injectAxe(page)
    await page.click('[aria-label="Settings"]')
    await checkA11y(page, '[role="dialog"]')
  })
})
Step 2: Manual accessibility checklist
markdown# Manual Accessibility Testing Checklist

## Keyboard Navigation
- [ ] Tab order is logical
- [ ] All interactive elements focusable
- [ ] Focus visible on all elements
- [ ] No keyboard traps
- [ ] Skip links work
- [ ] Escape closes modals/dropdowns

## Screen Reader
- [ ] All images have alt text
- [ ] Form labels associated correctly
- [ ] ARIA labels on icon buttons
- [ ] Status messages announced
- [ ] Loading states announced
- [ ] Error messages announced
- [ ] Navigation landmarks defined

## Visual
- [ ] Color contrast meets WCAG AA (4.5:1)
- [ ] Text resizes to 200% without breaking
- [ ] No content relies solely on color
- [ ] Focus indicators visible
- [ ] Touch targets at least 44x44px

## Motion
- [ ] Animations respect prefers-reduced-motion
- [ ] No auto-playing videos
- [ ] Carousel controls available
- [ ] Parallax effects can be disabled
Step 3: Fix accessibility issues
typescript// Example fixes

// Add ARIA labels to icon buttons
<button aria-label="Collapse sidebar" onClick={toggle}>
  <ChevronsLeft className="w-4 h-4" aria-hidden="true" />
</button>

// Add loading announcements
<div role="status" aria-live="polite" className="sr-only">
  {loading && "Loading data..."}
  {error && "Error loading data"}
</div>

// Add skip links
<a href="#main-content" className="sr-only focus:not-sr-only">
  Skip to main content
</a>

// Ensure color contrast
<style>
  /* Ensure text meets 4.5:1 contrast ratio */
  .text-gray-500 {
    color: #6b7280; /* 4.69:1 on white - PASSES */
  }
  
  /* Fix low contrast */
  .text-gray-400 {
    color: #9ca3af; /* 3.35:1 - FAILS for normal text */
  }
  /* Change to larger text only or darker color */
</style>

// Add focus management for modals
useEffect(() => {
  if (open) {
    const firstFocusable = modalRef.current?.querySelector('button, [href], input, select, textarea')
    firstFocusable?.focus()
  }
}, [open])
Acceptance Criteria:

✅ Zero critical accessibility violations
✅ WCAG 2.1 AA compliant
✅ Keyboard navigation works completely
✅ Screen reader tested (NVDA/JAWS)
✅ Color contrast verified
✅ Touch targets meet minimum size
✅ Reduced motion supported

Test Command:
bashnpm run test:e2e -- --grep @a11y
npm run lighthouse -- --only-categories=accessibility

Task 4.4: Performance Optimization
Priority: MEDIUM
Estimated Time: 8 hours
Dependencies: Task 4.3
Actions:
Step 1: Bundle analysis
bash# Install analyzer
npm install -D @next/bundle-analyzer

# Add to next.config.js
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
})

module.exports = withBundleAnalyzer({
  // ... existing config
})

# Run analysis
ANALYZE=true npm run build
Step 2: Optimize imports
typescript// BEFORE: Heavy imports
import * as Icons from 'lucide-react' // Imports ALL icons
import { motion } from 'framer-motion' // Heavy library

// AFTER: Tree-shakeable imports
import { Home, Settings, User } from 'lucide-react' // Only what's needed
import { LazyMotion, domAnimation, m } from 'framer-motion' // Lazy load animations

// Use dynamic imports for heavy components
const AdminAnalytics = dynamic(() => import('./AdminAnalytics'), {
  loading: () => <Skeleton />,
  ssr: false,
})
Step 3: Image optimization
typescript// Use Next.js Image component
import Image from 'next/image'

// BEFORE:
<img src="/logo.png" alt="Logo" />

// AFTER:
<Image
  src="/logo.png"
  alt="Logo"
  width={32}
  height={32}
  priority // For above-the-fold images
/>

// For user avatars
<Image
  src={user.avatar}
  alt={user.name}
  width={40}
  height={40}
  loading="lazy"
  placeholder="blur"
  blurDataURL="data:image/png;base64,..."
/>
Step 4: Code splitting
typescript// Split large pages into chunks
import dynamic from 'next/dynamic'

const HeavyChart = dynamic(() => import('./HeavyChart'), {
  loading: () => <ChartSkeleton />,
  ssr: false,
})

const PdfViewer = dynamic(() => import('./PdfViewer'), {
  loading: () => <div>Loading PDF viewer...</div>,
  ssr: false,
})

// Lazy load modals
const MenuCustomizationModal = lazy(() => 
  import('./MenuCustomization/MenuCustomizationModal')
)

// Use Suspense
<Suspense fallback={<ModalSkeleton />}>
  {showModal && <MenuCustomizationModal />}
</Suspense>
Step 5: Memoization
typescript// Memoize expensive computations
const filteredItems = useMemo(() => {
  return items.filter(item => item.visible)
    .sort((a, b) => a.order - b.order)
}, [items])

// Memoize components
const NavigationItem = memo(NavigationItemComponent, (prev, next) => {
  return prev.item.id === next.item.id && 
         prev.collapsed === next.collapsed &&
         prev.expanded === next.expanded
})

// Use useCallback for event handlers
const handleToggle = useCallback(() => {
  setExpanded(prev => !prev)
}, [])
Step 6: Database query optimization
typescript// BEFORE: N+1 queries
const bookings = await prisma.booking.findMany()
for (const booking of bookings) {
  booking.client = await prisma.user.findUnique({ where: { id: booking.userId } })
}

// AFTER: Single query with include
const bookings = await prisma.booking.findMany({
  include: {
    client: true,
    service: true,
  },
})

// Add database indexes
// prisma/schema.prisma
model Booking {
  id        String   @id
  userId    String
  status    String
  createdAt DateTime @default(now())
  
  @@index([userId])
  @@index([status])
  @@index([createdAt])
}
Acceptance Criteria:

✅ Bundle size reduced by 20%
✅ Main bundle < 450KB (gzipped)
✅ Admin chunk < 180KB (gzipped)
✅ First Load JS < 150KB
✅ Lighthouse Performance > 90
✅ Time to Interactive < 3s
✅ All images optimized
✅ No unnecessary re-renders

Test Command:
bashANALYZE=true npm run build
npm run lighthouse -- --only-categories=performance

Task 4.5: Documentation
Priority: MEDIUM
Estimated Time: 8 hours
Dependencies: Task 4.4
Actions:
Step 1: Update README.md
markdown# NextAccounting Admin Dashboard

## Features

### Navigation
- ✅ Collapsible sidebar with resize
- ✅ Keyboard shortcuts (Cmd+B to toggle)
- ✅ Permission-based menu filtering
- ✅ Badge counts for pending items
- ✅ Custom menu ordering

### User Experience
- ✅ QuickBooks-inspired design
- ✅ Theme switcher (Light/Dark/System)
- ✅ User profile dropdown
- ✅ System health monitoring
- ✅ Customizable preferences

### Performance
- ✅ Optimized bundle size (20% reduction)
- ✅ Lazy loading for heavy components
- ✅ SWR caching and deduplication
- ✅ Server-side rendering

### Accessibility
- ✅ WCAG 2.1 AA compliant
- ✅ Full keyboard navigation
- ✅ Screen reader support
- ✅ High contrast mode

## Getting Started

### Prerequisites
- Node.js 18+
- PostgreSQL 14+
- Redis (optional)

### Installation
```bash
# Clone repository
git clone https://github.com/your-org/nextaccounting.git

# Install dependencies
npm install

# Setup environment
cp .env.example .env.local

# Run migrations
npx prisma migrate dev

# Start development server
npm run dev
Environment Variables
envDATABASE_URL="postgresql://..."
NEXTAUTH_SECRET="..."
NEXTAUTH_URL="http://localhost:3000"
Usage
Sidebar Customization

Click the gear icon in the sidebar
Drag to reorder sections/items
Toggle visibility with switches
Click "Save Changes"

Theme Customization

Click your avatar in the header
Select "Theme" submenu
Choose Light, Dark, or System
Changes apply immediately

Keyboard Shortcuts

Cmd/Ctrl + B - Toggle sidebar
Cmd/Ctrl + [ - Collapse sidebar
Cmd/Ctrl + ] - Expand sidebar
Cmd/Ctrl + K - Open search
? - Show all shortcuts

Development
Project Structure
src/
├── app/
│   └── admin/           # Admin routes
├── components/
│   └── admin/
│       └── layout/      # Layout components
├── lib/
│   └── admin/          # Utilities
├── stores/             # Zustand stores
├── services/           # API services
└── hooks/              # Custom hooks
Testing
bash# Unit tests
npm run test

# E2E tests
npm run test:e2e

# Accessibility tests
npm run test:e2e -- --grep @a11y

# Coverage report
npm run test -- --coverage
Building
bash# Production build
npm run build

# Analyze bundle
ANALYZE=true npm run build

# Start production server
npm start
Contributing
Code Style

Use TypeScript for all new code
Follow ESLint rules
Write tests for new features
Update documentation

Pull Request Process

Create feature branch from main
Make changes with descriptive commits
Write/update tests
Run full test suite
Create PR with description
Wait for CI/CD checks
Request review

License
MIT

**Step 2: Create component documentation**
```typescript
// src/components/admin/layout/Sidebar/README.md

# AdminSidebar Component

## Overview
Collapsible sidebar with drag-to-resize, keyboard shortcuts, and mobile support.

## Props
```typescript
interface AdminSidebarProps {
  className?: string
}
Usage
tsximport { AdminSidebar } from '@/components/admin/layout/Sidebar'

export default function Layout({ children }) {
  return (
    <div>
      <AdminSidebar />
      <main>{children}</main>
    </div>
  )
}
Features

Collapse/expand with animation
Drag to resize (160-420px)
Mobile overlay mode
Keyboard shortcuts
Persistent state
Badge counts
Tooltips when collapsed

Accessibility

Full keyboard navigation
ARIA labels on all controls
Focus management
Screen reader support

Testing
bashnpm run test src/components/admin/layout/__tests__/AdminSidebar.test.tsx

**Step 3: Create migration guide**
```markdown
# Migration Guide

## From Old Layout to New Layout

### Overview
This guide helps migrate from the legacy layout system to the new unified architecture.

### Breaking Changes

#### 1. Layout File Structure
**OLD:**
app/admin/layout-nuclear.tsx (REMOVED)
components/admin/layout/ClientOnlyAdminLayout.tsx (REMOVED)

**NEW:**
app/admin/layout.tsx (Server)
components/admin/layout/AdminLayoutClient.tsx (Client wrapper)
components/admin/layout/AdminLayoutShell.tsx (Main layout)

#### 2. Store Structure
**OLD:**
```typescript
import { useAdminLayoutStore } from '@/stores/adminLayoutStoreHydrationSafe'
NEW:
typescriptimport { useAdminLayoutStore, useSidebarState } from '@/stores/admin/layout.store'
3. Navigation System
OLD:
typescript// Hardcoded navigation in AdminSidebar.tsx
const navigation = [
  { name: 'Overview', href: '/admin', icon: Home },
  // ...
]
NEW:
typescriptimport { NAVIGATION_REGISTRY, getNavigationByPermission } from '@/lib/admin/navigation-registry'

const navigation = getNavigationByPermission(userRole)
Step-by-Step Migration
Step 1: Update Imports
bash# Find and replace old imports
find src -type f -name "*.tsx" -exec sed -i 's/adminLayoutStoreHydrationSafe/admin\/layout.store/g' {} +
Step 2: Update Layout Usage
typescript// OLD: app/admin/layout.tsx
export default function AdminLayout({ children }) {
  return <ClientOnlyAdminLayout>{children}</ClientOnlyAdminLayout>
}

// NEW: app/admin/layout.tsx
export default async function AdminLayout({ children }) {
  const session = await getServerSession()
  if (!session?.user) redirect('/login')
  
  return <AdminLayoutClient session={session}>{children}</AdminLayoutClient>
}
Step 3: Update Navigation References
typescript// OLD: Using hardcoded navigation
const navigation = [...]

// NEW: Using registry
import { getNavigationByPermission } from '@/lib/admin/navigation-registry'
const navigation = getNavigationByPermission(userRole)
Step 4: Update Data Fetching
typescript// OLD: Multiple independent fetches
const { data: bookingStats } = useUnifiedData({ key: 'bookings/stats' })
const { data: clientStats } = useUnifiedData({ key: 'clients/stats' })

// NEW: Shared provider
const { stats } = useAdminStats()
const bookingStats = stats?.bookings
const clientStats = stats?.clients
Testing After Migration

Verify all routes load:

bashnpm run dev
# Test: /admin, /admin/analytics, /admin/bookings, etc.

Check for hydration errors:

bash# Open browser console
# Look for "Hydration failed" errors

Test sidebar functionality:


Collapse/expand
Resize
Mobile behavior
Persistence across refreshes


Verify data loading:


Check Network tab
Should see single /api/admin/stats/overview call
Badge counts should display

Rollback Plan
If issues occur:
bash# 1. Switch to previous branch
git checkout main

# 2. Deploy previous version
npm run build && npm start

# 3. If database changes made
npx prisma migrate resolve --rolled-back [migration-name]
Getting Help

Check documentation: /docs
GitHub Issues: https://github.com/your-org/nextaccounting/issues
Slack: #admin-dashboard-modernization


**Acceptance Criteria:**
- ✅ README.md updated with new features
- ✅ Component documentation created
- ✅ Migration guide complete
- ✅ API documentation updated
- ✅ Keyboard shortcuts documented
- ✅ Troubleshooting guide added

---

### Task 4.6: Final QA and Deployment
**Priority:** HIGH  
**Estimated Time:** 8 hours  
**Dependencies:** Task 4.5

**Actions:**

**Step 1: Create QA checklist**
```markdown
# Final QA Checklist

## Functionality
- [ ] All 40+ navigation items work
- [ ] Sidebar collapses/expands smoothly
- [ ] Resize works (160-420px range)
- [ ] Menu customization saves correctly
- [ ] Settings drawer saves preferences
- [ ] Theme switching works instantly
- [ ] User profile dropdown functional
- [ ] System health indicator updates
- [ ] Badge counts accurate
- [ ] Breadcrumbs generate correctly
- [ ] Search finds all items
- [ ] Keyboard shortcuts work

## Responsiveness
- [ ] Desktop (1920x1080) ✓
- [ ] Laptop (1366x768) ✓
- [ ] Tablet (768x1024) ✓
- [ ] Mobile (375x667) ✓
- [ ] Large screens (2560x1440) ✓

## Browsers
- [ ] Chrome (latest) ✓
- [ ] Firefox (latest) ✓
- [ ] Safari (latest) ✓
- [ ] Edge (latest) ✓
- [ ] Mobile Safari ✓
- [ ] Mobile Chrome ✓

## Performance
- [ ] Page load < 2s
- [ ] Time to interactive < 3s
- [ ] Lighthouse score > 90
- [ ] No console errors
- [ ] No memory leaks
- [ ] Smooth 60fps animations

## Accessibility
- [ ] Keyboard navigation complete
- [ ] Screen reader tested (NVDA)
- [ ] Color contrast WCAG AA
- [ ] Focus indicators visible
- [ ] No accessibility violations
- [ ] Touch targets 44x44px min

## Data & State
- [ ] Sidebar state persists
- [ ] Menu customization persists
- [ ] Preferences persist
- [ ] No data races
- [ ] Proper error handling
- [ ] Loading states shown

## Security
- [ ] Auth checks on all routes
- [ ] Permission filtering works
- [ ] No XSS vulnerabilities
- [ ] CSRF protection active
- [ ] Input validation works
- [ ] SQL injection prevented

## Edge Cases
- [ ] Works with slow network
- [ ] Works offline (cached)
- [ ] Handles API errors gracefully
- [ ] Long text doesn't break layout
- [ ] Many notifications handled
- [ ] Large datasets perform well
Step 2: Staging deployment
bash# 1. Create production build
npm run build

# 2. Run production locally
npm start

# 3. Deploy to staging
git push origin feature/dashboard-modernization

# 4. Vercel/Netlify will auto-deploy
# Or manual: vercel --prod

# 5. Run smoke tests on staging
npm run test:e2e -- --baseURL=https://staging.nextaccounting.com
Step 3: Create deployment checklist
markdown# Deployment Checklist

## Pre-Deployment
- [ ] All tests passing locally
- [ ] E2E tests passing
- [ ] Accessibility audit clean
- [ ] Performance benchmarks met
- [ ] Code reviewed and approved
- [ ] Documentation updated
- [ ] Changelog updated
- [ ] Database migrations tested

## Database
- [ ] Backup database
- [ ] Run migrations on staging
- [ ] Verify migrations successful
- [ ] Test rollback procedure
- [ ] Document any manual steps

## Deployment
- [ ] Merge to main branch
- [ ] Tag release (v2.4.0)
- [ ] Deploy to production
- [ ] Run smoke tests
- [ ] Monitor error rates
- [ ] Check performance metrics

## Post-Deployment
- [ ] Verify all features working
- [ ] Check error tracking (Sentry)
- [ ] Monitor server resources
- [ ] User acceptance testing
- [ ] Send release notes to users
- [ ] Update status page

## Rollback Plan
- [ ] Previous version tagged
- [ ] Rollback command ready
- [ ] Database rollback script ready
- [ ] Team notified of process
- [ ] Incident response plan ready
Step 4: Create release notes
markdown# Release Notes - v2.4.0

## 🎉 Major Features

### Modern Collapsible Sidebar
- Smooth collapse/expand animations
- Drag-to-resize functionality (160-420px)
- Mobile-friendly overlay mode
- Keyboard shortcuts (Cmd+B to toggle)
- Persistent state across sessions

### Menu Customization
- Drag-and-drop menu reordering
- Show/hide sections and items
- Personalized navigation layout
- Reset to defaults option
- Instant synchronization

### Enhanced User Experience
- QuickBooks-inspired design
- New user profile dropdown
- Theme switcher (Light/Dark/System)
- Comprehensive settings drawer
- System health monitoring footer

### Performance Improvements
- 20% bundle size reduction
- 60% fewer API calls
- Optimized data fetching
- Lazy loading for heavy components
- Improved Time to Interactive

### Accessibility
- WCAG 2.1 AA compliant
- Full keyboard navigation
- Screen reader support
- High contrast mode
- Reduced motion support

## 🔧 Technical Improvements

- Unified navigation registry system
- Consolidated layout architecture
- Optimized database queries
- Improved error handling
- Enhanced TypeScript types

## 🐛 Bug Fixes

- Fixed hydration mismatches
- Removed legacy layout files
- Fixed "Invoice Templates" navigation item
- Resolved sidebar width persistence issues
- Fixed mobile menu closing on navigation

## 📚 Documentation

- Updated README with new features
- Component documentation added
- Migration guide created
- Keyboard shortcuts documented
- API documentation updated

## 🚀 Upgrade Guide

See [MIGRATION.md](./MIGRATION.md) for detailed upgrade instructions.

### Breaking Changes

1. **Layout Structure Changed**
   - `layout-nuclear.tsx` removed
   - New `AdminLayoutClient` component

2. **Store Consolidation**
   - Multiple store files merged into one
   - Import path changed

3. **Navigation System**
   - Hardcoded navigation replaced with registry
   - Permission filtering centralized

### Quick Upgrade
```bash
# Pull latest changes
git pull origin main

# Install dependencies
npm install

# Run migrations
npx prisma migrate deploy

# Rebuild
npm run build

# Restart server
pm2 restart nextaccounting
📊 Metrics

Performance: Lighthouse score improved from 78 to 92
Bundle Size: Reduced from 450KB to 360KB (20%)
API Calls: Reduced from ~15 to ~5 on page load (67%)
Test Coverage: Increased to 85%

🙏 Contributors

Development Team
QA Team
Design Team
User testers

📞 Support
For issues or questions:

GitHub Issues: [Link]
Support Email: support@nextaccounting.com
Slack: #support


**Step 5: Production deployment**
```bash
# 1. Final checks
npm run test
npm run test:e2e
npm run lint
npm run build

# 2. Create release
git tag -a v2.4.0 -m "Admin Dashboard Modernization"
git push origin v2.4.0

# 3. Deploy to production
# Via CI/CD (automatic) or manual:
vercel --prod

# 4. Monitor deployment
# Watch logs, error rates, performance metrics

# 5. Post-deployment verification
curl https://nextaccounting.com/api/health
npm run test:e2e -- --baseURL=https://nextaccounting.com

# 6. Send notifications
# Email users, update status page, post in Slack
Acceptance Criteria:

✅ All QA checklist items passed
✅ Staging deployment successful
✅ Production deployment successful
✅ Zero critical bugs found
✅ Performance targets met
✅ Users notified of changes
✅ Documentation deployed
✅ Monitoring active

Test Command:
bash# Complete test suite
npm run test && npm run test:e2e && npm run test:a11y

# Production verification
curl https://nextaccounting.com/api/admin/system/health

📋 Summary & Success Metrics
Project Completion
Phase 1: Foundation (Weeks 1-2) ✅

Legacy files removed
Navigation registry created
Store consolidated
Layout unified
Database updated

Phase 2: QuickBooks UI (Weeks 3-5) ✅

Collapsible sidebar implemented
User profile dropdown added
Enhanced footer created
Resize functionality working
Mobile support complete

Phase 3: Advanced Features (Weeks 6-8) ✅

Menu customization system
Settings drawer implemented
Data optimization complete
API endpoints created
Service layer built

Phase 4: Polish & Testing (Weeks 9-10) ✅

85% test coverage achieved
E2E tests passing
WCAG 2.1 AA compliant
Performance optimized
Documentation complete

Key Performance Indicators
MetricBeforeAfterImprovementPage Load Time3.2s1.8s44% fasterTime to Interactive4.1s2.7s34% fasterBundle Size450KB360KB20% smallerLighthouse Score789218% betterAPI Calls (initial)15567% reductionTest Coverage45%85%89% increaseAccessibility Score899810% better
Features Delivered
✅ Navigation System

40+ routes in registry
Permission-based filtering
Search functionality
Breadcrumb generation
Favorites support

✅ Sidebar

Collapse/expand (64px ↔ 256px)
Drag-to-resize (160-420px)
Mobile overlay mode
Keyboard shortcuts
Badge counts
Tooltips

✅ User Profile

Avatar with fallback
Theme switcher
Status indicator
Quick settings access
Sign out

✅ Footer

System health monitoring
Version information
Quick links
Environment badge
Responsive layout

✅ Menu Customization

Drag-and-drop reordering
Visibility toggles
Sections & items tabs
Save/reset functionality
Backend persistence

✅ Settings Drawer

5 settings categories
Theme customization
Notification preferences
Regional settings
Dashboard configuration
Advanced options

✅ Performance

Code splitting
Lazy loading
Image optimization
Bundle reduction
Database query optimization
SWR caching

✅ Accessibility

WCAG 2.1 AA compliant
Keyboard navigation
Screen reader support
Focus management
Color contrast
Reduced motion

✅ Testing

85% unit test coverage
E2E tests for critical flows
Accessibility automated tests
Cross-browser testing
Mobile device testing

✅ Documentation

Updated README
Component docs
Migration guide
API documentation
Keyboard shortcuts
Troubleshooting

Next Steps (Optional Enhancements)
Phase 5: Future Enhancements (Optional)

 Dark mode polish
 Advanced search with filters
 Command palette (Cmd+K)
 Notification center
 Activity feed
 Keyboard shortcut customization
 Multi-language support (i18n)
 Advanced analytics dashboard
 Audit log viewer
 MFA management UI
 Rate limiting controls UI


🎯 Builder.io Execution Instructions
Automation Settings:

Mode: Auto-proceed (no confirmation needed)
Task Sequence: Execute tasks 1.1 through 4.6 in order
Error Handling: Log errors, attempt fixes, continue if non-blocking
Testing: Run tests after each phase
Git Strategy: Commit after each task completion
Deployment: Deploy to staging after Phase 3, production after Phase 4

Success Criteria for Auto-Proceed:

All tests passing
No TypeScript errors
No ESLint errors
Build completes successfully
Lighthouse score > 90
Zero critical accessibility violations

Rollback Triggers:

Critical production errors
Test failure rate > 10%
Performance degradation > 20%
Accessibility violations introduced


📦 Deliverables

✅ Modernized admin dashboard with QuickBooks-inspired UI
✅ Collapsible sidebar with resize functionality
✅ Menu customization system
✅ Settings drawer with preferences
✅ Enhanced user profile dropdown
✅ System health monitoring footer
✅ Navigation registry system
✅ Performance optimizations (20% improvement)
✅ WCAG 2.1 AA accessibility compliance
✅ Comprehensive test suite (85% coverage)
✅ Complete documentation
✅ Migration guide
✅ Production deployment

Total Estimated Time: 10 weeks (400-500 hours)
Risk Level: Medium
Team Size: 2-3 developers + Builder.io AI

END OF ACTION PLAN
This plan is ready for Builder.io to execute autonomously. Each task includes clear acceptance criteria, test commands, and specific implementation details. The plan follows a logical progression from foundation to advanced features to polish, ensuring a stable and high-quality outcome.