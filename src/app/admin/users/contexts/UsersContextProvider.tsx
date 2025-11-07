'use client'

import React, { createContext, useContext, useMemo, ReactNode } from 'react'
import { UserDataContextProvider, useUserDataContext, UserStats, UserItem, HealthLog } from './UserDataContext'
import { UserUIContextProvider, useUserUIContext } from './UserUIContext'
import { UserFilterContextProvider, useUserFilterContext } from './UserFilterContext'
import { useUserManagementRealtime } from '../hooks/useUserManagementRealtime'

type TabType = 'overview' | 'details' | 'activity' | 'settings'
type StatusAction = 'activate' | 'deactivate' | 'suspend'

/**
 * Unified UsersContext Type
 * Backward-compatible interface that combines all three contexts.
 * This allows existing code to continue using useUsersContext() without changes.
 */
interface UsersContextType {
  // Data State (from UserDataContext)
  users: UserItem[]
  stats: UserStats | null
  selectedUser: UserItem | null
  activity: HealthLog[]

  // Loading State
  isLoading: boolean
  usersLoading: boolean
  activityLoading: boolean
  refreshing: boolean
  exporting: boolean
  updating: boolean
  permissionsSaving: boolean

  // Error State
  errorMsg: string | null
  activityError: string | null

  // Filter State (from UserFilterContext)
  search: string
  roleFilter: 'ALL' | 'ADMIN' | 'TEAM_LEAD' | 'TEAM_MEMBER' | 'STAFF' | 'CLIENT'
  statusFilter: 'ALL' | 'ACTIVE' | 'INACTIVE' | 'SUSPENDED'

  // Dialog State (from UserUIContext)
  profileOpen: boolean
  activeTab: TabType
  editMode: boolean
  editForm: Partial<UserItem>
  statusDialogOpen: boolean
  statusAction: { action: StatusAction; user: UserItem } | null
  permissionModalOpen: boolean

  // Computed
  filteredUsers: UserItem[]

  // Data Actions
  setUsers: (users: UserItem[]) => void
  setStats: (stats: UserStats | null) => void
  setSelectedUser: (user: UserItem | null) => void
  setActivity: (activity: HealthLog[]) => void

  // Loading Actions
  setIsLoading: (value: boolean) => void
  setUsersLoading: (value: boolean) => void
  setActivityLoading: (value: boolean) => void
  setRefreshing: (value: boolean) => void
  setExporting: (value: boolean) => void
  setUpdating: (value: boolean) => void
  setPermissionsSaving: (value: boolean) => void

  // Error Actions
  setErrorMsg: (msg: string | null) => void
  setActivityError: (msg: string | null) => void

  // Filter Actions
  setSearch: (search: string) => void
  setRoleFilter: (filter: 'ALL' | 'ADMIN' | 'TEAM_LEAD' | 'TEAM_MEMBER' | 'STAFF' | 'CLIENT') => void
  setStatusFilter: (filter: 'ALL' | 'ACTIVE' | 'INACTIVE' | 'SUSPENDED') => void

  // Dialog Actions
  setProfileOpen: (open: boolean) => void
  setActiveTab: (tab: TabType) => void
  setEditMode: (mode: boolean) => void
  setEditForm: (form: Partial<UserItem>) => void
  setStatusDialogOpen: (open: boolean) => void
  setStatusAction: (action: { action: StatusAction; user: UserItem } | null) => void
  setPermissionModalOpen: (open: boolean) => void

  // Helpers
  openUserProfile: (user: UserItem) => void
  closeUserProfile: () => void
  refreshUsers: () => Promise<void>
}

// Create unified context for backward compatibility
const UsersContext = createContext<UsersContextType | undefined>(undefined)

/**
 * Inner component that accesses all three contexts and combines them
 * This allows the provider to handle composition internally
 */
