'use client'

import React from 'react'
import { Booking } from '@/types/shared/entities/booking'
import { usePermissions } from '@/lib/use-permissions'
import { PERMISSIONS } from '@/lib/permissions'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Edit2, Trash2, Calendar, Clock, User } from 'lucide-react'
import { ComponentVariant, CardComponentProps } from '../types'
import { formatDate, formatRelativeTime } from '@/lib/shared/formatters'

interface BookingCardProps extends CardComponentProps<Booking> {
  /** The booking to display */
  data: Booking
  /** Display variant */
  variant?: ComponentVariant
  /** Called when card is clicked */
  onClick?: () => void
  /** Called to edit booking (admin) */
  onEdit?: (id: string) => void
  /** Called to cancel booking */
  onCancel?: (id: string) => void
  /** Called to reschedule */
  onReschedule?: (id: string) => void
  /** Is loading */
  loading?: boolean
  /** Show action buttons */
  showActions?: boolean
}

/**
 * BookingCard Component
 *
 * Displays booking information in a card format.
 * Portal variant: View and manage own bookings
 * Admin variant: Full management of all bookings
 * Compact variant: Minimal display for lists
 *
 * @example
 * ```tsx
 * // Portal usage
 * <BookingCard booking={booking} variant="portal" onReschedule={handleReschedule} />
 *
 * // Admin usage
 * <BookingCard booking={booking} variant="admin" onEdit={handleEdit} onCancel={handleCancel} />
 * ```
 */
