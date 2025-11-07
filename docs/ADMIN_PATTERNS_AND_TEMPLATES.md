# Admin Page Patterns & Templates

**Status:** ✅ Production Patterns Documented  
**Date:** January 2025  
**Purpose:** Guide for building new admin pages using proven patterns from Phase 4 implementation

---

## Overview

This document captures the architectural patterns and best practices extracted from the successful Phase 4 implementation of the unified admin users page. Use these patterns when building new admin features.

### Key Principle
**Specialized Services > Generic Frameworks**

The Phase 4 implementation proved that domain-specific services with shared utility hooks outperform generic entity frameworks. Follow this pattern for new admin work.

---

## Shared Utility Hooks

These hooks are the core of the admin pattern library. They handle common list management concerns across all admin pages.

### 1. `useListState<T>` - Data State Management

**Location:** `src/hooks/admin/useListState.ts`

**Purpose:** Manage loading, data, and error state for list views

**API:**
```typescript
export interface ListState<T> {
  rows: T[]
  loading: boolean
  error: string | null
  setRows: (rows: T[]) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
}

export function useListState<T>(initial: T[] = []): ListState<T>
```

**Usage Example:**
```typescript
const { rows, loading, error, setRows, setLoading, setError } = useListState<User>([])

// Load data
const load = async () => {
  setLoading(true)
  try {
    const data = await fetch('/api/admin/users')
    setRows(await data.json())
  } catch (e) {
    setError(e.message)
  } finally {
    setLoading(false)
  }
}
```

**When to Use:**
- Anytime you need to manage a list of items
- For any CRUD page (users, clients, team, etc.)
- When you need a loading state for async operations

**What It Saves:**
- ~20 lines of useState boilerplate per page
- Consistent error handling across pages
- Type-safe state management

### 2. `useListFilters` - Search & Filter State

**Location:** `src/hooks/admin/useListFilters.ts`

**Purpose:** Manage search term and dynamic filter state

**API:**
```typescript
export interface ListFilters {
  search: string
  setSearch: (v: string) => void
  values: Record<string, string>
  setFilter: (key: string, value: string) => void
}

export function useListFilters(initial: Record<string, string> = {}): ListFilters

export function useTextMatch(term: string): (value?: string | null) => boolean
```

**Usage Example:**
```typescript
const { search, setSearch, values, setFilter } = useListFilters({ 
  tier: 'all', 
  status: 'all' 
})

// Now you can:
// - setSearch('john') → filter by search term
// - setFilter('tier', 'SMB') → filter by specific filter
// - values.tier === 'SMB' → check current filter value
```

**Helper: `useTextMatch`**
```typescript
const matches = useTextMatch(search)

// Check if a value matches search:
if (matches(client.name)) {
  // include in results
}
```

**When to Use:**
- For any list with search functionality
- When you have multiple independent filters
- For real-time filtering without API calls

**What It Saves:**
- ~30 lines of filter logic per page
- Consistent filter UI/UX across pages
- Debounce-ready hook (can add memoization)

---

## Shared UI Components

These components provide consistent UI/UX across admin pages.

### 1. `ListViewTemplate` - Generic List Renderer

**Location:** `src/components/dashboard/templates/ListPage.tsx`

**Purpose:** Standardized list page with header, filters, table/grid

**Used By:** EntitiesTab (clients list), any future list pages

**When to Use:**
- Building a new admin list page
- Need consistent styling with other admin pages
- Want table/grid with pagination built-in

### 2. `FilterBar` - Search & Filter Controls

**Location:** Implemented inline in components

**Pattern to Follow:**
```typescript
<div className="flex gap-2 items-center">
  <input
    type="text"
    placeholder="Search..."
    value={search}
    onChange={(e) => setSearch(e.target.value)}
  />
  <select
    value={values.status}
    onChange={(e) => setFilter('status', e.target.value)}
  >
    <option value="all">All Status</option>
    <option value="ACTIVE">Active</option>
    <option value="INACTIVE">Inactive</option>
  </select>
</div>
```

