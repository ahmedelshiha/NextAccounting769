'use client'

import { ReactNode } from 'react'
import { usePermissions } from '@/lib/use-permissions'

// TODO: Replace COMPONENT_NAME with actual component name (e.g., ServiceCard, BookingForm)
// TODO: Replace COMPONENT_DESCRIPTION with actual description

const COMPONENT_NAME = 'ComponentName'
const COMPONENT_DESCRIPTION = 'Brief description of what this component does'

/**
 * Props for the component
 * @template T - Data type this component displays
 */
interface ComponentProps<T = any> {
  /**
   * Data to display
   */
  data?: T

  /**
   * Component variant for different display modes
   * @default 'default'
   */
  variant?: 'portal' | 'admin' | 'default'

  /**
   * CSS class name for custom styling
   */
  className?: string

  /**
   * Loading state indicator
   * @default false
   */
  loading?: boolean

  /**
   * Error state and message
   */
  error?: string | null

  /**
   * Disabled state
   * @default false
   */
  disabled?: boolean

  /**
   * Child elements to render
   */
  children?: ReactNode

  /**
   * Callback when component action is triggered
   */
  onAction?: (data?: T) => void

  /**
   * Callback when component is edited
   */
  onEdit?: (data?: T) => void

  /**
   * Callback when component is deleted
   */
  onDelete?: (id?: string) => void
}

/**
 * {{COMPONENT_DESCRIPTION}}
 *
 * This component is part of the shared component library and can be used in both
 * portal and admin areas. Use the `variant` prop to customize behavior for different contexts.
 *
 * Features:
 * - Dual variant support (portal and admin)
 * - Permission-aware rendering
 * - Loading and error states
 * - Type-safe with TypeScript generics
 * - Accessible with ARIA labels
 *
 * @example Portal variant
 * ```tsx
 * <Component data={item} variant="portal" onAction={handleAction} />
 * ```
 *
 * @example Admin variant
 * ```tsx
 * <Component data={item} variant="admin" onEdit={handleEdit} onDelete={handleDelete} />
 * ```
 *
 * @example With loading state
 * ```tsx
 * <Component loading error={error} data={data} />
 * ```
 */
export function Component<T = any>({
  data,
  variant = 'default',
  className = '',
  loading = false,
  error = null,
  disabled = false,
  children,
  onAction,
  onEdit,
  onDelete,
}: ComponentProps<T>) {
  const { has, can } = usePermissions()

  // Show loading state
  if (loading) {
    return (
      <div className={`${className} opacity-50`} role="status" aria-busy="true">
        <div className="flex items-center justify-center p-4">
          <div className="animate-spin text-gray-500">
            <span className="sr-only">Loading...</span>
            <div className="h-4 w-4 border-2 border-gray-300 border-t-gray-600 rounded-full" />
          </div>
        </div>
      </div>
    )
  }

  // Show error state
  if (error) {
    return (
      <div
        className={`${className} p-4 bg-red-50 border border-red-200 rounded-md`}
        role="alert"
        aria-label="Error"
      >
        <p className="text-red-800 text-sm font-medium">Error</p>
        <p className="text-red-700 text-sm mt-1">{error}</p>
      </div>
    )
  }

  // Check permissions for portal variant
  if (variant === 'portal' && !can) {
    return (
      <div className={`${className} p-4 bg-gray-50 border border-gray-200 rounded-md`}>
        <p className="text-gray-600 text-sm">You don&apos;t have permission to view this content</p>
      </div>
    )
  }

  return (
    <div
      className={`${className} component-container`}
      role="article"
      aria-label={COMPONENT_NAME}
    >
      {/* Admin section - visible only in admin variant */}
      {variant === 'admin' && (
        <div className="admin-section">
          <div className="flex gap-2">
            {can && onEdit && (
              <button
                onClick={() => onEdit(data)}
                disabled={disabled}
                className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
              >
                Edit
              </button>
            )}

            {can && onDelete && (
              <button
                onClick={() => onDelete()}
                disabled={disabled}
                className="px-3 py-1 text-sm bg-red-500 text-white rounded hover:bg-red-600 disabled:opacity-50"
              >
                Delete
              </button>
            )}
          </div>
        </div>
      )}

      {/* Portal section - visible only in portal variant */}
      {variant === 'portal' && (
        <div className="portal-section">
          {can && onAction && (
            <button
              onClick={() => onAction(data)}
              disabled={disabled}
              className="px-4 py-2 text-sm bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
            >
              Action
            </button>
          )}
        </div>
      )}

      {/* Main content */}
      <div className="content">
        {children}
      </div>
    </div>
  )
}

Component.displayName = COMPONENT_NAME

export default Component
