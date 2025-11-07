'use client'

import React, { memo } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { UserStats } from '../contexts/UsersContextProvider'

interface StatsSectionProps {
  stats: UserStats | null
  isLoading?: boolean
}

const StatsCardSkeleton = memo(function StatsCardSkeleton() {
  return (
    <Card className="animate-pulse">
      <CardHeader className="space-y-0 pb-2">
        <div className="h-4 bg-gray-200 rounded w-20" />
      </CardHeader>
      <CardContent>
        <div className="h-8 bg-gray-200 rounded w-16 mb-1" />
        <div className="h-3 bg-gray-200 rounded w-24" />
      </CardContent>
    </Card>
  )
})

const TopClientsCard = memo(function TopClientsCard({ stats }: { stats: UserStats | null }) {
  // Safely access topUsers with proper null/undefined checks
  const topUsers = stats?.topUsers && Array.isArray(stats.topUsers) ? stats.topUsers : []

  return (
    <Card className="lg:col-span-1">
      <CardHeader>
        <CardTitle>Top Clients by Bookings</CardTitle>
        <CardDescription>Most active clients</CardDescription>
      </CardHeader>
      <CardContent>
        {topUsers.length > 0 ? (
          <div className="divide-y divide-gray-100">
            {topUsers.map((u) => {
              // Ensure bookingsCount is safely accessed
              const bookingCount = typeof u.bookingsCount === 'number' ? u.bookingsCount : 0
              return (
                <div key={u.id} className="flex items-center justify-between py-3">
                  <div>
                    <div className="font-medium text-gray-900">{u.name || 'Unnamed User'}</div>
                    <div className="text-sm text-gray-600">{u.email || ''}</div>
                  </div>
                  <Badge className="bg-blue-100 text-blue-800">{bookingCount} bookings</Badge>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="text-gray-500 text-sm">No user performance data.</div>
        )}
      </CardContent>
    </Card>
  )
})

export const StatsSection = memo(function StatsSection({ stats, isLoading = false }: StatsSectionProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
        {Array.from({ length: 5 }).map((_, i) => (
          <StatsCardSkeleton key={i} />
        ))}
      </div>
    )
  }

  // Provide default values to avoid "Expression not available" errors
  const safeStats = stats || {
    total: 0,
    clients: 0,
    staff: 0,
    admins: 0,
    newThisMonth: 0,
    newLastMonth: 0,
    growth: 0,
    activeUsers: 0,
    registrationTrends: [],
    topUsers: []
  }

  return (
    <div className="space-y-6">
      {/* Main Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        {/* Total Users */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{safeStats.total}</div>
            {typeof safeStats.growth === 'number' && safeStats.growth !== 0 && (
              <p className="text-xs text-muted-foreground">
                {safeStats.growth >= 0 ? `+${safeStats.growth}%` : `${safeStats.growth}%`} MoM
              </p>
            )}
          </CardContent>
        </Card>

        {/* Clients */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Clients</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{safeStats.clients}</div>
            <p className="text-xs text-muted-foreground">Active clients</p>
          </CardContent>
        </Card>

        {/* Staff */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Staff</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{safeStats.staff}</div>
            <p className="text-xs text-muted-foreground">Team members</p>
          </CardContent>
        </Card>

        {/* Admins */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Admins</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{safeStats.admins}</div>
            <p className="text-xs text-muted-foreground">Full access</p>
          </CardContent>
        </Card>

        {/* New This Month */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">New This Month</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{safeStats.newThisMonth}</div>
            <p className="text-xs text-muted-foreground">Recent signups</p>
          </CardContent>
        </Card>
      </div>

      {/* Top Clients Card */}
      <TopClientsCard stats={safeStats} />
    </div>
  )
})

StatsSection.displayName = 'StatsSection'
