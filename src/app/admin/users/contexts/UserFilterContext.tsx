'use client'

import React, { createContext, useContext, useState, useMemo, ReactNode } from 'react'
import { UserItem } from './UserDataContext'

/**
 * UserFilterContext - Manages user list filtering and search
 * Responsibilities:
 * - Search query state
 * - Role filtering
 * - Status filtering
 * - Computed filtered users list
 * - Filter persistence and reset
 */
interface UserFilterContextType {
  // Filter State
  search: string
  roleFilter: 'ALL' | 'ADMIN' | 'TEAM_LEAD' | 'TEAM_MEMBER' | 'STAFF' | 'CLIENT'
  statusFilter: 'ALL' | 'ACTIVE' | 'INACTIVE' | 'SUSPENDED'

  // Filter Actions
  setSearch: (search: string) => void
  setRoleFilter: (filter: 'ALL' | 'ADMIN' | 'TEAM_LEAD' | 'TEAM_MEMBER' | 'STAFF' | 'CLIENT') => void
  setStatusFilter: (filter: 'ALL' | 'ACTIVE' | 'INACTIVE' | 'SUSPENDED') => void

  // Helper: Compute filtered users
  getFilteredUsers: (users: UserItem[]) => UserItem[]
}

// Create Context
const UserFilterContext = createContext<UserFilterContextType | undefined>(undefined)

// Provider Component
interface UserFilterContextProviderProps {
  children: ReactNode
}

export function UserFilterContextProvider({ children }: UserFilterContextProviderProps) {
  // Filter state
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState<
    'ALL' | 'ADMIN' | 'TEAM_LEAD' | 'TEAM_MEMBER' | 'STAFF' | 'CLIENT'
  >('ALL')
  const [statusFilter, setStatusFilter] = useState<
    'ALL' | 'ACTIVE' | 'INACTIVE' | 'SUSPENDED'
  >('ALL')

  // Memoized filtering function
  const getFilteredUsers = useMemo(
    () => (users: UserItem[]) => {
      const q = search.trim().toLowerCase()
      return users
        .filter((u) => (roleFilter === 'ALL' ? true : u.role === roleFilter))
        .filter((u) => (statusFilter === 'ALL' ? true : (u.status || 'ACTIVE') === statusFilter))
        .filter(
          (u) =>
            !q ||
            (u.name?.toLowerCase().includes(q) ||
              u.email.toLowerCase().includes(q) ||
              u.company?.toLowerCase().includes(q))
        )
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    },
    [search, roleFilter, statusFilter]
  )

  const value: UserFilterContextType = {
    // Filter State
    search,
    roleFilter,
    statusFilter,

    // Filter Actions
    setSearch,
    setRoleFilter,
    setStatusFilter,

    // Helper
    getFilteredUsers
  }

  return <UserFilterContext.Provider value={value}>{children}</UserFilterContext.Provider>
}

// Hook to use UserFilterContext
export function useUserFilterContext() {
  const context = useContext(UserFilterContext)
  if (!context) {
    throw new Error('useUserFilterContext must be used within UserFilterContextProvider')
  }
  return context
}
