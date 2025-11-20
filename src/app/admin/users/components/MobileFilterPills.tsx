'use client'

import React, { useMemo } from 'react'
import { X } from 'lucide-react'
import { FilterState } from '../hooks/useFilterState'
import { FilterOption } from './FilterMultiSelect'

export interface MobileFilterPillsProps {
  filters: FilterState
  roleOptions: FilterOption[]
  statusOptions: FilterOption[]
  onRemoveFilter: (filterType: 'role' | 'status', value: string) => void
}

/**
 * Mobile Filter Pills - Horizontal scrollable filter badges
 *
 * Features:
 * - Horizontal scrolling container
 * - Touch-friendly pill sizing (min 40px height)
 * - -webkit-overflow-scrolling for smooth momentum scrolling
 * - One-touch removal (X button)
 * - Color-coded by filter type
 * - Truncated text for long labels
 *
 * Layout:
 * - Flex container with horizontal scrolling
 * - Pill badges for each active filter
 * - X button to remove filter
 */
export function MobileFilterPills({
  filters,
  roleOptions,
  statusOptions,
  onRemoveFilter
}: MobileFilterPillsProps) {
  // Create pill data from active filters
  const pills = useMemo(() => {
    const items: Array<{
      id: string
      label: string
      type: 'role' | 'status'
      value: string
    }> = []

    // Add role pills
    const roles = Array.isArray(filters.roles) ? filters.roles : []
    roles.forEach(role => {
      const option = roleOptions.find(o => o.value === role)
      if (option) {
        items.push({
          id: `role-${role}`,
          label: option.label,
          type: 'role',
          value: role
        })
      }
    })

    // Add status pills
    const statuses = Array.isArray(filters.statuses) ? filters.statuses : []
    statuses.forEach(status => {
      const option = statusOptions.find(o => o.value === status)
      if (option) {
        items.push({
          id: `status-${status}`,
          label: option.label,
          type: 'status',
          value: status
        })
      }
    })

    return items
  }, [filters, roleOptions, statusOptions])

  if (pills.length === 0) {
    return null
  }

  return (
    <div className="mobile-filter-pills" data-testid="mobile-filter-pills">
      {pills.map(pill => (
        <div
          key={pill.id}
          className={`mobile-filter-pill mobile-filter-pill--${pill.type.toLowerCase()}`}
          data-testid={`mobile-filter-pill-${pill.id}`}
        >
          <span className="mobile-pill-label">{pill.label}</span>
          <button
            className="mobile-pill-remove"
            onClick={() => onRemoveFilter(pill.type, pill.value)}
            aria-label={`Remove ${pill.label} filter`}
            data-testid={`mobile-pill-remove-${pill.id}`}
          >
            <X size={14} />
          </button>
        </div>
      ))}
    </div>
  )
}
