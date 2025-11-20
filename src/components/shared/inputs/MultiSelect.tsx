'use client'

import React, { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { SharedComponentProps } from '../types'
import { X, ChevronDown, Search } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface SelectOption {
  label: string
  value: string
  disabled?: boolean
}

interface MultiSelectProps extends SharedComponentProps {
  /** Available options */
  options: SelectOption[]
  /** Selected option values */
  value?: string[]
  /** Called when selection changes */
  onChange?: (values: string[]) => void
  /** Placeholder text */
  placeholder?: string
  /** Disabled state */
  disabled?: boolean
  /** Allow custom values (typing) */
  allowCustom?: boolean
  /** Max selected items (-1 for unlimited) */
  maxItems?: number
  /** Search function */
  filterFn?: (option: SelectOption, search: string) => boolean
}

/**
 * MultiSelect Component
 *
 * Dropdown multi-select with search, tagging, and custom values.
 * Supports keyboard navigation and accessibility.
 *
 * @example
 * ```tsx
 * <MultiSelect
 *   options={[
 *     { label: 'Option 1', value: 'opt1' },
 *     { label: 'Option 2', value: 'opt2' },
 *   ]}
 *   value={selected}
 *   onChange={setSelected}
 *   placeholder="Select items..."
 *   maxItems={5}
 * />
 * ```
 */
export default function MultiSelect({
  options,
  value = [],
  onChange,
  placeholder = 'Select options...',
  disabled = false,
  allowCustom = false,
  maxItems = -1,
  filterFn,
  className,
}: MultiSelectProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [customValue, setCustomValue] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // Filter options based on search
  const defaultFilter = (option: SelectOption, searchText: string) =>
    option.label.toLowerCase().includes(searchText.toLowerCase())

  const filteredOptions = options.filter((option) =>
    (filterFn || defaultFilter)(option, search)
  )

  // Get selected labels
  const selectedOptions = options.filter((opt) => value.includes(opt.value))
  const hasReachedMax = maxItems > 0 && value.length >= maxItems

  const handleSelect = (optionValue: string) => {
    if (!onChange) return

    if (value.includes(optionValue)) {
      onChange(value.filter((v) => v !== optionValue))
    } else {
      if (!hasReachedMax) {
        onChange([...value, optionValue])
      }
    }
  }

  const handleAddCustom = () => {
    if (customValue.trim() && allowCustom && !hasReachedMax) {
      const newValue = customValue.trim()
      if (!value.includes(newValue)) {
        onChange?.([...value, newValue])
      }
      setCustomValue('')
    }
  }

  const handleRemove = (removeValue: string) => {
    onChange?.(value.filter((v) => v !== removeValue))
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && allowCustom) {
      e.preventDefault()
      handleAddCustom()
    } else if (e.key === 'Backspace' && search === '' && value.length > 0) {
      // Remove last item on backspace
      onChange?.(value.slice(0, -1))
    } else if (e.key === 'Escape') {
      setIsOpen(false)
    }
  }

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div ref={containerRef} className={cn('relative w-full', className)}>
      {/* Main input */}
      <div
        className={cn(
          'flex min-h-10 w-full flex-wrap gap-1 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background transition-colors',
          disabled && 'cursor-not-allowed bg-muted',
          isOpen && 'ring-2 ring-ring ring-offset-2'
        )}
        onClick={() => !disabled && setIsOpen(!isOpen)}
      >
        {/* Selected badges */}
        {selectedOptions.map((option) => (
          <Badge key={option.value} variant="secondary" className="pl-2">
            {option.label}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                handleRemove(option.value)
              }}
              className="ml-1 hover:text-red-600"
              disabled={disabled}
            >
              <X className="h-3 w-3" />
            </button>
          </Badge>
        ))}

        {/* Search input */}
        <Input
          ref={inputRef}
          type="text"
          placeholder={value.length === 0 ? placeholder : ''}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => setIsOpen(true)}
          disabled={disabled}
          className="min-w-32 border-0 bg-transparent p-0 focus-visible:ring-0"
        />

        {/* Custom value input */}
        {allowCustom && customValue && (
          <Badge variant="outline" className="gap-1">
            <span className="text-xs">{customValue}</span>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                setCustomValue('')
              }}
              className="hover:text-red-600"
            >
              <X className="h-3 w-3" />
            </button>
          </Badge>
        )}

        {/* Chevron icon */}
        <ChevronDown
          className={cn(
            'ml-auto h-4 w-4 opacity-50 transition-transform',
            isOpen && 'rotate-180'
          )}
        />
      </div>

      {/* Dropdown menu */}
      {isOpen && (
        <div className="absolute left-0 right-0 top-full z-50 mt-1 max-h-60 overflow-y-auto rounded-md border border-input bg-popover p-1 shadow-md">
          {/* Custom value input */}
          {allowCustom && (
            <div className="flex gap-1 border-b p-2">
              <Input
                type="text"
                placeholder="Add custom value..."
                value={customValue}
                onChange={(e) => setCustomValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    handleAddCustom()
                  }
                }}
                className="h-8"
              />
              <Button
                size="sm"
                onClick={handleAddCustom}
                disabled={!customValue.trim() || hasReachedMax}
              >
                Add
              </Button>
            </div>
          )}

          {/* Options */}
          {filteredOptions.length > 0 ? (
            filteredOptions.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => handleSelect(option.value)}
                disabled={option.disabled || (hasReachedMax && !value.includes(option.value))}
                className={cn(
                  'relative flex w-full cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors',
                  value.includes(option.value)
                    ? 'bg-primary text-primary-foreground'
                    : 'hover:bg-accent hover:text-accent-foreground',
                  (option.disabled || (hasReachedMax && !value.includes(option.value))) &&
                    'cursor-not-allowed opacity-50'
                )}
              >
                <input
                  type="checkbox"
                  checked={value.includes(option.value)}
                  readOnly
                  className="mr-2 h-4 w-4 cursor-pointer"
                />
                {option.label}
              </button>
            ))
          ) : (
            <div className="px-2 py-6 text-center text-sm text-muted-foreground">
              No options found
            </div>
          )}

          {/* Max items message */}
          {hasReachedMax && maxItems > 0 && (
            <div className="border-t px-2 py-1 text-center text-xs text-muted-foreground">
              Max {maxItems} items selected
            </div>
          )}
        </div>
      )}
    </div>
  )
}
