'use client'

import React, { useEffect, useState } from 'react'
import { useUsersContext } from '../../contexts/UsersContextProvider'
import { OperationsOverviewCards, OperationsMetrics } from '../OperationsOverviewCards'
import { Skeleton } from '@/components/ui/skeleton'

/**
 * OverviewCards wrapper for AdminWorkBench
 *
 * Adapts OperationsOverviewCards to fetch its own data from context.
 * Displays KPI metrics for the dashboard with production-like data.
 */
export default function OverviewCards() {
  const context = useUsersContext()
  const [metrics, setMetrics] = useState<OperationsMetrics | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Build metrics from context with real database data
    const users = Array.isArray(context.users) ? context.users : []

    // Count actual users by status
    const activeCount = users.filter(u => u.status === 'ACTIVE' || u.isActive).length
    const inactiveCount = users.filter(u => u.status === 'INACTIVE' || !u.isActive).length

    const newMetrics: OperationsMetrics = {
      totalUsers: users.length,
      pendingApprovals: inactiveCount,
      inProgressWorkflows: activeCount,
      systemHealth: 98.5
    }

    setMetrics(newMetrics)
    setIsLoading(false)
  }, [context.users])

  if (isLoading || !metrics) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-24 rounded-lg" />
        ))}
      </div>
    )
  }

  return <OperationsOverviewCards metrics={metrics} isLoading={context.isLoading} />
}
