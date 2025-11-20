'use client'

import React, { useCallback, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Form, FormControl, FormField, FormItem, FormLabel } from '@/components/ui/form'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { X, Search, ChevronDown } from 'lucide-react'

// Filter schema
const ServiceFilterSchema = z.object({
  search: z.string().optional(),
  category: z.string().optional(),
  active: z.boolean().optional(),
  featured: z.boolean().optional(),
  minPrice: z.coerce.number().optional(),
  maxPrice: z.coerce.number().optional(),
  minDuration: z.coerce.number().optional(),
  maxDuration: z.coerce.number().optional(),
})

export type ServiceFilterValues = z.infer<typeof ServiceFilterSchema>

interface ServiceFilterProps {
  /** Available service categories */
  categories?: string[]
  /** Called when filters are applied */
  onFilter: (filters: ServiceFilterValues) => void
  /** Called when filters are cleared */
  onClear?: () => void
  /** Initial filter values */
  initialValues?: Partial<ServiceFilterValues>
  /** Show compact view (just search + expand button) */
  compact?: boolean
  /** Custom className */
  className?: string
}

/**
 * ServiceFilter Component
 *
 * Provides filtering options for services by:
 * - Search text (name/description)
 * - Category
 * - Active/inactive status
 * - Featured status
 * - Price range
 * - Duration range
 *
 * Can be displayed in expanded or compact mode.
 *
 * @example
 * ```tsx
 * const [filters, setFilters] = useState<ServiceFilterValues>({})
 *
 * <ServiceFilter
 *   categories={['Consulting', 'Training', 'Support']}
 *   onFilter={setFilters}
 *   compact={true}
 * />
 * ```
 */
export function ServiceFilter({
  categories = [],
  onFilter,
  onClear,
  initialValues,
  compact = false,
  className = '',
}: ServiceFilterProps) {
  const [isExpanded, setIsExpanded] = useState(!compact)
  const [activeFilters, setActiveFilters] = useState(0)

  const form = useForm<ServiceFilterValues>({
    resolver: zodResolver(ServiceFilterSchema),
    defaultValues: {
      search: '',
      category: '',
      active: true,
      featured: false,
      minPrice: undefined,
      maxPrice: undefined,
      minDuration: undefined,
      maxDuration: undefined,
      ...initialValues,
    },
  })

  const handleApplyFilters = useCallback(
    (values: ServiceFilterValues) => {
      // Count active filters
      let count = 0
      if (values.search) count++
      if (values.category) count++
      if (values.active !== undefined) count++
      if (values.featured) count++
      if (values.minPrice !== undefined) count++
      if (values.maxPrice !== undefined) count++
      if (values.minDuration !== undefined) count++
      if (values.maxDuration !== undefined) count++

      setActiveFilters(count)
      onFilter(values)
    },
    [onFilter]
  )

  const handleClearFilters = useCallback(() => {
    form.reset()
    setActiveFilters(0)
    onClear?.()
  }, [form, onClear])

  if (compact && !isExpanded) {
    return (
      <div className={`service-filter-compact flex items-center gap-2 ${className}`}>
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            type="text"
            placeholder="Search services..."
            className="pl-10"
            {...form.register('search')}
            onChange={(e) => {
              form.setValue('search', e.target.value)
              handleApplyFilters(form.getValues())
            }}
          />
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsExpanded(true)}
          className="gap-2"
        >
          <ChevronDown className="h-4 w-4" />
          Filters
          {activeFilters > 0 && <Badge variant="secondary">{activeFilters}</Badge>}
        </Button>
      </div>
    )
  }

  return (
    <Card className={`service-filter ${className}`}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle className="text-lg">Filter Services</CardTitle>
        {compact && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(false)}
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </CardHeader>

      <CardContent>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleApplyFilters)}
            className="space-y-4"
          >
            {/* Search Field */}
            <FormField
              control={form.control}
              name="search"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Search</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                      <Input
                        placeholder="Service name or description..."
                        className="pl-10"
                        {...field}
                      />
                    </div>
                  </FormControl>
                </FormItem>
              )}
            />

            {/* Category Filter */}
            {categories.length > 0 && (
              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category</FormLabel>
                    <Select value={field.value || ''} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="All categories" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="">All categories</SelectItem>
                        {categories.map((cat) => (
                          <SelectItem key={cat} value={cat}>
                            {cat}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />
            )}

            {/* Status Filters */}
            <div className="space-y-2">
              <FormLabel>Status</FormLabel>
              <div className="space-y-2">
                <FormField
                  control={form.control}
                  name="active"
                  render={({ field }) => (
                    <FormItem className="flex items-center space-x-2 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={(checked) => {
                            field.onChange(checked)
                            handleApplyFilters(form.getValues())
                          }}
                        />
                      </FormControl>
                      <FormLabel className="font-normal cursor-pointer">
                        Active services only
                      </FormLabel>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="featured"
                  render={({ field }) => (
                    <FormItem className="flex items-center space-x-2 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={(checked) => {
                            field.onChange(checked)
                            handleApplyFilters(form.getValues())
                          }}
                        />
                      </FormControl>
                      <FormLabel className="font-normal cursor-pointer">
                        Featured services only
                      </FormLabel>
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Price Range */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="minPrice"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Min Price</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="0"
                        min="0"
                        step="0.01"
                        {...field}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="maxPrice"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Max Price</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="Any"
                        min="0"
                        step="0.01"
                        {...field}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>

            {/* Duration Range */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="minDuration"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Min Duration (mins)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="0"
                        min="0"
                        step="15"
                        {...field}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="maxDuration"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Max Duration (mins)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="Any"
                        min="0"
                        step="15"
                        {...field}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2 pt-4">
              <Button type="submit" className="flex-1">
                Apply Filters
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={handleClearFilters}
              >
                Clear
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}

export default ServiceFilter