**When to Use:**
- Any list page needs search/filter functionality
- Keep filter styling consistent with existing pages

### 3. `ExportButton` - CSV Export

**Pattern to Follow:**
```typescript
const handleExport = async () => {
  const headers = ['ID', 'Name', 'Email', 'Status']
  const rows = data.map(item => [
    item.id,
    item.name,
    item.email,
    item.status
  ])
  
  const csv = [
    headers.join(','),
    ...rows.map(row => row.join(','))
  ].join('\n')
  
  const blob = new Blob([csv], { type: 'text/csv' })
  const url = window.URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'export.csv'
  a.click()
}
```

**When to Use:**
- Any list page should support export
- Use consistent CSV formatting across pages

---

## Specialized Services Pattern

### The Phase 4 Approach (Follow This!)

**Good Pattern:**
```typescript
// Create specialized service for each domain
export class UserService {
  static async getUsers(filters: UserFilters) { ... }
  static async createUser(data: UserData) { ... }
  static async updateUser(id: string, data: UserData) { ... }
  static async deleteUser(id: string) { ... }
  // Domain-specific methods:
  static async assignRole(userId: string, role: Role) { ... }
  static async resetPassword(userId: string) { ... }
}

export class ClientService {
  static async getClients(filters: ClientFilters) { ... }
  static async createClient(data: ClientData) { ... }
  // Domain-specific methods:
  static async updateTier(clientId: string, tier: ClientTier) { ... }
  static async getRevenue(clientId: string) { ... }
}
```

