'use client'

import React, { useCallback } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { X } from 'lucide-react'
import { FilterState } from '../hooks/useFilterState'

export interface UserDirectoryFilterBarProps {
  filters: FilterState
  onFiltersChange: (filters: FilterState) => void
  
  selectedCount: number
  totalCount: number
  filteredCount: number
  onSelectAll: (selected: boolean) => void
  
  roleOptions?: Array<{ value: string; label: string }>
  statusOptions?: Array<{ value: string; label: string }>
  
  onClearFilters: () => void
}

const DEFAULT_ROLE_OPTIONS = [
  { value: 'ADMIN', label: 'Admin' },
  { value: 'TEAM_LEAD', label: 'Team Lead' },
  { value: 'TEAM_MEMBER', label: 'Team Member' },
  { value: 'STAFF', label: 'Staff' },
  { value: 'CLIENT', label: 'Client' },
  { value: 'VIEWER', label: 'Viewer' }
]

const DEFAULT_STATUS_OPTIONS = [
  { value: 'ACTIVE', label: 'Active' },
  { value: 'INACTIVE', label: 'Inactive' },
  { value: 'SUSPENDED', label: 'Suspended' }
]

export function UserDirectoryFilterBar({
  filters,
  onFiltersChange,
  selectedCount,
  totalCount,
  filteredCount,
  onSelectAll,
  roleOptions = DEFAULT_ROLE_OPTIONS,
  statusOptions = DEFAULT_STATUS_OPTIONS,
  onClearFilters
}: UserDirectoryFilterBarProps) {
  const hasActiveFilters = !!(
    filters.search || 
    filters.role || 
    filters.status
  )

  const allFiltered = selectedCount === filteredCount && filteredCount > 0

  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    onFiltersChange({ ...filters, search: value })
  }, [filters, onFiltersChange])

  const handleRoleChange = useCallback((value: string) => {
    onFiltersChange({
      ...filters,
      role: value === 'ALL' ? null : value
    })
  }, [filters, onFiltersChange])

  const handleStatusChange = useCallback((value: string) => {
    onFiltersChange({
      ...filters,
      status: value === 'ALL' ? null : value
    })
  }, [filters, onFiltersChange])

  const handleSelectAllChange = useCallback((checked: boolean) => {
    onSelectAll(checked)
  }, [onSelectAll])

  return (
    <div className="sticky top-0 z-20 bg-white border-b border-gray-200">
      <div 
        className="grid grid-cols-[40px_minmax(180px,2fr)_140px_140px_auto] gap-3 p-3 items-center"
        role="toolbar"
        aria-label="User directory filters"
      >
        <div className="flex items-center justify-center">
          <Checkbox
            checked={allFiltered && selectedCount > 0}
            onCheckedChange={handleSelectAllChange}
            aria-label={selectedCount > 0 ? 'Deselect all users' : 'Select all filtered users'}
            title={selectedCount > 0 ? 'Deselect all' : 'Select all filtered users'}
          />
        </div>

        <div className="relative">
          <Input
            type="text"
            placeholder="Search name, email, phone..."
            value={filters.search}
            onChange={handleSearchChange}
            className="w-full text-sm pl-3 pr-8"
            aria-label="Search users by name, email, or phone"
          />
          {filters.search && (
            <button
              onClick={() => onFiltersChange({ ...filters, search: '' })}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              aria-label="Clear search"
              type="button"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        <Select
          value={filters.role || 'ALL'}
          onValueChange={handleRoleChange}
        >
          <SelectTrigger 
            className="text-sm"
            aria-label="Filter by role"
          >
            <SelectValue placeholder="All Roles" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Roles</SelectItem>
            {roleOptions.map(opt => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={filters.status || 'ALL'}
          onValueChange={handleStatusChange}
        >
          <SelectTrigger 
            className="text-sm"
            aria-label="Filter by status"
          >
            <SelectValue placeholder="All Statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Statuses</SelectItem>
            {statusOptions.map(opt => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {hasActiveFilters && (
          <Button
            onClick={onClearFilters}
            variant="outline"
            size="sm"
            className="text-xs"
            aria-label="Clear all filters"
          >
            <X className="w-3 h-3 mr-1" />
            Clear
          </Button>
        )}
      </div>

      <div className="px-3 py-2 text-xs text-gray-500 border-t border-gray-100 bg-gray-50">
        <span aria-live="polite" aria-atomic="true">
          {selectedCount > 0 && (
            <span className="font-medium text-gray-700">
              {selectedCount} selected
            </span>
          )}
          {selectedCount > 0 && ' • '}
          <span>
            {filteredCount} of {totalCount} users
          </span>
        </span>
      </div>
    </div>
  )
}
