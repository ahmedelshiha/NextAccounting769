'use client'

import React, { memo, useCallback, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Users, RefreshCw, Download, Loader2, Search } from 'lucide-react'
import { usePermissions } from '@/lib/use-permissions'
import { useUsersContext } from '../contexts/UsersContextProvider'
import { useDebouncedSearch } from '../hooks/useDebouncedSearch'

interface DashboardHeaderProps {
  onRefresh: () => Promise<void>
  onExport: () => Promise<void>
  refreshing?: boolean
  exporting?: boolean
}

export const DashboardHeader = memo(function DashboardHeader({
  onRefresh,
  onExport,
  refreshing = false,
  exporting = false
}: DashboardHeaderProps) {
  const perms = usePermissions()
  const { search, setSearch, roleFilter, setRoleFilter, statusFilter, setStatusFilter } = useUsersContext()
  const [localSearch, setLocalSearch] = useState(search)

  // ✅ Debounce search input (400ms) to reduce filtering operations
  const debouncedSearch = useDebouncedSearch(localSearch, setSearch)

  const handleSearchChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value
      setLocalSearch(value)
      debouncedSearch(value)
    },
    [debouncedSearch]
  )

  const handleRoleFilterChange = useCallback(
    (value: string) => {
      setRoleFilter(value as any)
    },
    [setRoleFilter]
  )

  const handleStatusFilterChange = useCallback(
    (value: string) => {
      setStatusFilter(value as any)
    },
    [setStatusFilter]
  )

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header with Title and Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 flex items-center gap-2 sm:gap-3 truncate">
            <Users className="h-6 sm:h-8 w-6 sm:w-8 text-blue-600 flex-shrink-0" />
            <span>User Management</span>
          </h1>
          <p className="text-sm sm:text-base text-gray-600 mt-1 sm:mt-2 truncate">Manage users, roles, and monitor activity</p>
        </div>
        <div className="flex flex-wrap items-center gap-2 sm:gap-3 flex-shrink-0">
          <Button
            variant="outline"
            onClick={onRefresh}
            disabled={refreshing}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            {refreshing ? 'Refreshing…' : 'Refresh'}
          </Button>
          {(perms.canViewAnalytics || perms.canManageUsers) && (
            <Button
              variant="outline"
              onClick={onExport}
              disabled={exporting}
              className="flex items-center gap-2"
            >
              {exporting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Download className="h-4 w-4" />
              )}
              {exporting ? 'Exporting…' : 'Export'}
            </Button>
          )}
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col gap-3">
        {/* Search Bar - Full width on mobile */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            value={localSearch}
            onChange={handleSearchChange}
            placeholder="Search by name, email, or company"
            className="w-full pl-9 text-sm"
          />
        </div>

        {/* Filter Selects - Stack on mobile, row on tablet+ */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Select value={roleFilter || 'ALL'} onValueChange={handleRoleFilterChange}>
            <SelectTrigger className="w-full text-sm">
              <SelectValue placeholder="Role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Roles</SelectItem>
              <SelectItem value="ADMIN">Admin</SelectItem>
              <SelectItem value="TEAM_LEAD">Team Lead</SelectItem>
              <SelectItem value="TEAM_MEMBER">Team Member</SelectItem>
              <SelectItem value="STAFF">Staff</SelectItem>
              <SelectItem value="CLIENT">Client</SelectItem>
            </SelectContent>
          </Select>
          <Select value={statusFilter || 'ALL'} onValueChange={handleStatusFilterChange}>
            <SelectTrigger className="w-full text-sm">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Status</SelectItem>
              <SelectItem value="ACTIVE">Active</SelectItem>
              <SelectItem value="INACTIVE">Inactive</SelectItem>
              <SelectItem value="SUSPENDED">Suspended</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  )
})

DashboardHeader.displayName = 'DashboardHeader'
