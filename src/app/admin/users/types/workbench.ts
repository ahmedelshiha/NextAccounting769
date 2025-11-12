/**
 * AdminWorkBench Type Definitions
 * 
 * Centralized type definitions for the new AdminWorkBench UI.
 * Includes all types needed for components, hooks, and API interactions.
 */

import { UserItem } from '../contexts/UsersContextProvider'

// ============================================================================
// WORKBENCH LAYOUT TYPES
// ============================================================================

export interface AdminWorkBenchProps {
  initialFilters?: Partial<WorkbenchFilters>
  onUserSelect?: (user: UserItem) => void
}

export interface AdminUsersLayoutProps {
  children?: React.ReactNode
}

// ============================================================================
// FILTER TYPES
// ============================================================================

export interface WorkbenchFilters {
  search: string
  role: 'ALL' | 'ADMIN' | 'TEAM_LEAD' | 'TEAM_MEMBER' | 'STAFF' | 'CLIENT' | 'EDITOR' | 'VIEWER'
  status: 'ALL' | 'ACTIVE' | 'INACTIVE' | 'SUSPENDED'
  department?: string
  dateRange: 'all' | '7d' | '30d' | '90d'
}

export type FilterKey = keyof Omit<WorkbenchFilters, 'search'>

// ============================================================================
// SELECTION TYPES
// ============================================================================

export interface SelectionState {
  selectedUserIds: Set<string>
  selectAll: boolean
  totalSelected: number
}

export interface SelectionHandlers {
  selectUser: (userId: string, selected: boolean) => void
  selectAll: (selected: boolean) => void
  clearSelection: () => void
  toggleSelection: (userId: string) => void
}

// ============================================================================
// TABLE TYPES
// ============================================================================

export interface TableColumn {
  id: string
  label: string
  sortable: boolean
  visible: boolean
  width?: string
  align?: 'left' | 'center' | 'right'
}

export interface TableState {
  columns: TableColumn[]
  sortBy?: string
  sortOrder: 'asc' | 'desc'
  pageSize: number
  currentPage: number
}

export interface TableHandlers {
  setSortBy: (column: string) => void
  setPageSize: (size: number) => void
  goToPage: (page: number) => void
  toggleColumn: (columnId: string) => void
}

// ============================================================================
// BULK ACTION TYPES
// ============================================================================

export type BulkActionType =
  | 'set-status'
  | 'set-role'
  | 'set-department'
  | 'send-email'
  | 'export-data'
  | 'reset-password'
  | 'delete-users'

export interface BulkActionConfig {
  type: BulkActionType
  value: any
  userIds: string[]
  dryRun?: boolean
}

export interface BulkActionRequest {
  userIds: string[]
  action: BulkActionType
  value: any
}

export interface BulkActionPreview {
  affected: number
  estimatedTime: number
  warnings: string[]
  details: {
    field: string
    oldValue: any
    newValue: any
  }[]
}

export interface BulkActionResponse {
  success: boolean
  affected: number
  operationId: string
  message: string
  errors?: string[]
}

export interface UndoOperationRequest {
  operationId: string
}

export interface UndoOperationResponse {
  success: boolean
  message: string
  reverted: number
}

// ============================================================================
// SIDEBAR TYPES
// ============================================================================

export interface SidebarSection {
  id: 'filters' | 'analytics' | 'activity'
  label: string
  collapsible: boolean
  defaultOpen: boolean
}

export interface SidebarState {
  openSections: Set<string>
  mobileOpen: boolean
  width: number
}

// ============================================================================
// CARD/METRIC TYPES
// ============================================================================

export interface MetricCardData {
  title: string
  value: string | number
  delta?: string
  positive?: boolean
  icon?: React.ReactNode
  trend?: 'up' | 'down' | 'stable'
  lastUpdated?: string
}

export interface OverviewMetrics {
  totalUsers: MetricCardData
  activeUsers: MetricCardData
  pendingApprovals: MetricCardData
  inProgressWorkflows: MetricCardData
  systemHealth: MetricCardData
  costPerUser: MetricCardData
}

// ============================================================================
// CHART TYPES
// ============================================================================

export interface RoleDistributionData {
  [roleName: string]: number
}

