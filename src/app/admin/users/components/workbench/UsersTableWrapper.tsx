'use client'

import React, { useCallback, useMemo } from 'react'
import { useUsersContext } from '../../contexts/UsersContextProvider'
import { UsersTable } from '../UsersTable'
import { UserItem } from '../../contexts/UsersContextProvider'
import { UserProfileDialog } from '../UserProfileDialog'
import DirectoryHeader from './DirectoryHeader'
import { UserDirectoryFilterBar } from '../UserDirectoryFilterBar'
import { UserDirectoryFilterBarEnhanced } from '../UserDirectoryFilterBarEnhanced'
import { MobileFilterBar } from '../MobileFilterBar'
import { useFilterState } from '../../hooks/useFilterState'
import { useUserActions } from '../../hooks/useUserActions'
import { useMediaQuery } from '@/hooks/useMediaQuery'
import { deleteUser as deleteUserApi } from './api/users'
import { toast } from 'sonner'
import '../styles/mobile-optimizations.css'

interface UsersTableWrapperProps {
  selectedUserIds?: Set<string>
  onSelectionChange?: (ids: Set<string>) => void
  filters?: Record<string, any>
  onViewProfileInline?: (user: UserItem) => void
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
  filters = {},
  onViewProfileInline
}: UsersTableWrapperProps) {
  const context = useUsersContext()

  // Use filter state hook for centralized filter management
  const {
    filters: filterState,
    updateFilter,
    filteredUsers,
    hasActiveFilters,
    clearFilters,
    stats,
    toggleRole,
    toggleStatus,
    clearRoles,
    clearStatuses
  } = useFilterState(context.users)

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
    context.setSelectedUser(user)
    if (onViewProfileInline) {
      onViewProfileInline(user)
    } else {
      context.setProfileOpen(true)
    }
  }, [context, onViewProfileInline])

  const { updateUser, updateUserRole } = useUserActions({ onRefetchUsers: context.refreshUsers, onSuccess: (msg) => toast.success(msg), onError: (err) => toast.error(err) })

  const handleRoleChange = useCallback(
    async (userId: string, newRole: UserItem['role']) => {
      try {
        await updateUserRole(userId, newRole)
      } catch (e) {
        console.error(e)
      }
    },
    [updateUserRole]
  )

  const handleEditInline = useCallback(async (userId: string, field: string, value: any) => {
    try {
      await updateUser(userId, { [field]: value })
    } catch (e) {
      console.error(e)
    }
  }, [updateUser])

  const handleDeleteUser = useCallback(async (userId: string) => {
    try {
      await deleteUserApi(userId)
      toast.success('User deleted')
      await context.refreshUsers()
    } catch (e) {
      console.error(e)
      toast.error('Failed to delete user')
    }
  }, [context])

  const handleResetPassword = useCallback(async (email: string) => {
    try {
      const res = await fetch('/api/auth/password/forgot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      })
      if (!res.ok) throw new Error('Failed')
      toast.success('Password reset email queued')
    } catch (e) {
      console.error(e)
      toast.error('Failed to send reset email')
    }
  }, [])

  // Mobile detection for responsive filter bar
  const isMobile = useMediaQuery('(max-width: 767px)')

  // Role and status options (moved outside JSX for reuse)
  const roleOptions = useMemo(
    () => [
      { value: 'ADMIN', label: 'Admin' },
      { value: 'TEAM_LEAD', label: 'Team Lead' },
      { value: 'TEAM_MEMBER', label: 'Team Member' },
      { value: 'STAFF', label: 'Staff' },
      { value: 'CLIENT', label: 'Client' },
      { value: 'VIEWER', label: 'Viewer' }
    ],
    []
  )

  const statusOptions = useMemo(
    () => [
      { value: 'ACTIVE', label: 'Active' },
      { value: 'INACTIVE', label: 'Inactive' },
      { value: 'SUSPENDED', label: 'Suspended' }
    ],
    []
  )

  return (
    <>
      <div className="flex flex-col h-full w-full overflow-hidden">
        <DirectoryHeader
          selectedCount={selectedUserIds.size}
          onClearSelection={() => onSelectionChange?.(new Set())}
          onSidebarToggle={() => console.log('Toggle sidebar')}
        />

        {isMobile ? (
          <MobileFilterBar
            filters={filterState}
            onFiltersChange={(newFilters) => {
              updateFilter('search', newFilters.search)
              updateFilter('roles', newFilters.roles || [])
              updateFilter('statuses', newFilters.statuses || [])
            }}
            roleOptions={roleOptions}
            statusOptions={statusOptions}
            onClearFilters={clearFilters}
            filteredCount={stats.filteredCount}
            totalCount={stats.totalCount}
            showClearButton={true}
          />
        ) : (
          <UserDirectoryFilterBarEnhanced
            filters={filterState}
            onFiltersChange={(newFilters) => {
              updateFilter('search', newFilters.search)
              updateFilter('roles', newFilters.roles || [])
              updateFilter('statuses', newFilters.statuses || [])
            }}
            onToggleRole={toggleRole}
            onToggleStatus={toggleStatus}
            onClearRoles={clearRoles}
            onClearStatuses={clearStatuses}
            selectedCount={selectedUserIds.size}
            totalCount={stats.totalCount}
            filteredCount={stats.filteredCount}
            filteredUsers={filteredUsers}
            allUsers={context.users}
            selectedUserIds={selectedUserIds}
            onSelectAll={handleSelectAll}
            onClearFilters={clearFilters}
            roleOptions={roleOptions}
            statusOptions={statusOptions}
            multiSelect={true}
            showExport={true}
          />
        )}

        <div className="flex-1 overflow-hidden min-h-0 w-full">
          <UsersTable
            users={filteredUsers}
            isLoading={context.isLoading || context.usersLoading}
            onViewProfile={handleViewProfile}
            onRoleChange={handleRoleChange}
            onEditInline={handleEditInline}
            onDeleteUser={handleDeleteUser}
            onResetPassword={handleResetPassword}
            selectedUserIds={selectedUserIds}
            onSelectUser={handleSelectUser}
            onSelectAll={handleSelectAll}
          />
        </div>
      </div>

      {/* User Profile Dialog - gets state from context */}
      <UserProfileDialog />
    </>
  )
}
