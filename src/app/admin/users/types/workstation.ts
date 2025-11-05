import type { ReactNode } from 'react'

// Layout Props
export interface WorkstationLayoutProps {
  sidebar: ReactNode
  main: ReactNode
  insights: ReactNode
  sidebarWidth?: number
  insightsPanelWidth?: number
  onSidebarToggle?: (open: boolean) => void
  onInsightsToggle?: (open: boolean) => void
}

export interface WorkstationSidebarProps {
  isOpen?: boolean
  onClose?: () => void
  filters?: UserFilters
  onFiltersChange?: (filters: UserFilters) => void
  stats?: QuickStatsData
  onAddUser?: () => void
  onReset?: () => void
}

export interface WorkstationMainContentProps {
  users?: Array<{ id: string; name?: string; email: string }>
  stats?: Record<string, number | string>
  isLoading?: boolean
  onAddUser?: () => void
  onImport?: () => void
  onBulkOperation?: () => void
  onExport?: () => void
  onRefresh?: () => void
}

export interface WorkstationInsightsPanelProps {
  isOpen?: boolean
  onClose?: () => void
  stats?: Record<string, number | string>
  analyticsData?: unknown
}

// State & Context Types
export interface UserFilters {
  search?: string
  roleFilter?: string | string[]
  statusFilter?: string | string[]
  departmentFilter?: string | string[]
  dateRange?: {
    from?: Date
    to?: Date
  }
}

export interface QuickStatsData {
  totalUsers: number
  activeUsers: number
  pendingApprovals: number
  inProgressWorkflows: number
  refreshedAt: Date
}

export interface WorkstationContextType {
  // Layout State
  sidebarOpen: boolean
  insightsPanelOpen: boolean
  setSidebarOpen: (open: boolean) => void
  setInsightsPanelOpen: (open: boolean) => void

  // Filter State
  filters: UserFilters
  setFilters: (filters: UserFilters) => void

  // Quick Stats
  quickStats: QuickStatsData
  quickStatsRefreshing: boolean
  refreshQuickStats: () => Promise<void>

  // Selection State
  selectedUserIds: Set<string>
  setSelectedUserIds: (ids: Set<string>) => void

  // Bulk Actions
  bulkActionType: string
  setBulkActionType: (type: string) => void
  bulkActionValue: string
  setBulkActionValue: (value: string) => void
  applyBulkAction: () => Promise<void>
  isApplyingBulkAction: boolean
}

// Responsive Breakpoints
export const BREAKPOINTS = {
  MOBILE: 375,
  TABLET: 768,
  LAPTOP: 1024,
  DESKTOP: 1400,
} as const

export const SIDEBAR_WIDTH = 280
export const INSIGHTS_PANEL_WIDTH = 300
