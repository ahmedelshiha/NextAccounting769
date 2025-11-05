import { createContext } from 'react'
import type { WorkstationContextType, QuickStatsData, UserFilters } from '../types/workstation'

const defaultQuickStats: QuickStatsData = {
  totalUsers: 0,
  activeUsers: 0,
  pendingApprovals: 0,
  inProgressWorkflows: 0,
  refreshedAt: new Date(),
}

const defaultFilters: UserFilters = {
  search: '',
  roleFilter: '',
  statusFilter: '',
  departmentFilter: '',
}

const defaultContextValue: WorkstationContextType = {
  // Layout State
  sidebarOpen: true,
  insightsPanelOpen: true,
  setSidebarOpen: () => {},
  setInsightsPanelOpen: () => {},

  // Filter State
  filters: defaultFilters,
  setFilters: () => {},

  // Quick Stats
  quickStats: defaultQuickStats,
  quickStatsRefreshing: false,
  refreshQuickStats: async () => {},

  // Selection State
  selectedUserIds: new Set(),
  setSelectedUserIds: () => {},

  // Bulk Actions
  bulkActionType: '',
  setBulkActionType: () => {},
  bulkActionValue: '',
  setBulkActionValue: () => {},
  applyBulkAction: async () => {},
  isApplyingBulkAction: false,
}

export const WorkstationContext = createContext<WorkstationContextType>(defaultContextValue)