export interface UserGrowthData {
  labels: string[]
  values: number[]
}

export interface ActivityEvent {
  id: string
  userId: string
  userName: string
  action: 'created' | 'updated' | 'deleted' | 'role_changed' | 'login' | 'logout' | 'verified'
  timestamp: string
  details?: string
}

// ============================================================================
// MODAL/DIALOG TYPES
// ============================================================================

export interface DryRunModalProps {
  isOpen: boolean
  preview: BulkActionPreview | null
  isLoading?: boolean
  onConfirm: () => Promise<void>
  onCancel: () => void
}

export interface UndoToastProps {
  visible: boolean
  operationId: string
  message?: string
  autoClose?: boolean
  onDismiss: () => void
  onUndo: () => Promise<boolean>
}

// ============================================================================
// STATE MANAGEMENT TYPES
// ============================================================================

export interface WorkbenchState {
  filters: WorkbenchFilters
  selection: SelectionState
  table: TableState
  sidebar: SidebarState
  isLoading: boolean
  error: string | null
}

export interface WorkbenchContextValue {
  state: WorkbenchState
  filterHandlers: {
    setSearch: (search: string) => void
    setRole: (role: WorkbenchFilters['role']) => void
    setStatus: (status: WorkbenchFilters['status']) => void
    setDateRange: (range: WorkbenchFilters['dateRange']) => void
    clearFilters: () => void
  }
  selectionHandlers: SelectionHandlers
  tableHandlers: TableHandlers
  sidebarHandlers: {
    toggleSection: (sectionId: string) => void
    setSidebarMobile: (open: boolean) => void
  }
}

// ============================================================================
// INLINE EDITING TYPES
// ============================================================================

export interface InlineEditState {
  rowId?: string
  field?: string
  originalValue?: any
  currentValue?: any
  isEditing: boolean
}

export interface InlineEditHandlers {
  startEdit: (rowId: string, field: string, value: any) => void
  updateValue: (value: any) => void
  saveEdit: (callback?: () => Promise<void>) => Promise<void>
  cancelEdit: () => void
}

// ============================================================================
// VIRTUALIZATION TYPES
// ============================================================================

export interface VirtualizationOptions {
  itemHeight: number
  containerHeight: number
  bufferSize: number
  overscanCount: number
}

export interface VirtualizationState {
  scrollTop: number
  visibleStartIndex: number
  visibleEndIndex: number
  totalHeight: number
}

// ============================================================================
// API RESPONSE TYPES
// ============================================================================

export interface GetUsersResponse {
  users: UserItem[]
  total: number
  limit: number
  offset: number
}

export interface GetStatsResponse {
  totalUsers: number
  activeUsers: number
  pendingApprovals: number
  inProgressWorkflows: number
  systemHealth: number
  costPerUser: number
  roleDistribution?: RoleDistributionData
  userGrowth?: UserGrowthData
}

// ============================================================================
// COMPONENT PROP TYPES
// ============================================================================

export interface DirectoryHeaderProps {
  selectedCount: number
  totalCount: number
  onClearSelection?: () => void
  onToggleSidebar?: () => void
}

export interface UserDirectorySectionProps {
  selectedUserIds?: Set<string>
  onSelectionChange?: (ids: Set<string>) => void
  filters?: Partial<WorkbenchFilters>
}

export interface QuickActionBarProps {
  onAddUser?: () => void
  onImport?: () => void
  onExport?: () => void
  onRefresh?: () => void
}

export interface AdminSidebarProps {
  mobileOpen?: boolean
  onClose?: () => void
  filters?: WorkbenchFilters
  onFilterChange?: (key: FilterKey, value: any) => void
}

export interface BulkActionsPanelProps {
  selectedCount: number
  selectedUserIds: Set<string>
  onClear: () => void
}

export interface UsersTableWrapperProps {
  selectedUserIds?: Set<string>
  onSelectionChange?: (ids: Set<string>) => void
  filters?: Record<string, any>
}

// ============================================================================
// EXPORT TYPE
// ============================================================================

export type WorkbenchActionTypes = BulkActionType | 'filter' | 'sort' | 'select' | 'deselect'
