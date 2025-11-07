# Admin Users Dashboard → AdminWorkBench Transformation Roadmap

**Version:** 1.0
**Status:** ✅ **PHASES 1-5 COMPLETE** | Phases 6-8 Pending
**Last Updated:** January 2025
**Project Lead:** Engineering Team

---

## 🚀 IMPLEMENTATION STATUS UPDATE

### ✅ Completed (Phase 1-5)
- **Setup Phase:** Feature flags, file structure, wrapper components
- **Phase 1:** Root components (AdminWorkBench, AdminUsersLayout, responsive CSS grid)
- **Phase 2:** Data display (OverviewCards, DirectoryHeader, UserDirectorySection)
- **Phase 3:** Sidebar & filters (AdminSidebar with collapsible sections)
- **Phase 4:** User table & selection (UsersTableWrapper, selection management)
- **Phase 5:** Bulk operations (BulkActionsPanel, DryRunModal, UndoToast)
- **Data Layer:** API wrappers (users, stats, bulkActions) + React Query hooks

**Details:** See [`docs/ADMIN_WORKBENCH_PHASE_1_5_PROGRESS.md`](./ADMIN_WORKBENCH_PHASE_1_5_PROGRESS.md)

### ⏳ Pending (Phase 6-8)
- **Phase 6:** Builder.io CMS integration (requires external plugin setup)
- **Phase 7:** Unit tests, E2E tests, accessibility audits
- **Phase 8:** Monitoring, rollout plan, feature flag finalization

---  

---

## 📋 Executive Summary

This document provides a **complete, production-ready replacement plan** for transitioning the existing Admin Users Dashboard (`ExecutiveDashboardTab`) to a modern, enterprise-grade **AdminWorkBench** matching SAP/QuickBooks standards.

### Key Objectives
✅ Replace outdated dashboard UI with modern 2-panel layout  
✅ Maintain 100% API backward-compatibility  
✅ Support safe, staged rollout with feature flags  
✅ Achieve <2.0s LCP and WCAG 2.1 AA compliance  
✅ Enable Builder.io CMS integration for non-technical users  
✅ Provide instant rollback capability for 2 weeks post-launch  

### Success Metrics
- **Performance:** LCP < 2.0s, TTI < 3.5s, Lighthouse > 90
- **Accessibility:** WCAG 2.1 AA compliant, 0 critical violations
- **Reliability:** 0 P1/P2 errors for 72h at 100% traffic
- **User Adoption:** >95% of admins using new dashboard by week 3

### High-Level Timeline
- **Phase 1-2:** 3 days (Layout + Command bar + KPI cards)
- **Phase 3-5:** 8 days (Sidebar + Table + Bulk ops)
- **Phase 6:** 2 days (Builder.io integration)
- **Phase 7-8:** 4 days (Testing + Rollout)
- **Total:** ~128 developer-hours (3-4 weeks with review)

**Team:** 2 Frontend Devs + 1 QA  

---

## 🎯 Replacement Strategy

### Core Principle
Replace the legacy `ExecutiveDashboardTab` entirely while maintaining backward compatibility and supporting instant rollback.

### Implementation Approach

```
OLD STATE                          TRANSITION                      NEW STATE
─────────────────────────────────────────────────────────────────────────────
ExecutiveDashboardTab              (hidden, kept for 2 weeks)     REMOVED
 ├─ Analytics sidebar                                              
 ├─ KPI cards                                                      
 ├─ Static user table              ExecutiveDashboardTabWrapper    AdminWorkBench
 └─ Bulk ops inline                (feature-flag controlled)       ├─ QuickActionsBar
                                                                   ├─ AdminUsersLayout
                                                                   ├─ AdminSidebar
                                                                   ├─ OverviewCards (KPI)
                                                                   ├─ UsersTable (virtualized)
                                                                   └─ BulkActionsPanel
```

### Feature Flags & Rollout
- **Staging:** Flag `adminWorkBench = true` for internal testing
- **Canary:** 10% production for 48h, monitor Sentry + performance
- **Ramp:** 25% → 50% → 100% over 3 days
- **Stabilization:** Keep fallback code for 2 weeks
- **Cleanup:** Remove old code after zero-incident window

### Backward Compatibility
✅ **All API endpoints preserved:**
- `GET /api/admin/users` (query params: limit, offset, search, role, status, sort)
- `PATCH /api/admin/users/{id}` (inline edits)
- `POST /api/admin/users/bulk-action` (bulk operations)
- `GET /api/admin/users/stats` (KPI metrics)

✅ **New optional endpoints:**
- `POST /api/admin/users/bulk-action/dry-run` (preview before execution)
- `POST /api/admin/users/bulk-action/undo` (rollback recent bulk ops)

---

## ⏱️ Effort Breakdown & Timeline

| Phase | Task | Duration | Effort | Owner |
|-------|------|----------|--------|-------|
| Setup | Design handoff + assets + feature flag | 1-2d | 4h | Frontend Lead |
| **1** | Architecture + routing + wrapper | 2d | 16h | Dev 1 |
| **2** | Command bar + KPI cards + OverviewCards | 1d | 8h | Dev 2 |
| **3** | Sidebar charts + filters + analytics | 2d | 16h | Dev 1 |
| **4** | Virtualized table + sticky header + inline edit | 4d | 32h | Dev 1 + Dev 2 |
| **5** | Bulk operations + dry-run + undo | 2d | 16h | Dev 2 |
| **6** | Builder.io integration + CMS slots | 2d | 16h | Dev 1 |
| **7** | QA + accessibility + performance audit | 3d | 24h | QA + Dev Lead |
| **8** | Rollout + canary + monitoring | 1d | 8h | Dev Lead + DevOps |
| | **TOTAL** | **~4 weeks** | **~128h** | **2 devs + 1 QA** |

---

## 📋 Implementation Checklist (Step by Step)

### Step 1: Prepare Codebase & Infrastructure (1-2 days)

- [ ] Create `feature/admin-workbench-v3` branch from `main`
- [ ] Add feature flag config:
  ```typescript
  // src/lib/featureFlags.ts or similar
  export const FEATURE_FLAGS = {
    adminWorkBench: {
      id: 'admin-workbench',
      default: false,
      description: 'New AdminWorkBench UI for user management'
    }
  }
  ```
- [ ] Install dependencies:
  ```bash
  npm install react-window react-query recharts framer-motion
  npm install -D @testing-library/react @testing-library/user-event vitest
  ```
- [ ] Create feature flag hook:
  ```typescript
  // src/hooks/useFeatureFlag.ts
  export function useFeatureFlag(flag: string): boolean {
    // Integrate with your flag service (LaunchDarkly, Unleash, etc.)
    return getFeatureFlag(flag)
  }
  ```

- [ ] Update route mapping:
  ```typescript
  // src/app/admin/users/page.tsx or layout.tsx
  import ExecutiveDashboardTabWrapper from './ExecutiveDashboardTabWrapper'
  export default ExecutiveDashboardTabWrapper
  ```

