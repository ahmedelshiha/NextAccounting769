'use client'

import React, { useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Service } from '@/types/shared/entities/service'
import { ServiceCreateSchema, ServiceUpdateSchema } from '@/schemas/shared/service'
import { FormComponentProps } from '../types'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { usePermissions } from '@/lib/use-permissions'
import { PERMISSIONS } from '@/lib/permissions'
import { slugify } from '@/lib/shared/transformers'
import { AlertCircle, Loader2, Save } from 'lucide-react'

interface ServiceFormProps extends FormComponentProps<Service> {
  /** Service to edit (if editing) */
  initialData?: Partial<Service>
  /** Called when form is submitted */
  onSubmit: (data: any) => void | Promise<void>
  /** Whether form is submitting */
  isSubmitting?: boolean
  /** Error message from submission */
  submitError?: string
  /** Display variant - admin sees more fields */
  variant?: 'portal' | 'admin'
}

/**
 * ServiceForm Component
 *
 * Form for creating and editing services.
 * Admin variant: Full control over all fields (pricing, booking settings, etc.)
 * Portal variant: Limited fields (for self-service service requests)
 *
 * @example
 * ```tsx
 * // Admin: Create/edit service with full control
 * <ServiceForm
 *   variant="admin"
 *   initialData={service}
 *   onSubmit={handleSubmit}
 *   isSubmitting={loading}
 * />
 *
 * // Portal: Limited service request
 * <ServiceForm
 *   variant="portal"
 *   onSubmit={handleSubmit}
 * />
 * ```
 */