**Bad Pattern (Don't Do This):**
```typescript
// Generic EntityManager doesn't work for real systems
export class EntityManager<T> {
  static async getEntities(type: EntityType): T[] { ... }
  static async create(type: EntityType, data: any) { ... }
  // Can't handle domain-specific needs (roles, permissions, etc.)
}
```

**Why Specialized Services Win:**
1. ✅ Can implement domain-specific validation
2. ✅ Can add specialized methods (assignRole, resetPassword)
3. ✅ Easier to test (can mock specific methods)
4. ✅ Type-safe (not generic T)
5. ✅ Clearer intent (UserService is obviously for users)

**When to Create a New Service:**
- Adding a new entity type to the system
- Have >10 API calls specific to that entity
- Need domain-specific business logic

---

## Tab-Based Architecture Pattern

### Structure (From Phase 4)

```typescript
export function MyAdminPage() {
  const [activeTab, setActiveTab] = useState<TabType>('dashboard')

  // Initialize tab from URL (?tab=...)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const tab = params.get('tab')
    if (tab) setActiveTab(tab)
  }, [])

  return (
    <div>
      <TabNavigation activeTab={activeTab} onTabChange={setActiveTab} />
      
      {activeTab === 'dashboard' && <DashboardTab />}
      {activeTab === 'entities' && <EntitiesTab />}
      {activeTab === 'settings' && <SettingsTab />}
    </div>
  )
}
```

### Benefits

| Benefit | Example |
|---------|---------|
| **Feature Isolation** | Each tab can be enhanced independently |
| **Lazy Loading** | Load tab components only when needed |
| **URL State** | `?tab=entities` allows bookmarking specific tabs |
| **Testing** | Can test each tab in isolation |
| **Scalability** | Easy to add new tabs without touching others |

### When to Use Tab-Based Design

✅ Use when:
- Page has 3+ distinct feature areas
- Want to isolate features for independent development
- Users need quick context switching

❌ Don't use when:
- Simple page with single feature
- All content should be visible at once
- Heavy cross-feature integration needed

---

## Sub-Tab Pattern (Entities Tab Example)

When a tab has multiple related views, use sub-tabs:

```typescript
function EntitiesTab() {
  const [activeSubTab, setActiveSubTab] = useState<'clients' | 'team'>('clients')

  return (
    <div>
      <div className="border-b">
        <nav className="flex gap-4">
          <button
            onClick={() => setActiveSubTab('clients')}
            className={activeSubTab === 'clients' ? 'active' : ''}
          >
            Clients
          </button>
          <button
            onClick={() => setActiveSubTab('team')}
            className={activeSubTab === 'team' ? 'active' : ''}
          >
            Team
          </button>
        </nav>
      </div>

      {activeSubTab === 'clients' && <ClientsListEmbedded />}
      {activeSubTab === 'team' && <TeamManagement />}
    </div>
  )
}
```

**When to Use Sub-Tabs:**
- Related entity types (clients, team members, users)
- Different views of same data (list, grid, timeline)
- Progressive disclosure (basic, advanced, expert modes)

---

## API Route Patterns

### Unified Structure (From Phase 4)

**Routing Approach:**
```
/api/admin/entities/[type]/route.ts
├─ GET /api/admin/entities/users
├─ GET /api/admin/entities/clients
├─ GET /api/admin/entities/team-members
├─ GET /api/admin/entities/[type]/[id]
├─ POST /api/admin/entities/[type]
├─ PATCH /api/admin/entities/[type]/[id]
└─ DELETE /api/admin/entities/[type]/[id]
```

**Standard Query Parameters:**
```
?search=term
?filter.status=ACTIVE
?filter.tier=SMB
?limit=50
?offset=0
?sort=name
&order=asc
```

**Standard Response Format:**
```typescript
interface ListResponse<T> {
  data: T[]
  total: number
  limit: number
  offset: number
  search: string
  filters: Record<string, string>
}

interface SingleResponse<T> {
  data: T
  success: boolean
  message?: string
}
```

### When to Create New Routes

✅ Do create new routes for:
- New entity types
- Different access patterns (admin vs portal)
- Bulk operations on entities

❌ Don't create new routes for:
- One-off features (use existing routes + parameters)
- Minor variations of existing functionality

---

## TypeScript Type Patterns

### Base Entity Interface

```typescript
interface BaseEntity {
  id: string
  createdAt: Date
  updatedAt: Date
}

interface User extends BaseEntity {
  name: string
  email: string
  role: Role
  isActive: boolean
}

interface Client extends BaseEntity {
  name: string
  email: string
  company?: string
  tier: 'INDIVIDUAL' | 'SMB' | 'ENTERPRISE'
}
```

### Validation Schemas

Use Zod for validation:

```typescript
import { z } from 'zod'

export const UserSchema = z.object({
  name: z.string().min(1, 'Name required'),
  email: z.string().email('Valid email required'),
  role: z.enum(['ADMIN', 'USER', 'VIEWER']),
  isActive: z.boolean()
})

export type User = z.infer<typeof UserSchema>
```

### When to Create New Types

✅ Create new types for:
- Each entity type (User, Client, Team)
- API request/response shapes
- Component prop interfaces

❌ Don't create types for:
- Generic containers (use TypeScript's built-in)
- Single-use objects (inline is fine)

---

## State Management Pattern

### Context Providers (From Phase 4)

```typescript
interface UsersContextType {
  users: User[]
  loading: boolean
  refetchUsers: () => Promise<void>
  createUser: (data: UserData) => Promise<User>
  updateUser: (id: string, data: UserData) => Promise<User>
  deleteUser: (id: string) => Promise<void>
}

export const UsersContext = createContext<UsersContextType | undefined>(undefined)

export function UsersContextProvider({ children }: { children: React.ReactNode }) {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(false)

  const refetchUsers = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/users')
      setUsers(await res.json())
    } finally {
      setLoading(false)
    }
  }

  const value: UsersContextType = {
    users,
    loading,
    refetchUsers,
    // ... other methods
  }

  return (
    <UsersContext.Provider value={value}>
      {children}
    </UsersContext.Provider>
  )
}

export function useUsersContext() {
  const context = useContext(UsersContext)
  if (!context) throw new Error('useUsersContext must be used within provider')
  return context
}
```

**When to Use Context:**
✅ Use for shared state across multiple components in a page/tab  
❌ Don't use for single-component state (use useState)

---

## Performance Optimization Patterns

### Code Splitting & Lazy Loading

```typescript
// Good: Lazy load heavy modals
const CreateUserModal = dynamic(() => 
  import('@/components/admin/modals/CreateUserModal'),
  { loading: () => <Spinner /> }
)

// In component:
{isModalOpen && <CreateUserModal />}
```

### Memoization

```typescript
// Memoize expensive list filters
const filteredRows = useMemo(() => {
  return rows.filter(row => {
    const matchesSearch = matches(row.name)
    const matchesFilter = row.tier === values.tier
    return matchesSearch && matchesFilter
  })
}, [rows, search, values.tier])
```

### Virtual Scrolling

For lists with 1000+ items:
```typescript
import { FixedSizeList as List } from 'react-window'

<List
  height={600}
  itemCount={items.length}
  itemSize={50}
  width="100%"
>
  {({ index, style }) => (
    <div style={style}>{items[index].name}</div>
  )}
</List>
```

---

## Security Patterns

### Input Validation

```typescript
// Always validate on server
export async function POST(req: Request) {
  const data = await req.json()
  const validated = UserSchema.parse(data) // Throws if invalid
  // ... proceed with validated data
}

// Validate on client too (for UX)
const handleSubmit = async (data: UserData) => {
  const result = UserSchema.safeParse(data)
  if (!result.success) {
    setError(result.error.issues[0].message)
    return
  }
  // ... submit
}
```

### Authorization Checks

```typescript
// Server-side
export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  const session = await getSession(req)
  if (!session?.user?.permissions.includes('users:delete')) {
    return new Response('Forbidden', { status: 403 })
  }
  // ... delete
}

// Client-side (for UX only)
import { PermissionGate } from '@/components/PermissionGate'

<PermissionGate permission="users:delete">
  <button onClick={handleDelete}>Delete</button>
</PermissionGate>
```

---

## Testing Patterns

### E2E Test Template

```typescript
import { test, expect } from '@playwright/test'

test('can create new user', async ({ page }) => {
  await page.goto('/admin/users')
  
  // Click create button
  await page.click('button:has-text("Add User")')
  
  // Fill form
  await page.fill('input[name="email"]', 'test@example.com')
  await page.fill('input[name="name"]', 'Test User')
  
  // Submit
  await page.click('button:has-text("Create")')
  
  // Verify
  await expect(page.locator('text=User created successfully')).toBeVisible()
})
```

### Unit Test Template

```typescript
import { renderHook, act } from '@testing-library/react'
import { useListState } from '@/hooks/admin/useListState'

test('useListState works correctly', () => {
  const { result } = renderHook(() => useListState<string>([]))
  
  expect(result.current.loading).toBe(false)
  expect(result.current.rows).toEqual([])
  
  act(() => {
    result.current.setLoading(true)
    result.current.setRows(['item1', 'item2'])
  })
  
  expect(result.current.loading).toBe(true)
  expect(result.current.rows).toHaveLength(2)
})
```

---

## Accessibility Patterns

### Semantic HTML

```typescript
// Good
<nav role="tablist">
  <button role="tab" aria-selected={activeTab === 'users'}>
    Users
  </button>
</nav>

// Bad
<div className="tabs">
  <div className="tab-button">Users</div>
</div>
```

### ARIA Labels for Dynamic Content

```typescript
// For live region updates
<div role="status" aria-live="polite" aria-atomic="true">
  {loadingMessage}
</div>

// For form errors
<div role="alert">
  {error}
</div>
```

### Keyboard Navigation

```typescript
<select
  value={activeFilter}
  onChange={(e) => setFilter(e.target.value)}
  className="accessible-select"
>
  <option value="all">All Items</option>
  <option value="active">Active Only</option>
</select>
```

---

## Common Pitfalls & Solutions

### Pitfall 1: Generic EntityManager

❌ **Don't:**
```typescript
// Too generic, doesn't fit real needs
class EntityManager<T> {
  getEntities(type: string): Promise<T[]> { ... }
}
```

✅ **Do:**
```typescript
// Specialized services for each domain
class UserService {
  static getUsers(): Promise<User[]> { ... }
  static assignRole(userId: string, role: Role) { ... }
}

class ClientService {
  static getClients(): Promise<Client[]> { ... }
  static updateTier(clientId: string, tier: Tier) { ... }
}
```

### Pitfall 2: Props Drilling

❌ **Don't:**
```typescript
function Page({ users, loading, onUpdate, ... }) {
  return <Tab users={users} loading={loading} onUpdate={onUpdate} ... />
}
```

✅ **Do:**
```typescript
function Page() {
  return <UsersContextProvider><Tab /></UsersContextProvider>
}

function Tab() {
  const { users, loading, updateUser } = useUsersContext()
}
```

### Pitfall 3: Inconsistent API Patterns

❌ **Don't:**
```
GET /api/users (no pagination)
GET /api/clients?limit=10&offset=0 (has pagination)
```

✅ **Do:**
```
GET /api/entities/users?limit=50&offset=0
GET /api/entities/clients?limit=50&offset=0
// Same parameters for all
```

---

## Checklist: Building a New Admin Page

- [ ] Create entity service class (not generic manager)
- [ ] Define TypeScript types (User, Client, etc.)
- [ ] Create Zod validation schema
- [ ] Extract data loading to useListState + service
- [ ] Add search/filter with useListFilters
- [ ] Implement context provider for shared state
- [ ] Create sub-components for modals/forms
- [ ] Add error handling and loading states
- [ ] Write E2E tests for happy paths
- [ ] Verify accessibility (WCAG 2.1 AA)
- [ ] Add TypeScript strict mode ✓
- [ ] Document any specialized patterns used
- [ ] Review with team before deployment

---

## Quick Reference: When to Use What

| Need | Pattern | File | Example |
|------|---------|------|---------|
| **List state** | `useListState<T>` | `src/hooks/admin/` | EntitiesTab |
| **Filtering** | `useListFilters` | `src/hooks/admin/` | ClientsListEmbedded |
| **Domain logic** | Specialized Service | `src/services/` | UserService |
| **Page layout** | Tab-based architecture | `src/app/admin/` | EnterpriseUsersPage |
| **Type safety** | Zod schema | `src/schemas/` | UserSchema |
| **Shared state** | Context provider | `src/contexts/` | UsersContextProvider |
| **Heavy components** | Dynamic import | Modals/drawers | CreateUserModal |
| **Large lists** | Virtual scrolling | 1000+ items | If needed |

---

## Additional Resources

- **Phase 4 Documentation**: `docs/PHASE_4_IMPLEMENTATION_GUIDE.md`
- **RBAC Consolidation**: `docs/ADMIN_UNIFIED_RBAC_CONSOLIDATION_PLAN.md`
- **Accessibility Guide**: `docs/ACCESSIBILITY_AUDIT.md`
- **Performance Optimization**: `docs/PHASE_4a_PERFORMANCE_OPTIMIZATION_GUIDE.md`

---

## Next Steps

When building a new admin feature:
1. Review this guide and the Phase 4 implementation
2. Choose the right pattern (service vs context vs hook)
3. Follow the checklist above
4. Get code review from team lead
5. Run through accessibility tests

---

**Last Updated:** January 2025  
**Maintainer:** Engineering Team  
**Status:** ✅ Production Patterns - Ready for Use