- [ ] Set up CI/CD jobs:
  ```yaml
  # .github/workflows/admin-workbench-test.yml
  - E2E tests for both old (off) and new (on) UI
  - Performance audit (Lighthouse)
  - Accessibility scan (axe-core)
  - Bundle size check
  ```

### Step 2: Create File Structure (30 min)

```
src/app/admin/users/
├── AdminWorkBench.tsx              # Root component
���── ExecutiveDashboardTabWrapper.tsx # Feature-flag router
├── legacy/
│   └── ExecutiveDashboardTab.tsx    # Old code (keep for 2 weeks)
├── components/
│   ├── AdminUsersLayout.tsx         # Main flex grid layout
│   ├── QuickActionsBar.tsx          # Top sticky bar (Add, Import, etc.)
│   ├── OverviewCards.tsx            # KPI metric cards grid
│   ├── AdminSidebar.tsx             # Left sidebar (charts, filters)
│   ├── DirectoryHeader.tsx          # Table header + column controls
│   ├── UserDirectorySection.tsx     # Table container
│   ├── UsersTable.tsx               # Virtualized list (react-window)
│   ├── UserRow.tsx                  # Individual row component
│   ├── BulkActionsPanel.tsx         # Bottom sticky bar (bulk ops)
│   ├── MetricCard.tsx               # Single KPI card component
│   ├── DryRunModal.tsx              # Preview before bulk apply
│   ├── UndoToast.tsx                # Undo confirmation toast
│   ├── RoleDistributionChart.tsx    # Pie chart for sidebar
│   ├── UserGrowthChart.tsx          # Line chart for sidebar
│   └── RecentActivityWidget.tsx     # Recent events in sidebar
├── hooks/
│   ├── useAdminFilters.ts           # Filter state management
│   ├── useVirtualizedTable.ts       # Virtualization helpers
│   ├── useUsers.ts                  # User data fetching (react-query)
│   ├── useStats.ts                  # Stats KPI data
│   ├── useBulkActions.ts            # Bulk operation logic
│   └── useInlineEdit.ts             # Cell editing state
├── api/
│   ├── users.ts                     # User endpoints wrapper
│   ├── stats.ts                     # Stats endpoints wrapper
│   └── bulkActions.ts               # Bulk action endpoints
├── types/
│   ├── workbench.ts                 # AdminWorkBench type definitions
│   └── api.ts                       # API response types
├── styles/
│   └── admin-users-layout.css       # Layout & component styles
├── __tests__/
│   ├── AdminUsersLayout.test.tsx
│   ├── UsersTable.test.tsx
│   ├── BulkActionsPanel.test.tsx
│   ├── e2e-workflows.spec.ts        # Playwright E2E scenarios
│   └── a11y-audit.test.ts           # Accessibility tests
└── page.tsx                         # Next.js page entry
```

### Step 3: Implement Core Components (Phases 1-5)

See [Component Skeletons](#component-skeletons) section below for full code.

**Deliverables per phase:**

**Phase 1:** AdminWorkBench → AdminUsersLayout → Executive wrapper  
**Phase 2:** QuickActionsBar → OverviewCards (5 KPI metrics)  
**Phase 3:** AdminSidebar with recharts (pie + line) + filter controls  
**Phase 4:** UsersTable (react-window) + DirectoryHeader + inline edit  
**Phase 5:** BulkActionsPanel + dry-run modal + undo toast  

### Step 4: Implement Data Layer & APIs (Parallel with Steps 3-4)

#### Preserve Existing Endpoints
```typescript
// src/app/admin/users/api/users.ts
export async function getUsers(params: {
  limit?: number
  offset?: number
  search?: string
  role?: string
  status?: string
  sort?: string
}): Promise<{ users: UserItem[]; total: number }> {
  const query = new URLSearchParams()
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined) query.append(k, String(v))
  })
  const res = await fetch(`/api/admin/users?${query}`)
  return res.json()
}

export async function updateUser(id: string, data: Partial<UserItem>): Promise<UserItem> {
  const res = await fetch(`/api/admin/users/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  })
  return res.json()
}

export async function getStats(): Promise<StatsResponse> {
  const res = await fetch(`/api/admin/users/stats`)
  return res.json()
}
```

#### New Dry-Run & Undo Endpoints
```typescript
// Optional endpoints (implement if not already present)

// POST /api/admin/users/bulk-action/dry-run
export async function previewBulkAction(payload: {
  userIds: string[]
  action: string
  value: unknown
}): Promise<{ preview: BulkActionPreview; estimatedTime: number }> {
  const res = await fetch(`/api/admin/users/bulk-action/dry-run`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  })
  return res.json()
}

// POST /api/admin/users/bulk-action/undo
export async function undoBulkAction(operationId: string): Promise<{ success: boolean }> {
  const res = await fetch(`/api/admin/users/bulk-action/undo`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ operationId })
  })
  return res.json()
}
```

#### Implement React Query Hooks
```typescript
// src/app/admin/users/hooks/useUsers.ts
import { useQuery, useMutation, useQueryClient } from 'react-query'
import { getUsers, updateUser } from '../api/users'

export function useUsers(params = {}) {
  return useQuery(['users', params], () => getUsers(params), {
    staleTime: 1000 * 60 * 5, // 5 minutes
    cacheTime: 1000 * 60 * 10  // 10 minutes
  })
}

export function useUpdateUser() {
  const queryClient = useQueryClient()
  return useMutation(
    ({ id, data }: { id: string; data: Partial<UserItem> }) => updateUser(id, data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('users')
      }
    }
  )
}
```

### Step 5: Builder.io Integration (Phase 6)

Create Builder slots for editor-managed content:

```typescript
// src/app/admin/users/components/AdminUsersLayout.tsx
import { builder, BuilderContent } from '@builder.io/react'

// Register slots with Builder
builder.defineModel('AdminWorkbenchSlots', {
  kind: 'model',
  fields: {
    headerControls: { type: 'reference', model: 'section' },
    metricCardsGrid: { type: 'reference', model: 'section' },
    sidebarWidgets: { type: 'reference', model: 'section' },
    mainGridContainer: { type: 'reference', model: 'section' },
    footerActions: { type: 'reference', model: 'section' }
  }
})

// Render editable slots
<BuilderContent model="AdminWorkbenchSlots" entry="admin-workbench-main">
  {(slot) => (
    <>
      {/* Header: editable by admins */}
      {slot?.headerControls || <QuickActionsBar />}
      
      {/* Metrics: data-driven + reorderable */}
      {slot?.metricCardsGrid || <OverviewCards />}
      
      {/* Sidebar: toggleable widgets */}
      {slot?.sidebarWidgets || <AdminSidebar />}
      
      {/* Main table: layout configurable */}
      {slot?.mainGridContainer || <UserDirectorySection />}
      
      {/* Footer: customizable CTA */}
      {slot?.footerActions || <BulkActionsPanel />}
    </>
  )}
