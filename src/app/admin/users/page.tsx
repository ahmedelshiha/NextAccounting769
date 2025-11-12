'use client'

import React, { Suspense } from 'react'
import { EnterpriseUsersPage } from './EnterpriseUsersPage'

/**
 * Admin Users Page
 *
 * Main entry point for the admin users page.
 * Uses the unified EnterpriseUsersPage implementation with tabbed interface.
 *
 * Features:
 * - Dashboard Tab: User directory and operations overview
 * - Workflows Tab: User lifecycle workflows
 * - Bulk Operations Tab: Batch user operations
 * - Audit Tab: Compliance and audit trail
 * - RBAC Tab: Role and permission management
 * - Admin Tab: System configuration
 *
 * Architecture:
 * - Server-side data fetching via layout.tsx
 * - Client-side state management for filters
 * - UsersContextProvider for shared state
 * - Dynamic imports for performance optimization
 *
 * Data Flow:
 * - UsersContextProvider initialized in layout.tsx
 * - Initial data fetched server-side and provided via context
 * - Client components receive data through context
 */
function PageLoadingSkeleton() {
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="h-12 bg-gray-200 rounded w-64 animate-pulse" />
        <div className="grid grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-24 bg-gray-200 rounded animate-pulse" />
          ))}
        </div>
        <div className="h-64 bg-gray-200 rounded animate-pulse" />
      </div>
    </div>
  )
}

export default function AdminUsersPage() {
  return (
    <Suspense fallback={<PageLoadingSkeleton />}>
      <EnterpriseUsersPage />
    </Suspense>
  )
}