function UsersContextComposer({ children }: { children: ReactNode }) {
  const dataContext = useUserDataContext()
  const uiContext = useUserUIContext()
  const filterContext = useUserFilterContext()

  // Set up real-time user management synchronization
  // Safe to call here since we're inside UserDataContextProvider
  useUserManagementRealtime({
    debounceMs: 500,
    autoRefresh: true,
    refreshUsers: dataContext.refreshUsers
  })

  // Compute filtered users from data and filter contexts
  const filteredUsers = useMemo(() => {
    return filterContext.getFilteredUsers(dataContext.users)
  }, [dataContext.users, filterContext])

  // Combine all contexts into unified interface
  const value: UsersContextType = {
    // Data State
    users: dataContext.users,
    stats: dataContext.stats,
    selectedUser: dataContext.selectedUser,
    activity: dataContext.activity,

    // Loading State
    isLoading: dataContext.isLoading,
    usersLoading: dataContext.usersLoading,
    activityLoading: dataContext.activityLoading,
    refreshing: dataContext.refreshing,
    exporting: dataContext.exporting,
    updating: dataContext.updating,
    permissionsSaving: uiContext.permissionsSaving,

    // Error State
    errorMsg: dataContext.errorMsg,
    activityError: dataContext.activityError,

    // Filter State
    search: filterContext.search,
    roleFilter: filterContext.roleFilter,
    statusFilter: filterContext.statusFilter,

    // Dialog State
    profileOpen: uiContext.profileOpen,
    activeTab: uiContext.activeTab,
    editMode: uiContext.editMode,
    editForm: uiContext.editForm,
    statusDialogOpen: uiContext.statusDialogOpen,
    statusAction: uiContext.statusAction,
    permissionModalOpen: uiContext.permissionModalOpen,

    // Computed
    filteredUsers,

    // Data Actions
    setUsers: dataContext.setUsers,
    setStats: dataContext.setStats,
    setSelectedUser: dataContext.setSelectedUser,
    setActivity: dataContext.setActivity,

    // Loading Actions
    setIsLoading: dataContext.setIsLoading,
    setUsersLoading: dataContext.setUsersLoading,
    setActivityLoading: dataContext.setActivityLoading,
    setRefreshing: dataContext.setRefreshing,
    setExporting: dataContext.setExporting,
    setUpdating: dataContext.setUpdating,
    setPermissionsSaving: uiContext.setPermissionsSaving,

    // Error Actions
    setErrorMsg: dataContext.setErrorMsg,
    setActivityError: dataContext.setActivityError,

    // Filter Actions
    setSearch: filterContext.setSearch,
    setRoleFilter: filterContext.setRoleFilter,
    setStatusFilter: filterContext.setStatusFilter,

    // Dialog Actions
    setProfileOpen: uiContext.setProfileOpen,
    setActiveTab: uiContext.setActiveTab,
    setEditMode: uiContext.setEditMode,
    setEditForm: uiContext.setEditForm,
    setStatusDialogOpen: uiContext.setStatusDialogOpen,
    setStatusAction: uiContext.setStatusAction,
    setPermissionModalOpen: uiContext.setPermissionModalOpen,

    // Helpers
    openUserProfile: uiContext.openUserProfile,
    closeUserProfile: uiContext.closeUserProfile,
    refreshUsers: dataContext.refreshUsers
  }

  return <UsersContext.Provider value={value}>{children}</UsersContext.Provider>
}

/**
 * Main Provider Component
 * Wraps three focused context providers and composes them into a unified context
 *
 * Benefits of this architecture:
 * - ✅ Backward compatible: useUsersContext() still works
 * - ✅ Separation of concerns: Data, UI, and Filter logic separated
 * - ✅ Performance: Components only re-render when relevant state changes
 * - ✅ Maintainability: Each context is responsible for one domain
 * - ✅ Testability: Each context can be tested independently
 */
interface UsersContextProviderProps {
  children: ReactNode
  initialUsers?: UserItem[]
  initialStats?: UserStats | null
}

export function UsersContextProvider({
  children,
  initialUsers = [],
  initialStats = null
}: UsersContextProviderProps) {
  return (
    <UserDataContextProvider initialUsers={initialUsers} initialStats={initialStats}>
      <UserUIContextProvider>
        <UserFilterContextProvider>
          <UsersContextComposer>{children}</UsersContextComposer>
        </UserFilterContextProvider>
      </UserUIContextProvider>
    </UserDataContextProvider>
  )
}

/**
 * Backward-compatible hook for accessing unified context
 * Use this for existing code. For new code, consider using specific hooks:
 * - useUserDataContext() for data operations
 * - useUserUIContext() for UI state
 * - useUserFilterContext() for filtering
 */
export function useUsersContext() {
  const context = useContext(UsersContext)
  if (!context) {
    throw new Error('useUsersContext must be used within UsersContextProvider')
  }
  return context
}

// Re-export types and hooks for convenience
export type { UserStats, UserItem, HealthLog }
export { useUserDataContext, useUserUIContext, useUserFilterContext }