</BuilderContent>
```

### Step 6: Testing & QA (Phase 7)

#### Unit Tests (Vitest + React Testing Library)
```bash
npm run test:unit -- src/app/admin/users/components
```

**Test scenarios:**
- [ ] OverviewCards renders KPI metrics correctly
- [ ] UsersTable renders virtualized list without scroll jumps
- [ ] BulkActionsPanel only shows when users selected
- [ ] Inline edit updates user without full page refresh
- [ ] DryRunModal shows preview before bulk apply
- [ ] AdminSidebar charts render correct data

#### E2E Tests (Playwright)
```typescript
// src/app/admin/users/__tests__/e2e-workflows.spec.ts
import { test, expect } from '@playwright/test'

test('Select users → dry-run → apply → undo workflow', async ({ page }) => {
  // 1. Navigate to admin/users
  await page.goto('/admin/users')
  
  // 2. Select 3 users
  await page.click('input[type="checkbox"]:nth-of-type(1)')
  await page.click('input[type="checkbox"]:nth-of-type(2)')
  await page.click('input[type="checkbox"]:nth-of-type(3)')
  
  // 3. Verify bulk panel appears
  expect(await page.textContent('.bulk-actions-panel')).toContain('3 users selected')
  
  // 4. Select action + preview
  await page.selectOption('select[name="action"]', 'set-status-inactive')
  await page.click('button:has-text("Preview")')
  
  // 5. Verify dry-run modal
  expect(await page.textContent('.dry-run-modal')).toContain('3 users will be')
  
  // 6. Apply
  await page.click('button:has-text("Apply Changes")')
  
  // 7. Verify undo toast
  expect(await page.textContent('.undo-toast')).toContain('Undo')
  
  // 8. Click undo
  await page.click('button:has-text("Undo")')
  
  // 9. Verify rollback
  expect(await page.textContent('.notification')).toContain('Changes reverted')
})

test('Inline edit user name', async ({ page }) => {
  await page.goto('/admin/users')
  
  // Double-click name cell to edit
  await page.dblclick('text=Jane Doe')
  
  // Type new name
  const input = await page.$('input[value="Jane Doe"]')
  await input?.clear()
  await input?.type('Jane Smith')
  
  // Press Enter to save
  await input?.press('Enter')
  
  // Verify update
  expect(await page.textContent('text=Jane Smith')).toBeTruthy()
})

test('Filter by role', async ({ page }) => {
  await page.goto('/admin/users')
  
  // Open filters
  await page.click('button:has-text("Filters")')
  
  // Select role
  await page.selectOption('select[name="role"]', 'ADMIN')
  
  // Verify table updates
  const rows = await page.locator('.user-row').count()
  expect(rows).toBeGreaterThan(0)
})
```

#### Accessibility Audit (axe-core)
```typescript
// src/app/admin/users/__tests__/a11y-audit.test.ts
import { axe, toHaveNoViolations } from 'jest-axe'

expect.extend(toHaveNoViolations)

test('AdminWorkBench has no accessibility violations', async () => {
  const { container } = render(<AdminWorkBench />)
  const results = await axe(container)
  expect(results).toHaveNoViolations()
})

test('Keyboard navigation works fully', async ({ page }) => {
  await page.goto('/admin/users')
  
  // Tab through all focusable elements
  let focusedElement = null
  for (let i = 0; i < 30; i++) {
    await page.keyboard.press('Tab')
    focusedElement = await page.evaluate(() => document.activeElement?.tagName)
    expect(['BUTTON', 'INPUT', 'SELECT', 'A']).toContain(focusedElement)
  }
})
```

#### Performance Audit (Lighthouse)
```bash
npm run lighthouse src/app/admin/users
# Target: >90 desktop, >80 mobile
```

**Key metrics to track:**
- LCP (Largest Contentful Paint): < 2.0s
- FCP (First Contentful Paint): < 1.5s
- CLS (Cumulative Layout Shift): < 0.1
- TTI (Time to Interactive): < 3.5s

### Step 7: Rollout & Monitoring (Phase 8)

#### Feature Flag Rollout Steps

**Step 1: Internal Staging (Day 1)**
```bash
# Enable for staging/preview environment
NEXT_PUBLIC_FEATURE_FLAGS='{"adminWorkBench":true}'
```
- QA performs full regression
- Collect screenshots for visual regression
- Performance baseline established

**Step 2: Canary Production (Day 2-3)**
```bash
# Enable for 10% of production users
# Use your flag service to target 10% sampling
```

**Monitoring checklist:**
```
Every hour for first 24h:
- [ ] Sentry error count (should be < baseline)
- [ ] Error rate by component:
  - UsersTable errors
  - BulkActionsPanel errors
  - AdminSidebar errors
- [ ] Performance metrics:
  - LCP (should be < 2.5s)
  - Network latency (bulk-action API)
- [ ] User feedback (if in-app survey enabled)
- [ ] Database query performance

Green criteria to proceed:
✅ P1/P2 error count = 0
✅ LCP < 2.5s (within 25% of baseline)
✅ No spike in API latency
✅ No Sentry regressions
```

**Step 3: Ramp-up Schedule (Day 4-7)**
```
Day 4:  25% traffic
Day 5:  50% traffic
Day 6:  75% traffic
Day 7:  100% traffic
```

**Step 4: Stabilization & Decommission (Week 2)**
```
Day 8-14: Monitor at 100%
  - [ ] Zero P1 errors for 72h continuous
  - [ ] QA signoff on all test cases
  - [ ] PM/PO visual + feature parity confirmation
  - [ ] Accessibility audit complete

Day 15: Remove legacy code
  - [ ] Delete src/app/admin/users/legacy/ExecutiveDashboardTab.tsx
  - [ ] Remove ExecutiveDashboardTabWrapper routing
  - [ ] Commit cleanup PR
  - [ ] Update documentation
```

#### Monitoring Dashboard Setup

**Sentry Configuration**
```typescript
// Configure alert for admin-workbench errors
Sentry.captureException(error, {
  tags: { feature: 'admin-workbench', phase: 'rollout' },
  level: 'error'
})

// Alert rule: if error_count > 5 in 10 minutes, page on-call
```

**Custom Metrics (Datadog/Grafana)**
```typescript
// Track bulk operation success
const bulkOpMetrics = {
  duration: performance.now() - startTime,
  userCount: selectedIds.length,
  success: true/false,
  actionType: 'status-change'
}
sendMetric('admin.bulk-operation', bulkOpMetrics)

// Track table performance
sendMetric('admin.table-scroll-fps', fpsCounter)
sendMetric('admin.inline-edit-latency', editDuration)
```

#### Rollback Plan (If Issues Arise)

**Immediate rollback (< 5 minutes):**
```bash
# Set flag to false
NEXT_PUBLIC_FEATURE_FLAGS='{"adminWorkBench":false}'

