'use client'

import React from 'react'
import { Service } from '@/types/shared/entities/service'
import { usePermissions } from '@/lib/use-permissions'
import { PERMISSIONS } from '@/lib/permissions'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Edit2, Trash2, ChevronRight, DollarSign, Clock } from 'lucide-react'
import { ComponentVariant, CardComponentProps } from '../types'

interface ServiceCardProps extends CardComponentProps<Service> {
  /** The service to display */
  data: Service
  /** Display variant */
  variant?: ComponentVariant
  /** Called when card is clicked in portal mode */
  onSelect?: (id: string) => void
  /** Called to edit service (admin) */
  onEdit?: (id: string) => void
  /** Called to delete service (admin) */
  onDelete?: (id: string) => void
  /** Is loading */
  loading?: boolean
  /** Show action buttons */
  showActions?: boolean
}

/**
 * ServiceCard Component
 *
 * Displays service information in a card format.
 * Portal variant: Read-only with request/select action
 * Admin variant: Full CRUD with pricing and metrics
 * Compact variant: Minimal display for lists/tables
 *
 * @example
 * ```tsx
 * // Portal usage
 * <ServiceCard service={service} variant="portal" onSelect={handleSelect} />
 *
 * // Admin usage
 * <ServiceCard service={service} variant="admin" onEdit={handleEdit} onDelete={handleDelete} />
 * ```
 */
export default function ServiceCard({
  data: service,
  variant = 'portal',
  onSelect,
  onEdit,
  onDelete,
  loading = false,
  showActions = true,
  className = '',
}: ServiceCardProps) {
  const { has } = usePermissions()
  const canEditService = has(PERMISSIONS.SERVICES_EDIT)
  const canDeleteService = has(PERMISSIONS.SERVICES_DELETE)

  if (!service) return null

  const handleEdit = () => {
    if (onEdit && canEditService) {
      onEdit(service.id)
    }
  }

  const handleDelete = () => {
    if (onDelete && canDeleteService) {
      onDelete(service.id)
    }
  }

  const handleSelect = () => {
    if (onSelect && !loading) {
      onSelect(service.id)
    }
  }

  const statusColor = {
    DRAFT: 'bg-gray-100 text-gray-800',
    ACTIVE: 'bg-green-100 text-green-800',
    INACTIVE: 'bg-yellow-100 text-yellow-800',
    DEPRECATED: 'bg-orange-100 text-orange-800',
    RETIRED: 'bg-red-100 text-red-800',
  }

  // Compact variant - minimal display for lists
  if (variant === 'compact') {
    return (
      <div
        className={`flex items-center justify-between p-3 border rounded-md hover:bg-gray-50 cursor-pointer transition-colors ${className}`}
        onClick={handleSelect}
        role="button"
        tabIndex={0}
        aria-label={`Service: ${service.name}`}
      >
        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm truncate">{service.name}</p>
          {service.shortDesc && (
            <p className="text-xs text-gray-500 truncate">{service.shortDesc}</p>
          )}
        </div>
        {service.price != null && (
          <p className="text-sm font-semibold text-gray-900 ml-2">
            ${service.price.toFixed(2)}
          </p>
        )}
        <ChevronRight className="h-4 w-4 text-gray-400 ml-2 flex-shrink-0" />
      </div>
    )
  }

  return (
    <Card
      className={`overflow-hidden transition-all hover:shadow-md ${className}`}
      role="article"
      aria-label={`Service: ${service.name}`}
    >
      {/* Image Section */}
      {service.image && (
        <div className="relative h-40 overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200">
          <img
            src={service.image}
            alt={service.name}
            className="w-full h-full object-cover hover:scale-105 transition-transform"
          />
          {variant === 'admin' && (
            <div className="absolute top-2 right-2">
              <Badge className={statusColor[service.status] || 'bg-gray-100 text-gray-800'}>
                {service.status}
              </Badge>
            </div>
          )}
        </div>
      )}

      {/* Content Section */}
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <CardTitle className="truncate">{service.name}</CardTitle>
            {service.category && (
              <CardDescription className="text-xs">{service.category}</CardDescription>
            )}
          </div>
          {variant === 'admin' && service.featured && (
            <Badge variant="secondary" className="flex-shrink-0">
              Featured
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {/* Description */}
        <p className="text-sm text-gray-600 line-clamp-2">{service.description}</p>

        {/* Features */}
        {service.features && service.features.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {service.features.slice(0, 3).map((feature, idx) => (
              <Badge key={idx} variant="outline" className="text-xs">
                {feature}
              </Badge>
            ))}
            {service.features.length > 3 && (
              <Badge variant="outline" className="text-xs">
                +{service.features.length - 3}
              </Badge>
            )}
          </div>
        )}

        {/* Pricing & Duration (visible to portal) */}
        <div className="flex items-center gap-4 text-sm pt-2 border-t">
          {service.price != null && (
            <div className="flex items-center gap-1 text-gray-700">
              <DollarSign className="h-4 w-4" />
              <span className="font-semibold">${service.price.toFixed(2)}</span>
            </div>
          )}
          {service.duration != null && (
            <div className="flex items-center gap-1 text-gray-700">
              <Clock className="h-4 w-4" />
              <span>{service.duration} min</span>
            </div>
          )}
        </div>

        {/* Admin Section */}
        {variant === 'admin' && (
          <div className="pt-2 border-t space-y-2">
            {/* Metrics */}
            {service.metrics && (
              <div className="grid grid-cols-2 gap-2 text-xs">
                {service.metrics.bookings != null && (
                  <div className="bg-blue-50 p-2 rounded">
                    <p className="text-gray-600">Bookings</p>
                    <p className="font-semibold">{service.metrics.bookings}</p>
                  </div>
                )}
                {service.metrics.revenue != null && (
                  <div className="bg-green-50 p-2 rounded">
                    <p className="text-gray-600">Revenue</p>
                    <p className="font-semibold">${service.metrics.revenue.toFixed(2)}</p>
                  </div>
                )}
              </div>
            )}

            {/* Booking Config */}
            <div className="text-xs text-gray-600 space-y-1">
              {service.advanceBookingDays != null && (
                <p>Advance: {service.advanceBookingDays} days</p>
              )}
              {service.maxDailyBookings != null && (
                <p>Max Daily: {service.maxDailyBookings}</p>
              )}
            </div>
          </div>
        )}

        {/* Actions */}
        {showActions && (
          <div className="pt-2 border-t flex gap-2">
            {variant === 'admin' ? (
              <>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleEdit}
                  disabled={!canEditService || loading}
                  className="flex-1"
                  aria-label={`Edit service ${service.name}`}
                >
                  <Edit2 className="h-4 w-4 mr-1" />
                  Edit
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleDelete}
                  disabled={!canDeleteService || loading}
                  className="flex-1 text-red-600 hover:text-red-700 hover:bg-red-50"
                  aria-label={`Delete service ${service.name}`}
                >
                  <Trash2 className="h-4 w-4 mr-1" />
                  Delete
                </Button>
              </>
            ) : (
              <Button
                size="sm"
                onClick={handleSelect}
                disabled={!service.active || loading}
                className="w-full"
                aria-label={`Select service ${service.name}`}
              >
                {loading ? 'Loading...' : service.active ? 'Select' : 'Unavailable'}
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
