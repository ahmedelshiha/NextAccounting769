'use client'

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Badge } from '@/components/ui/badge'
import { SharedComponentProps } from '../types'
import { formatDate } from '@/lib/shared/formatters'
import { CalendarIcon, X } from 'lucide-react'
import { cn } from '@/lib/utils'

interface DateRange {
  from?: Date
  to?: Date
}

interface DateRangePickerProps extends SharedComponentProps {
  /** Selected date range */
  value?: DateRange
  /** Called when date range changes */
  onChange?: (range: DateRange) => void
  /** Placeholder text */
  placeholder?: string
  /** Disabled state */
  disabled?: boolean
  /** Show time picker (not implemented in basic version) */
  showTime?: boolean
  /** Quick select presets */
  presets?: Array<{ label: string; range: DateRange }>
}

/**
 * DateRangePicker Component
 *
 * Date range picker with quick presets.
 * Supports selecting date ranges for filtering, reporting, and booking.
 *
 * @example
 * ```tsx
 * const [dateRange, setDateRange] = useState<DateRange>({ from: new Date(), to: new Date() })
 *
 * <DateRangePicker
 *   value={dateRange}
 *   onChange={setDateRange}
 *   placeholder="Select date range"
 *   presets={[
 *     { label: 'Today', range: { from: today, to: today } },
 *     { label: 'This Week', range: { from: weekStart, to: weekEnd } },
 *   ]}
 * />
 * ```
 */
export default function DateRangePicker({
  value,
  onChange,
  placeholder = 'Pick a date range',
  disabled = false,
  showTime = false,
  presets = [],
  className,
}: DateRangePickerProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [from, setFrom] = useState<Date | undefined>(value?.from)
  const [to, setTo] = useState<Date | undefined>(value?.to)

  // Default presets if none provided
  const defaultPresets: Array<{ label: string; range: DateRange }> = presets.length > 0 ? presets : [
    {
      label: 'Today',
      range: {
        from: new Date(),
        to: new Date(),
      },
    },
    {
      label: 'Last 7 days',
      range: {
        from: new Date(new Date().setDate(new Date().getDate() - 7)),
        to: new Date(),
      },
    },
    {
      label: 'This Month',
      range: {
        from: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
        to: new Date(),
      },
    },
    {
      label: 'Last 30 days',
      range: {
        from: new Date(new Date().setDate(new Date().getDate() - 30)),
        to: new Date(),
      },
    },
  ]

  const handleApply = () => {
    onChange?.({ from, to })
    setIsOpen(false)
  }

  const handleClear = () => {
    setFrom(undefined)
    setTo(undefined)
    onChange?.({ from: undefined, to: undefined })
  }

  const handlePreset = (preset: DateRange) => {
    setFrom(preset.from)
    setTo(preset.to)
    onChange?.(preset)
    setIsOpen(false)
  }

  const displayText =
    from && to
      ? `${formatDate(from, 'short')} - ${formatDate(to, 'short')}`
      : from
        ? formatDate(from, 'short')
        : placeholder

  const fromDate = from ? from.toISOString().split('T')[0] : ''
  const toDate = to ? to.toISOString().split('T')[0] : ''

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          disabled={disabled}
          className={cn('w-full justify-start text-left font-normal', !from && 'text-muted-foreground', className)}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {displayText}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-4">
        <div className="space-y-4">
          {/* Presets */}
          <div className="flex flex-wrap gap-2">
            {defaultPresets.map((preset) => (
              <Button
                key={preset.label}
                variant={
                  from?.getTime() === preset.range.from?.getTime() &&
                  to?.getTime() === preset.range.to?.getTime()
                    ? 'default'
                    : 'outline'
                }
                size="sm"
                onClick={() => handlePreset(preset.range)}
                className="text-xs"
              >
                {preset.label}
              </Button>
            ))}
          </div>

          {/* Date Inputs */}
          <div className="space-y-2">
            <div>
              <label className="text-sm font-medium">From</label>
              <Input
                type="date"
                value={fromDate}
                onChange={(e) => setFrom(e.target.value ? new Date(e.target.value) : undefined)}
                disabled={disabled}
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-sm font-medium">To</label>
              <Input
                type="date"
                value={toDate}
                onChange={(e) => setTo(e.target.value ? new Date(e.target.value) : undefined)}
                disabled={disabled}
                className="mt-1"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2 border-t pt-3">
            <Button
              size="sm"
              variant="outline"
              onClick={handleClear}
              className="flex-1"
              disabled={!from && !to}
            >
              <X className="mr-1 h-3 w-3" />
              Clear
            </Button>
            <Button
              size="sm"
              onClick={handleApply}
              className="flex-1"
              disabled={!from || !to}
            >
              Apply
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}