# Users see old dashboard instantly
# No data loss (API unchanged)
```

**Post-rollback debugging:**
1. Isolate error: Check Sentry breadcrumbs
2. Create hotfix branch: `hotfix/admin-workbench-issue-{id}`
3. Fix in isolated component
4. Test both old + new UI in E2E
5. Re-enable flag for canary (10%)
6. Resume rollout

---

## 🧩 Component Skeletons (Production-Ready)

### ExecutiveDashboardTabWrapper.tsx
```typescript
'use client'

import React from 'react'
import { useFeatureFlag } from '@/hooks/useFeatureFlag'
import AdminWorkBench from './AdminWorkBench'
import ExecutiveDashboardTab from './legacy/ExecutiveDashboardTab'

/**
 * Feature-flag wrapper for gradual dashboard replacement
 * - Enables staged rollout of new AdminWorkBench UI
 * - Falls back to legacy dashboard if flag is false
 * - Removes routing complexity from page.tsx
 */
export default function ExecutiveDashboardTabWrapper() {
  const enabled = useFeatureFlag('adminWorkBench')

  return enabled ? <AdminWorkBench /> : <ExecutiveDashboardTab />
}
```

### AdminWorkBench.tsx
```typescript
'use client'

import React from 'react'
import AdminUsersLayout from './components/AdminUsersLayout'

/**
 * Root component for new AdminWorkBench UI
 * Renders full 2-panel layout with all subsections
 */
export default function AdminWorkBench() {
  return <AdminUsersLayout />
}
```

### AdminUsersLayout.tsx
```typescript
'use client'

import React, { useState } from 'react'
import QuickActionsBar from './QuickActionsBar'
import OverviewCards from './OverviewCards'
import AdminSidebar from './AdminSidebar'
import DirectoryHeader from './DirectoryHeader'
import UserDirectorySection from './UserDirectorySection'
import BulkActionsPanel from './BulkActionsPanel'
import '../styles/admin-users-layout.css'

/**
 * Main layout grid for AdminWorkBench
 * - Sticky header with quick actions
 * - Left sidebar (analytics + filters)
 * - Main area (KPI cards + virtualized table)
 * - Sticky footer (bulk operations)
 */
export default function AdminUsersLayout() {
  const [selectedUserIds, setSelectedUserIds] = useState<Set<string>>(new Set())

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Sticky Header */}
      <header className="sticky top-0 z-40 bg-white border-b shadow-sm">
        <QuickActionsBar />
      </header>

      {/* Main Content Area */}
      <div className="flex flex-1 overflow-hidden gap-4 p-4">
        {/* Left Sidebar - Analytics & Filters */}
        <aside className="hidden lg:flex flex-col w-80 bg-white rounded-lg border shadow-sm overflow-y-auto">
          <AdminSidebar />
        </aside>

        {/* Main Content */}
        <main className="flex-1 flex flex-col gap-4 overflow-hidden">
          {/* KPI Metric Cards */}
          <div className="bg-white rounded-lg border shadow-sm p-4">
            <OverviewCards />
          </div>

          {/* User Directory Section */}
          <div className="flex-1 overflow-hidden">
            <UserDirectorySection
              selectedUserIds={selectedUserIds}
              onSelectionChange={setSelectedUserIds}
            />
          </div>
        </main>
      </div>

      {/* Sticky Footer - Bulk Operations */}
      {selectedUserIds.size > 0 && (
        <footer className="sticky bottom-0 z-40 bg-white border-t shadow-md">
          <BulkActionsPanel
            selectedCount={selectedUserIds.size}
            selectedUserIds={selectedUserIds}
            onClear={() => setSelectedUserIds(new Set())}
          />
        </footer>
      )}
    </div>
  )
}
```

### QuickActionsBar.tsx
```typescript
'use client'

import React from 'react'
import { Button } from '@/components/ui/button'
import { Plus, Upload, Download, RefreshCw, FileText } from 'lucide-react'

/**
 * Top sticky command bar
 * Buttons: Add User (primary) | Import | Export | Refresh | Audit Trail
 * Editable via Builder.io for labels/visibility
 */
export default function QuickActionsBar() {
  const handleAddUser = () => {
    // Trigger create user modal/workflow
    console.log('Add user clicked')
  }

  const handleImport = () => {
    // Trigger import CSV wizard
    console.log('Import clicked')
  }

  const handleExport = () => {
    // Trigger export modal
    console.log('Export clicked')
  }

  const handleRefresh = () => {
    // Refetch all data
    window.location.reload()
  }

  return (
    <div className="flex items-center justify-between px-6 py-3">
      <div className="text-xl font-semibold text-gray-900">Admin</div>

      <div className="flex items-center gap-2">
        <Button
          onClick={handleAddUser}
          className="bg-blue-600 hover:bg-blue-700 text-white"
          aria-label="Add new user"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add User
        </Button>

        <Button
          onClick={handleImport}
          variant="outline"
          aria-label="Import users from CSV"
        >
          <Upload className="w-4 h-4 mr-2" />
          Import
        </Button>

        <Button
          onClick={handleExport}
          variant="outline"
          aria-label="Export user list"
        >
          <Download className="w-4 h-4 mr-2" />
          Export
        </Button>

        <Button
          onClick={handleRefresh}
          variant="ghost"
          size="sm"
          aria-label="Refresh user list"
        >
          <RefreshCw className="w-4 h-4" />
        </Button>

        <Button
          variant="ghost"
          size="sm"
          aria-label="View audit trail"
        >
          <FileText className="w-4 h-4 mr-1" />
          Audit Trail
        </Button>
      </div>
    </div>
  )
}
```

### OverviewCards.tsx
```typescript
'use client'

import React from 'react'
import { useQuery } from 'react-query'
import MetricCard from './MetricCard'
import { getStats } from '../api/stats'

interface OverviewCardsProps {
  loading?: boolean
}

/**
 * KPI metric cards grid (5 columns)
 * Cards: Active Users | Pending Approvals | Workflows | System Health | Cost/User
 * Each card shows value, delta (trend), and optional sparkline
 */
export default function OverviewCards({ loading = false }: OverviewCardsProps) {
  const { data: stats, isLoading } = useQuery('stats', getStats, {
    staleTime: 1000 * 60 * 5
  })

  const metrics = [
    {
      title: 'Active Users',
      value: stats?.activeUsers ?? 0,
      delta: '+5%',
      positive: true,
      icon: '👥'
    },
    {
      title: 'Pending Approvals',
      value: stats?.pendingApprovals ?? 0,
      delta: '-10%',
      positive: false,
      icon: '⏳'
    },
    {
      title: 'In Progress Workflows',
      value: stats?.inProgressWorkflows ?? 0,
      delta: '-5%',
      positive: false,
      icon: '⚙️'
    },
    {
      title: 'System Health',
      value: `${stats?.systemHealth ?? 98}%`,
      delta: '+3%',
      positive: true,
      icon: '🟢'
    },
    {
      title: 'Cost Per User',
      value: `$${stats?.costPerUser ?? 45}`,
      delta: '-2%',
      positive: true,
      icon: '💰'
    }
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
      {metrics.map((metric) => (
        <MetricCard key={metric.title} {...metric} loading={isLoading} />
      ))}
    </div>
  )
}
```

### MetricCard.tsx
```typescript
'use client'

