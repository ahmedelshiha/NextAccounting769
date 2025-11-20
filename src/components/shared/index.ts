/**
 * Shared Components Library
 *
 * Central export point for all shared components used across Portal and Admin.
 * Components are organized by category: cards, forms, inputs, tables, widgets, and notifications.
 *
 * Usage:
 * ```typescript
 * import { ServiceCard, BookingForm, TaskCard } from '@/components/shared'
 * ```
 */

// Type definitions
export * from './types'

// Cards - Display individual entities
export { default as ServiceCard } from './cards/ServiceCard'
export { default as BookingCard } from './cards/BookingCard'
export { default as TaskCard } from './cards/TaskCard'
export { default as DocumentCard } from './cards/DocumentCard'
export { default as InvoiceCard } from './cards/InvoiceCard'
export { default as ApprovalCard } from './cards/ApprovalCard'

// Forms - Create/edit entities
export { default as ServiceForm } from './forms/ServiceForm'
export { default as BookingForm } from './forms/BookingForm'
export { default as TaskForm } from './forms/TaskForm'
export { DocumentUploadForm } from './forms/DocumentUploadForm'
export { DocumentSigningForm } from './forms/DocumentSigningForm'
export { DocumentApprovalForm } from './forms/DocumentApprovalForm'

// Inputs - Input components and pickers
export { default as DateRangePicker } from './inputs/DateRangePicker'
export { default as MultiSelect } from './inputs/MultiSelect'
export { default as ServiceFilter } from './inputs/ServiceFilter'
export { type ServiceFilterValues } from './inputs/ServiceFilter'
export { BookingCalendar } from './inputs/BookingCalendar'

// Tables - List components
export { default as SharedDataTable } from './tables/SharedDataTable'

// Widgets - Small utility components
export { default as StatusBadge } from './widgets/StatusBadge'
export { default as PriorityBadge } from './widgets/PriorityBadge'
export { default as UserAvatar } from './widgets/UserAvatar'
export { ServiceGrid } from './widgets/ServiceGrid'
export { DocumentVersionHistory } from './widgets/DocumentVersionHistory'

// Notifications - Notification components
export { default as NotificationBanner } from './notifications/NotificationBanner'
