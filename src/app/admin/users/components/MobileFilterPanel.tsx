'use client'

import React, { useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { ChevronUp } from 'lucide-react'
import { FilterState } from '../hooks/useFilterState'
import { FilterOption } from './FilterMultiSelect'

export interface MobileFilterPanelProps {
  filters: FilterState
  roleOptions: FilterOption[]
  statusOptions: FilterOption[]
  onFiltersChange: (filters: FilterState) => void
  onApply: () => void
  onClear: () => void
}

/**
 * Mobile Filter Panel - Collapsible panel with role and status filters
 *
 * Features:
 * - Vertical stacking of filter options
 * - Touch-friendly checkboxes (larger hit targets)
 * - Smooth transitions
 * - Apply and Clear buttons
 * - Shows active state for selected options
 *
 * Layout:
 * - Role filters section (vertical list of checkboxes)
 * - Status filters section (vertical list of checkboxes)
 * - Action buttons (Apply, Clear)
 */
export function MobileFilterPanel({
  filters,
  roleOptions,
  statusOptions,
  onFiltersChange,
  onApply,
  onClear
}: MobileFilterPanelProps) {
  const selectedRoles = filters.roles || []
  const selectedStatuses = filters.statuses || []

  const handleRoleToggle = useCallback(
    (role: string) => {
      const newRoles = selectedRoles.includes(role)
        ? selectedRoles.filter(r => r !== role)
        : [...selectedRoles, role]

      onFiltersChange({
        ...filters,
        roles: newRoles
      })
    },
    [filters, selectedRoles, onFiltersChange]
  )

  const handleStatusToggle = useCallback(
    (status: string) => {
      const newStatuses = selectedStatuses.includes(status)
        ? selectedStatuses.filter(s => s !== status)
        : [...selectedStatuses, status]

      onFiltersChange({
        ...filters,
        statuses: newStatuses
      })
    },
    [filters, selectedStatuses, onFiltersChange]
  )

  return (
    <div className="mobile-filter-panel">
      {/* Role Filters Section */}
      <div className="mobile-filter-section">
        <h3 className="mobile-filter-section-title">Role</h3>
        <div className="mobile-filter-options">
          {roleOptions.map(option => (
            <label
              key={option.value}
              className="mobile-filter-option"
              htmlFor={`role-${option.value}`}
            >
              <Checkbox
                id={`role-${option.value}`}
                checked={selectedRoles.includes(option.value)}
                onCheckedChange={() => handleRoleToggle(option.value)}
                className="mobile-filter-checkbox"
              />
              <span className="mobile-filter-label">{option.label}</span>
              <span className="mobile-filter-count">
                ({option.count || 0})
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* Status Filters Section */}
      <div className="mobile-filter-section">
        <h3 className="mobile-filter-section-title">Status</h3>
        <div className="mobile-filter-options">
          {statusOptions.map(option => (
            <label
              key={option.value}
              className="mobile-filter-option"
              htmlFor={`status-${option.value}`}
            >
              <Checkbox
                id={`status-${option.value}`}
                checked={selectedStatuses.includes(option.value)}
                onCheckedChange={() => handleStatusToggle(option.value)}
                className="mobile-filter-checkbox"
              />
              <span className="mobile-filter-label">{option.label}</span>
              <span className="mobile-filter-count">
                ({option.count || 0})
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="mobile-filter-actions">
        <Button
          onClick={onClear}
          variant="outline"
          className="mobile-filter-button mobile-filter-clear-btn"
          data-testid="mobile-filter-clear-btn"
        >
          Clear All
        </Button>
        <Button
          onClick={onApply}
          className="mobile-filter-button mobile-filter-apply-btn"
          data-testid="mobile-filter-apply-btn"
        >
          Apply
        </Button>
      </div>
    </div>
  )
}