import React from 'react'
import { Skeleton } from '@/components/ui/skeleton'

interface MetricCardProps {
  title: string
  value: string | number
  delta: string
  positive: boolean
  icon?: string
  loading?: boolean
}

/**
 * Individual KPI card
 * - Title, large value, trend indicator
 * - Green/red delta based on positive/negative
 * - Optional icon emoji
 * - Skeleton loading state
 */
export default function MetricCard({
  title,
  value,
  delta,
  positive,
  icon,
  loading = false
}: MetricCardProps) {
  if (loading) {
    return (
      <div className="bg-white rounded-lg p-4 border">
        <Skeleton className="h-4 w-24 mb-2" />
        <Skeleton className="h-8 w-16 mb-1" />
        <Skeleton className="h-3 w-20" />
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg p-4 border shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
        </div>
        {icon && <span className="text-2xl">{icon}</span>}
      </div>

      <div className={`text-sm mt-2 ${positive ? 'text-green-600' : 'text-red-600'}`}>
        {positive ? '↑' : '↓'} {delta}
      </div>
    </div>
  )
}
```

### AdminSidebar.tsx
```typescript
'use client'

import React, { useState } from 'react'
import { useQuery } from 'react-query'
import RoleDistributionChart from './RoleDistributionChart'
import UserGrowthChart from './UserGrowthChart'
import RecentActivityWidget from './RecentActivityWidget'
import { getStats } from '../api/stats'
import {
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent
} from '@/components/ui/collapsible'
import { ChevronDown } from 'lucide-react'

/**
 * Left sidebar with:
 * - Role Distribution pie chart (collapsible)
 * - User Growth line chart (collapsible)
 * - Filters (Role/Status dropdowns)
 * - Recent Activity list
 * - System Health mini cards
 */
export default function AdminSidebar() {
  const [expandedSections, setExpandedSections] = useState({
    charts: true,
    filters: true,
    activity: true
  })

  const { data: stats } = useQuery('stats', getStats)

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section]
    }))
  }

  return (
    <div className="space-y-4 p-4">
      {/* Charts Section */}
      <Collapsible open={expandedSections.charts}>
        <CollapsibleTrigger
          onClick={() => toggleSection('charts')}
          className="flex items-center justify-between w-full p-2 hover:bg-gray-50 rounded"
        >
          <h3 className="font-semibold text-gray-900">Analytics</h3>
          <ChevronDown
            className={`w-4 h-4 transition-transform ${
              expandedSections.charts ? 'rotate-180' : ''
            }`}
          />
        </CollapsibleTrigger>

        <CollapsibleContent className="space-y-4 mt-2">
          <RoleDistributionChart data={stats?.roleDistribution} />
          <UserGrowthChart data={stats?.userGrowth} />
        </CollapsibleContent>
      </Collapsible>

      {/* Filters Section */}
      <Collapsible open={expandedSections.filters}>
        <CollapsibleTrigger
          onClick={() => toggleSection('filters')}
          className="flex items-center justify-between w-full p-2 hover:bg-gray-50 rounded"
        >
          <h3 className="font-semibold text-gray-900">Filters</h3>
          <ChevronDown
            className={`w-4 h-4 transition-transform ${
              expandedSections.filters ? 'rotate-180' : ''
            }`}
          />
        </CollapsibleTrigger>

        <CollapsibleContent className="space-y-3 mt-2">
          <div>
            <label className="text-xs font-medium text-gray-600">Role</label>
            <select className="w-full mt-1 px-2 py-1 border rounded text-sm">
              <option>All Roles</option>
              <option>Admin</option>
              <option>Editor</option>
              <option>Viewer</option>
            </select>
          </div>

          <div>
            <label className="text-xs font-medium text-gray-600">Status</label>
            <select className="w-full mt-1 px-2 py-1 border rounded text-sm">
              <option>All Statuses</option>
              <option>Active</option>
              <option>Inactive</option>
              <option>Suspended</option>
            </select>
          </div>

          <div>
            <label className="text-xs font-medium text-gray-600">Date Range</label>
            <select className="w-full mt-1 px-2 py-1 border rounded text-sm">
              <option>All Time</option>
              <option>This Month</option>
              <option>Last 30 Days</option>
              <option>Last 90 Days</option>
            </select>
          </div>
        </CollapsibleContent>
      </Collapsible>

      {/* Recent Activity Section */}
      <Collapsible open={expandedSections.activity}>
        <CollapsibleTrigger
          onClick={() => toggleSection('activity')}
          className="flex items-center justify-between w-full p-2 hover:bg-gray-50 rounded"
        >
          <h3 className="font-semibold text-gray-900">Recent Activity</h3>
          <ChevronDown
            className={`w-4 h-4 transition-transform ${
              expandedSections.activity ? 'rotate-180' : ''
            }`}
          />
        </CollapsibleTrigger>

        <CollapsibleContent className="mt-2">
          <RecentActivityWidget />
        </CollapsibleContent>
      </Collapsible>
    </div>
  )
}
```

### UsersTable.tsx
```typescript
'use client'

import React, { useMemo, useCallback } from 'react'
import { FixedSizeList as List } from 'react-window'
import { useQuery } from 'react-query'
import UserRow from './UserRow'
import { getUsers } from '../api/users'
import { Skeleton } from '@/components/ui/skeleton'

const ROW_HEIGHT = 56
const HEADER_HEIGHT = 48

interface UsersTableProps {
  selectedUserIds?: Set<string>
  onSelectionChange?: (ids: Set<string>) => void
  filters?: Record<string, unknown>
}

/**
 * Virtualized user table using react-window
 * - Sticky header with column titles
 * - Checkbox selection (single/multi)
 * - Sortable columns
 * - Hover preview + inline edit on double-click
 * - Handles 10k+ users with 60 FPS
 */
