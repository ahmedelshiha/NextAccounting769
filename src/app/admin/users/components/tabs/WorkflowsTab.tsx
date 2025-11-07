'use client'

import React, { useMemo, useState } from 'react'
import { PendingOperationsPanel } from '@/app/admin/users/components/PendingOperationsPanel'
import { usePendingOperations } from '@/app/admin/users/hooks/usePendingOperations'
import { Button } from '@/components/ui/button'

export function WorkflowsTab() {
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'in-progress' | 'completed'>('all')
  const { operations, isLoading, error, refetch } = usePendingOperations({ enabled: true })

  const filteredOps = useMemo(() => {
    if (statusFilter === 'all') return operations
    return operations.filter(op => op.status === statusFilter)
  }, [operations, statusFilter])

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Button
            variant={statusFilter === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setStatusFilter('all')}
            aria-pressed={statusFilter === 'all'}
          >
            All
          </Button>
          <Button
            variant={statusFilter === 'pending' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setStatusFilter('pending')}
            aria-pressed={statusFilter === 'pending'}
          >
            Pending
          </Button>
          <Button
            variant={statusFilter === 'in-progress' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setStatusFilter('in-progress')}
            aria-pressed={statusFilter === 'in-progress'}
          >
            In Progress
          </Button>
          <Button
            variant={statusFilter === 'completed' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setStatusFilter('completed')}
            aria-pressed={statusFilter === 'completed'}
          >
            Completed
          </Button>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => refetch()} aria-label="Refresh workflows">
            Refresh
          </Button>
        </div>
      </div>

      {error ? (
        <div className="bg-red-50 border border-red-200 text-red-800 rounded-md p-4" role="alert">
          Failed to load workflows. Please try again.
        </div>
      ) : (
        <PendingOperationsPanel operations={filteredOps} isLoading={isLoading} />
      )}
    </div>
  )
}
