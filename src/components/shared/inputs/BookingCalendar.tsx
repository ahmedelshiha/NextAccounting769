'use client'

import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ChevronLeft, ChevronRight, Clock, AlertCircle } from 'lucide-react'
import {
  format,
  addDays,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameMonth,
  isToday,
  isBefore,
  startOfDay,
  parse,
  addMinutes,
} from 'date-fns'
import { useAvailabilitySlots } from '@/hooks/shared'

interface TimeSlot {
  id: string
  date: Date
  startTime: string
  endTime: string
  available: boolean
  maxBookings?: number
  currentBookings?: number
}

interface BookingCalendarProps {
  /** Service ID to fetch availability for */
  serviceId: string
  /** Called when time slot is selected */
  onSelectSlot: (slot: TimeSlot) => void
  /** Number of days to show availability for (default: 30) */
  daysAhead?: number
  /** Minimum advance booking hours (default: 1) */
  minAdvanceHours?: number
  /** Enable real-time sync (default: true) */
  enableRealtime?: boolean
  /** Show time slots or just date selection */
  showTimeSlots?: boolean
  /** Duration in minutes for booking (affects slot display) */
  duration?: number
  /** Variant for display */
  variant?: 'portal' | 'admin'
  /** Custom className */
  className?: string
}

/**
 * BookingCalendar Component
 *
 * Interactive calendar for selecting available time slots for services.
 * Features:
 * - Month view with available dates highlighted
 * - Time slot selection within available dates
 * - Real-time availability updates
 * - Portal and admin variants
 * - Responsive design
 *
 * @example
 * ```tsx
 * <BookingCalendar
 *   serviceId="service-1"
 *   onSelectSlot={(slot) => handleBooking(slot)}
 *   daysAhead={30}
 *   showTimeSlots={true}
 * />
 * ```
 */
