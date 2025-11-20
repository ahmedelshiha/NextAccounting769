'use client'

import React, { useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Booking } from '@/types/shared/entities/booking'
import { BookingCreateSchema, BookingUpdateSchema } from '@/schemas/shared/booking'
import { FormComponentProps } from '../types'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { usePermissions } from '@/lib/use-permissions'
import { PERMISSIONS } from '@/lib/permissions'
import { AlertCircle, Loader2, Save, Calendar, Clock } from 'lucide-react'

interface BookingFormProps extends FormComponentProps<Booking> {
  /** Booking to edit (if editing) */
  initialData?: Partial<Booking>
  /** Called when form is submitted */
  onSubmit: (data: any) => void | Promise<void>
  /** Whether form is submitting */
  isSubmitting?: boolean
  /** Error message from submission */
  submitError?: string
  /** Display variant - admin can assign, portal cannot */
  variant?: 'portal' | 'admin'
}

/**
 * BookingForm Component
 *
 * Form for creating and editing bookings.
 * Admin variant: Can assign team members, create for clients
 * Portal variant: Can only book own services, manage own bookings
 *
 * @example
 * ```tsx
 * // Portal: Self-service booking
 * <BookingForm
 *   variant="portal"
 *   onSubmit={handleSubmit}
 * />
 *
 * // Admin: Create booking for client
 * <BookingForm
 *   variant="admin"
 *   onSubmit={handleSubmit}
 * />
 * ```
 */
export default function BookingForm({
  initialData,
  onSubmit,
  isSubmitting = false,
  submitError,
  variant = 'portal',
  className,
}: BookingFormProps) {
  const { has } = usePermissions()
  const isAdmin = variant === 'admin' && has(PERMISSIONS.BOOKINGS_CREATE)
  const isEditing = !!initialData?.id

  // Determine which schema to use
  const schema = isEditing ? BookingUpdateSchema : BookingCreateSchema

  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      serviceId: initialData?.serviceId || '',
      clientId: isAdmin ? initialData?.clientId || '' : undefined,
      scheduledAt: initialData?.scheduledAt ? new Date(initialData.scheduledAt).toISOString().split('T')[0] : '',
      scheduledTime: initialData?.scheduledAt ? new Date(initialData.scheduledAt).toISOString().split('T')[1]?.slice(0, 5) : '09:00',
      notes: initialData?.notes || '',
      ...(isAdmin && {
        status: initialData?.status || 'PENDING',
      }),
    },
  })

  const onSubmitHandler = async (data: any) => {
    // Combine date and time
    if (data.scheduledAt && data.scheduledTime) {
      data.scheduledAt = new Date(`${data.scheduledAt}T${data.scheduledTime}`)
    }
    delete data.scheduledTime
    await onSubmit(data)
  }

  return (
    <div className={className}>
      <Card>
        <CardHeader>
          <CardTitle>{isEditing ? 'Edit Booking' : 'New Booking'}</CardTitle>
        </CardHeader>
        <CardContent>
          {submitError && (
            <div className="mb-6 flex gap-2 rounded-md bg-red-50 p-4 text-red-900">
              <AlertCircle className="h-5 w-5 flex-shrink-0" />
              <p className="text-sm">{submitError}</p>
            </div>
          )}

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmitHandler)} className="space-y-6">
              {/* Service Selection */}
              <FormField
                control={form.control}
                name="serviceId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Service *</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange} disabled={isSubmitting || isEditing}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a service" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="service-1">Tax Preparation</SelectItem>
                        <SelectItem value="service-2">Bookkeeping</SelectItem>
                        <SelectItem value="service-3">Audit Services</SelectItem>
                        <SelectItem value="service-4">Consulting</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription>Select the service you want to book</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Client Selection (Admin Only) */}
              {isAdmin && (
                <FormField
                  control={form.control}
                  name="clientId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Client</FormLabel>
                      <Select value={field.value} onValueChange={field.onChange} disabled={isSubmitting}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a client" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="client-1">John Smith</SelectItem>
                          <SelectItem value="client-2">Jane Doe</SelectItem>
                          <SelectItem value="client-3">Acme Corp</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormDescription>Client who will use this service</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              {/* Date and Time */}
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="scheduledAt"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        Date *
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="date"
                          {...field}
                          disabled={isSubmitting}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="scheduledTime"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        Time *
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="time"
                          {...field}
                          disabled={isSubmitting}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Notes */}
              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notes</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Additional notes or special requests..."
                        className="resize-none"
                        rows={3}
                        {...field}
                        value={field.value || ''}
                        disabled={isSubmitting}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Status (Admin Only) */}
              {isAdmin && (
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="status"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Status</FormLabel>
                        <Select value={field.value} onValueChange={field.onChange} disabled={isSubmitting}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="PENDING">Pending</SelectItem>
                            <SelectItem value="CONFIRMED">Confirmed</SelectItem>
                            <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                            <SelectItem value="COMPLETED">Completed</SelectItem>
                            <SelectItem value="CANCELLED">Cancelled</SelectItem>
                            <SelectItem value="NO_SHOW">No Show</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                </div>
              )}

              {/* Form Actions */}
              <div className="flex gap-2 pt-4">
                <Button type="submit" disabled={isSubmitting} className="gap-2">
                  {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  {isSubmitting ? 'Saving...' : isEditing ? 'Update Booking' : 'Create Booking'}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  )
}
