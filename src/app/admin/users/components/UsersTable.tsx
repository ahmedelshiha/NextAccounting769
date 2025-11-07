'use client'

import React, { memo, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { UserItem } from '../contexts/UsersContextProvider'
import { UserActions } from './UserActions'
import { usePermissions } from '@/lib/use-permissions'
import { VirtualScroller } from '@/lib/virtual-scroller'

interface UsersTableProps {
  users: UserItem[]
  isLoading?: boolean
  onViewProfile: (user: UserItem) => void
  onRoleChange?: (userId: string, role: UserItem['role']) => Promise<void>
  isUpdating?: boolean
  selectedUserIds?: Set<string>
  onSelectUser?: (userId: string, selected: boolean) => void
  onSelectAll?: (selected: boolean) => void
}

const UserRowSkeleton = memo(function UserRowSkeleton() {
  return (
    <div className="animate-pulse flex items-center justify-between p-4 bg-white border rounded-lg">
      <div className="flex items-center gap-4">
        <div className="w-10 h-10 bg-gray-200 rounded-full" />
        <div className="space-y-2">
          <div className="h-4 bg-gray-200 rounded w-32" />
          <div className="h-3 bg-gray-200 rounded w-48" />
        </div>
      </div>
      <div className="hidden sm:block space-y-1">
        <div className="h-3 bg-gray-200 rounded w-16" />
        <div className="h-3 bg-gray-200 rounded w-12" />
      </div>
    </div>
  )
})

const formatDate = (iso?: string) => {
  if (!iso) return 'Never'
  const d = new Date(iso)
  if (isNaN(d.getTime())) return 'Invalid date'
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
}

const getStatusColor = (status?: string) => {
  switch (status) {
    case 'ACTIVE':
      return 'bg-green-100 text-green-800 border-green-200'
    case 'INACTIVE':
      return 'bg-gray-100 text-gray-800 border-gray-200'
    case 'SUSPENDED':
      return 'bg-red-100 text-red-800 border-red-200'
    default:
      return 'bg-green-100 text-green-800 border-green-200'
  }
}

const getRoleColor = (role: string) => {
  switch (role) {
    case 'ADMIN':
      return 'bg-red-100 text-red-800 border-red-200'
    case 'TEAM_MEMBER':
      return 'bg-blue-100 text-blue-800 border-blue-200'
    case 'TEAM_LEAD':
      return 'bg-purple-100 text-purple-800 border-purple-200'
    case 'STAFF':
      return 'bg-blue-100 text-blue-800 border-blue-200'
    case 'CLIENT':
      return 'bg-green-100 text-green-800 border-green-200'
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200'
  }
}

export const UsersTable = memo(function UsersTable({
  users,
  isLoading = false,
  onViewProfile,
  onRoleChange,
  isUpdating = false,
  selectedUserIds = new Set(),
  onSelectUser,
  onSelectAll
}: UsersTableProps) {
  const perms = usePermissions()

  const handleRoleChange = useCallback(
    (userId: string, newRole: UserItem['role']) => {
      onRoleChange?.(userId, newRole).catch(console.error)
    },
    [onRoleChange]
  )

  const handleSelectUser = useCallback(
    (userId: string, selected: boolean) => {
      onSelectUser?.(userId, selected)
    },
    [onSelectUser]
  )

  const allSelected = users.length > 0 && users.every(u => selectedUserIds.has(u.id))
  const someSelected = users.length > 0 && users.some(u => selectedUserIds.has(u.id)) && !allSelected

  const handleSelectAllChange = useCallback(() => {
    onSelectAll?.(!allSelected)
  }, [allSelected, onSelectAll])

  // ✅ OPTIMIZED: Use VirtualScroller for handling 100+ users efficiently
  // Only renders ~10 visible rows instead of all rows
  const renderUserRow = useCallback(
    (user: UserItem) => (
      <div
        key={user.id}
        className="flex flex-col gap-3 p-4 bg-white border rounded-lg hover:shadow-sm w-full"
        role="row"
        aria-label={`User row for ${user.name || user.email}`}
      >
        {/* Top row: Checkbox and user info */}
        <div className="flex items-start gap-3 min-w-0">
          <Checkbox
            checked={selectedUserIds.has(user.id)}
            onCheckedChange={(checked) => handleSelectUser(user.id, checked === true)}
            aria-label={`Select ${user.name || user.email}`}
            className="mt-0.5 flex-shrink-0"
          />
          <div
            className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold flex-shrink-0 text-sm"
            aria-hidden="true"
          >
            {(user.name || user.email).charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <button
              onClick={() => onViewProfile(user)}
              className="font-medium text-sm sm:text-base text-gray-900 hover:text-blue-600 truncate w-full text-left focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded"
              aria-label={`View profile for ${user.name || user.email}`}
            >
              {user.name || 'Unnamed User'}
            </button>
            <div className="text-xs sm:text-sm text-gray-600 truncate">
              {user.email}
            </div>
            <div className="flex flex-wrap items-center gap-1 sm:gap-2 mt-1 text-xs text-gray-400">
              <span>Joined {formatDate(user.createdAt)}</span>
              {user.company && <span className="hidden sm:inline">•</span>}
              {user.company && <span className="hidden sm:inline">{user.company}</span>}
            </div>
          </div>
        </div>

        {/* Bottom row: Status, Role badge, and actions */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3 pl-11">
          <div
            className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(user.status)}`}
            role="status"
            aria-label={`Status: ${user.status || 'ACTIVE'}`}
          >
            {user.status || 'ACTIVE'}
          </div>
          <div
            className={`px-2 py-1 rounded text-xs font-medium hidden sm:inline-block ${getRoleColor(user.role)}`}
            role="status"
            aria-label={`Role: ${user.role}`}
          >
            {user.role}
          </div>
          {perms.canManageUsers && (
            <Select value={user.role} onValueChange={(val) => handleRoleChange(user.id, val as UserItem['role'])}>
              <SelectTrigger
                className="h-8 text-xs w-24 sm:w-28 flex-shrink-0 focus:outline-none focus:ring-2 focus:ring-blue-500"
                aria-label={`Change role for ${user.name || user.email}`}
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="CLIENT">Client</SelectItem>
                <SelectItem value="TEAM_MEMBER">Team Member</SelectItem>
                <SelectItem value="TEAM_LEAD">Team Lead</SelectItem>
                <SelectItem value="STAFF">Staff</SelectItem>
                <SelectItem value="ADMIN">Admin</SelectItem>
              </SelectContent>
            </Select>
          )}
          <div className="flex-1" />
          <UserActions
            user={user}
            onViewProfile={onViewProfile}
            isLoading={isUpdating}
          />
        </div>
      </div>
    ),
    [onViewProfile, perms.canManageUsers, handleRoleChange, isUpdating, selectedUserIds, handleSelectUser]
  )

  return (
    <Card>
      <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 space-y-0">
        <div className="space-y-1 min-w-0">
          <CardTitle className="text-xl sm:text-2xl">User Directory</CardTitle>
          <CardDescription className="text-xs sm:text-sm">Search, filter and manage users</CardDescription>
        </div>
        {users.length > 0 && (
          <div className="flex items-center gap-2 text-sm flex-shrink-0" role="toolbar" aria-label="Table selection actions">
            <Checkbox
              checked={allSelected || someSelected}
              onCheckedChange={handleSelectAllChange}
              aria-label={allSelected ? 'Deselect all users' : 'Select all users'}
              title={allSelected ? 'Deselect all users' : 'Select all users'}
              className={someSelected ? 'opacity-50' : ''}
            />
            <span className="text-gray-500 text-xs sm:text-sm" aria-live="polite">
              {selectedUserIds.size > 0 ? `${selectedUserIds.size} selected` : 'Select all'}
            </span>
          </div>
        )}
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="max-h-[60vh] space-y-2" role="status" aria-label="Loading users">
            {Array.from({ length: 5 }).map((_, i) => (
              <UserRowSkeleton key={i} />
            ))}
          </div>
        ) : users.length ? (
          <div
            role="grid"
            aria-label="User directory table"
            aria-rowcount={users.length}
          >
            <VirtualScroller
              items={users}
              itemHeight={96}
              maxHeight="60vh"
              renderItem={(user) => renderUserRow(user)}
              overscan={5}
              getKey={(user) => user.id}
              className="pr-1"
            />
          </div>
        ) : (
          <div className="h-[60vh] flex items-center justify-center text-gray-500 text-sm" role="status">
            No users found matching your criteria.
          </div>
        )}
      </CardContent>
    </Card>
  )
})

UsersTable.displayName = 'UsersTable'
