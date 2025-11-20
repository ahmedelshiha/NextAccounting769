# Component Template

Use this template when creating new shared components in `src/components/shared/`.

## File: `src/components/shared/[category]/ComponentName.tsx`

```typescript
'use client'

import { ReactNode } from 'react'
import { cn } from '@/lib/utils'

/**
 * Props for ComponentName
 */
interface ComponentNameProps {
  /**
   * Component variant for different display modes
   * @default 'default'
   */
  variant?: 'portal' | 'admin' | 'default'
  
  /**
   * Additional CSS class names
   */
  className?: string
  
  /**
   * Children elements
   */
  children?: ReactNode
  
  /**
   * Loading state
   * @default false
   */
  loading?: boolean
  
  /**
   * Error message to display
   */
  error?: string | null
  
  /**
   * Disabled state
   * @default false
   */
  disabled?: boolean
}

/**
 * ComponentName description - what does it do?
 * 
 * Supports both portal and admin variants. Handles loading, error, and empty states.
 * 
 * @example
 * ```tsx
 * <ComponentName variant="portal" loading={isLoading}>
 *   {children}
 * </ComponentName>
 * ```
 * 
 * @example
 * ```tsx
 * <ComponentName 
 *   variant="admin" 
 *   error={errorMessage}
 * >
 *   {children}
 * </ComponentName>
 * ```
 */
export function ComponentName({
  variant = 'default',
  className,
  children,
  loading = false,
  error = null,
  disabled = false,
}: ComponentNameProps) {
  if (loading) {
    return (
      <div className="flex items-center justify-center p-4">
        <div className="text-sm text-muted-foreground">Loading...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="rounded-md border border-destructive/50 bg-destructive/10 p-4">
        <p className="text-sm text-destructive">{error}</p>
      </div>
    )
  }

  return (
    <div
      className={cn(
        'rounded-lg border border-gray-200',
        variant === 'admin' && 'bg-slate-50',
        variant === 'portal' && 'bg-white',
        disabled && 'opacity-50 cursor-not-allowed',
        className
      )}
    >
      {children}
    </div>
  )
}

export default ComponentName
```

## File: `src/components/shared/[category]/__tests__/ComponentName.test.tsx`

```typescript
import { render, screen } from '@testing-library/react'
import { ComponentName } from '../ComponentName'
import { describe, it, expect } from 'vitest'

describe('ComponentName', () => {
  it('renders children', () => {
    render(<ComponentName>Test Content</ComponentName>)
    expect(screen.getByText('Test Content')).toBeInTheDocument()
  })

  it('shows loading state', () => {
    render(<ComponentName loading>Test</ComponentName>)
    expect(screen.getByText('Loading...')).toBeInTheDocument()
  })

  it('shows error message', () => {
    const error = 'Something went wrong'
    render(<ComponentName error={error}>Test</ComponentName>)
    expect(screen.getByText(error)).toBeInTheDocument()
  })

  it('applies portal variant styles', () => {
    const { container } = render(
      <ComponentName variant="portal">Test</ComponentName>
    )
    expect(container.querySelector('.bg-white')).toBeInTheDocument()
  })

  it('applies admin variant styles', () => {
    const { container } = render(
      <ComponentName variant="admin">Test</ComponentName>
    )
    expect(container.querySelector('.bg-slate-50')).toBeInTheDocument()
  })

  it('disables when disabled prop is true', () => {
    const { container } = render(
      <ComponentName disabled>Test</ComponentName>
    )
    expect(container.querySelector('.opacity-50')).toBeInTheDocument()
  })
})
```

## Key Pattern Rules

1. **Always use 'use client'** - Components are client components
2. **Import utilities** - Always import `cn` from `@/lib/utils` for class merging
3. **Props interface** - Define Props interface with JSDoc for each property
4. **Variants** - Support 'portal', 'admin', 'default' variants
5. **States** - Handle loading, error, disabled states
6. **JSDoc** - Document all exports with JSDoc comments and examples
7. **Tests** - Create test file alongside component
8. **Accessibility** - Include ARIA labels and semantic HTML

## Variant Pattern

```typescript
// Template for variant-specific rendering
{variant === 'admin' && can('resource:manage') && (
  <div className="admin-controls">
    {/* Admin-only content */}
  </div>
)}

{variant === 'portal' && (
  <div className="portal-content">
    {/* Portal-only content */}
  </div>
)}

{variant === 'default' && (
  <div className="default-content">
    {/* Default content */}
  </div>
)}
```

## Export Pattern

Always export from the category index:

```typescript
// src/components/shared/cards/index.ts
export { ComponentName } from './ComponentName'
export type { ComponentNameProps } from './ComponentName'
```

Then from shared index:

```typescript
// src/components/shared/index.ts
export { ComponentName } from './cards/ComponentName'
export type { ComponentNameProps } from './cards/ComponentName'
```