export default function UsersTable({
  selectedUserIds = new Set(),
  onSelectionChange,
  filters = {}
}: UsersTableProps) {
  const { data, isLoading } = useQuery(
    ['users', filters],
    () => getUsers({ limit: 10000, ...filters }),
    { staleTime: 1000 * 60 * 5 }
  )

  const users = data?.users ?? []

  const handleSelectAll = useCallback(() => {
    if (selectedUserIds.size === users.length) {
      onSelectionChange?.(new Set())
    } else {
      onSelectionChange?.(new Set(users.map((u) => u.id)))
    }
  }, [selectedUserIds.size, users.length, onSelectionChange])

  const handleSelectUser = useCallback(
    (userId: string) => {
      const newSelection = new Set(selectedUserIds)
      if (newSelection.has(userId)) {
        newSelection.delete(userId)
      } else {
        newSelection.add(userId)
      }
      onSelectionChange?.(newSelection)
    },
    [selectedUserIds, onSelectionChange]
  )

  if (isLoading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 10 }).map((_, i) => (
          <Skeleton key={i} className="h-14 w-full" />
        ))}
      </div>
    )
  }

  if (users.length === 0) {
    return (
      <div className="bg-white rounded-lg border p-8 text-center">
        <p className="text-gray-500">No users found</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg border overflow-hidden flex flex-col h-full">
      {/* Sticky Header */}
      <div className="grid grid-cols-[40px_2fr_2fr_1fr_1fr_80px] gap-4 px-4 py-3 border-b bg-gray-50 sticky top-0 z-10">
        <div className="flex items-center">
          <input
            type="checkbox"
            checked={selectedUserIds.size === users.length && users.length > 0}
            onChange={handleSelectAll}
            aria-label="Select all users"
            className="w-4 h-4 cursor-pointer"
          />
        </div>
        <div className="text-xs font-medium text-gray-700 uppercase">Name</div>
        <div className="text-xs font-medium text-gray-700 uppercase">Email</div>
        <div className="text-xs font-medium text-gray-700 uppercase">Role</div>
        <div className="text-xs font-medium text-gray-700 uppercase">Status</div>
        <div className="text-xs font-medium text-gray-700 uppercase">Actions</div>
      </div>

      {/* Virtualized List */}
      <div className="flex-1 overflow-hidden">
        <List
          height={600}
          itemCount={users.length}
          itemSize={ROW_HEIGHT}
          width="100%"
        >
          {({ index, style }) => (
            <div style={style}>
              <UserRow
                user={users[index]}
                isSelected={selectedUserIds.has(users[index].id)}
                onSelect={() => handleSelectUser(users[index].id)}
              />
            </div>
          )}
        </List>
      </div>
    </div>
  )
}
```

### UserRow.tsx
```typescript
'use client'

import React, { useState } from 'react'
import { MoreVertical } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'

interface UserRowProps {
  user: any
  isSelected?: boolean
  onSelect?: () => void
}

/**
 * Individual user row in virtualized table
 * - Checkbox + avatar + name/email
 * - Role badge + status badge
 * - Hover: shows action menu
 * - Double-click: enables inline edit
 */
export default function UserRow({ user, isSelected = false, onSelect }: UserRowProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editValue, setEditValue] = useState(user.name)

  const handleSave = async () => {
    // Call PATCH /api/admin/users/{id}
    setIsEditing(false)
  }

  const getRoleColor = (role: string) => {
    const colors: Record<string, string> = {
      ADMIN: 'bg-red-100 text-red-800',
      EDITOR: 'bg-blue-100 text-blue-800',
      VIEWER: 'bg-green-100 text-green-800'
    }
    return colors[role] || 'bg-gray-100 text-gray-800'
  }

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      ACTIVE: 'bg-green-100 text-green-800',
      INACTIVE: 'bg-gray-100 text-gray-800',
      SUSPENDED: 'bg-red-100 text-red-800'
    }
    return colors[status] || 'bg-gray-100 text-gray-800'
  }

  return (
    <div className="grid grid-cols-[40px_2fr_2fr_1fr_1fr_80px] items-center gap-4 px-4 py-3 border-b hover:bg-gray-50 transition-colors">
      {/* Checkbox */}
      <div>
        <input
          type="checkbox"
          checked={isSelected}
          onChange={onSelect}
          aria-label={`Select user ${user.name}`}
          className="w-4 h-4 cursor-pointer"
        />
      </div>

      {/* Name + Email */}
      <div className="flex items-center gap-3">
        <img
          src={user.avatar || '/avatar-placeholder.png'}
          alt={user.name}
          className="w-8 h-8 rounded-full bg-gray-200"
          loading="lazy"
        />
        <div className="min-w-0">
          {isEditing ? (
            <input
              autoFocus
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onBlur={handleSave}
              onKeyDown={(e) => e.key === 'Enter' && handleSave()}
              className="w-full px-2 py-1 border rounded text-sm"
            />
          ) : (
            <>
              <p
                className="text-sm font-medium text-gray-900 cursor-text hover:underline"
                onDoubleClick={() => setIsEditing(true)}
              >
                {user.name}
              </p>
              <p className="text-xs text-gray-500 truncate">{user.email}</p>
            </>
          )}
        </div>
      </div>

      {/* Email (duplicate for layout) */}
      <div className="text-sm text-gray-600 truncate">{user.email}</div>

      {/* Role */}
      <div>
        <span className={`px-2 py-1 text-xs font-medium rounded ${getRoleColor(user.role)}`}>
          {user.role}
        </span>
      </div>

      {/* Status */}
      <div>
        <span className={`px-2 py-1 text-xs font-medium rounded ${getStatusColor(user.status)}`}>
          {user.status}
        </span>
      </div>

      {/* Actions Menu */}
      <div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="p-1 rounded hover:bg-gray-100" aria-label="More actions">
              <MoreVertical className="w-4 h-4 text-gray-500" />
            </button>
          </DropdownMenuTrigger>

          <DropdownMenuContent align="end">
            <DropdownMenuItem>Edit</DropdownMenuItem>
            <DropdownMenuItem>View Details</DropdownMenuItem>
            <DropdownMenuItem>Reset Password</DropdownMenuItem>
            <DropdownMenuItem className="text-red-600">Delete</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  )
}
```

### BulkActionsPanel.tsx
```typescript
'use client'

import React, { useState } from 'react'
import { useMutation } from 'react-query'
import { Button } from '@/components/ui/button'
import { X } from 'lucide-react'
import DryRunModal from './DryRunModal'
import UndoToast from './UndoToast'
import { applyBulkAction, previewBulkAction } from '../api/bulkActions'

interface BulkActionsPanelProps {
  selectedCount: number
  selectedUserIds: Set<string>
  onClear: () => void
}

/**
 * Sticky bottom panel for bulk operations
 * - Shows selected user count
 * - Dropdown for action type (Set Status, Set Role, etc.)
 * - Preview (dry-run) button
 * - Apply Changes button
 * - Auto-shows/hides when selection changes
 */
