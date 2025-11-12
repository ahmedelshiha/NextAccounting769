'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { ChevronDown, X } from 'lucide-react'

export interface FilterOption {
  value: string
  label: string
  count?: number
}

export interface FilterMultiSelectProps {
  label: string
  placeholder: string
  options: FilterOption[]
  selectedValues: string[]
  onToggle: (value: string) => void
  onClear: () => void
  ariaLabel?: string
}

export function FilterMultiSelect({
  label,
  placeholder,
  options,
  selectedValues,
  onToggle,
  onClear,
  ariaLabel
}: FilterMultiSelectProps) {
  const [open, setOpen] = useState(false)

  const displayLabel = selectedValues.length > 0
    ? `${label}: ${selectedValues.length} selected`
    : label

  return (
    <div className="relative inline-block w-full">
      <button
        onClick={() => setOpen(!open)}
        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md bg-white text-gray-900 hover:bg-gray-50 flex items-center justify-between gap-2"
        aria-label={ariaLabel || `Filter by ${label}`}
        type="button"
      >
        <span className="truncate text-left flex-1">
          {displayLabel}
        </span>
        <ChevronDown className={`w-4 h-4 flex-shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <>
          <div
            className="fixed inset-0 z-30"
            onClick={() => setOpen(false)}
          />
          
          <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-300 rounded-md shadow-lg z-40 max-h-64 overflow-y-auto">
            {selectedValues.length > 0 && (
              <div className="px-3 py-2 border-b border-gray-200 flex items-center justify-between gap-2 sticky top-0 bg-gray-50">
                <span className="text-xs text-gray-600">
                  {selectedValues.length} selected
                </span>
                <button
                  onClick={onClear}
                  className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1"
                  type="button"
                  aria-label={`Clear ${label} selection`}
                >
                  <X className="w-3 h-3" />
                  Clear
                </button>
              </div>
            )}

            <div className="py-2">
              {options.map(option => (
                <label
                  key={option.value}
                  className="px-3 py-2 flex items-center gap-3 hover:bg-gray-100 cursor-pointer transition-colors"
                >
                  <Checkbox
                    checked={selectedValues.includes(option.value)}
                    onCheckedChange={() => onToggle(option.value)}
                  />
                  <span className="text-sm text-gray-900">{option.label}</span>
                </label>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
