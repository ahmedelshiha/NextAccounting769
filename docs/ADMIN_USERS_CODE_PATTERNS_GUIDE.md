# Admin Users - Code Patterns & Best Practices Guide

**Purpose:** Reference guide for consistent code patterns used throughout the Admin Users Dashboard  
**Version:** 1.0  
**Last Updated:** January 2025  

---

## 📋 Table of Contents

1. [Context Pattern](#context-pattern)
2. [Custom Hook Patterns](#custom-hook-patterns)
3. [Component Patterns](#component-patterns)
4. [Data Fetching Patterns](#data-fetching-patterns)
5. [State Management Patterns](#state-management-patterns)
6. [Filtering & Search Patterns](#filtering--search-patterns)
7. [Error Handling Patterns](#error-handling-patterns)
8. [Performance Patterns](#performance-patterns)
9. [Testing Patterns](#testing-patterns)

---

## 🏗️ Context Pattern

### Multi-Context Provider Pattern

**Location:** `src/app/admin/users/contexts/UsersContextProvider.tsx`

**Purpose:** Compose multiple related contexts into a single unified interface

**Pattern:**
```typescript
// Step 1: Define individual context interfaces
interface UserDataContextType { ... }
interface UserUIContextType { ... }
interface UserFilterContextType { ... }

// Step 2: Create individual contexts
const UserDataContext = createContext<UserDataContextType | undefined>(undefined)
const UserUIContext = createContext<UserUIContextType | undefined>(undefined)
const UserFilterContext = createContext<UserFilterContextType | undefined>(undefined)

// Step 3: Create individual providers
function UserDataContextProvider({ children }: Props) { ... }
function UserUIContextProvider({ children }: Props) { ... }
function UserFilterContextProvider({ children }: Props) { ... }

// Step 4: Create unified interface combining all three
interface UsersContextType extends 
  UserDataContextType, 
  UserUIContextType, 
  UserFilterContextType { 
    // Additional computed properties
    filteredUsers: UserItem[]
  }

// Step 5: Compose into single provider
export function UsersContextProvider({ children, initialUsers, initialStats }: Props) {
  return (
    <UserDataContextProvider initialData={initialData}>
      <UserUIContextProvider>
        <UserFilterContextProvider>
          {children}
        </UserFilterContextProvider>
      </UserUIContextProvider>
    </UserDataContextProvider>
  )
}

// Step 6: Create unified hook for backward compatibility
export function useUsersContext(): UsersContextType {
  const data = useContext(UserDataContext)
  const ui = useContext(UserUIContext)
  const filters = useContext(UserFilterContext)
  
  if (!data || !ui || !filters) {
    throw new Error('useUsersContext must be used within UsersContextProvider')
  }
  
  return { ...data, ...ui, ...filters, filteredUsers: ... }
}
```

**When to Use:**
✅ Multiple related state concerns (data, UI, filters)  
✅ Want unified interface without deeply nested providers  
✅ Need backward compatibility with existing code  

**Benefits:**
- Single `useUsersContext()` hook instead of 3
- Easy to understand dependencies
- Flexible composition
- Testable individual contexts

---

## 🪝 Custom Hook Patterns

### 1. Service-Based Data Fetching Hook

**Location:** `src/app/admin/users/hooks/useUnifiedUserService.ts`

**Pattern:**
```typescript
interface UseServiceOptions {
  enabled?: boolean
  debounceMs?: number
  retryCount?: number
  timeoutMs?: number
}

interface UseServiceReturn<T> {
  data: T | null
  isLoading: boolean
  isError: boolean
  error: Error | null
  refetch: () => Promise<void>
}

export function useUnifiedUserService<T>(
  request: () => Promise<T>,
  options: UseServiceOptions = {}
): UseServiceReturn<T> {
  const [state, setState] = useState<UseServiceReturn<T>>({
    data: null,
    isLoading: true,
    isError: false,
    error: null,
    refetch: async () => {}
  })

  // Deduplication: Single request per component lifecycle
  const requestRef = useRef<Promise<T> | null>(null)
  
  // Caching: 30-second TTL with timestamp validation
  const cacheRef = useRef<{ data: T; timestamp: number } | null>(null)
  
  // Timeout handling
  const abortControllerRef = useRef<AbortController | null>(null)

  const fetchData = useCallback(async () => {
    // Check cache first
    if (cacheRef.current) {
      const age = Date.now() - cacheRef.current.timestamp
      if (age < 30000) {
        setState(s => ({ ...s, data: cacheRef.current.data, isLoading: false }))
        return
      }
    }

    // Prevent duplicate requests
    if (requestRef.current) {
      return requestRef.current
    }

    setState(s => ({ ...s, isLoading: true }))
    abortControllerRef.current = new AbortController()

    try {
      const timeoutId = setTimeout(
        () => abortControllerRef.current?.abort(),
        options.timeoutMs || 30000
      )

      const data = await Promise.race([
        request(),
        new Promise<T>((_, reject) => 
          setTimeout(() => reject(new Error('Request timeout')), options.timeoutMs || 30000)
        )
      ])

      clearTimeout(timeoutId)
      cacheRef.current = { data, timestamp: Date.now() }
      setState({ data, isLoading: false, isError: false, error: null, refetch: fetchData })
    } catch (error) {
      setState(s => ({ 
        ...s, 
        isError: true, 
        error: error as Error, 
        isLoading: false 
      }))
    } finally {
      requestRef.current = null
    }
  }, [request, options])

  useEffect(() => {
    if (options.enabled !== false) {
      fetchData()
    }
  }, [options.enabled, fetchData])

  return { ...state, refetch: fetchData }
}
```

**When to Use:**
✅ API data fetching with caching requirements  
✅ Need request deduplication  
✅ Want timeout and retry logic  

**Benefits:**
- Single source of truth for fetch logic
- Built-in caching and deduplication
- Type-safe with TypeScript
- Composable with other hooks

---

### 2. Filter Hook Pattern

**Location:** `src/app/admin/users/hooks/useFilterUsers.ts`

**Pattern:**
```typescript
interface FilterConfig {
  search?: string
  role?: string
  status?: string
  department?: string
}

export function useFilterUsers(
  items: UserItem[],
  filters: FilterConfig,
  options?: { immediate?: boolean }
): UserItem[] {
  return useMemo(() => {
    let result = items

    // Search filter
    if (filters.search?.trim()) {
      const q = filters.search.toLowerCase()
      result = result.filter(item =>
        item.name?.toLowerCase().includes(q) ||
        item.email.toLowerCase().includes(q) ||
        item.company?.toLowerCase().includes(q)
      )
    }

    // Role filter
    if (filters.role && filters.role !== 'ALL') {
      result = result.filter(item => item.role === filters.role)
    }

    // Status filter
    if (filters.status && filters.status !== 'ALL') {
      result = result.filter(item => item.status === filters.status)
    }

    // Department filter
    if (filters.department) {
      result = result.filter(item => item.department === filters.department)
    }

    // Sort by creation date (newest first)
    return result.sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )
  }, [items, filters])
}
```

**When to Use:**
✅ Client-side filtering on small-medium datasets  
✅ Want cached filter results  
✅ Multiple filter dimensions  

**Benefits:**
- Computed only when inputs change
- No API calls needed
- Fast for <5000 items
- Extensible for new filters

---

### 3. Form State Hook Pattern

**Location:** `src/app/admin/users/hooks/useEntityForm.ts`

**Pattern:**
```typescript
interface FormFieldError {
  message: string
  code: string
}

interface UseFormState<T> {
  values: T
  errors: Record<keyof T, FormFieldError | null>
  touched: Record<keyof T, boolean>
  isSubmitting: boolean
  isDirty: boolean
}

interface UseFormReturn<T> extends UseFormState<T> {
  setField: (field: keyof T, value: unknown) => void
  setFieldError: (field: keyof T, error: FormFieldError | null) => void
  setFieldTouched: (field: keyof T, touched: boolean) => void
  resetForm: () => void
  submitForm: (onSubmit: (values: T) => Promise<void>) => Promise<void>
}

export function useEntityForm<T extends Record<string, unknown>>(
  initialValues: T,
  validators?: Record<keyof T, (value: unknown) => FormFieldError | null>
): UseFormReturn<T> {
  const [values, setValues] = useState<T>(initialValues)
  const [errors, setErrors] = useState<Record<keyof T, FormFieldError | null>>({} as any)
  const [touched, setTouched] = useState<Record<keyof T, boolean>>({} as any)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const setField = useCallback((field: keyof T, value: unknown) => {
    setValues(v => ({ ...v, [field]: value }))
    
    // Validate if validator exists
    if (validators?.[field]) {
      const error = validators[field](value)
      setErrors(e => ({ ...e, [field]: error }))
    }
  }, [validators])

  const isDirty = useMemo(() => 
    JSON.stringify(values) !== JSON.stringify(initialValues),
    [values, initialValues]
  )

  return {
    values,
    errors,
    touched,
    isSubmitting,
    isDirty,
    setField,
    setFieldError: (field, error) => setErrors(e => ({ ...e, [field]: error })),
    setFieldTouched: (field, isTouched) => setTouched(t => ({ ...t, [field]: isTouched })),
    resetForm: () => {
      setValues(initialValues)
      setErrors({} as any)
      setTouched({} as any)
    },
    submitForm: async (onSubmit) => {
      setIsSubmitting(true)
      try {
        await onSubmit(values)
      } finally {
        setIsSubmitting(false)
      }
    }
  }
}
```

**When to Use:**
✅ Multi-field forms with validation  
✅ Need touched/dirty state tracking  
✅ Form submission handling  

**Benefits:**
- Consistent form behavior
- Built-in field validation
- Automatic dirty detection
- Error state management

---

## 🎨 Component Patterns

### 1. Memoized List Component Pattern

**Location:** `src/app/admin/users/components/UsersTable.tsx`

**Pattern:**
```typescript
// Separate skeleton component for loading state
const UserRowSkeleton = memo(function UserRowSkeleton() {
  return (
    <div className="animate-pulse flex items-center gap-4 p-4">
      <div className="w-10 h-10 bg-gray-200 rounded-full" />
      <div className="space-y-2 flex-1">
        <div className="h-4 bg-gray-200 rounded w-32" />
        <div className="h-3 bg-gray-200 rounded w-48" />
      </div>
    </div>
  )
})

// Separate row component for fine-grained memoization
interface UserRowProps {
  user: UserItem
  isSelected?: boolean
  onSelect?: (selected: boolean) => void
  onViewProfile?: () => void
  onRoleChange?: (newRole: string) => Promise<void>
}

const UserRow = memo(function UserRow({
  user,
  isSelected,
  onSelect,
  onViewProfile,
  onRoleChange
}: UserRowProps) {
  const handleRoleChange = useCallback((newRole: string) => {
    onRoleChange?.(newRole).catch(console.error)
  }, [onRoleChange])

  return (
    <div className="flex items-center justify-between p-4 border-b hover:bg-gray-50">
      {/* Row content */}
    </div>
  )
})

// Main list component
interface UsersTableProps {
  users: UserItem[]
  isLoading?: boolean
  onViewProfile: (user: UserItem) => void
  onRoleChange?: (userId: string, role: string) => Promise<void>
}

export const UsersTable = memo(function UsersTable({
  users,
  isLoading = false,
  onViewProfile,
  onRoleChange
}: UsersTableProps) {
  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <UserRowSkeleton key={i} />
        ))}
      </div>
    )
  }

  // Empty state
  if (users.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        No users found
      </div>
    )
  }

  // List
  return (
    <div className="border rounded-lg">
      {users.map(user => (
        <UserRow
          key={user.id}
          user={user}
          onViewProfile={() => onViewProfile(user)}
          onRoleChange={(newRole) => onRoleChange?.(user.id, newRole)}
        />
      ))}
    </div>
  )
})

UsersTable.displayName = 'UsersTable'
```

**When to Use:**
✅ Lists with >50 items  
✅ Complex row components  
✅ Need fine-grained re-render control  

**Benefits:**
- Prevents unnecessary re-renders
- Individual row updates don't affect entire list
- Better performance with large datasets
- Clear loading/empty states

---

### 2. Modal/Dialog Component Pattern

**Location:** `src/app/admin/users/components/UserProfileDialog/index.tsx`

**Pattern:**
```typescript
interface UserProfileDialogProps {
  user: UserItem | null
  isOpen: boolean
  onClose: () => void
  onSave?: (user: Partial<UserItem>) => Promise<void>
}

export function UserProfileDialog({
  user,
  isOpen,
  onClose,
  onSave
}: UserProfileDialogProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'details' | 'activity' | 'settings'>('overview')
  const [isSaving, setIsSaving] = useState(false)

  const handleSave = useCallback(async (updates: Partial<UserItem>) => {
    if (!onSave) return
    setIsSaving(true)
    try {
      await onSave(updates)
    } finally {
      setIsSaving(false)
    }
  }, [onSave])

  if (!user) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{user.name || 'User Profile'}</DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={(v: any) => setActiveTab(v)}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="activity">Activity</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <OverviewTab user={user} />
          </TabsContent>

          <TabsContent value="details">
            <DetailsTab user={user} onSave={handleSave} isSaving={isSaving} />
          </TabsContent>

          <TabsContent value="activity">
            <ActivityTab user={user} />
          </TabsContent>

          <TabsContent value="settings">
            <SettingsTab user={user} onSave={handleSave} isSaving={isSaving} />
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Close</Button>
          {/* Additional actions */}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
```

**When to Use:**
✅ Complex multi-step forms  
✅ Modal content with multiple views  
✅ Need tab navigation in dialogs  

**Benefits:**
- Organized complex UI
- Clear separation of concerns
- Reusable tab components
- Easy to test individual tabs

---

## 📡 Data Fetching Patterns

### Server-Side Data Fetching Pattern

**Location:** `src/app/admin/users/layout.tsx`

**Pattern:**
```typescript
// server.ts - Server functions
export async function fetchUsersServerSide(
  page: number,
  limit: number,
  tenantId: string
): Promise<{ users: UserItem[]; total: number }> {
  try {
    // Validate tenant
    if (!tenantId) {
      throw new Error('Invalid tenant context')
    }

    // Query database
    const users = await db.user.findMany({
      where: { tenantId },
      take: limit,
      skip: (page - 1) * limit,
      orderBy: { createdAt: 'desc' }
    })

    const total = await db.user.count({ where: { tenantId } })

    return { users, total }
  } catch (error) {
    console.error('Failed to fetch users:', error)
    throw error
  }
}

// layout.tsx - Server component
export default async function UsersLayout({ children }: Props) {
  // Extract tenant from session (not context)
  const session = await getSessionOrBypass()
  if (!session?.user) redirect('/login')

  const tenantId = (session.user as any)?.tenantId as string

  // Fetch in parallel
  const [usersData, statsData] = await Promise.all([
    fetchUsersServerSide(1, 50, tenantId),
    fetchStatsServerSide(tenantId)
  ])

  // Pass to client provider
  return (
    <UsersContextProvider
      initialUsers={usersData.users}
      initialStats={statsData}
    >
      {children}
    </UsersContextProvider>
  )
}
```

**Pattern Benefits:**
✅ Data in HTML from first request  
✅ No API calls from browser  
✅ Faster Time to First Byte (TTFB)  
✅ No loading skeletons for initial data  

---

### Client-Side Data Fetching Pattern

**Location:** `src/app/admin/users/hooks/useServerSideFiltering.ts`

**Pattern:**
```typescript
interface ServerFilterOptions {
  enabled?: boolean
  debounceMs?: number
}

export function useServerSideFiltering(
  filters: UserFilters,
  options: ServerFilterOptions = {}
) {
  const [data, setData] = useState<UserItem[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  // Debounce API calls
  const debouncedSearch = useDebouncedValue(filters, options.debounceMs || 300)

  useEffect(() => {
    if (options.enabled === false) return

    const fetchFiltered = async () => {
      setIsLoading(true)
      try {
        const response = await fetch('/api/admin/users/search', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(debouncedSearch)
        })

        if (!response.ok) throw new Error('Failed to fetch')

        const result = await response.json()
        setData(result.users)
        setError(null)
      } catch (err) {
        setError(err as Error)
        setData([])
      } finally {
        setIsLoading(false)
      }
    }

    fetchFiltered()
  }, [debouncedSearch, options.enabled])

  return { data, isLoading, error }
}
```

**Pattern Benefits:**
✅ Debounces API calls  
✅ Server handles complex filtering  
✅ Scales to 1000+ items  
✅ Proper error handling  

---

## 🔄 State Management Patterns

### Combined State Update Pattern

**Pattern:**
```typescript
// Before: Multiple state updates
setSearch(newSearch)
setRole(newRole)
setStatus(newStatus)
setPage(1) // Reset pagination

// After: Single batch update
setFilters({
  search: newSearch,
  role: newRole,
  status: newStatus,
  page: 1
})
```

### Computed State Pattern

**Pattern:**
```typescript
// Instead of storing computed values, derive them
const filteredUsers = useMemo(() => {
  return users.filter(u => matchesFilter(u, filters))
}, [users, filters])

const hasActiveFilters = useMemo(() => {
  return filters.search || filters.role !== 'ALL'
}, [filters])

const selectedCount = useMemo(() => {
  return selectedUserIds.size
}, [selectedUserIds])
```

**Benefits:**
- Single source of truth
- Always in sync
- Easier to reason about
- Better performance

---

## 🔍 Filtering & Search Patterns

### Hybrid Filtering Strategy

**Pattern:**
```typescript
// Use client-side filtering for initial load
const clientFiltered = useFilterUsers(users, filters)

// Use server-side filtering for active filters
const serverFiltered = useServerSideFiltering(
  filters,
  { enabled: hasActiveFilters, debounceMs: 300 }
)

// Choose based on context
const hasActiveFilters = Boolean(
  filters.search || filters.role !== 'ALL'
)
const filteredUsers = hasActiveFilters ? 
  serverFiltered.data : 
  clientFiltered
```

**Benefits:**
✅ Fast initial load (client-side)  
✅ Scalable filtering (server-side)  
✅ Smooth UX with debouncing  

---

### Advanced Filter UI Pattern

**Location:** `src/app/admin/users/components/AdvancedUserFilters.tsx`

**Pattern:**
```typescript
export interface UserFilters {
  search: string
  role?: string
  status?: string
  department?: string
  dateRange?: 'all' | 'today' | 'week' | 'month'
}

interface AdvancedUserFiltersProps {
  filters: UserFilters
  onFiltersChange: (filters: UserFilters) => void
  onReset?: () => void
}

export function AdvancedUserFilters({
  filters,
  onFiltersChange,
  onReset
}: AdvancedUserFiltersProps) {
  const isMobile = useMediaQuery('(max-width: 768px)')

  // Count active filters
  const activeFilterCount = [
    filters.search ? 1 : 0,
    filters.role ? 1 : 0,
    filters.status ? 1 : 0,
    filters.department ? 1 : 0
  ].reduce((a, b) => a + b, 0)

  // Mobile: collapsible, Desktop: always visible
  return (
    <Collapsible open={!isMobile} onOpenChange={setOpen}>
      <CollapsibleTrigger asChild>
        <Button variant="ghost">
          🔍 Filters {activeFilterCount > 0 && `(${activeFilterCount})`}
        </Button>
      </CollapsibleTrigger>

      <CollapsibleContent>
        {/* Filter controls */}
      </CollapsibleContent>
    </Collapsible>
  )
}
```

**Benefits:**
- Responsive on mobile
- Shows active filter count
- Easy to clear all
- Accessible

---

## ⚠️ Error Handling Patterns

### Try-Catch with User Feedback

**Pattern:**
```typescript
const handleAction = async () => {
  try {
    setIsLoading(true)
    await performAction()
    toast.success('Action completed successfully')
  } catch (error) {
    const message = error instanceof Error 
      ? error.message 
      : 'Unknown error occurred'
    
    toast.error(message)
    console.error('Action failed:', error)
  } finally {
    setIsLoading(false)
  }
}
```

### Error Boundary Pattern

**Pattern:**
```typescript
import { ErrorBoundary } from '@/components/providers/error-boundary'

export function Page() {
  return (
    <div className="space-y-6">
      <ErrorBoundary fallback={<DashboardErrorCard />}>
        <DashboardSection />
      </ErrorBoundary>

      <ErrorBoundary fallback={<TableErrorCard />}>
        <UsersTable />
      </ErrorBoundary>
    </div>
  )
}
```

**Benefits:**
- Isolated error scopes
- Prevents full page crashes
- User-friendly error messages
- Easy debugging

---

## ⚡ Performance Patterns

### 1. Code Splitting Pattern

**Pattern:**
```typescript
// Static import for frequently used components
import { ExecutiveDashboardTab } from './components/tabs/ExecutiveDashboardTab'

// Dynamic import for less-used components
const WorkflowsTab = lazy(() =>
  import('./components/tabs/WorkflowsTab')
    .then(m => ({ default: m.WorkflowsTab }))
)

// Usage with Suspense
<Suspense fallback={<TabSkeleton />}>
  <WorkflowsTab />
</Suspense>
```

**Impact:** 40KB bundle reduction (code splitting)

---

### 2. Memoization Pattern

**Pattern:**
```typescript
// Memoize expensive computations
const expensiveValue = useMemo(() => {
  return complexCalculation(data)
}, [data])

// Memoize callback references
const handleChange = useCallback((value) => {
  performAction(value)
}, [performAction])

// Memoize entire components
const UserRow = memo(({ user, ...props }: Props) => {
  return <div>{user.name}</div>
})
```

**Benefits:**
- Prevents unnecessary re-computations
- Prevents unnecessary re-renders
- Improves perceived performance
- Essential for lists with 100+ items

---

### 3. Virtual Scrolling Pattern (Future)

**Pattern (Ready for Implementation):**
```typescript
import { FixedSizeList as List } from 'react-window'

<List
  height={600}
  itemCount={users.length}
  itemSize={60}
  width="100%"
>
  {({ index, style }) => (
    <div style={style}>
      <UserRow user={users[index]} />
    </div>
  )}
</List>
```

**When to Use:**
✅ Lists with 500+ items  
✅ Virtualization reduces DOM nodes from 500 to ~10  

---

## 🧪 Testing Patterns

### Component Testing Pattern

**Pattern:**
```typescript
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

describe('UsersTable', () => {
  it('renders user list', () => {
    const users = [
      { id: '1', name: 'John', email: 'john@example.com' }
    ]

    render(
      <UsersTable users={users} onViewProfile={vi.fn()} />
    )

    expect(screen.getByText('John')).toBeInTheDocument()
  })

  it('calls onViewProfile when user clicks row', async () => {
    const user = { id: '1', name: 'John', email: 'john@example.com' }
    const handleViewProfile = vi.fn()

    render(
      <UsersTable users={[user]} onViewProfile={handleViewProfile} />
    )

    await userEvent.click(screen.getByText('John'))
    expect(handleViewProfile).toHaveBeenCalledWith(user)
  })

  it('shows loading skeleton', () => {
    render(
      <UsersTable users={[]} isLoading onViewProfile={vi.fn()} />
    )

    expect(screen.getByRole('status')).toBeInTheDocument()
  })

  it('shows empty state', () => {
    render(
      <UsersTable users={[]} onViewProfile={vi.fn()} />
    )

    expect(screen.getByText('No users found')).toBeInTheDocument()
  })
})
```

### Hook Testing Pattern

**Pattern:**
```typescript
import { renderHook, act } from '@testing-library/react'

describe('useFilterUsers', () => {
  it('filters by search term', () => {
    const users = [
      { id: '1', name: 'John', email: 'john@example.com' },
      { id: '2', name: 'Jane', email: 'jane@example.com' }
    ]

    const { result } = renderHook(() =>
      useFilterUsers(users, { search: 'john' })
    )

    expect(result.current).toHaveLength(1)
    expect(result.current[0].name).toBe('John')
  })

  it('returns all users when no filters', () => {
    const users = [
      { id: '1', name: 'John' },
      { id: '2', name: 'Jane' }
    ]

    const { result } = renderHook(() =>
      useFilterUsers(users, {})
    )

    expect(result.current).toHaveLength(2)
  })
})
```

---

## 📚 Summary: Pattern Quick Reference

| Pattern | File | Use Case |
|---------|------|----------|
| Multi-Context | UsersContextProvider.tsx | Multiple related concerns |
| Service Hook | useUnifiedUserService.ts | API data fetching |
| Filter Hook | useFilterUsers.ts | Client-side filtering |
| Form Hook | useEntityForm.ts | Multi-field forms |
| Memoized List | UsersTable.tsx | Performance optimization |
| Modal Dialog | UserProfileDialog/ | Complex multi-step UI |
| Server Fetch | layout.tsx | Initial data loading |
| Client Fetch | useServerSideFiltering.ts | Dynamic filtering |
| Hybrid Filtering | ExecutiveDashboardTab.tsx | Best of both worlds |
| Error Handling | hooks/*.ts | User feedback |
| Code Splitting | EnterpriseUsersPage.tsx | Bundle optimization |
| Testing | __tests__/ | Quality assurance |

---

## 🎓 Best Practices Checklist

When creating new features, ensure:

- [ ] **State Management**: Use appropriate context/hook pattern
- [ ] **Performance**: Memoize expensive computations and components
- [ ] **Types**: Strong TypeScript types, avoid `any` casts
- [ ] **Error Handling**: Try-catch with user-friendly messages
- [ ] **Accessibility**: ARIA labels, keyboard navigation, color contrast
- [ ] **Testing**: Unit tests + E2E tests + a11y tests
- [ ] **Documentation**: JSDoc comments on complex functions
- [ ] **Responsive**: Mobile-first design, media queries
- [ ] **Naming**: Descriptive component/variable names
- [ ] **Reusability**: Extract common patterns into utilities

---

## 🔗 Related Files

- Code: `src/app/admin/users/`
- Tests: `src/app/admin/users/__tests__/`
- Components: `src/app/admin/users/components/`
- Hooks: `src/app/admin/users/hooks/`
- Contexts: `src/app/admin/users/contexts/`