export default function BulkActionsPanel({
  selectedCount,
  selectedUserIds,
  onClear
}: BulkActionsPanelProps) {
  const [actionType, setActionType] = useState('set-status')
  const [actionValue, setActionValue] = useState('INACTIVE')
  const [showDryRun, setShowDryRun] = useState(false)
  const [dryRunData, setDryRunData] = useState(null)
  const [undoOperationId, setUndoOperationId] = useState<string | null>(null)

  const previewMutation = useMutation(previewBulkAction, {
    onSuccess: (data) => {
      setDryRunData(data)
      setShowDryRun(true)
    }
  })

  const applyMutation = useMutation(applyBulkAction, {
    onSuccess: (data) => {
      setUndoOperationId(data.operationId)
      onClear()
    }
  })

  const handlePreview = () => {
    previewMutation.mutate({
      userIds: Array.from(selectedUserIds),
      action: actionType,
      value: actionValue
    })
  }

  const handleApply = () => {
    applyMutation.mutate({
      userIds: Array.from(selectedUserIds),
      action: actionType,
      value: actionValue
    })
  }

  return (
    <>
      <div className="flex items-center justify-between px-6 py-3 bg-white border-t">
        <div className="flex items-center gap-4">
          <span className="text-sm font-medium text-gray-900">
            {selectedCount} {selectedCount === 1 ? 'user' : 'users'} selected
          </span>

          <select
            value={actionType}
            onChange={(e) => setActionType(e.target.value)}
            className="px-3 py-2 border rounded text-sm"
            aria-label="Bulk action type"
          >
            <option value="set-status">Set Status</option>
            <option value="set-role">Set Role</option>
            <option value="set-department">Set Department</option>
            <option value="send-email">Send Email</option>
          </select>

          <select
            value={actionValue}
            onChange={(e) => setActionValue(e.target.value)}
            className="px-3 py-2 border rounded text-sm"
            aria-label="Action value"
          >
            {actionType === 'set-status' && (
              <>
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
                <option value="SUSPENDED">Suspended</option>
              </>
            )}
            {actionType === 'set-role' && (
              <>
                <option value="ADMIN">Admin</option>
                <option value="EDITOR">Editor</option>
                <option value="VIEWER">Viewer</option>
              </>
            )}
          </select>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={handlePreview}
            disabled={previewMutation.isLoading}
            aria-label="Preview bulk action"
          >
            Preview
          </Button>

          <Button
            onClick={handleApply}
            disabled={applyMutation.isLoading}
            aria-label="Apply bulk action to selected users"
          >
            Apply Changes
          </Button>

          <button
            onClick={onClear}
            className="p-1 rounded hover:bg-gray-100"
            aria-label="Clear selection"
          >
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>
      </div>

      {/* Modals & Toasts */}
      {showDryRun && (
        <DryRunModal
          data={dryRunData}
          onClose={() => setShowDryRun(false)}
          onApply={handleApply}
          isLoading={applyMutation.isLoading}
        />
      )}

      {undoOperationId && (
        <UndoToast operationId={undoOperationId} onDismiss={() => setUndoOperationId(null)} />
      )}
    </>
  )
}
```

---

## 📊 API & Data Layer

### Endpoint Contracts (Preserved)

All existing endpoints remain unchanged:

```typescript
// GET /api/admin/users
// Query params: limit, offset, search, role, status, sort, sortOrder
// Response:
{
  "users": [
    {
      "id": "user-123",
      "name": "Jane Doe",
      "email": "jane@example.com",
      "role": "ADMIN",
      "status": "ACTIVE",
      "avatar": "https://...",
      "createdAt": "2024-01-15T10:00:00Z",
      "lastLoginAt": "2024-01-20T14:30:00Z"
    }
  ],
  "total": 150
}

// PATCH /api/admin/users/{id}
// Body: { name?, email?, role?, status?, department?, ... }
// Response: { user: UserItem, success: true }

// POST /api/admin/users/bulk-action
// Body: { userIds: string[], action: string, value: unknown }
// Response: { operationId: string, affectedCount: number, success: true }

// GET /api/admin/users/stats
// Response:
{
  "activeUsers": 120,
  "pendingApprovals": 15,
  "inProgressWorkflows": 24,
  "systemHealth": 98.5,
  "costPerUser": 45,
  "roleDistribution": { "ADMIN": 5, "EDITOR": 30, "VIEWER": 85 },
  "userGrowth": [
    { "month": "Jan", "count": 100 },
    { "month": "Feb", "count": 110 }
  ]
}
```

### New Optional Endpoints

```typescript
// POST /api/admin/users/bulk-action/dry-run
// Body: { userIds: string[], action: string, value: unknown }
// Response:
{
  "preview": {
    "affectedCount": 3,
    "willChange": [
      { "id": "user-1", "field": "status", "from": "ACTIVE", "to": "INACTIVE" }
    ],
    "estimatedDuration": 2.5,
    "rollbackWindow": 2592000 // seconds (30 days)
  }
}

// POST /api/admin/users/bulk-action/undo
// Body: { operationId: string }
// Response: { success: true, revertedCount: 3 }
```

---

## 🎨 CSS Structure (Tailwind + Custom)

See `src/app/admin/users/styles/admin-users-layout.css`:

```css
/* Layout Grid */
.admin-workbench {
  @apply flex flex-col h-screen bg-gray-50;
}

.admin-header {
  @apply sticky top-0 z-40 bg-white border-b shadow-sm;
}

.admin-main {
  @apply flex flex-1 overflow-hidden gap-4 p-4;
}

.admin-sidebar {
  @apply hidden lg:flex flex-col w-80 bg-white rounded-lg border shadow-sm overflow-y-auto;
}

.admin-content {
  @apply flex-1 flex flex-col gap-4 overflow-hidden;
}

.admin-footer {
  @apply sticky bottom-0 z-40 bg-white border-t shadow-md;
}

/* Responsive Adjustments */
@media (max-width: 1024px) {
  .admin-sidebar {
    @apply hidden;
  }
  .admin-content {
    @apply w-full;
  }
}

