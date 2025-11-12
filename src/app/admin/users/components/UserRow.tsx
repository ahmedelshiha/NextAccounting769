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
import { Dialog, DialogContent, DialogHeader, DialogFooter, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogFooter, AlertDialogTitle, AlertDialogDescription, AlertDialogAction, AlertDialogCancel } from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'

interface UserRowProps {
  user: UserItem
  isSelected?: boolean
  onSelect?: (userId: string, selected: boolean) => void
  onViewProfile?: (user: UserItem) => void
  onEditInline?: (userId: string, field: string, value: any) => void
  onDeleteUser?: (userId: string) => Promise<void>
  onResetPassword?: (email: string) => Promise<void>
  onRoleChange?: (userId: string, role: UserItem['role']) => Promise<void>
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
  onEditInline,
  onDeleteUser,
  onResetPassword,
  onRoleChange
}: UserRowProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editValue, setEditValue] = useState(user.name || '')
  const [isRoleDialogOpen, setIsRoleDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [selectedRole, setSelectedRole] = useState<UserItem['role']>(user.role || 'VIEWER')
  const roles = ['ADMIN','EDITOR','VIEWER','TEAM_LEAD','TEAM_MEMBER','STAFF','CLIENT'] as const

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
      ADMIN: 'bg-red-50 text-red-700 border border-red-100',
      EDITOR: 'bg-blue-50 text-blue-700 border border-blue-100',
      VIEWER: 'bg-emerald-50 text-emerald-700 border border-emerald-100',
      TEAM_LEAD: 'bg-purple-50 text-purple-700 border border-purple-100',
      TEAM_MEMBER: 'bg-sky-50 text-sky-700 border border-sky-100',
      STAFF: 'bg-cyan-50 text-cyan-700 border border-cyan-100',
      CLIENT: 'bg-emerald-50 text-emerald-700 border border-emerald-100'
    }
    return colors[role] || 'bg-gray-50 text-gray-800 border border-gray-100'
  }

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      ACTIVE: 'bg-green-50 text-green-700 border border-green-200',
      INACTIVE: 'bg-red-50 text-red-700 border border-red-200',
      SUSPENDED: 'bg-red-50 text-red-700 border border-red-200',
      PENDING: 'bg-yellow-50 text-yellow-700 border border-yellow-200'
    }
    return colors[status] || 'bg-gray-50 text-gray-800 border border-gray-100'
  }

  return (
    <div className="grid grid-cols-[40px_minmax(220px,2fr)_minmax(240px,2fr)_120px_110px_120px_80px] items-center gap-4 px-4 py-3 border-b border-gray-200 hover:bg-gray-50 transition-colors">
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

      {/* Name */}
      <div className="flex items-center gap-3">
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
            <p
              className="text-sm font-medium text-gray-900 cursor-text hover:underline"
              onDoubleClick={() => setIsEditing(true)}
              title="Double-click to edit"
            >
              {user.name}
            </p>
          )}
        </div>
      </div>

      {/* Email */}
      <div className="text-sm text-gray-600 truncate hidden md:block">
        {user.email}
      </div>

      {/* Role */}
      <div>
        <span
          className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded ${getRoleColor(
            user.role || 'VIEWER'
          )}`}
        >
          {user.role || 'VIEWER'}
        </span>
      </div>

      {/* Status */}
      <div>
        <span
          className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded ${getStatusColor(
            user.status || 'ACTIVE'
          )}`}
        >
          {user.status || 'ACTIVE'}
        </span>
      </div>

      {/* Date Joined */}
      <div className="text-sm text-gray-600 whitespace-nowrap">
        {(() => {
          try {
            const d = new Date(user.createdAt)
            return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
          } catch {
            return user.createdAt
          }
        })()}
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
            <DropdownMenuItem onClick={() => onResetPassword?.(user.email || '')}>
              Reset Password
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => { setSelectedRole(user.role || 'VIEWER'); setIsRoleDialogOpen(true) }}>
              Change Role
            </DropdownMenuItem>
            <DropdownMenuItem className="text-red-600" onClick={() => setIsDeleteDialogOpen(true)}>
              Delete User
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Role change dialog */}
      <Dialog open={isRoleDialogOpen} onOpenChange={setIsRoleDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Change Role</DialogTitle>
            <DialogDescription>Assign a new role to {user.name}</DialogDescription>
          </DialogHeader>

          <div className="p-4">
            <Select value={selectedRole} onValueChange={(v) => setSelectedRole(v as any)}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select role" />
              </SelectTrigger>
              <SelectContent>
                {roles.map((r) => (
                  <SelectItem key={r} value={r}>{r}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsRoleDialogOpen(false)}>Cancel</Button>
            <Button onClick={async () => {
              try {
                await onRoleChange?.(user.id, selectedRole)
                setIsRoleDialogOpen(false)
              } catch (e) {
                console.error(e)
                alert('Failed to change role')
              }
            }}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete user</AlertDialogTitle>
            <AlertDialogDescription>Are you sure you want to delete {user.name || user.email}? This action cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setIsDeleteDialogOpen(false)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={async () => {
              try {
                await onDeleteUser?.(user.id)
                setIsDeleteDialogOpen(false)
              } catch (e) {
                console.error(e)
                alert('Failed to delete user')
              }
            }}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
})

export default UserRow
