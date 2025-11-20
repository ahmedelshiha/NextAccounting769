# Shared Components Library

This directory contains reusable components shared between the **Portal** (`/portal`) and **Admin** (`/admin`) areas of the application.

## Overview

The shared component library provides a unified set of UI components and business logic components that work consistently across both portal and admin interfaces. This ensures:

- **Code reuse**: Single implementation for multiple features
- **Consistency**: Unified look & feel across both areas
- **Maintainability**: Bug fixes and improvements benefit both sides
- **Scalability**: Easy to add new features leveraging shared components

## Directory Structure

```
src/components/shared/
├── README.md                    # This file
├── types.ts                     # Shared component type definitions
├── index.ts                     # Main exports
│
├── cards/                       # Card components for displaying entities
│   ├── ServiceCard.tsx
│   ├── BookingCard.tsx
│   ├── TaskCard.tsx
│   ├── DocumentCard.tsx
│   ├── InvoiceCard.tsx
│   ├── ApprovalCard.tsx
│   └── index.ts
│
├── forms/                       # Form components for creating/editing entities
│   ├── ServiceForm.tsx
│   ├── BookingForm.tsx
│   ├── TaskForm.tsx
│   └── index.ts
│
├── inputs/                      # Input/picker components
│   ├── DateRangePicker.tsx
│   ├── MultiSelect.tsx
│   └── index.ts
│
├── tables/                      # Table components for lists
│   ├── SharedDataTable.tsx
│   └── index.ts
│
├── widgets/                     # Utility components
│   ├── StatusBadge.tsx
│   ├── PriorityBadge.tsx
│   ├── UserAvatar.tsx
│   └── index.ts
│
├── notifications/              # Notification components
│   ├── NotificationBanner.tsx
│   └── index.ts
│
└── __tests__/                  # Component tests
    └── components.test.tsx
```

## Component Patterns

### 1. Naming Conventions

- **Components**: PascalCase (e.g., `ServiceCard`, `BookingForm`)
- **Props interfaces**: `{ComponentName}Props` (e.g., `ServiceCardProps`)
- **File names**: Match component name (e.g., `ServiceCard.tsx`)

### 2. Props Structure

All shared components follow a consistent props pattern:

```typescript
interface ComponentProps {
  // Required data
  data: SomeEntity
  
  // Optional variant/mode
  variant?: 'portal' | 'admin' | 'compact'
  
  // Optional callbacks
  onSelect?: (id: string) => void
  onEdit?: (id: string) => void
  onDelete?: (id: string) => void
  
  // Optional state
  loading?: boolean
  error?: string
  disabled?: boolean
  
  // Optional display customization
  className?: string
  children?: ReactNode
}
```

### 3. Variant Pattern

Components support multiple variants for different contexts:

- **`portal`**: User-facing, read-only or limited write access
- **`admin`**: Admin-facing, full CRUD operations
- **`compact`**: Minimal display, used in lists/tables

Example:

```typescript
export function ServiceCard({ 
  service, 
  variant = 'portal', 
  onEdit, 
  onDelete 
}: ServiceCardProps) {
  return (
    <div className="service-card">
      {/* Base content shown in all variants */}
      <h3>{service.name}</h3>
      <p>{service.description}</p>
      
      {/* Admin-only section */}
      {variant === 'admin' && (
        <div className="admin-controls">
          <span>${service.price}</span>
          <button onClick={() => onEdit?.(service.id)}>Edit</button>
          <button onClick={() => onDelete?.(service.id)}>Delete</button>
        </div>
      )}
      
      {/* Portal-only section */}
      {variant === 'portal' && (
        <div className="portal-actions">
          <button>Request Service</button>
        </div>
      )}
    </div>
  )
}
```

### 4. Permission-Aware Components

Use the `usePermissions()` hook to conditionally show/hide actions:

```typescript
import { usePermissions } from '@/lib/use-permissions'

export function TaskCard({ task, variant = 'portal' }: TaskCardProps) {
  const { can } = usePermissions()
  
  return (
    <div>
      <h3>{task.title}</h3>
      
      {/* Only show edit button if user has permission */}
      {can('task:update') && (
        <button onClick={handleEdit}>Edit</button>
      )}
    </div>
  )
}
```

### 5. Form Components

Form components should:
- Use `react-hook-form` for state management
- Use Zod schemas for validation
- Export separate Create and Update variants

```typescript
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { ServiceCreateSchema } from '@/schemas/shared'

export function ServiceForm({ 
  service, 
  onSubmit, 
  loading = false 
}: ServiceFormProps) {
  const form = useForm({
    resolver: zodResolver(ServiceCreateSchema),
    defaultValues: service,
  })

  return (
    <form onSubmit={form.handleSubmit(onSubmit)}>
      {/* Form fields */}
    </form>
  )
}
```

### 6. Component Accessibility

All components must include:
- Semantic HTML (`<button>`, `<form>`, `<table>`, etc.)
- ARIA labels for icon-only buttons
- Keyboard navigation support
- Focus management
- Screen reader friendly text

Example:

```typescript
<button 
  aria-label="Delete service"
  onClick={handleDelete}
>
  <TrashIcon />
</button>

<input 
  type="text"
  aria-label="Service name"
  aria-required="true"
  required
/>
```

### 7. Loading & Error States

Components should handle:
- Loading state (with skeleton or spinner)
- Error state (with error message)
- Empty state (when no data)

```typescript
export function ServiceCard({ service, loading, error }: ServiceCardProps) {
  if (loading) return <Skeleton className="h-48" />
  
  if (error) return (
    <Alert variant="destructive">
      <AlertTitle>Error</AlertTitle>
      <AlertDescription>{error}</AlertDescription>
    </Alert>
  )
  
  if (!service) return (
    <div className="text-center text-gray-500">
      No service found
    </div>
  )
  
  return <div>/* component content */</div>
}
```

## Component Testing

Each component should have:
- Unit tests for basic rendering
- Tests for variant behavior
- Tests for permission gating
- Tests for callbacks/handlers
- Tests for edge cases (empty, error, loading)

Test template:

```typescript
// src/components/shared/cards/__tests__/ServiceCard.test.tsx
import { render, screen } from '@testing-library/react'
import { ServiceCard } from '../ServiceCard'
import { vi } from 'vitest'

vi.mock('@/lib/use-permissions', () => ({
  usePermissions: () => ({ can: () => true }),
}))

describe('ServiceCard', () => {
  const mockService = {
    id: '1',
    name: 'Test Service',
    description: 'Test description',
    price: 100,
    status: 'ACTIVE',
  }

  it('renders service name and description', () => {
    render(<ServiceCard service={mockService} />)
    expect(screen.getByText('Test Service')).toBeInTheDocument()
    expect(screen.getByText('Test description')).toBeInTheDocument()
  })

  it('shows admin controls in admin variant', () => {
    const onEdit = vi.fn()
    render(<ServiceCard service={mockService} variant="admin" onEdit={onEdit} />)
    const editBtn = screen.getByText('Edit')
    editBtn.click()
    expect(onEdit).toHaveBeenCalledWith('1')
  })

  it('hides admin controls in portal variant', () => {
    render(<ServiceCard service={mockService} variant="portal" />)
    expect(screen.queryByText('Edit')).not.toBeInTheDocument()
  })
})
```

## Implementation Checklist for New Components

When creating a new shared component:

- [ ] Create component file with TypeScript interface for props
- [ ] Use `'use client'` directive if component needs client features
- [ ] Define `{ComponentName}Props` interface
- [ ] Implement base component with default variant
- [ ] Add `variant?: 'portal' | 'admin' | 'compact'` prop
- [ ] Handle both portal and admin rendering paths
- [ ] Add loading state
- [ ] Add error state
- [ ] Use `usePermissions()` for permission checks
- [ ] Create test file with at least 3 test cases
- [ ] Add JSDoc comment block explaining component
- [ ] Add to `src/components/shared/index.ts`
- [ ] Document in this README if adding new component type

## Using Shared Components

### In Portal
```typescript
import { ServiceCard, TaskCard, BookingForm } from '@/components/shared'

export function PortalServices() {
  return (
    <div>
      {services.map(service => (
        <ServiceCard 
          key={service.id} 
          service={service} 
          variant="portal"
          onSelect={handleSelect}
        />
      ))}
    </div>
  )
}
```

### In Admin
```typescript
import { ServiceCard, TaskCard, BookingForm } from '@/components/shared'

export function AdminServices() {
  return (
    <div>
      {services.map(service => (
        <ServiceCard 
          key={service.id} 
          service={service} 
          variant="admin"
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
      ))}
    </div>
  )
}
```

## Styling Guidelines

- Use Tailwind CSS classes
- Follow existing color scheme from `src/app/globals.css`
- Support both light and dark modes (if applicable)
- Mobile-first responsive design
- Use CSS custom properties for theming

Example:

```typescript
export function ServiceCard({ service, variant = 'portal' }: ServiceCardProps) {
  return (
    <div className="rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow">
      {/* content */}
    </div>
  )
}
```

## FAQ

**Q: When should I create a shared component vs a feature-specific component?**
A: Use shared components when the component is used in both portal and admin, or when it's a generic utility component. Feature-specific components stay in their feature directory.

**Q: How do I handle different field visibility between portal and admin?**
A: Use the `variant` prop or `usePermissions()` hook to conditionally render fields:
```typescript
{variant === 'admin' && <AdminOnlyField />}
{can('service:view-pricing') && <PricingField />}
```

**Q: Can shared components call API routes?**
A: Yes, but prefer using shared hooks from `src/hooks/shared/`. This keeps data fetching logic reusable and testable.

**Q: What about styling conflicts?**
A: All components use Tailwind CSS scoped classes. If you need component-specific styles, create a CSS module and import it in the component file.

## Contributing

When adding new shared components:

1. Create component in appropriate subdirectory
2. Write tests with >80% coverage
3. Update this README if adding new component type
4. Add to `index.ts` export
5. Follow all patterns documented above
6. Request review before merging

---

**Last Updated**: November 2024  
**Status**: Foundation Phase (Phase 1.2)