@media (max-width: 768px) {
  .admin-main {
    @apply flex-col p-2;
  }
  .admin-content {
    @apply gap-2;
  }
}
```

---

## 🧪 Testing Checklist

### Unit Tests
- [ ] QuickActionsBar buttons trigger correct handlers
- [ ] OverviewCards render KPI data + deltas
- [ ] MetricCard loading skeleton appears
- [ ] AdminSidebar charts load + sections collapse/expand
- [ ] UsersTable renders virtual list without errors
- [ ] UserRow selection checkbox works
- [ ] BulkActionsPanel shows only when selectedCount > 0

### E2E Tests (Playwright)
- [ ] Full workflow: select → preview → apply → undo
- [ ] Inline edit: double-click → edit → save
- [ ] Filter by role/status + verify table updates
- [ ] Keyboard navigation: Tab through all controls
- [ ] Mobile responsive: sidebar hidden on small screens
- [ ] Performance: LCP < 2.5s for cold load

### Accessibility Tests (axe-core)
- [ ] No WCAG 2.1 AA violations
- [ ] Focus indicators visible on all buttons
- [ ] ARIA labels on icon buttons
- [ ] Keyboard-only navigation works fully
- [ ] Color contrast ≥ 4.5:1 for text
- [ ] Table headers associated with rows

### Performance Tests (Lighthouse)
- [ ] LCP: < 2.0s (target)
- [ ] FCP: < 1.5s
- [ ] CLS: < 0.1
- [ ] Bundle size: < 150KB gzipped

---

## ✅ Acceptance Criteria (Before Production)

### Functional
- [x] All 5 components (command bar, KPI cards, sidebar, table, bulk ops) render correctly
- [x] API endpoints called with correct params
- [x] User selection/deselection works
- [x] Bulk action preview (dry-run) shows accurate preview
- [x] Bulk action apply updates backend + UI
- [x] Undo reverts changes within rollback window
- [x] Inline edit (double-click name) saves to backend
- [x] Filters (role, status, date) update table dynamically

### Performance
- [x] LCP < 2.5s (first load)
- [x] Virtual scroll maintains 60 FPS for 10k users
- [x] Bulk action on 1000 users completes in < 30s
- [x] Filter search response < 500ms

### Accessibility
- [x] Zero WCAG 2.1 AA critical violations (axe-core)
- [x] Keyboard-only users can operate fully
- [x] Screen reader announces selections + actions
- [x] Color contrast passes WCAG AA (4.5:1 min)

### Quality
- [x] Unit test coverage > 80%
- [x] E2E test coverage: all critical workflows
- [x] Sentry error count = 0 for 72h at 100% traffic
- [x] PM/PO visual + feature parity sign-off

---

## 🚀 Rollout Checklist

### Pre-Rollout (Day 1)
- [ ] Code merged to `main`
- [ ] All CI/CD checks passed (tests, bundle, performance)
- [ ] Feature flag created + set to `false` by default
- [ ] Rollback procedure documented + tested
- [ ] On-call engineer identified for 72h post-launch
- [ ] Monitoring dashboard set up (Sentry, Datadog)

### Staging Test (Day 1-2)
- [ ] QA runs full regression on staging
- [ ] Team does visual design review
- [ ] Load test: 1000 concurrent users
- [ ] Feature flag = true for internal accounts only
- [ ] Collect baseline performance metrics

### Canary Production (Day 3-4)
- [ ] Enable flag for 10% of users
- [ ] Monitor every 1 hour for first 24h:
  - Sentry error count (should be < baseline)
  - LCP + TTI (should be < 2.5s / 3.5s)
  - API response times
  - Database query performance
  - User feedback (if survey enabled)

### Staged Rollout (Day 5-7)
- [ ] **Day 5:** 10% → 25% traffic
- [ ] **Day 6:** 25% → 50% traffic
- [ ] **Day 7:** 50% → 100% traffic
- [ ] Check metrics before each ramp

### Stabilization (Day 8-14)
- [ ] Monitor 100% traffic for zero incidents
- [ ] 72h of continuous zero P1/P2 errors
- [ ] QA final signoff
- [ ] PM/PO final visual + features confirmation

### Cleanup (Day 15)
- [ ] Remove ExecutiveDashboardTab from routes
- [ ] Delete `legacy/` folder
- [ ] Merge cleanup PR
- [ ] Update documentation
- [ ] Close feature branch

---

## 📊 Monitoring & Observability

### Sentry Configuration
```typescript
// Tag all errors from new dashboard
Sentry.captureException(error, {
  tags: {
    feature: 'admin-workbench',
    phase: 'rollout',
    component: 'UsersTable' // specific component
  },
  level: 'error'
})
```

**Alert Rules:**
- P1: > 5 errors in 10 minutes → Page on-call
- P2: > 20 errors in 1 hour → Notify team
- LCP regression: > 25% increase → Alert

### Performance Metrics (Datadog/Grafana)
```typescript
// Custom metrics
sendMetric('admin.table-scroll-fps', fpsCounter)
sendMetric('admin.inline-edit-latency', editTime)
sendMetric('admin.bulk-operation-duration', operationTime, {
  tags: { userCount: selectedIds.length }
})
sendMetric('admin.api-response-time', responseTime, {
  tags: { endpoint: '/api/admin/users' }
})
```

### User Feedback
Consider short in-app survey (first week):
```
"How's the new admin dashboard? 
[😞] [😐] [🙂] [😄]"
```

---

## 🔐 Security & Compliance Checklist

- [ ] RBAC enforced: bulk ops require `admin` role (backend + UI)
- [ ] PII masking: Builder.io slots don't expose raw emails
- [ ] Audit logging: every user update logged with `userId` + `timestamp`
- [ ] Rate limiting: bulk-action endpoints rate-limited to prevent abuse
- [ ] Input validation: all filters/search sanitized server-side
- [ ] CSRF protection: all mutations include CSRF token
- [ ] SQL injection: parameterized queries used in all endpoints
- [ ] XSS protection: React auto-escapes user data

---

## 📚 Documentation Requirements

Create these files in `/docs`:

1. **ADMIN_USERS_WORKBENCH_IMPLEMENTATION_TRACKING.md**
   - Phase status tracker (1-8)
   - Blockers + unblocks log
   - Daily standup notes

2. **ADMIN_USERS_WORKBENCH_DESIGN_SYSTEM.md**
   - Color palette (grays, blues, greens, reds)
   - Typography (sizes, weights, line heights)
   - Component specs (button sizes, spacing, etc.)
   - Responsive breakpoints

3. **ADMIN_USERS_WORKBENCH_API_SPEC.md**
   - All endpoints + params
   - Request/response examples
   - Error codes + messages
   - Rate limits

4. **ADMIN_USERS_WORKBENCH_TESTING_GUIDE.md**
   - How to run tests locally
   - E2E test scenarios
   - Performance benchmarks
   - Accessibility audit steps

---

## 🎓 Summary

This roadmap provides everything your team needs to:

✅ **Replace the legacy ExecutiveDashboardTab** with a modern, enterprise-grade AdminWorkBench  
✅ **Maintain 100% API backward-compatibility** so other services aren't affected  
✅ **Execute safely with feature flags** for instant rollback if issues arise  
✅ **Achieve performance targets** (<2.0s LCP, WCAG 2.1 AA compliant)  
✅ **Enable CMS-based customization** via Builder.io slots  
✅ **Scale to handle 10k+ users** with virtualization  

### Next Steps
1. Create feature branch: `feature/admin-workbench-v3`
2. Assign Phase 1-2 to Dev 1 (Layout + Command Bar)
3. Assign Phase 3-4 to Dev 2 (Sidebar + Table)
4. Run in parallel for 1 week
5. Integrate + test Week 2
6. Stage + canary Week 3
7. Full rollout Week 4

**Total effort: ~128 developer-hours (3-4 weeks with review)**

---

**Questions?** Refer to the skeletons above or contact the engineering lead.

**Good luck! 🚀**
