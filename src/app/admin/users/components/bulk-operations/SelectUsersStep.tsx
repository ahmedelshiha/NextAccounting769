'use client'

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'

interface SelectUsersStepProps {
  tenantId: string
  filter: Record<string, any>
  onFilterChange: (filter: Record<string, any>) => void
  onSelectUsers: (userIds: string[]) => void
  onNext: () => void
}

interface User {
  id: string
  name: string | null
  email: string
  role: string
}

export const SelectUsersStep: React.FC<SelectUsersStepProps> = ({
  tenantId,
  filter,
  onFilterChange,
  onSelectUsers,
  onNext
}) => {
  const [users, setUsers] = useState<User[]>([])
  const [filteredUsers, setFilteredUsers] = useState<User[]>([])
  const [selectedUserIds, setSelectedUserIds] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectAll, setSelectAll] = useState(false)

  // Fetch users
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true)
        const response = await fetch(`/api/admin/users?tenantId=${tenantId}&limit=1000`)
        if (!response.ok) throw new Error('Failed to fetch users')
        const data = await response.json()
        setUsers(data.users || [])
        setFilteredUsers(data.users || [])
      } catch (err) {
        setError((err as Error).message)
      } finally {
        setLoading(false)
      }
    }

    fetchUsers()
  }, [tenantId])

  // Apply filters
  useEffect(() => {
    let result = users

    if (filter.searchTerm) {
      const term = filter.searchTerm.toLowerCase()
      result = result.filter(
        u =>
          u.name?.toLowerCase().includes(term) ||
          u.email.toLowerCase().includes(term)
      )
    }

    if (filter.roles && filter.roles.length > 0) {
      result = result.filter(u => filter.roles.includes(u.role))
    }

    setFilteredUsers(result)
    setSelectAll(false)
  }, [filter, users])

  const toggleUser = (userId: string) => {
    const newSelected = new Set(selectedUserIds)
    if (newSelected.has(userId)) {
      newSelected.delete(userId)
    } else {
      newSelected.add(userId)
    }
    setSelectedUserIds(newSelected)
  }

  const toggleSelectAll = () => {
    if (selectAll) {
      setSelectedUserIds(new Set())
      setSelectAll(false)
    } else {
      setSelectedUserIds(new Set(filteredUsers.map(u => u.id)))
      setSelectAll(true)
    }
  }

  const handleNext = () => {
    if (selectedUserIds.size === 0) {
      setError('Please select at least one user')
      return
    }
    onSelectUsers(Array.from(selectedUserIds))
    onNext()
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4">Select Users</h3>
        <p className="text-gray-600 mb-4">
          Choose which users to include in this bulk operation. You can filter and search.
        </p>
      </div>

      {/* Filters */}
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">Search</label>
            <Input
              placeholder="Search by name or email..."
              value={filter.searchTerm || ''}
              onChange={(e) =>
                onFilterChange({ ...filter, searchTerm: e.target.value })
              }
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Role Filter</label>
            <Select
              value={filter.roles?.[0] || 'ALL_ROLES'}
              onValueChange={(role) =>
                onFilterChange({
                  ...filter,
                  roles: role === 'ALL_ROLES' ? [] : [role]
                })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="All roles" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL_ROLES">All roles</SelectItem>
                <SelectItem value="ADMIN">Admin</SelectItem>
                <SelectItem value="STAFF">Staff</SelectItem>
                <SelectItem value="TEAM_MEMBER">Team Member</SelectItem>
                <SelectItem value="CLIENT">Client</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* User selection */}
      <div className="border rounded-lg overflow-hidden">
        <div className="bg-gray-50 p-3 flex items-center gap-3 border-b">
          <Checkbox
            checked={selectAll}
            onCheckedChange={toggleSelectAll}
            disabled={filteredUsers.length === 0}
          />
          <span className="font-medium text-sm">
            Select All ({filteredUsers.length} users)
          </span>
        </div>

        <div className="max-h-96 overflow-y-auto divide-y">
          {filteredUsers.length === 0 ? (
            <div className="p-4 text-center text-gray-500">
              No users found matching the filters
            </div>
          ) : (
            filteredUsers.map(user => (
              <div
                key={user.id}
                className="p-3 flex items-center gap-3 hover:bg-gray-50 transition-colors"
              >
                <Checkbox
                  checked={selectedUserIds.has(user.id)}
                  onCheckedChange={() => toggleUser(user.id)}
                />
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm">{user.name || user.email}</div>
                  <div className="text-xs text-gray-500">{user.email}</div>
                </div>
                <Badge variant="outline" className="text-xs">
                  {user.role}
                </Badge>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Summary */}
      <div className="bg-blue-50 p-4 rounded-lg">
        <p className="text-sm">
          <strong>{selectedUserIds.size} of {filteredUsers.length}</strong> users selected
        </p>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
          {error}
        </div>
      )}

      {/* Button */}
      <div className="flex justify-end gap-2">
        <Button
          onClick={handleNext}
          disabled={selectedUserIds.size === 0}
          className="bg-blue-600 hover:bg-blue-700"
        >
          Next: Choose Operation
        </Button>
      </div>
    </div>
  )
}
