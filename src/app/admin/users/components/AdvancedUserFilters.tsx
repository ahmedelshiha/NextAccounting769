'use client'

import React, { useState } from 'react'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { ChevronDown, X } from 'lucide-react'
import { useMediaQuery } from '@/hooks/useMediaQuery'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'

export interface UserFilters {
  search: string
  role?: string
  status?: string
  department?: string
  dateRange?: 'all' | 'today' | 'week' | 'month'
}

interface AdvancedUserFiltersProps {
  filters: UserFilters
  onFiltersChange: (filters: UserFilters) => void
  onReset?: () => void
  roleOptions?: Array<{ value: string; label: string }>
  statusOptions?: Array<{ value: string; label: string }>
  departmentOptions?: Array<{ value: string; label: string }>
}

const DEFAULT_ROLE_OPTIONS = [
  { value: 'ADMIN', label: 'Admin' },
  { value: 'TEAM_LEAD', label: 'Team Lead' },
  { value: 'TEAM_MEMBER', label: 'Team Member' },
  { value: 'STAFF', label: 'Staff' },
  { value: 'CLIENT', label: 'Client' }
]

const DEFAULT_STATUS_OPTIONS = [
  { value: 'ACTIVE', label: 'Active' },
  { value: 'INACTIVE', label: 'Inactive' },
  { value: 'SUSPENDED', label: 'Suspended' },
  { value: 'PENDING', label: 'Pending Activation' }
]

const DEFAULT_DATE_RANGE_OPTIONS = [
  { value: 'all', label: 'All Time' },
  { value: 'today', label: 'Today' },
  { value: 'week', label: 'This Week' },
  { value: 'month', label: 'This Month' }
]

/**
 * Advanced User Filters with Mobile Optimization
 * 
 * Comprehensive filtering interface for user directory:
 * - Full-text search with debouncing
 * - Role filter (RBAC)
 * - Status filter (Active, Inactive, Suspended)
 * - Department filter
 * - Date range filter (Created date)
 * - Reset all filters
 * 
 * Features:
 * - Mobile: Collapsible filter panel with active filter counter
 * - Desktop: Always-visible multi-column layout
 * - Clear visual feedback
 * - Accessibility support
 * - Customizable options
 */
export function AdvancedUserFilters({
  filters,
  onFiltersChange,
  onReset,
  roleOptions = DEFAULT_ROLE_OPTIONS,
  statusOptions = DEFAULT_STATUS_OPTIONS,
  departmentOptions = []
}: AdvancedUserFiltersProps) {
  const isMobile = useMediaQuery('(max-width: 768px)')
  const [isOpen, setIsOpen] = useState(!isMobile)
  
  const hasActiveFilters =
    !!filters.search ||
    !!filters.role ||
    !!filters.status ||
    !!filters.department ||
    (filters.dateRange !== undefined && filters.dateRange !== 'all')
  
  const activeFilterCount = [
    filters.search ? 1 : 0,
    filters.role ? 1 : 0,
    filters.status ? 1 : 0,
    filters.department ? 1 : 0,
    (filters.dateRange && filters.dateRange !== 'all') ? 1 : 0,
  ].reduce((a, b) => a + b, 0)

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      {/* Mobile: Collapsible header */}
      {isMobile && (
        <Collapsible open={isOpen} onOpenChange={setIsOpen}>
          <CollapsibleTrigger className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 border-none bg-transparent text-left">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-900">🔎 Filters</span>
              {activeFilterCount > 0 && (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  {activeFilterCount}
                </span>
              )}
            </div>
            <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
          </CollapsibleTrigger>
          <CollapsibleContent className="border-t border-gray-200 p-4 space-y-4">
            <FilterContent
              filters={filters}
              onFiltersChange={onFiltersChange}
              onReset={onReset}
              hasActiveFilters={hasActiveFilters}
              roleOptions={roleOptions}
              statusOptions={statusOptions}
              departmentOptions={departmentOptions}
              isMobile={isMobile}
            />
          </CollapsibleContent>
        </Collapsible>
      )}
      
      {/* Desktop: Always visible */}
      {!isMobile && (
        <div className="p-4 space-y-4">
          <FilterContent
            filters={filters}
            onFiltersChange={onFiltersChange}
            onReset={onReset}
            hasActiveFilters={hasActiveFilters}
            roleOptions={roleOptions}
            statusOptions={statusOptions}
            departmentOptions={departmentOptions}
            isMobile={isMobile}
          />
        </div>
      )}
    </div>
  )
}

