'use client'

import React, { useEffect, useState } from 'react'
import { useUsersContext } from '../../contexts/UsersContextProvider'
import { OperationsOverviewCards, OperationsMetrics } from '../OperationsOverviewCards'
import { Skeleton } from '@/components/ui/skeleton'

/**
 * OverviewCards wrapper for AdminWorkBench
 * 
 * Adapts OperationsOverviewCards to fetch its own data from context.
 * Displays KPI metrics for the dashboard.
 */
export default function OverviewCards() {
  const context = useUsersContext()
  const [metrics, setMetrics] = useState<OperationsMetrics | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Build metrics from context
    const users = Array.isArray(context.users) ? context.users : []

    const newMetrics: OperationsMetrics = {
      totalUsers: users.length,
      pendingApprovals: users.filter(u => u.status === 'INACTIVE').length,
      inProgressWorkflows: users.filter(u => u.status === 'ACTIVE').length,
      dueThisWeek: 0 // This would come from a separate API call
    }

    setMetrics(newMetrics)
    setIsLoading(false)
  }, [context.users])

  if (isLoading || !metrics) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-24 rounded-lg" />
        ))}
      </div>
    )
  }

  return <OperationsOverviewCards metrics={metrics} isLoading={context.isLoading} />
}
