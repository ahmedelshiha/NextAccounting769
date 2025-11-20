# Code Generation Templates

This directory contains templates for quickly scaffolding new code that follows the project's established patterns and conventions.

## Available Templates

### 1. **component.template.tsx** - React Component Template

Use this template when creating new reusable components in `src/components/shared/`.

**Features:**
- Dual variant support (portal/admin)
- Permission-aware rendering with `usePermissions()`
- Loading and error states
- TypeScript generics for type safety
- Accessibility (ARIA labels, semantic HTML)
- JSDoc documentation

**Usage:**
```bash
# Copy template
cp templates/component.template.tsx src/components/shared/MyComponent.tsx

# Replace placeholders
# - Change 'Component' to 'MyComponent'
# - Update component description
# - Implement specific logic
```

**Key Sections:**
- Props interface with full JSDoc
- Variant pattern (portal/admin/default)
- Loading state handling
- Error state display
- Permission-based rendering
- Action callbacks

**Example - Creating ServiceCard:**
```tsx
// 1. Copy template
cp templates/component.template.tsx src/components/shared/ServiceCard.tsx

// 2. Update component name
export function ServiceCard<T = Service>({ ... })

// 3. Add Service-specific rendering logic
// 4. Define variant-specific behavior
```

---

### 2. **hook.template.ts** - React Hook Template

Use this template when creating new hooks in `src/hooks/shared/`.

**Features:**
- SWR-based data fetching with caching
- Filter/pagination support
- Memoized return values for performance
- TypeScript generics
- Real-time updates via `mutate()`
- Deduplication and validation

**Usage:**
```bash
# Copy template
cp templates/hook.template.ts src/hooks/shared/useMyData.ts

# Replace placeholders
# - Change 'Data' to your data type
# - Update API endpoint
# - Define filter parameters
# - Implement filter building logic
```

**Key Sections:**
- Filter parameters interface
- Hook return type with all methods
- Query string building (memoized)
- SWR configuration
- Pagination metadata
- Optional useLoadMore hook
- Filter synchronization with URL

**Example - Creating useServices:**
```ts
// 1. Copy template
cp templates/hook.template.ts src/hooks/shared/useServices.ts

// 2. Update hook name
export function useServices(filters: ServiceFilters = {}, options?: SWRConfiguration)

// 3. Define Service-specific filters
interface ServiceFilters {
  category?: string
  featured?: boolean
  active?: boolean
  ...
}

// 4. Update API endpoint
const endpoint = useMemo(() => {
  const baseUrl = '/api/services'
  return queryString ? `${baseUrl}?${queryString}` : baseUrl
}, [queryString])
```

---

### 3. **api-route.template.ts** - API Route Template

Use this template when creating new API endpoints in `src/app/api/`.

**Features:**
- Authentication middleware with role checks
- Pagination and filtering
- Error handling and validation
- Zod schema validation
- Permission checks
- Multi-tenant support
- Comprehensive JSDoc

**Usage:**
```bash
# Copy template
cp templates/api-route.template.ts src/app/api/resource/route.ts

# Replace placeholders
# - Change endpoint paths
# - Update database model names
# - Define filters/searches
# - Add permission checks
# - Configure validation schemas
```

**Key Sections:**
- GET handler with pagination
- POST handler for creation
- PUT handler for updates
- DELETE handler
- Zod schema validation
- Error handling with respond helper
- Multi-tenant support via withTenantAuth

**Example - Creating /api/services:**
```ts
// 1. Copy template
cp templates/api-route.template.ts src/app/api/services/route.ts

// 2. Import schemas
import { ServiceCreateSchema, ServiceUpdateSchema } from '@/schemas/shared'

// 3. Update model references
const services = await prisma.service.findMany(...)

// 4. Add Service-specific filtering
const whereClause: any = {
  tenantId: request.tenantId,
  active: filters.active !== undefined ? filters.active : undefined,
  category: filters.category,
}

// 5. Update validation
const validated = ServiceCreateSchema.parse(body)
```

---

### 4. **test.template.ts** - Test Suite Template

