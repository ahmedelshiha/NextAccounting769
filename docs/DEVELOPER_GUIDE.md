# Developer Onboarding Guide

**For**: New developers joining the Portal-Admin Integration project  
**Duration**: 3-4 hours to read completely  
**Last Updated**: November 2024

---

## Table of Contents

1. [Quick Start (15 minutes)](#quick-start)
2. [Project Structure](#project-structure)
3. [Code Patterns & Conventions](#code-patterns--conventions)
4. [Working with Shared Code](#working-with-shared-code)
5. [Creating Features](#creating-features)
6. [Testing Guidelines](#testing-guidelines)
7. [Common Tasks](#common-tasks)
8. [Troubleshooting](#troubleshooting)
9. [Resources](#resources)

---

## Quick Start

### Get Your Environment Running (5 min)

```bash
# 1. Clone repository
git clone <repo-url>
cd <project-dir>

# 2. Install dependencies
npm install
# or
pnpm install

# 3. Setup environment variables
cp .env.example .env.local
# Edit .env.local with your values

# 4. Setup database
npx prisma migrate dev
npx prisma db seed

# 5. Start development server
npm run dev
# Application available at http://localhost:3000
```

### Verify Setup (10 min)

```bash
# Check TypeScript
npm run type-check

# Run linting
npm run lint

# Run tests
npm run test

# Run build
npm run build

# If all pass, you're good to go! ✅
```

### Make Your First Change (5 min)

```bash
# 1. Create a feature branch
git checkout -b feat/your-feature-name

# 2. Make a small change (e.g., add a console.log)
# 3. Test it
npm run test
npm run type-check

# 4. Commit
git add .
git commit -m "feat: describe your change"

# 5. Push
git push origin feat/your-feature-name
```

---

## Project Structure

### High-Level Organization

```
project/
├── src/
│   ├── app/                    ← Next.js pages and routes
│   │   ├── api/               ← API endpoints
│   │   ├── admin/             ← Admin pages
│   │   ├── portal/            ← Client portal pages
│   │   └── ...
│   ├── components/            ← React components
│   │   ├── shared/            ← Reusable components (15+)
│   │   ├── admin/             ← Admin-only components
│   │   ├── portal/            ← Portal-only components
│   │   └── ui/                ← shadcn/ui components
│   ├── hooks/                 ← React hooks
│   │   ├── shared/            ← Shared hooks (18+)
│   │   └── ...
│   ├── lib/                   ← Utilities & helpers
│   │   ├── shared/            ← Shared utilities
│   │   ├── auth-middleware.ts ← API auth helpers
│   │   ├── api-response.ts    ← Standard response format
│   │   ├── permissions.ts     ← RBAC utilities
│   │   └── ...
│   ├── types/                 ← TypeScript type definitions
│   │   ├── shared/            ← Shared entity types
│   │   └── ...
│   ├── schemas/               ← Zod validation schemas
│   │   ├── shared/            ← Shared schemas
│   │   └── ...
│   └── ...
├── tests/                     ← Integration/E2E tests
├── e2e/                       ← Playwright E2E tests
├── prisma/                    ← Database schema & migrations
├── templates/                 ← Code generation templates
├── docs/                      ← Documentation
│   ├── DEVELOPER_GUIDE.md     ← This file
│   ├── portal/                ← Feature documentation
│   └── api/                   ← API documentation
├── .env.example               ← Environment variables template
├── package.json
├── tsconfig.json
├── eslint.config.mjs
└── vitest.config.ts
```

### Key Directories Explained

| Directory | Purpose | Typical Files |
|-----------|---------|---|
| `src/app/api/` | API endpoints | `GET`, `POST`, `PUT`, `DELETE` handlers |
| `src/components/shared/` | Reusable UI components | `ServiceCard`, `BookingForm`, etc. |
| `src/hooks/shared/` | Reusable React hooks | `useServices`, `useBookings`, etc. |
| `src/lib/shared/` | Shared utilities | formatters, validators, transformers |
| `src/types/shared/` | TypeScript types | Entity types, API types |
| `src/schemas/shared/` | Zod validation | Create/Update/Filter schemas |
| `prisma/` | Database | Schema, migrations, seed script |
| `tests/` | Integration tests | Complex scenario testing |
| `e2e/` | E2E tests | Full user workflows |
| `docs/` | Documentation | Guides, architecture, features |
| `templates/` | Code scaffolding | Component, hook, API templates |

---

## Code Patterns & Conventions

### 1. Components

**Location**: `src/components/shared/`

**Pattern**: All components follow this structure:
- Props interface with JSDoc
- Dual variant support (portal/admin)
- Permission checks with `usePermissions()`
- Loading/error states
- TypeScript generics for data

**Example**:
```tsx
interface ServiceCardProps {
  service: Service
  variant?: 'portal' | 'admin'
  onEdit?: () => void
  loading?: boolean
  error?: string | null
}

export function ServiceCard({
  service,
  variant = 'portal',
  onEdit,
  loading = false,
  error = null,
}: ServiceCardProps) {
  const { can } = usePermissions()

  if (loading) return <div>Loading...</div>
  if (error) return <div>Error: {error}</div>

  if (variant === 'admin' && can('service:edit')) {
    return <div>{/* Admin content */}</div>
  }

  return <div>{/* Portal content */}</div>
}
```

**When to create shared components**:
- ✅ Used in both portal and admin areas
- ✅ Reusable for multiple features
- ✅ Complex enough to justify extraction
- ❌ Not specific to one area

### 2. Hooks

**Location**: `src/hooks/shared/`

**Pattern**: SWR-based data fetching with filters
- Takes optional filters parameter
- Returns `{ data, error, isLoading, mutate, hasMore, total }`
- Memoized for performance
- Supports pagination and filtering

**Example**:
```ts
export function useServices(filters: ServiceFilters = {}) {
  const { data, error, mutate } = useSWR(
    `/api/services?${buildQuery(filters)}`,
    apiFetch,
    { revalidateOnFocus: false, dedupingInterval: 30000 }
  )

  return useMemo(() => ({
    data: data?.data || [],
    error,
    isLoading: !data && !error,
    mutate,
    hasMore: data?.meta?.hasMore || false,
    total: data?.meta?.total || 0,
  }), [data, error, mutate])
}
```

**Hook naming convention**:
- `useData()` - Fetch data
- `useFilters()` - Manage filters
- `usePermissions()` - Check permissions
- `useFormState()` - Form management

### 3. API Routes

**Location**: `src/app/api/`

**Pattern**: Unified endpoints with role-based filtering
- Use `withTenantAuth` middleware
- Validate input with Zod schemas
- Return standard response format
- Handle all error cases

**Example**:
```ts
import { withTenantAuth } from '@/lib/auth-middleware'
import { respond } from '@/lib/api-response'

export const GET = withTenantAuth(async (request) => {
  try {
    const services = await prisma.service.findMany({
      where: { tenantId: request.tenantId },
    })
    return respond.ok({ data: services })
  } catch (error) {
    return respond.serverError('Failed to fetch services')
  }
})

export const POST = withTenantAuth(async (request) => {
  try {
    const body = await request.json()
    const validated = ServiceCreateSchema.parse(body)
    
    const service = await prisma.service.create({
      data: { ...validated, tenantId: request.tenantId },
    })
    
    return respond.created(service)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return respond.badRequest('Invalid input', error.errors)
    }
    return respond.serverError()
  }
})
```

### 4. Types & Schemas

**Location**: `src/types/shared/` and `src/schemas/shared/`

**Pattern**: Shared type definitions + Zod schemas
- Define once, use everywhere
- Zod schemas auto-generate TypeScript types
- Separate Create/Update/Filter variants

**Example**:
```ts
// Define schema
const ServiceCreateSchema = z.object({
  name: z.string().min(1),
  price: z.number().positive().optional(),
  duration: z.number().positive(),
})

// Auto-generate type
type ServiceCreate = z.infer<typeof ServiceCreateSchema>

// Use in component
const handleCreate = (data: ServiceCreate) => {
  // data is fully typed
}
```

### 5. Permissions

**Pattern**: Role-based access control with fine-grained checks
- Use `usePermissions()` in components
- Use `withAdminAuth` for admin endpoints
- Use `withPermissionAuth` for fine-grained control

**Example**:
```tsx
// In component
const { can } = usePermissions()
if (!can('service:delete')) {
  return <div>No permission</div>
}

// In API route
export const DELETE = withAdminAuth(async (request) => {
  if (request.userRole !== 'ADMIN') {
    return respond.forbidden()
  }
  // ...
})
```

### 6. Error Handling

**Pattern**: Standard error responses
- Use `respond` helper for consistent format
- Validate all inputs
- Handle permissions, not found, validation errors

**Example**:
```ts
import { respond } from '@/lib/api-response'

// In API route
try {
  const data = await fetch(...)
  return respond.ok(data)
} catch (error) {
  if (error instanceof z.ZodError) {
    return respond.badRequest('Invalid input', error.errors)
  }
  return respond.serverError('Failed to process request')
}
```

---

## Working with Shared Code

### Using Shared Components

```tsx
// Import from shared library
import { ServiceCard } from '@/components/shared'
import { BookingForm } from '@/components/shared'

// Use with variant
<ServiceCard 
  service={service} 
  variant="admin"
  onEdit={handleEdit}
/>

// Or portal variant
<ServiceCard 
  service={service} 
  variant="portal"
  onSelect={handleSelect}
/>
```

### Using Shared Hooks

```tsx
// Data fetching hook
const { data: services, isLoading, error } = useServices({
  category: 'consulting',
  limit: 20
})

// State management hook
const { filters, addFilter, clearFilters } = useFilters({
  search: '',
  status: 'ACTIVE',
})

// Permission hook
const { can } = usePermissions()
if (can('service:edit')) {
  // Show edit button
}
```

### Using Shared Types

```tsx
import type { Service, Booking, Task } from '@/types/shared'

// Types automatically available
const service: Service = {
  id: '1',
  name: 'Consulting',
  price: 100,
  // ...
}

// Use in components
interface MyComponentProps {
  service: Service
  booking?: Booking
  tasks: Task[]
}
```

### Using Shared Schemas

```ts
import { ServiceCreateSchema, ServiceFilterSchema } from '@/schemas/shared'

// Validation in API route
const body = await request.json()
const validated = ServiceCreateSchema.parse(body)

// Validation in component form
const form = useForm({
  resolver: zodResolver(ServiceCreateSchema),
  defaultValues: { name: '', price: 0 },
})
```

---

## Creating Features

### Step 1: Plan Your Feature

**Questions to answer**:
- [ ] Is this feature used in both portal and admin? (→ create shared)
- [ ] Do both areas need different implementations? (→ create variants)
- [ ] What data types are involved?
- [ ] What API endpoints are needed?
- [ ] What permissions are required?

### Step 2: Define Types and Schemas

```bash
# 1. Create type definition
cp templates/schema.template.ts src/schemas/shared/myfeature.ts

# 2. Define your entity types
export const MyEntitySchema = z.object({
  id: z.string().cuid(),
  name: z.string().min(1),
  // ...
})

# 3. Create variants
export const MyEntityCreateSchema = MyEntitySchema.omit({ id: true })
export const MyEntityUpdateSchema = MyEntitySchema.partial()
export const MyEntityFilterSchema = z.object({ ... })

# 4. Export types
export type MyEntity = z.infer<typeof MyEntitySchema>
export type MyEntityCreate = z.infer<typeof MyEntityCreateSchema>
```

### Step 3: Create API Routes

```bash
# 1. Create API route handler
mkdir -p src/app/api/myfeature
cp templates/api-route.template.ts src/app/api/myfeature/route.ts

# 2. Implement GET, POST, PUT, DELETE handlers
# 3. Add validation with Zod schemas
# 4. Use withTenantAuth middleware
# 5. Return respond.ok() or respond.error()

# 6. Test the route
npm run test

# 7. Type-check
npm run type-check
```

### Step 4: Create Hooks

```bash
# 1. Create hook
cp templates/hook.template.ts src/hooks/shared/useMyFeature.ts

# 2. Update hook to fetch from your API endpoint
# 3. Define filter parameters
# 4. Return data with pagination/error handling

# 5. Test the hook
npm run test
```

### Step 5: Create Components

```bash
# 1. Create component
cp templates/component.template.tsx src/components/shared/MyFeatureCard.tsx

# 2. Define Props interface
# 3. Implement both variants (portal/admin)
# 4. Add permission checks
# 5. Handle loading/error/success states

# 6. Create form component if needed
cp templates/component.template.tsx src/components/shared/MyFeatureForm.tsx

# 7. Use react-hook-form + Zod for validation
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { MyFeatureCreateSchema } from '@/schemas/shared'

const form = useForm({
  resolver: zodResolver(MyFeatureCreateSchema),
})
```

### Step 6: Create Tests

```bash
# 1. Create test file
cp templates/test.template.ts src/components/shared/__tests__/MyFeatureCard.test.ts

# 2. Test rendering with variants
# 3. Test user interactions
# 4. Test permissions
# 5. Test accessibility
# 6. Test error handling

# 7. Run tests
npm run test

# 8. Check coverage
npm run test:coverage
```

### Step 7: Integrate into Pages

```tsx
// src/app/portal/myfeature/page.tsx
'use client'

import { useState } from 'react'
import { useMyFeature } from '@/hooks/shared/useMyFeature'
import { MyFeatureCard } from '@/components/shared/MyFeatureCard'
import { MyFeatureForm } from '@/components/shared/MyFeatureForm'

export default function MyFeaturePage() {
  const { data, isLoading, error, mutate } = useMyFeature()
  const [showForm, setShowForm] = useState(false)

  const handleCreate = async (formData) => {
    await fetch('/api/myfeature', {
      method: 'POST',
      body: JSON.stringify(formData),
    })
    mutate() // Refresh data
    setShowForm(false)
  }

  return (
    <div>
      <h1>My Feature</h1>
      {isLoading && <p>Loading...</p>}
      {error && <p>Error: {error.message}</p>}
      {data.map(item => (
        <MyFeatureCard 
          key={item.id} 
          data={item} 
          variant="portal"
        />
      ))}
      {showForm && (
        <MyFeatureForm onSubmit={handleCreate} />
      )}
    </div>
  )
}
```

### Step 8: Deploy

```bash
# 1. Type-check
npm run type-check

# 2. Lint
npm run lint

# 3. Test
npm run test

# 4. Build
npm run build

# 5. Commit
git add .
git commit -m "feat: add my feature"

# 6. Push
git push origin feat/my-feature

# 7. Create PR
# (via GitHub UI)
```

---

## Testing Guidelines

### Unit Tests (Components & Hooks)

```bash
npm run test
```

**What to test**:
- Rendering with different props
- User interactions (clicks, form input)
- Permission-based rendering
- Error and loading states
- Accessibility (ARIA labels, keyboard nav)

**Example**:
```ts
describe('ServiceCard', () => {
  it('renders with portal variant', () => {
    const service = { id: '1', name: 'Service' }
    render(<ServiceCard service={service} variant="portal" />)
    expect(screen.getByText('Service')).toBeInTheDocument()
  })

  it('calls onEdit when edit button clicked', async () => {
    const user = userEvent.setup()
    const onEdit = vi.fn()
    render(<ServiceCard service={service} variant="admin" onEdit={onEdit} />)
    await user.click(screen.getByText('Edit'))
    expect(onEdit).toHaveBeenCalled()
  })
})
```

### Integration Tests

```bash
npm run test
```

**What to test**:
- Multiple components working together
- API integration
- State management
- Complex user workflows

### E2E Tests

```bash
npm run test:e2e
```

**What to test**:
- Full user workflows
- Critical paths
- Browser compatibility
- Responsive design

### Running Tests

```bash
# Run all tests
npm run test

# Run specific file
npm run test -- ServiceCard

# Watch mode
npm run test:watch

# Coverage report
npm run test:coverage
```

---

## Common Tasks

### Adding a New API Endpoint

```bash
# 1. Copy template
cp templates/api-route.template.ts src/app/api/resources/route.ts

# 2. Update model references
# 3. Import your Zod schemas
# 4. Implement GET, POST, PUT, DELETE
# 5. Use withTenantAuth middleware
# 6. Return respond.ok/error responses
# 7. Test thoroughly

npm run test
npm run type-check
```

### Adding a New Component

```bash
# 1. Copy template
cp templates/component.template.tsx src/components/shared/MyComponent.tsx

# 2. Update component name
# 3. Define Props interface
# 4. Implement both variants
# 5. Add permission checks
# 6. Test with both variants

npm run test
npm run type-check
```

### Adding a New Hook

```bash
# 1. Copy template
cp templates/hook.template.ts src/hooks/shared/useMyHook.ts

# 2. Update hook name
# 3. Define filter parameters
# 4. Update API endpoint
# 5. Test with various filters

npm run test
npm run type-check
```

### Adding a New Type

```bash
# 1. Create type file
touch src/types/shared/entities/mytype.ts

# 2. Define interface
export interface MyType {
  id: string
  name: string
  // ...
}

# 3. Create variants for portal/admin
export type MyTypePortalView = Omit<MyType, 'adminField'>

# 4. Create Zod schema
export const MyTypeSchema = z.object({
  id: z.string(),
  name: z.string(),
})
```

### Updating a Type

1. Update type definition in `src/types/shared/`
2. Update Zod schema in `src/schemas/shared/`
3. Update all usages (components, hooks, API routes)
4. Run type-check to find affected files
5. Test thoroughly

---

## Troubleshooting

### TypeScript Errors

**Problem**: "Type X is not compatible with type Y"

**Solution**:
```bash
# Check all files
npm run type-check

# Look at the error message
# Find the file and line number
# Check if you're using the correct type from src/types/shared/

import type { Service } from '@/types/shared' // ✅ Correct
import type { Service } from '@/lib/api' // ❌ Wrong location
```

### Component Not Rendering

**Problem**: Component shows nothing or console errors

**Solution**:
```bash
# 1. Check browser console for errors
# 2. Add debug logs
console.log('Props:', props)
console.log('Permissions:', can('resource:view'))

# 3. Check if component is being imported
import { MyComponent } from '@/components/shared' // ✅ Correct path

# 4. Check if component has display name (for debugging)
MyComponent.displayName = 'MyComponent'

# 5. Run tests to isolate issue
npm run test -- MyComponent
```

### API Errors

**Problem**: 401, 403, or 500 errors from API

**Solution**:

| Error | Cause | Fix |
|-------|-------|-----|
| **401** | Not authenticated | Check session, login |
| **403** | Forbidden/No permission | Check user role, permissions |
| **400** | Bad request | Validate input with Zod schema |
| **404** | Not found | Check resource ID, tenant ID |
| **500** | Server error | Check server logs, database |

```bash
# Check error in API route
const validated = MySchema.parse(body) // Will throw ZodError if invalid
// Handle with respond.badRequest(error.errors)
```

### Hook Returning Undefined

**Problem**: `useServices()` returns `{ data: [], error: undefined }`

**Solution**:
```bash
# 1. Check API endpoint is correct
# 2. Check API is responding
curl http://localhost:3000/api/services

# 3. Add error logging
const { data, error } = useServices()
if (error) console.error('Hook error:', error)

# 4. Check filter parameters
const { data } = useServices({ status: 'ACTIVE' })
// Make sure API supports this filter

# 5. Check SWR configuration
// Change dedupingInterval if needed
const config = { dedupingInterval: 5000 }
```

### Build Failures

**Problem**: `npm run build` fails

**Solution**:
```bash
# 1. Run type-check first
npm run type-check
# Fix all TypeScript errors

# 2. Run linting
npm run lint
# Fix all linting errors

# 3. Check for missing files
# All imports must resolve to real files

# 4. Try build again
npm run build

# 5. If still failing, check error message
# Usually points to specific file/line
```

---

## Resources

### Project Documentation
- **Strategic Overview**: `PORTAL_ADMIN_INTEGRATION_ROADMAP.md`
- **Task Details**: `PORTAL_ADMIN_INTEGRATION_ROADMAP_todo.md`
- **Quick Reference**: `docs/INTEGRATION_ROADMAP_INDEX.md`
- **Auth Middleware**: `docs/api/AUTH_MIDDLEWARE.md`
- **API Contracts**: `docs/api/RESPONSE_CONTRACT.md`

### Code Templates
- **Component Template**: `templates/component.template.tsx`
- **Hook Template**: `templates/hook.template.ts`
- **API Route Template**: `templates/api-route.template.ts`
- **Test Template**: `templates/test.template.ts`
- **Schema Template**: `templates/schema.template.ts`

### Feature Documentation
- **Approvals**: `docs/portal/Approvals Feature*.md`
- **Bills**: `docs/portal/Bills Feature*.md`
- **Compliance**: `docs/portal/Compliance Feature*.md`
- **KYC**: `docs/portal/KYC*.md`
- **Messages**: `docs/portal/Messages*.md`

### External Resources
- [Next.js Docs](https://nextjs.org/docs)
- [React Docs](https://react.dev)
- [Prisma Docs](https://www.prisma.io/docs)
- [Zod Docs](https://zod.dev)
- [React Hook Form Docs](https://react-hook-form.com)
- [shadcn/ui Docs](https://ui.shadcn.com)
- [TypeScript Handbook](https://www.typescriptlang.org/docs)
- [ESLint Docs](https://eslint.org/docs)
- [Vitest Docs](https://vitest.dev)

### Getting Help
- **Questions about patterns?** → See `src/components/shared/README.md`
- **Questions about types?** → See `src/types/shared/`
- **Questions about hooks?** → See `src/hooks/shared/`
- **Questions about APIs?** → See `src/app/api/`
- **Questions about testing?** → See test files in `src/**/__tests__/`

---

## Development Workflow Summary

```
1. PLAN
   ├─ Read requirements/documentation
   ├─ Check existing implementations
   └─ Decide on architecture

2. CODE
   ├─ Copy template
   ├─ Implement functionality
   ├─ Follow conventions
   └─ Add tests

3. VALIDATE
   ├─ npm run type-check
   ├─ npm run lint
   ├─ npm run test
   └─ npm run build

4. COMMIT
   ├─ git add .
   ├─ git commit -m "feat: description"
   └─ git push origin branch-name

5. REVIEW
   ├─ Create PR
   ├─ Wait for reviews
   ├─ Address feedback
   └─ Merge to main
```

---

## Quick Command Reference

| Command | Purpose |
|---------|---------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run type-check` | Check TypeScript errors |
| `npm run lint` | Check code style |
| `npm run lint:fix` | Auto-fix code style |
| `npm run test` | Run all tests |
| `npm run test:watch` | Run tests in watch mode |
| `npm run test:coverage` | Generate coverage report |
| `npm run test:e2e` | Run E2E tests |
| `prisma migrate dev` | Create and run migration |
| `prisma studio` | Open database UI |
| `prisma db seed` | Run seed script |

---

## Final Checklist for New Developers

- [ ] Project cloned and dependencies installed
- [ ] `npm run dev` works without errors
- [ ] All tests pass (`npm run test`)
- [ ] TypeScript compilation succeeds (`npm run type-check`)
- [ ] Read `PORTAL_ADMIN_INTEGRATION_ROADMAP.md`
- [ ] Read `docs/INTEGRATION_ROADMAP_INDEX.md`
- [ ] Explored `src/components/shared/` directory
- [ ] Explored `src/hooks/shared/` directory
- [ ] Reviewed existing feature implementations
- [ ] Made first commit (small change)
- [ ] Familiar with code templates in `templates/`
- [ ] Know where to find help/resources

---

**Welcome to the team! 🎉**

You now have everything you need to be productive. Start with a small feature, follow the patterns, and gradually explore more complex parts of the codebase.

**Remember**: When in doubt, look at existing implementations—they're your best reference!

---

**Version**: 1.0  
**Last Updated**: November 2024  
**Maintained By**: Development Team
