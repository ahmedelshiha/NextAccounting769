'use client'

import React, { useState, useCallback, memo } from 'react'
import { ChevronDown, MoreVertical } from 'lucide-react'
import { Checkbox } from '@/components/ui/checkbox'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import { UserItem } from '../contexts/UsersContextProvider'

interface UserRowProps {
  user: UserItem
  isSelected?: boolean
  onSelect?: (userId: string, selected: boolean) => void
  onViewProfile?: (user: UserItem) => void
  onEditInline?: (userId: string, field: string, value: any) => void
}

/**
 * Individual user row in virtualized table
 * 
 * Features:
 * - Checkbox + avatar + name/email display
 * - Role badge + status badge
 * - Hover: shows action menu
 * - Double-click: enables inline edit for name
 * - Responsive grid layout
 */
const UserRow = memo(function UserRow({
  user,
  isSelected = false,
  onSelect,
  onViewProfile,
  onEditInline
}: UserRowProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editValue, setEditValue] = useState(user.name || '')

  const handleSave = useCallback(async () => {
    if (editValue.trim() && editValue !== user.name) {
      onEditInline?.(user.id, 'name', editValue)
    }
    setIsEditing(false)
  }, [editValue, user.id, user.name, onEditInline])

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
        handleSave()
      } else if (e.key === 'Escape') {
        setIsEditing(false)
        setEditValue(user.name || '')
      }
    },
    [handleSave, user.name]
  )

  const getRoleColor = (role: string) => {
    const colors: Record<string, string> = {
      ADMIN: 'bg-red-100 text-red-800',
      EDITOR: 'bg-blue-100 text-blue-800',
      VIEWER: 'bg-green-100 text-green-800',
      TEAM_LEAD: 'bg-purple-100 text-purple-800',
      TEAM_MEMBER: 'bg-blue-100 text-blue-800',
      STAFF: 'bg-cyan-100 text-cyan-800',
      CLIENT: 'bg-emerald-100 text-emerald-800'
    }
    return colors[role] || 'bg-gray-100 text-gray-800'
  }

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      ACTIVE: 'bg-green-100 text-green-800',
      INACTIVE: 'bg-gray-100 text-gray-800',
      SUSPENDED: 'bg-red-100 text-red-800',
      PENDING: 'bg-yellow-100 text-yellow-800'
    }
    return colors[status] || 'bg-gray-100 text-gray-800'
  }

  return (
    <div className="grid grid-cols-[40px_2fr_2fr_1fr_1fr_80px] items-center gap-4 px-4 py-3 border-b hover:bg-gray-50 transition-colors">
      {/* Checkbox */}
      <div className="flex items-center justify-center">
        <Checkbox
          checked={isSelected}
          onCheckedChange={(checked) =>
            onSelect?.(user.id, checked === true)
          }
          aria-label={`Select user ${user.name}`}
        />
      </div>

      {/* Name + Email */}
      <div className="flex items-center gap-3">
        <img
          src={user.avatar || 'https://via.placeholder.com/32'}
          alt={user.name}
          className="w-8 h-8 rounded-full bg-gray-200 object-cover"
          loading="lazy"
        />
        <div className="min-w-0">
          {isEditing ? (
            <input
              autoFocus
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onBlur={handleSave}
              onKeyDown={handleKeyDown}
              className="w-full px-2 py-1 border rounded text-sm font-medium"
              aria-label="Edit user name"
            />
          ) : (
            <>
              <p
                className="text-sm font-medium text-gray-900 cursor-text hover:underline"
                onDoubleClick={() => setIsEditing(true)}
                title="Double-click to edit"
              >
                {user.name}
              </p>
              <p className="text-xs text-gray-500 truncate">{user.email}</p>
            </>
          )}
        </div>
      </div>

      {/* Email (duplicate for grid layout) */}
      <div className="text-sm text-gray-600 truncate hidden md:block">
        {user.email}
      </div>

      {/* Role */}
      <div>
        <span
          className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded ${getRoleColor(
            user.role
          )}`}
        >
          {user.role}
        </span>
      </div>

      {/* Status */}
      <div>
        <span
          className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded ${getStatusColor(
            user.status
          )}`}
        >
          {user.status}
        </span>
      </div>

      {/* Actions Menu */}
      <div className="flex items-center justify-center">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className="p-1 rounded hover:bg-gray-100 transition-colors"
              aria-label="More actions"
            >
              <MoreVertical className="w-4 h-4 text-gray-500" />
            </button>
          </DropdownMenuTrigger>

          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem onClick={() => onViewProfile?.(user)}>
              View Profile
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setIsEditing(true)}>
              Edit Name
            </DropdownMenuItem>
            <DropdownMenuItem>Reset Password</DropdownMenuItem>
            <DropdownMenuItem>Change Role</DropdownMenuItem>
            <DropdownMenuItem className="text-red-600">
              Delete User
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  )
})

export default UserRow