/**
 * Filter Controls Component (shared between mobile and desktop)
 */
function FilterContent({
  filters,
  onFiltersChange,
  onReset,
  hasActiveFilters,
  roleOptions,
  statusOptions,
  departmentOptions,
  isMobile,
}: {
  filters: UserFilters
  onFiltersChange: (filters: UserFilters) => void
  onReset?: () => void
  hasActiveFilters: boolean
  roleOptions: Array<{ value: string; label: string }>
  statusOptions: Array<{ value: string; label: string }>
  departmentOptions: Array<{ value: string; label: string }>
  isMobile: boolean
}) {
  return (
    <>
      {/* Search Bar */}
      <div>
        <label htmlFor="search" className="block text-xs md:text-sm font-medium text-gray-700 mb-2">
          Search Users
        </label>
        <div className="relative">
          <Input
            id="search"
            type="text"
            placeholder="Search by name, email, or ID..."
            value={filters.search}
            onChange={(e) =>
              onFiltersChange({
                ...filters,
                search: e.target.value
              })
            }
            className="w-full pr-8 text-sm"
          />
          {filters.search && (
            <button
              onClick={() => onFiltersChange({ ...filters, search: '' })}
              className="absolute right-2 top-2.5 text-gray-400 hover:text-gray-600"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Filter Grid - Mobile: Stack, Desktop: 4 columns */}
      <div className={`grid gap-3 md:gap-4 ${isMobile ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4'}`}>
        {/* Role Filter */}
        <div>
          <label htmlFor="role" className="block text-xs md:text-sm font-medium text-gray-700 mb-2">
            Role
          </label>
          <Select
            value={filters.role || 'ALL_ROLES'}
            onValueChange={(value) =>
              onFiltersChange({
                ...filters,
                role: value === 'ALL_ROLES' ? undefined : value
              })
            }
          >
            <SelectTrigger id="role" className="text-sm">
              <SelectValue placeholder="All Roles" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL_ROLES">All Roles</SelectItem>
              {roleOptions.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Status Filter */}
        <div>
          <label htmlFor="status" className="block text-xs md:text-sm font-medium text-gray-700 mb-2">
            Status
          </label>
          <Select
            value={filters.status || 'ALL_STATUSES'}
            onValueChange={(value) =>
              onFiltersChange({
                ...filters,
                status: value === 'ALL_STATUSES' ? undefined : value
              })
            }
          >
            <SelectTrigger id="status" className="text-sm">
              <SelectValue placeholder="All Statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL_STATUSES">All Statuses</SelectItem>
              {statusOptions.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Department Filter (if available) */}
        {departmentOptions.length > 0 && (
          <div>
            <label htmlFor="department" className="block text-xs md:text-sm font-medium text-gray-700 mb-2">
              Department
            </label>
            <Select
              value={filters.department || 'ALL_DEPARTMENTS'}
              onValueChange={(value) =>
                onFiltersChange({
                  ...filters,
                  department: value === 'ALL_DEPARTMENTS' ? undefined : value
                })
              }
            >
              <SelectTrigger id="department" className="text-sm">
                <SelectValue placeholder="All Departments" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL_DEPARTMENTS">All Departments</SelectItem>
                {departmentOptions.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Date Range Filter */}
        <div>
          <label htmlFor="dateRange" className="block text-xs md:text-sm font-medium text-gray-700 mb-2">
            Created Date
          </label>
          <Select
            value={filters.dateRange || 'all'}
            onValueChange={(value) =>
              onFiltersChange({
                ...filters,
                dateRange: value as any
              })
            }
          >
            <SelectTrigger id="dateRange" className="text-sm">
              <SelectValue placeholder="Select period" />
            </SelectTrigger>
            <SelectContent>
              {DEFAULT_DATE_RANGE_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Reset Button */}
      {hasActiveFilters && (
        <div className={isMobile ? 'pt-2' : 'flex justify-end pt-2'}>
          <Button
            onClick={onReset}
            variant="outline"
            size="sm"
            className="w-full md:w-auto text-xs md:text-sm"
          >
            <X className="w-3 h-3 mr-1" />
            Clear Filters
          </Button>
        </div>
      )}
    </>
  )
}
