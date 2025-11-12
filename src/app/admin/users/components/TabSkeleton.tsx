'use client'

import React from 'react'

/**
 * Generic skeleton loader for tab content
 * Provides a smooth loading experience while tab content is being fetched
 */
export function TabSkeleton() {
  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 animate-pulse">
      {/* Header skeleton */}
      <div className="space-y-2">
        <div className="h-8 bg-gray-200 rounded w-1/3"></div>
        <div className="h-4 bg-gray-200 rounded w-1/2"></div>
      </div>

      {/* Cards skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-gray-200 rounded-lg h-24"></div>
        ))}
      </div>

      {/* Table skeleton */}
      <div className="space-y-3">
        <div className="bg-gray-200 rounded h-10"></div>
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="bg-gray-100 rounded h-12"></div>
        ))}
      </div>
    </div>
  )
}

/**
 * Minimal skeleton for quick loading (tabs with heavy content)
 */
export function MinimalTabSkeleton() {
  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="space-y-4 animate-pulse">
        <div className="h-6 bg-gray-200 rounded w-1/4"></div>
        <div className="h-20 bg-gray-100 rounded"></div>
      </div>
    </div>
  )
}

/**
 * Dashboard-specific skeleton
 */
export function DashboardTabSkeleton() {
  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 animate-pulse">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-gradient-to-br from-gray-200 to-gray-100 rounded-lg h-24"></div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-gray-100 rounded-lg h-64"></div>
        <div className="bg-gray-100 rounded-lg h-64"></div>
      </div>

      {/* Table */}
      <div className="space-y-3">
        <div className="h-10 bg-gray-200 rounded"></div>
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-12 bg-gray-100 rounded"></div>
        ))}
      </div>
    </div>
  )
}
