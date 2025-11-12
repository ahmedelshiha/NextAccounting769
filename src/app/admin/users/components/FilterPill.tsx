'use client'

import React from 'react'
import { X } from 'lucide-react'

export interface FilterPillProps {
  label: string
  value: string
  onRemove: () => void
}

export function FilterPill({ label, value, onRemove }: FilterPillProps) {
  return (
    <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-100 text-blue-900 rounded-full text-sm border border-blue-200">
      <span>
        <span className="font-medium">{label}:</span> {value}
      </span>
      <button
        onClick={onRemove}
        className="ml-1 hover:text-blue-700 transition-colors"
        aria-label={`Remove ${label} filter: ${value}`}
        type="button"
      >
        <X className="w-3 h-3" />
      </button>
    </div>
  )
}

export interface FilterPillsProps {
  search?: string
  roles: Array<{ value: string; label: string }>
  statuses: Array<{ value: string; label: string }>
  onRemoveSearch?: () => void
  onRemoveRole?: (value: string) => void
  onRemoveStatus?: (value: string) => void
  onClearAll?: () => void
}

export function FilterPills({
  search,
  roles,
  statuses,
  onRemoveSearch,
  onRemoveRole,
  onRemoveStatus,
  onClearAll
}: FilterPillsProps) {
  const hasFilters = !!search || roles.length > 0 || statuses.length > 0

  if (!hasFilters) {
    return null
  }

  return (
    <div className="px-3 py-2 bg-blue-50 border-t border-blue-100 flex items-center gap-2 flex-wrap">
      {search && onRemoveSearch && (
        <FilterPill
          label="Search"
          value={search}
          onRemove={onRemoveSearch}
        />
      )}

      {roles.map(role => (
        <FilterPill
          key={role.value}
          label="Role"
          value={role.label}
          onRemove={() => onRemoveRole?.(role.value)}
        />
      ))}

      {statuses.map(status => (
        <FilterPill
          key={status.value}
          label="Status"
          value={status.label}
          onRemove={() => onRemoveStatus?.(status.value)}
        />
      ))}

      {onClearAll && (
        <button
          onClick={onClearAll}
          className="ml-auto text-xs text-blue-600 hover:text-blue-800 font-medium"
          type="button"
        >
          Clear All
        </button>
      )}
    </div>
  )
}
