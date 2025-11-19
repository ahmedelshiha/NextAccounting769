'use client'

import { ReactNode } from 'react'
import { cn } from '@/lib/cn'

interface BaseComponentProps {
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
 * BaseComponent
 *
 * Supports both portal and admin variants. Handles loading, error, and empty states.
 *
 * @example
 * ```tsx
 * <BaseComponent variant="portal" loading={isLoading}>
 *   {children}
 * </BaseComponent>
 * ```
 *
 * @example
 * ```tsx
 * <BaseComponent
 *   variant="admin"
 *   error={errorMessage}
 * >
 *   {children}
 * </BaseComponent>
 * ```
 */
export function BaseComponent({
  variant = 'default',
  className,
  children,
  loading = false,
  error = null,
  disabled = false,
}: BaseComponentProps) {
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

export default BaseComponent