export default function ServiceForm({
  initialData,
  onSubmit,
  isSubmitting = false,
  submitError,
  variant = 'admin',
  className,
}: ServiceFormProps) {
  const { has } = usePermissions()
  const isAdmin = variant === 'admin' && has(PERMISSIONS.SERVICES_CREATE)
  const isEditing = !!initialData?.id

  // Determine which schema to use
  const schema = isEditing ? ServiceUpdateSchema : ServiceCreateSchema
  
  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      name: initialData?.name || '',
      slug: initialData?.slug || '',
      description: initialData?.description || '',
      shortDesc: initialData?.shortDesc || '',
      category: initialData?.category || '',
      price: initialData?.price || undefined,
      currency: initialData?.currency || 'USD',
      duration: initialData?.duration || 60,
      features: (initialData?.features as string[]) || [],
      image: initialData?.image || '',
      active: initialData?.active !== false,
      featured: initialData?.featured === true,
      ...(isAdmin && {
        basePrice: initialData?.basePrice || undefined,
        advanceBookingDays: initialData?.advanceBookingDays || 30,
        minAdvanceHours: initialData?.minAdvanceHours || 24,
        maxDailyBookings: initialData?.maxDailyBookings || undefined,
        bookingEnabled: initialData?.bookingEnabled !== false,
      }),
    },
  })

  const nameValue = form.watch('name')

  const handleNameChange = (value: string) => {
    form.setValue('name', value)
    if (!isEditing) {
      form.setValue('slug', slugify(value))
    }
  }

  const handleAddFeature = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      const input = e.currentTarget
      const feature = input.value.trim()
      if (feature) {
        const features = form.getValues('features')
        form.setValue('features', [...(features || []), feature])
        input.value = ''
      }
    }
  }

  const removeFeature = (index: number) => {
    const features = form.getValues('features')
    form.setValue('features', features.filter((_, i) => i !== index))
  }

  const onSubmitHandler = async (data: any) => {
    await onSubmit(data)
  }

  return (
    <div className={className}>
      <Card>
        <CardHeader>
          <CardTitle>{isEditing ? 'Edit Service' : 'Create Service'}</CardTitle>
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
              {/* Basic Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Basic Information</h3>

                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Service Name *</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="e.g., Tax Preparation"
                          {...field}
                          onChange={(e) => handleNameChange(e.target.value)}
                          disabled={isSubmitting}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="slug"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>URL Slug *</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="e.g., tax-preparation"
                          {...field}
                          disabled={true}
                        />
                      </FormControl>
                      <FormDescription>Auto-generated from service name</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description *</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Detailed description of the service..."
                          className="resize-none"
                          rows={4}
                          {...field}
                          disabled={isSubmitting}
                        />
                      </FormControl>
                      <FormDescription>Minimum 10 characters, maximum 5000</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="shortDesc"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Short Description</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Brief summary for listings..."
                          className="resize-none"
                          rows={2}
                          {...field}
                          value={field.value || ''}
                          disabled={isSubmitting}
                        />
                      </FormControl>
                      <FormDescription>Maximum 500 characters</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Service Details */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Service Details</h3>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="category"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Category</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="e.g., Accounting, Tax, Legal"
                            {...field}
                            value={field.value || ''}
                            disabled={isSubmitting}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="duration"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Duration (minutes)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="60"
                            {...field}
                            onChange={(e) => field.onChange(e.target.valueAsNumber || undefined)}
                            disabled={isSubmitting}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="features"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Features</FormLabel>
                      <div className="space-y-2">
                        <div className="flex flex-wrap gap-2">
                          {field.value && field.value.length > 0 && (
                            field.value.map((feature, index) => (
                              <Badge key={index} variant="secondary" className="pl-2">
                                {feature}
                                <button
                                  type="button"
                                  onClick={() => removeFeature(index)}
                                  className="ml-2 hover:text-red-500"
                                >
                                  ×
                                </button>
                              </Badge>
                            ))
                          )}
                        </div>
                        <Input
                          placeholder="Add feature and press Enter"
                          onKeyDown={handleAddFeature}
                          disabled={isSubmitting}
                        />
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="image"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Service Image URL</FormLabel>
                      <FormControl>
                        <Input
                          type="url"
                          placeholder="https://example.com/image.jpg"
                          {...field}
                          value={field.value || ''}
                          disabled={isSubmitting}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Pricing */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Pricing</h3>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="price"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Price</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="99.99"
                            {...field}
                            onChange={(e) => field.onChange(e.target.valueAsNumber || undefined)}
                            disabled={isSubmitting}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="currency"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Currency</FormLabel>
                        <Select value={field.value || 'USD'} onValueChange={field.onChange} disabled={isSubmitting}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="USD">USD ($)</SelectItem>
                            <SelectItem value="EUR">EUR (€)</SelectItem>
                            <SelectItem value="GBP">GBP (£)</SelectItem>
                            <SelectItem value="AED">AED (د.إ)</SelectItem>
                            <SelectItem value="SAR">SAR (﷼)</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {isAdmin && (
                  <FormField
                    control={form.control}
                    name="basePrice"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Base Price (Admin Only)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="Cost for admin tracking"
                            {...field}
                            onChange={(e) => field.onChange(e.target.valueAsNumber || undefined)}
                            disabled={isSubmitting}
                          />
                        </FormControl>
                        <FormDescription>Internal cost tracking - not shown to clients</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
              </div>

              {/* Status and Availability */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Status & Availability</h3>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="active"
                    render={({ field }) => (
                      <FormItem className="flex items-center space-x-2">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            disabled={isSubmitting}
                          />
                        </FormControl>
                        <FormLabel className="font-normal">Active Service</FormLabel>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="featured"
                    render={({ field }) => (
                      <FormItem className="flex items-center space-x-2">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            disabled={isSubmitting || !isAdmin}
                          />
                        </FormControl>
                        <FormLabel className="font-normal">Featured Service</FormLabel>
                      </FormItem>
                    )}
                  />
                </div>

                {isAdmin && (
                  <>
                    <FormField
                      control={form.control}
                      name="bookingEnabled"
                      render={({ field }) => (
                        <FormItem className="flex items-center space-x-2">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                              disabled={isSubmitting}
                            />
                          </FormControl>
                          <FormLabel className="font-normal">Enable Bookings</FormLabel>
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      <FormField
                        control={form.control}
                        name="advanceBookingDays"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Advance Booking Days</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                placeholder="30"
                                {...field}
                                onChange={(e) => field.onChange(e.target.valueAsNumber || 0)}
                                disabled={isSubmitting}
                              />
                            </FormControl>
                            <FormDescription>Days in advance clients can book</FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="minAdvanceHours"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Min Advance Hours</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                placeholder="24"
                                {...field}
                                onChange={(e) => field.onChange(e.target.valueAsNumber || 0)}
                                disabled={isSubmitting}
                              />
                            </FormControl>
                            <FormDescription>Hours in advance minimum booking</FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="maxDailyBookings"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Max Daily Bookings</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                placeholder="5"
                                {...field}
                                onChange={(e) => field.onChange(e.target.valueAsNumber || undefined)}
                                disabled={isSubmitting}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </>
                )}
              </div>

              {/* Form Actions */}
              <div className="flex gap-2 pt-4">
                <Button type="submit" disabled={isSubmitting} className="gap-2">
                  {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  {isSubmitting ? 'Saving...' : isEditing ? 'Update Service' : 'Create Service'}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  )
}