Use this template when creating tests in `src/**/__tests__/`.

**Features:**
- Comprehensive test coverage patterns
- Component rendering tests
- User interaction tests
- Permission checks
- Accessibility testing
- Error handling
- Hook testing examples
- API mocking examples

**Usage:**
```bash
# Copy template
cp templates/test.template.ts src/components/shared/__tests__/MyComponent.test.ts

# Replace placeholders
# - Update import paths
# - Replace ComponentName with actual component
# - Uncomment relevant test sections
# - Add component-specific test cases
```

**Test Categories:**
1. **Rendering Tests**
   - Basic rendering
   - Loading state
   - Error state
   - Variant support
   - Children rendering

2. **Props Tests**
   - Custom className
   - Disabled state
   - Data handling

3. **User Interaction Tests**
   - Button clicks
   - Form submission
   - Keyboard navigation
   - Multiple interactions

4. **Permission Tests**
   - Permission denied display
   - Normal rendering with permissions

5. **Accessibility Tests**
   - ARIA labels
   - Loading state attributes
   - Alert roles
   - Keyboard accessibility
   - Color contrast

6. **Edge Cases**
   - Undefined data
   - Empty arrays
   - Rapid interactions
   - Variant switching

**Example - Creating ServiceCard Tests:**
```ts
// 1. Copy template
cp templates/test.template.ts src/components/shared/__tests__/ServiceCard.test.ts

// 2. Import component
import { ServiceCard } from '@/components/shared/ServiceCard'

// 3. Uncomment relevant tests and customize
it('renders service name', () => {
  const service = { id: '1', name: 'Web Development', ... }
  render(<ServiceCard service={service} />)
  expect(screen.getByText('Web Development')).toBeInTheDocument()
})
```

---

### 5. **schema.template.ts** - Zod Schema Template

Use this template when creating validation schemas in `src/schemas/shared/`.

**Features:**
- Enum definitions with type inference
- Base schema with all fields
- Create schema (POST validation)
- Update schema (PUT validation)
- Filter schema (GET query validation)
- Response schemas (success/error)
- Custom validations and refinements
- Utility functions for validation
- Type inference with z.infer

**Usage:**
```bash
# Copy template
cp templates/schema.template.ts src/schemas/shared/service.ts

# Replace placeholders
# - Rename Item* types to Service*
# - Update enum values
# - Define schema fields
# - Add custom validations
# - Export all schemas and types
```

**Schema Layers:**

1. **Enums** - Status/priority types
2. **Base Schema** - All fields with descriptions
3. **Create Schema** - For POST requests (omit system fields)
4. **Update Schema** - For PUT requests (all fields optional)
5. **Filter Schema** - For GET query parameters
6. **Response Schemas** - For API responses

**Example - Creating Service Schema:**
```ts
// 1. Copy template
cp templates/schema.template.ts src/schemas/shared/service.ts

// 2. Update enum
export const ServiceStatusEnum = z.enum([
  'ACTIVE',
  'INACTIVE',
  'ARCHIVED',
])

// 3. Add Service-specific fields
export const ServiceBaseSchema = z.object({
  id: z.string().cuid(),
  name: z.string().min(1).max(255),
  price: z.number().positive().optional(),
  duration: z.number().positive().optional(),
  category: z.string().optional(),
  ...
})

// 4. Define validation rules
.refine(
  (data) => data.price && data.price > 0,
  { message: 'Price must be greater than 0' }
)

// 5. Export all variants
export type ServiceCreate = z.infer<typeof ServiceCreateSchema>
export type ServiceUpdate = z.infer<typeof ServiceUpdateSchema>
export type ServiceFilter = z.infer<typeof ServiceFilterSchema>
```

---

## Template Usage Workflow

### Step 1: Choose the Right Template
- Creating a component? → Use `component.template.tsx`
- Creating a hook? → Use `hook.template.ts`
- Creating an API route? → Use `api-route.template.ts`
- Creating tests? → Use `test.template.ts`
- Creating validation? → Use `schema.template.ts`

### Step 2: Copy Template
```bash
cp templates/[template] src/[path]/[filename]
```

