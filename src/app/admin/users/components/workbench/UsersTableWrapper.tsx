'use client'

import React, { useCallback, useMemo } from 'react'
import { useUsersContext } from '../../contexts/UsersContextProvider'
import { UsersTable } from '../UsersTable'
import { UserItem } from '../../contexts/UsersContextProvider'
import { UserProfileDialog } from '../UserProfileDialog'

interface UsersTableWrapperProps {
  selectedUserIds?: Set<string>
  onSelectionChange?: (ids: Set<string>) => void
  filters?: Record<string, any>
}

/**
 * UsersTable wrapper for AdminWorkBench
 * 
 * Adapts the existing UsersTable component to work with the new AdminWorkBench layout.
 * Handles data fetching, filtering, and selection management.
 */
export default function UsersTableWrapper({
  selectedUserIds = new Set(),
  onSelectionChange,
  filters = {}
}: UsersTableWrapperProps) {
  const context = useUsersContext()
  const [selectedUser, setSelectedUser] = React.useState<UserItem | null>(null)

  // Filter users based on provided filters
  const filteredUsers = useMemo(() => {
    let result = Array.isArray(context.users) ? [...context.users] : []

    // Apply search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase()
      result = result.filter(
        (u) =>
          u.name?.toLowerCase().includes(searchLower) ||
          u.email?.toLowerCase().includes(searchLower)
      )
    }

    // Apply role filter
    if (filters.role) {
      result = result.filter((u) => u.role === filters.role)
    }

    // Apply status filter
    if (filters.status) {
      result = result.filter((u) => u.status === filters.status)
    }

    // Apply department filter if available
    if (filters.department && 'department' in result[0]) {
      result = result.filter((u) => (u as any).department === filters.department)
    }

    return result
  }, [context.users, filters])

  const handleSelectUser = useCallback(
    (userId: string, selected: boolean) => {
      const newSelection = new Set(selectedUserIds)
      if (selected) {
        newSelection.add(userId)
      } else {
        newSelection.delete(userId)
      }
      onSelectionChange?.(newSelection)
    },
    [selectedUserIds, onSelectionChange]
  )

  const handleSelectAll = useCallback(
    (selected: boolean) => {
      if (selected) {
        onSelectionChange?.(new Set(filteredUsers.map((u) => u.id)))
      } else {
        onSelectionChange?.(new Set())
      }
    },
    [filteredUsers, onSelectionChange]
  )

  const handleViewProfile = useCallback((user: UserItem) => {
    setSelectedUser(user)
  }, [])

  const handleRoleChange = useCallback(
    async (userId: string, newRole: UserItem['role']) => {
      // This would be handled by a mutation
      console.log(`Changing role for user ${userId} to ${newRole}`)
    },
    []
  )

  return (
    <>
      <UsersTable
        users={filteredUsers}
        isLoading={context.isLoading || context.usersLoading}
        onViewProfile={handleViewProfile}
        onRoleChange={handleRoleChange}
        selectedUserIds={selectedUserIds}
        onSelectUser={handleSelectUser}
        onSelectAll={handleSelectAll}
      />

      {/* User Profile Dialog - gets state from context */}
      <UserProfileDialog />
    </>
  )
}
