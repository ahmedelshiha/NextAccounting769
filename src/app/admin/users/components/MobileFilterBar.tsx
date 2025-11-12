'use client'

import React, { useCallback, useState, useMemo } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { X, Search, Filter, ChevronDown } from 'lucide-react'
import { FilterState } from '../hooks/useFilterState'
import { FilterOption } from './FilterMultiSelect'
import { MobileFilterPanel } from './MobileFilterPanel'
import { MobileFilterPills } from './MobileFilterPills'

export interface MobileFilterBarProps {
  filters: FilterState
  onFiltersChange: (filters: FilterState) => void
  roleOptions?: FilterOption[]
  statusOptions?: FilterOption[]
  onClearFilters: () => void
  filteredCount: number
  totalCount: number
  showClearButton?: boolean
}

/**
 * Mobile-optimized filter bar for screens <768px
 *
 * Features:
 * - Compact search input (full width)
 * - Collapsible filter panel (hidden by default)
 * - Active filter counter badge
 * - Horizontal scrolling filter pills
 * - Touch-friendly sizing (44px minimum height)
 * - Smooth animations
 *
 * Layout:
 * - Header: Search input + Filter toggle button + Clear button (if filters active)
 * - Optional expandable panel: Role/Status filters + Apply button
 * - Filter pills: Horizontal scrollable badges
 */
export function MobileFilterBar({
  filters,
  onFiltersChange,
  roleOptions = [],
  statusOptions = [],
  onClearFilters,
  filteredCount,
  totalCount,
  showClearButton = true
}: MobileFilterBarProps) {
  const [isPanelOpen, setIsPanelOpen] = useState(false)

  // Calculate active filter count
  const activeFilterCount = useMemo(() => {
    let count = 0
    if (filters.search) count++
    if (filters.roles?.length) count += filters.roles.length
    if (filters.statuses?.length) count += filters.statuses.length
    return count
  }, [filters])

  const hasActiveFilters = activeFilterCount > 0

  const handleSearchChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value
      onFiltersChange({
        ...filters,
        search: value
      })
    },
    [filters, onFiltersChange]
  )

  const handleSearchClear = useCallback(() => {
    onFiltersChange({
      ...filters,
      search: ''
    })
  }, [filters, onFiltersChange])

  const handleApplyFilters = useCallback(() => {
    setIsPanelOpen(false)
  }, [])

  const handleRemoveFilter = useCallback(
    (filterType: 'role' | 'status', value: string) => {
      if (filterType === 'role') {
        onFiltersChange({
          ...filters,
          roles: (filters.roles || []).filter(r => r !== value)
        })
      } else {
        onFiltersChange({
          ...filters,
          statuses: (filters.statuses || []).filter(s => s !== value)
        })
      }
    },
    [filters, onFiltersChange]
  )

  const handleClearAll = useCallback(() => {
    onClearFilters()
    setIsPanelOpen(false)
  }, [onClearFilters])

  return (
    <div className="mobile-filter-bar" data-testid="mobile-filter-bar">
      {/* Header: Search + Toggle Button + Clear Button */}
      <div className="mobile-filter-header">
        {/* Search Input */}
        <div className="mobile-search-wrapper">
          <Search className="mobile-search-icon" size={18} />
          <Input
            type="text"
            placeholder="Search by name, email..."
            value={filters.search || ''}
            onChange={handleSearchChange}
            className="mobile-search-input"
            data-testid="mobile-search-input"
          />
          {filters.search && (
            <button
              onClick={handleSearchClear}
              className="mobile-search-clear"
              aria-label="Clear search"
              data-testid="mobile-search-clear"
            >
              <X size={16} />
            </button>
          )}
        </div>

        {/* Filter Toggle Button */}
        <Button
          onClick={() => setIsPanelOpen(!isPanelOpen)}
          variant="outline"
          size="sm"
          className="mobile-filter-toggle"
          data-testid="mobile-filter-toggle"
        >
          <Filter size={18} />
          {activeFilterCount > 0 && (
            <span className="mobile-filter-badge">{activeFilterCount}</span>
          )}
        </Button>

        {/* Clear Button (if filters active) */}
        {hasActiveFilters && showClearButton && (
          <Button
            onClick={handleClearAll}
            variant="ghost"
            size="sm"
            className="mobile-clear-button"
            data-testid="mobile-clear-button"
          >
            <X size={18} />
          </Button>
        )}
      </div>

      {/* Expandable Filter Panel */}
      {isPanelOpen && (
        <MobileFilterPanel
          filters={filters}
          roleOptions={roleOptions}
          statusOptions={statusOptions}
          onFiltersChange={onFiltersChange}
          onApply={handleApplyFilters}
          onClear={handleClearAll}
          data-testid="mobile-filter-panel"
        />
      )}

      {/* Active Filter Pills (if any filters active) */}
      {hasActiveFilters && (
        <MobileFilterPills
          filters={filters}
          roleOptions={roleOptions}
          statusOptions={statusOptions}
          onRemoveFilter={handleRemoveFilter}
          data-testid="mobile-filter-pills"
        />
      )}

      {/* Results Counter */}
      {hasActiveFilters && (
        <div className="mobile-filter-counter">
          <span className="mobile-counter-text">
            {filteredCount} of {totalCount} users
          </span>
        </div>
      )}
    </div>
  )
}