### Step 3: Find and Replace
Search for:
- `TODO:` comments - Implementation guidance
- `ComponentName` - Your actual component/function name
- `placeholder` - Your actual values
- Commented examples - Uncomment relevant sections

### Step 4: Customize
- Add component-specific props
- Implement business logic
- Add error handling
- Add accessibility features
- Add tests

### Step 5: Review
- Check TypeScript compilation: `npm run type-check`
- Run linting: `npm run lint`
- Run tests: `npm run test`
- Build: `npm run build`

---

## Best Practices

### When Creating Components
- ✅ Always define Props interface with JSDoc
- ✅ Support both portal and admin variants
- ✅ Use `usePermissions()` for access control
- ✅ Handle loading and error states
- ✅ Include proper ARIA labels
- ✅ Test with multiple variants

### When Creating Hooks
- ✅ Use SWR for data fetching
- ✅ Memoize return values
- ✅ Support filtering and pagination
- ✅ Include TypeScript generics
- ✅ Document with examples
- ✅ Test with various filters

### When Creating API Routes
- ✅ Use `withTenantAuth` middleware
- ✅ Validate input with Zod
- ✅ Include permission checks
- ✅ Handle all error cases
- ✅ Return consistent response format
- ✅ Test happy and sad paths

### When Creating Tests
- ✅ Test rendering variants
- ✅ Test user interactions
- ✅ Test permission checks
- ✅ Test accessibility
- ✅ Test error cases
- ✅ Aim for >80% coverage

### When Creating Schemas
- ✅ Define enums first
- ✅ Create base schema with all fields
- ✅ Define Create/Update variants
- ✅ Include Filter schema
- ✅ Add custom validations
- ✅ Export types with z.infer

---

## Common Patterns

### Portal vs Admin Variant
```tsx
// In component template, render variant-specific content
if (variant === 'admin' && can('resource:edit')) {
  // Show admin controls
}
if (variant === 'portal' && can('resource:view')) {
  // Show portal content
}
```

### Error Handling in Hooks
```ts
// Use SWR's built-in error handling
const { data, error, isLoading } = useSWR(endpoint, fetcher)
if (error) return { error, data: [] }
```

### Permission Checks in API
```ts
// Use middleware + explicit checks
export const DELETE = withAdminAuth(async (request) => {
  if (request.userRole !== 'SUPER_ADMIN') {
    return respond.forbidden('Only SUPER_ADMIN can delete')
  }
})
```

### Validation with Zod
```ts
// Parse with error handling
try {
  const validated = ServiceCreateSchema.parse(body)
  // Use validated data
} catch (error) {
  return respond.badRequest('Invalid input', error.errors)
}
```

---

## File Organization After Using Templates

```
src/
├── components/shared/
│   ├── cards/
│   │   ├── ServiceCard.tsx         ← From component template
│   │   └── __tests__/
│   │       └── ServiceCard.test.ts ← From test template
│   └── ...
├── hooks/shared/
│   ├── useServices.ts              ← From hook template
│   └── ...
├── app/api/
│   ├── services/
│   │   └── route.ts                ← From api-route template
│   └── ...
└── schemas/shared/
    ├── service.ts                  ← From schema template
    └── ...
```

---

## Next Steps

1. **Explore Templates** - Read through each template to understand structure
2. **Copy First Template** - Start with component or hook you need to create
3. **Follow TODOs** - Replace placeholders and implement logic
4. **Test Thoroughly** - Use test template for comprehensive coverage
5. **Review Code** - Check TypeScript, linting, build
6. **Document** - Add JSDoc comments for public APIs

---

## Questions?

Refer to:
- **Component Patterns**: `src/components/shared/README.md`
- **Hook Examples**: `src/hooks/shared/` (existing implementations)
- **API Routes**: `src/app/api/` (existing endpoints)
- **Schemas**: `src/schemas/shared/` (existing schemas)
- **Tests**: `src/**/__tests__/` (existing test files)

---

**Version**: 1.0  
**Last Updated**: November 2024  
**Maintained By**: Development Team
