'use client'

import React, { memo, useCallback } from 'react'
import { Checkbox } from '@/components/ui/checkbox'
import { UserItem } from '../contexts/UsersContextProvider'
import UserRow from './UserRow'
import { VirtualScroller } from '@/lib/virtual-scroller'

interface UsersTableProps {
  users: UserItem[]
  isLoading?: boolean
  onViewProfile: (user: UserItem) => void
  onRoleChange?: (userId: string, role: UserItem['role']) => Promise<void>
  onEditInline?: (userId: string, field: string, value: any) => void
  onDeleteUser?: (userId: string) => Promise<void>
  onResetPassword?: (email: string) => Promise<void>
  isUpdating?: boolean
  selectedUserIds?: Set<string>
  onSelectUser?: (userId: string, selected: boolean) => void
  onSelectAll?: (selected: boolean) => void
}

const UserRowSkeleton = memo(function UserRowSkeleton() {
  return (
    <div className="grid grid-cols-[40px_minmax(220px,2fr)_minmax(240px,2fr)_120px_110px_120px_80px] items-center gap-4 px-4 py-3 border-b border-gray-200 bg-white animate-pulse">
      <div className="w-5 h-5 bg-gray-200 rounded" />
      <div className="h-4 bg-gray-200 rounded w-32" />
      <div className="h-3 bg-gray-200 rounded w-48" />
      <div className="h-6 bg-gray-200 rounded w-16" />
      <div className="h-6 bg-gray-200 rounded w-16" />
      <div className="h-4 bg-gray-200 rounded w-24" />
      <div className="h-8 bg-gray-200 rounded w-8" />
    </div>
  )
})

export const UsersTable = memo(function UsersTable({
  users,
  isLoading = false,
  onViewProfile,
  onRoleChange,
  onEditInline: onEditInlineProp,
  onDeleteUser,
  onResetPassword,
  isUpdating = false,
  selectedUserIds = new Set(),
  onSelectUser,
  onSelectAll
}: UsersTableProps) {
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

  const handleEditInline = useCallback(
    (userId: string, field: string, value: any) => {
      // Delegate to prop if provided
      if (onEditInlineProp) {
        try { onEditInlineProp(userId, field, value) } catch (e) { console.error(e) }
      } else {
        console.log(`Edit user ${userId}, field ${field}:`, value)
      }
    },
    [onEditInlineProp]
  )

  // Render a single user row with 6-column grid layout
  const renderUserRow = useCallback(
    (user: UserItem) => (
      <UserRow
        key={user.id}
        user={user}
        isSelected={selectedUserIds.has(user.id)}
        onSelect={handleSelectUser}
        onViewProfile={onViewProfile}
        onEditInline={handleEditInline}
        onDeleteUser={onDeleteUser}
        onResetPassword={onResetPassword}
        onRoleChange={onRoleChange}
      />
    ),
    [selectedUserIds, handleSelectUser, onViewProfile, handleEditInline, onDeleteUser, onResetPassword, onRoleChange]
  )

  return (
    <div className="flex flex-col h-full w-full bg-white border border-gray-200 rounded-lg overflow-hidden">
      {/* Table Header */}
      <div className="grid grid-cols-[40px_minmax(220px,2fr)_minmax(240px,2fr)_120px_110px_120px_80px] items-center gap-4 px-4 py-3 border-b border-gray-200 bg-gray-50 flex-shrink-0" role="row" aria-label="Table header">
        <div className="flex items-center justify-center">
          <Checkbox
            checked={allSelected || someSelected}
            onCheckedChange={handleSelectAllChange}
            aria-label={allSelected ? 'Deselect all users' : 'Select all users'}
            className={someSelected ? 'opacity-50' : ''}
          />
        </div>
        <div className="text-sm font-semibold text-gray-600">Name</div>
        <div className="text-sm font-semibold text-gray-600">Email</div>
        <div className="text-sm font-semibold text-gray-600">Role</div>
        <div className="text-sm font-semibold text-gray-600">Status</div>
        <div className="text-sm font-semibold text-gray-600">Date Joined</div>
        <div className="text-sm font-semibold text-gray-600">Actions</div>
      </div>

      {/* Table Body */}
      <div className="flex-1 overflow-hidden min-h-0 w-full">
        {isLoading ? (
          <div className="h-full space-y-0 overflow-auto" role="status" aria-label="Loading users">
            {Array.from({ length: 8 }).map((_, i) => (
              <UserRowSkeleton key={i} />
            ))}
          </div>
        ) : users.length ? (
          <div
            role="rowgroup"
            aria-label="User directory table body"
            className="h-full w-full overflow-hidden"
          >
            <VirtualScroller
              items={users}
              itemHeight={56}
              maxHeight="auto"
              renderItem={(user) => renderUserRow(user)}
              overscan={5}
              getKey={(user) => user.id}
              className="h-full w-full"
            />
          </div>
        ) : (
          <div className="h-full flex items-center justify-center text-gray-500 text-sm" role="status">
            No users found matching your criteria.
          </div>
        )}
      </div>
    </div>
  )
})

UsersTable.displayName = 'UsersTable'
