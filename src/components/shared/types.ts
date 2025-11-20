import { ReactNode } from 'react'

/**
 * Base props for all shared components
 */
export interface SharedComponentProps {
  /** Component display variant - how it should look/behave */
  variant?: 'portal' | 'admin' | 'compact'
  /** Additional CSS class names */
  className?: string
  /** Child elements to render */
  children?: ReactNode
  /** Loading state indicator */
  loading?: boolean
  /** Error message to display */
  error?: string
  /** Whether the component is disabled */
  disabled?: boolean
  /** Data test ID for testing */
  testId?: string
}

/**
 * Props for card-type components (display entities)
 */
export interface CardComponentProps<T = any> extends SharedComponentProps {
  /** The entity data to display */
  data?: T
  /** Callback when card is clicked */
  onClick?: () => void
  /** Callback to edit entity (admin only) */
  onEdit?: (id: string) => void
  /** Callback to delete entity (admin only) */
  onDelete?: (id: string) => void
  /** Callback to select entity */
  onSelect?: (id: string) => void
}

/**
 * Props for form-type components
 */
export interface FormComponentProps<T = any> extends SharedComponentProps {
  /** Initial form data */
  initialData?: Partial<T>
  /** Callback on successful form submission */
  onSubmit: (data: T) => void | Promise<void>
  /** Is the form currently submitting */
  isSubmitting?: boolean
  /** Error message from submission */
  submitError?: string
  /** Success message after submission */
  successMessage?: string
  /** Whether to reset form after successful submission */
  resetOnSuccess?: boolean
  /** Additional CSS class for the form element */
  formClassName?: string
}

/**
 * Props for list/table components
 */
export interface ListComponentProps<T = any> extends SharedComponentProps {
  /** Array of items to display */
  items: T[]
  /** Total number of items (for pagination) */
  total?: number
  /** Current page number */
  page?: number
  /** Items per page */
  limit?: number
  /** Current sort column */
  sortBy?: string
  /** Sort direction */
  sortOrder?: 'asc' | 'desc'
  /** Callback when sort changes */
  onSort?: (key: string, order: 'asc' | 'desc') => void
  /** Callback when page changes */
  onPageChange?: (page: number) => void
  /** Callback when limit changes */
  onLimitChange?: (limit: number) => void
  /** Whether list is empty */
  isEmpty?: boolean
  /** Empty state message */
  emptyMessage?: string
}

/**
 * Props for badge/indicator components
 */
export interface BadgeComponentProps extends SharedComponentProps {
  /** The status or value to display */
  value: string
  /** What type of entity this status is for */
  type?: 'booking' | 'task' | 'approval' | 'document' | 'invoice' | 'approval' | 'generic'
  /** Size of the badge */
  size?: 'sm' | 'md' | 'lg'
  /** Whether to show an icon */
  showIcon?: boolean
}

/**
 * Props for picker/input components
 */
export interface PickerComponentProps<T = any> extends SharedComponentProps {
  /** Current selected value(s) */
  value?: T | T[]
  /** Callback when value changes */
  onChange?: (value: T | T[]) => void
  /** Options to choose from */
  options?: Array<{ label: string; value: T }>
  /** Placeholder text */
  placeholder?: string
  /** Whether multiple selections are allowed */
  multiple?: boolean
  /** Whether the picker is clearable */
  clearable?: boolean
  /** Minimum date (for date pickers) */
  minDate?: Date
  /** Maximum date (for date pickers) */
  maxDate?: Date
}

/**
 * Props for avatar components
 */
export interface AvatarComponentProps extends SharedComponentProps {
  /** User or entity name */
  name: string
  /** Avatar image URL */
  src?: string
  /** Avatar fallback initials */
  initials?: string
  /** Size of avatar */
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  /** Whether to show online status indicator */
  showStatus?: boolean
  /** Is the user online */
  isOnline?: boolean
  /** Callback when avatar is clicked */
  onClick?: () => void
  /** Whether avatar is clickable */
  clickable?: boolean
}

/**
 * Component variant type
 */
export type ComponentVariant = 'portal' | 'admin' | 'compact'

/**
 * Component status types
 */
export enum ComponentStatus {
  IDLE = 'idle',
  LOADING = 'loading',
  SUCCESS = 'success',
  ERROR = 'error',
}

/**
 * Common action types for components
 */
export interface ComponentAction {
  id: string
  label: string
  icon?: ReactNode
  onClick: () => void | Promise<void>
  variant?: 'default' | 'secondary' | 'destructive' | 'ghost'
  disabled?: boolean
  loading?: boolean
}

/**
 * Props for components with actions
 */
export interface ComponentWithActionsProps extends SharedComponentProps {
  /** Array of actions to display */
  actions?: ComponentAction[]
  /** Maximum number of visible actions (rest go in menu) */
  maxVisibleActions?: number
}

/**
 * Response from form submission
 */
export interface FormSubmissionResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  validationErrors?: Record<string, string[]>
}

/**
 * Pagination state
 */
export interface PaginationState {
  page: number
  limit: number
  total: number
  hasMore: boolean
}

/**
 * Sort state
 */
export interface SortState {
  sortBy?: string
  sortOrder: 'asc' | 'desc'
}

/**
 * Filter state for list components
 */
export interface FilterState {
  [key: string]: any
}

/**
 * Props for filterable list components
 */
export interface FilterableListProps<T = any> extends ListComponentProps<T> {
  /** Current filter state */
  filters?: FilterState
  /** Callback when filters change */
  onFiltersChange?: (filters: FilterState) => void
  /** Whether to show filter UI */
  showFilters?: boolean
}

/**
 * Props for selectable components
 */
export interface SelectableComponentProps extends SharedComponentProps {
  /** Whether component is selectable */
  selectable?: boolean
  /** Currently selected items (by ID) */
  selectedIds?: string[]
  /** Callback when selection changes */
  onSelectionChange?: (ids: string[]) => void
}
