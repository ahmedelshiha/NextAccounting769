'use client'

import React, { useMemo } from 'react'
import { Service } from '@/types/shared/entities/service'
import ServiceCard from '../cards/ServiceCard'
import { Skeleton } from '@/components/ui/skeleton'
import { ComponentVariant } from '../types'

interface ServiceGridProps {
  /** Services to display */
  services: Service[]
  /** Display variant */
  variant?: ComponentVariant
  /** Number of columns */
  columns?: number | { mobile?: number; tablet?: number; desktop?: number }
  /** Is loading */
  loading?: boolean
  /** Show action buttons */
  showActions?: boolean
  /** Called when service is selected (portal mode) */
  onSelect?: (id: string) => void
  /** Called to edit service (admin mode) */
  onEdit?: (id: string) => void
  /** Called to delete service (admin mode) */
  onDelete?: (id: string) => void
  /** Custom className */
  className?: string
  /** Empty state message */
  emptyMessage?: string
}

/**
 * ServiceGrid Component
 *
 * Displays services in a responsive grid layout.
 * Automatically adapts column count based on viewport width.
 * Portal variant: Read-only with selection action
 * Admin variant: Full CRUD operations with metrics
 *
 * @example
 * ```tsx
 * // Portal usage
 * <ServiceGrid
 *   services={services}
 *   variant="portal"
 *   columns={{ mobile: 1, tablet: 2, desktop: 3 }}
 *   onSelect={handleSelect}
 * />
 *
 * // Admin usage
 * <ServiceGrid
 *   services={services}
 *   variant="admin"
 *   columns={4}
 *   onEdit={handleEdit}
 *   onDelete={handleDelete}
 * />
 * ```
 */
export function ServiceGrid({
  services,
  variant = 'portal',
  columns = { mobile: 1, tablet: 2, desktop: 3 },
  loading = false,
  showActions = true,
  onSelect,
  onEdit,
  onDelete,
  className = '',
  emptyMessage = 'No services available',
}: ServiceGridProps) {
  // Determine grid columns
  const gridColumns = useMemo(() => {
    if (typeof columns === 'number') {
      return columns
    }

    // Responsive columns - this would be determined by viewport in real implementation
    // For now, default to desktop
    return columns.desktop || 3
  }, [columns])

  // Skeleton loading state
  if (loading && services.length === 0) {
    return (
      <div
        className={`service-grid-skeleton grid gap-4 ${className}`}
        style={{
          gridTemplateColumns: `repeat(${gridColumns}, minmax(0, 1fr))`,
        }}
      >
        {[...Array(gridColumns * 2)].map((_, i) => (
          <div key={i} className="h-80">
            <Skeleton className="h-full rounded-lg" />
          </div>
        ))}
      </div>
    )
  }

  // Empty state
  if (!loading && services.length === 0) {
    return (
      <div className={`service-grid-empty flex items-center justify-center min-h-64 p-8 rounded-lg border border-dashed bg-muted/20 ${className}`}>
        <div className="text-center">
          <p className="text-muted-foreground text-lg">{emptyMessage}</p>
        </div>
      </div>
    )
  }

  return (
    <div
      className={`service-grid grid gap-4 ${className}`}
      style={{
        gridTemplateColumns: `repeat(auto-fill, minmax(${variant === 'compact' ? '200px' : '280px'}, 1fr))`,
      }}
    >
      {services.map((service) => (
        <ServiceCard
          key={service.id}
          data={service}
          variant={variant}
          onSelect={onSelect}
          onEdit={onEdit}
          onDelete={onDelete}
          showActions={showActions}
          loading={loading}
        />
      ))}
    </div>
  )
}

export default ServiceGrid
