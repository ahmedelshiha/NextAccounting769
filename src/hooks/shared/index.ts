// Data fetching hooks
export { useServices, type ServiceFilters, type UseServicesResponse } from './useServices'
export { useBookings, type BookingFilters, type UseBookingsResponse } from './useBookings'
export { useTasks, type TaskFilters, type UseTasksResponse } from './useTasks'
export { useUsers, type UserFilters, type UseUsersResponse } from './useUsers'
export { useDocuments, type DocumentFilters, type UseDocumentsResponse } from './useDocuments'
export { useInvoices, type InvoiceFilters, type UseInvoicesResponse } from './useInvoices'
export { useMessages, type MessageFilters, type UseMessagesResponse } from './useMessages'
export { useApprovals, type ApprovalFilters, type UseApprovalsResponse } from './useApprovals'
export { useTeamMembers, useTeamMember, useTeamMemberSearch, type TeamMembersFilters } from './useTeamMembers'
export { useAvailabilityRealtime, useAvailabilitySlots, type AvailabilitySlot } from './useAvailabilityRealtime'
export { useBookingRealtime, useBookingsWithRealtime, type BookingUpdate } from './useBookingRealtime'

// State management hooks
export { useFilters, type FilterValue } from './useFilters'
export { useTableState, type TableState, type SortState } from './useTableState'
export { useFormState } from './useFormState'
export { useSelection, type SelectionState } from './useSelection'

// Notification hooks
export { useNotifications, useNotificationPreferences, useSendNotification } from './useNotifications'

// Permission & session hooks
export { useCanAction } from './useCanAction'
export { useRequiredPermission } from './useRequiredPermission'
export { useUserRole } from './useUserRole'
export { useTenant, type TenantInfo } from './useTenant'
export { useCurrentUser, type CurrentUser } from './useCurrentUser'