export default function BookingCard({
  data: booking,
  variant = 'portal',
  onClick,
  onEdit,
  onCancel,
  onReschedule,
  loading = false,
  showActions = true,
  className = '',
}: BookingCardProps) {
  const { has } = usePermissions()
  const canEditBooking = has(PERMISSIONS.BOOKINGS_EDIT)
  const canCancelBooking = has(PERMISSIONS.BOOKINGS_CANCEL)

  if (!booking) return null

  const statusColor: Record<string, string> = {
    DRAFT: 'bg-gray-100 text-gray-700',
    PENDING: 'bg-yellow-100 text-yellow-800',
    CONFIRMED: 'bg-green-100 text-green-800',
    IN_PROGRESS: 'bg-blue-100 text-blue-800',
    COMPLETED: 'bg-emerald-100 text-emerald-800',
    CANCELLED: 'bg-red-100 text-red-800',
    RESCHEDULED: 'bg-purple-100 text-purple-800',
    NO_SHOW: 'bg-orange-100 text-orange-800',
  }

  const statusLabel: Record<string, string> = {
    DRAFT: 'Draft',
    PENDING: 'Pending',
    CONFIRMED: 'Confirmed',
    IN_PROGRESS: 'In Progress',
    COMPLETED: 'Completed',
    CANCELLED: 'Cancelled',
    RESCHEDULED: 'Rescheduled',
    NO_SHOW: 'No Show',
  }

  // Compact variant - minimal display for lists
  if (variant === 'compact') {
    const scheduledDate = booking.scheduledAt ? new Date(booking.scheduledAt) : null

    return (
      <div
        className={`flex items-center justify-between p-3 border rounded-md hover:bg-gray-50 transition-colors cursor-pointer ${className}`}
        onClick={onClick}
        role="button"
        tabIndex={0}
        aria-label={`Booking for ${booking.service?.name || 'service'}`}
      >
        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm truncate">{booking.service?.name}</p>
          {scheduledDate && (
            <p className="text-xs text-gray-500">
              {formatDate(scheduledDate, 'short')} at {scheduledDate.toLocaleTimeString('en-US', {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </p>
          )}
        </div>
        <Badge className={statusColor[booking.status] || 'bg-gray-100 text-gray-800'}>
          {statusLabel[booking.status] || booking.status}
        </Badge>
      </div>
    )
  }

  const handleEdit = () => {
    if (onEdit && canEditBooking && !loading) {
      onEdit(booking.id)
    }
  }

  const handleCancel = () => {
    if (onCancel && canCancelBooking && !loading) {
      onCancel(booking.id)
    }
  }

  const handleReschedule = () => {
    if (onReschedule && !loading) {
      onReschedule(booking.id)
    }
  }

  const scheduledDate = booking.scheduledAt ? new Date(booking.scheduledAt) : null

  return (
    <Card
      className={`overflow-hidden transition-all hover:shadow-md ${className}`}
      onClick={onClick}
      role="article"
      aria-label={`Booking for ${booking.service?.name || 'service'}`}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-lg truncate">
              {booking.service?.name || 'Service'}
            </CardTitle>
            <CardDescription className="text-sm">
              Booking #{booking.id.slice(0, 8)}
            </CardDescription>
          </div>
          <Badge className={statusColor[booking.status] || 'bg-gray-100 text-gray-800'}>
            {statusLabel[booking.status] || booking.status}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {/* Scheduled Date & Time */}
        {scheduledDate && (
          <div className="flex items-center gap-2 text-sm text-gray-700">
            <Calendar className="h-4 w-4 flex-shrink-0" />
            <div>
              <p>{formatDate(scheduledDate, 'long')}</p>
              <p className="text-xs text-gray-500">
                {scheduledDate.toLocaleTimeString('en-US', {
                  hour: '2-digit',
                  minute: '2-digit',
                  hour12: true,
                })}
              </p>
            </div>
          </div>
        )}

        {/* Duration */}
        {booking.duration && (
          <div className="flex items-center gap-2 text-sm text-gray-700">
            <Clock className="h-4 w-4 flex-shrink-0" />
            <span>{booking.duration} minutes</span>
          </div>
        )}

        {/* Client Info (Admin) */}
        {variant === 'admin' && booking.client && (
          <div className="flex items-center gap-2 text-sm text-gray-700 pt-2 border-t">
            <User className="h-4 w-4 flex-shrink-0" />
            <div>
              <p className="font-medium">{booking.client.name}</p>
              <p className="text-xs text-gray-500">{booking.client.email}</p>
            </div>
          </div>
        )}

        {/* Assigned Team Member (Admin) */}
        {variant === 'admin' && booking.assignedTeamMember && (
          <div className="flex items-center gap-2 text-sm text-gray-700">
            <User className="h-4 w-4 flex-shrink-0" />
            <div>
              <p className="font-medium">{booking.assignedTeamMember.name}</p>
              <p className="text-xs text-gray-500">Assigned to</p>
            </div>
          </div>
        )}


        {/* Notes (admin) */}
        {variant === 'admin' && booking.notes && (
          <div className="pt-2 border-t">
            <p className="text-xs font-medium text-gray-600 mb-1">Notes:</p>
            <p className="text-sm text-gray-700 line-clamp-2">{booking.notes}</p>
          </div>
        )}

        {/* Service Description */}
        {booking.service?.shortDesc && (
          <div className="pt-2 border-t">
            <p className="text-sm text-gray-600 line-clamp-2">{booking.service.shortDesc}</p>
          </div>
        )}

        {/* Actions */}
        {showActions && (
          <div className="pt-2 border-t">
            {variant === 'admin' ? (
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleEdit}
                  disabled={!canEditBooking || loading}
                  className="flex-1"
                  aria-label={`Edit booking ${booking.id.slice(0, 8)}`}
                >
                  <Edit2 className="h-4 w-4 mr-1" />
                  Edit
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleCancel}
                  disabled={!canCancelBooking || loading || booking.status === 'CANCELLED'}
                  className="flex-1 text-red-600 hover:text-red-700 hover:bg-red-50"
                  aria-label={`Cancel booking ${booking.id.slice(0, 8)}`}
                >
                  Cancel
                </Button>
              </div>
            ) : (
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleReschedule}
                  disabled={loading || booking.status === 'CANCELLED' || booking.status === 'COMPLETED'}
                  className="flex-1"
                  aria-label={`Reschedule booking ${booking.id.slice(0, 8)}`}
                >
                  Reschedule
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleCancel}
                  disabled={loading || booking.status === 'CANCELLED' || booking.status === 'COMPLETED'}
                  className="flex-1 text-red-600 hover:text-red-700 hover:bg-red-50"
                  aria-label={`Cancel booking ${booking.id.slice(0, 8)}`}
                >
                  Cancel
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Time since booking */}
        {booking.createdAt && (
          <div className="text-xs text-gray-500 text-right pt-1">
            Booked {formatRelativeTime(new Date(booking.createdAt))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