export function BookingCalendar({
  serviceId,
  onSelectSlot,
  daysAhead = 30,
  minAdvanceHours = 1,
  enableRealtime = true,
  showTimeSlots = true,
  duration = 60,
  variant = 'portal',
  className = '',
}: BookingCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [selectedTime, setSelectedTime] = useState<string | null>(null)

  // Fetch availability slots
  const { slots, loading, connected } = useAvailabilitySlots(serviceId, {
    subscribeToUpdates: enableRealtime,
  })

  // Calculate calendar days
  const calendarDays = useMemo(() => {
    const start = startOfMonth(currentDate)
    const end = endOfMonth(currentDate)
    return eachDayOfInterval({ start, end })
  }, [currentDate])

  // Check if date has available slots
  const getAvailableSlots = useCallback(
    (date: Date) => {
      return slots.filter((slot) => {
        const slotDate = new Date(slot.date)
        return (
          isSameMonth(slotDate, currentDate) &&
          format(slotDate, 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd') &&
          slot.available
        )
      })
    },
    [slots, currentDate]
  )

  // Get time slots for selected date
  const timeSlots = useMemo(() => {
    if (!selectedDate) return []

    const dateStr = format(selectedDate, 'yyyy-MM-dd')
    const daySlots = slots.filter((slot) => {
      const slotDateStr = format(new Date(slot.date), 'yyyy-MM-dd')
      return slotDateStr === dateStr
    })

    // Create time slot options
    return daySlots
      .filter((slot) => slot.available)
      .map((slot) => ({
        id: slot.id,
        date: selectedDate,
        startTime: slot.startTime,
        endTime: slot.endTime,
        available: true,
        maxBookings: slot.maxBookings,
        currentBookings: 0,
      }))
  }, [selectedDate, slots])

  // Check if day is bookable
  const isDayBookable = useCallback((date: Date) => {
    const now = new Date()
    const minBookingTime = addMinutes(now, minAdvanceHours * 60)

    // Can't book in the past
    if (isBefore(date, startOfDay(now))) {
      return false
    }

    // Check minimum advance hours
    if (isBefore(date, startOfDay(minBookingTime))) {
      return false
    }

    // Check if there are available slots
    return getAvailableSlots(date).length > 0
  }, [minAdvanceHours, getAvailableSlots])

  const handlePreviousMonth = () => {
    setCurrentDate((prev) => addDays(prev, -31))
    setSelectedDate(null)
    setSelectedTime(null)
  }

  const handleNextMonth = () => {
    setCurrentDate((prev) => addDays(prev, 31))
    setSelectedDate(null)
    setSelectedTime(null)
  }

  const handleDateSelect = (date: Date) => {
    if (isDayBookable(date)) {
      setSelectedDate(date)
      setSelectedTime(null)
    }
  }

  const handleTimeSelect = (slotId: string) => {
    const slot = timeSlots.find((s) => s.id === slotId)
    if (slot) {
      setSelectedTime(slotId)
      onSelectSlot(slot)
    }
  }

  return (
    <Card className={`booking-calendar ${className}`}>
      <CardHeader className="pb-4">
        <CardTitle className="text-lg">Select Available Time</CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Real-time Status */}
        {enableRealtime && (
          <div className="flex items-center gap-2 text-sm">
            <div className={`h-2 w-2 rounded-full ${connected ? 'bg-green-500' : 'bg-gray-300'}`} />
            <span className="text-muted-foreground">
              {connected ? 'Live updates enabled' : 'Connecting...'}
            </span>
          </div>
        )}

        {/* Month Navigation */}
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            onClick={handlePreviousMonth}
            disabled={loading}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>

          <h3 className="font-semibold">
            {format(currentDate, 'MMMM yyyy')}
          </h3>

          <Button
            variant="ghost"
            size="sm"
            onClick={handleNextMonth}
            disabled={loading}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        {/* Weekday Headers */}
        <div className="grid grid-cols-7 gap-2 text-center text-sm font-medium text-muted-foreground">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
            <div key={day}>{day}</div>
          ))}
        </div>

        {/* Calendar Days */}
        <div className="grid grid-cols-7 gap-2">
          {calendarDays.map((date) => {
            const isBookable = isDayBookable(date)
            const isSelected = selectedDate && format(selectedDate, 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd')
            const hasSlots = getAvailableSlots(date).length > 0

            return (
              <button
                key={format(date, 'yyyy-MM-dd')}
                onClick={() => handleDateSelect(date)}
                disabled={!isBookable || loading}
                className={`
                  relative h-10 rounded-lg text-sm font-medium transition-colors
                  ${!isSameMonth(date, currentDate) && 'text-muted-foreground/40'}
                  ${!isBookable && 'cursor-not-allowed opacity-40'}
                  ${isBookable && !isSelected && 'hover:bg-muted'}
                  ${isSelected && 'bg-primary text-primary-foreground'}
                  ${isToday(date) && !isSelected && 'border border-primary'}
                `}
              >
                {format(date, 'd')}
                {hasSlots && !isSelected && (
                  <div className="absolute bottom-1 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-primary" />
                )}
              </button>
            )
          })}
        </div>

        {/* Time Slot Selection */}
        {showTimeSlots && selectedDate && (
          <div className="space-y-3 border-t pt-4">
            <h4 className="font-medium text-sm">
              Available times for {format(selectedDate, 'MMMM d, yyyy')}
            </h4>

            {timeSlots.length === 0 ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground rounded-lg bg-muted/50 p-3">
                <AlertCircle className="h-4 w-4" />
                <span>No available time slots for this date</span>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto">
                {timeSlots.map((slot) => (
                  <Button
                    key={slot.id}
                    variant={selectedTime === slot.id ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => handleTimeSelect(slot.id)}
                    className="h-auto flex items-center gap-2 p-2"
                  >
                    <Clock className="h-3 w-3" />
                    <span className="text-xs font-medium">
                      {slot.startTime} - {slot.endTime}
                    </span>
                  </Button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Loading State */}
        {loading && timeSlots.length === 0 && (
          <div className="flex items-center justify-center py-8 text-sm text-muted-foreground">
            <div className="inline-flex animate-spin rounded-full h-4 w-4 border border-current border-t-transparent mr-2" />
            Loading availability...
          </div>
        )}

        {/* Selection Summary */}
        {selectedDate && (
          <div className="flex items-center justify-between bg-muted/50 rounded-lg p-3 text-sm">
            <div>
              <p className="font-medium">{format(selectedDate, 'EEEE, MMMM d, yyyy')}</p>
              {selectedTime && (
                <p className="text-muted-foreground text-xs mt-1">
                  {timeSlots.find((s) => s.id === selectedTime)?.startTime}
                </p>
              )}
            </div>
            {variant === 'admin' && (
              <Badge variant="secondary">Ready to book</Badge>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default BookingCalendar
