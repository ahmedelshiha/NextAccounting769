'use client'

import React, { Suspense } from 'react'
import { Skeleton } from '@/components/ui/skeleton'
import UsersTableWrapper from './UsersTableWrapper'

interface UserDirectorySectionProps {
  selectedUserIds?: Set<string>
  onSelectionChange?: (ids: Set<string>) => void
  filters?: Record<string, any>
  onViewProfileInline?: (user: any) => void
}

/**
 * User directory section containing the virtualized users table
 *
 * Features:
 * - Virtualized list rendering (10,000+ users at 60fps)
 * - Responsive columns
 * - Selection state management
 * - Filter integration
 * - Loading and error states
 */
export default function UserDirectorySection({
  selectedUserIds = new Set(),
  onSelectionChange,
  filters = {},
  onViewProfileInline
}: UserDirectorySectionProps) {
  return (
    <Suspense fallback={<UserDirectorySkeleton />}>
      <div className="flex flex-col flex-1 overflow-hidden">
        <UsersTableWrapper
          selectedUserIds={selectedUserIds}
          onSelectionChange={onSelectionChange}
          filters={filters}
          onViewProfileInline={onViewProfileInline}
        />
      </div>
    </Suspense>
  )
}

/**
 * Loading skeleton for user directory
 */
function UserDirectorySkeleton() {
  return (
    <div className="space-y-2 px-4 py-3">
      {Array.from({ length: 10 }).map((_, i) => (
        <Skeleton key={i} className="h-12 w-full rounded" />
      ))}
    </div>
  )
}
