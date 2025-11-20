'use client'

import useSWR, { mutate } from 'swr'
import { apiFetch } from '@/lib/api'

interface ApprovalFilters {
  limit?: number
  offset?: number
  type?: string
  status?: string
}

/**
 * Hook for fetching and managing approvals
 */
export function useApprovals(filters: ApprovalFilters = {}) {
  const {
    limit = 20,
    offset = 0,
    type,
    status,
  } = filters

  // Build query string
  const searchParams = new URLSearchParams()
  searchParams.append('limit', String(limit))
  searchParams.append('offset', String(offset))
  if (type) searchParams.append('type', type)
  if (status) searchParams.append('status', status)

  const url = `/api/approvals?${searchParams.toString()}`

  const { data, error, isLoading } = useSWR(url, apiFetch, {
    revalidateOnFocus: false,
    dedupingInterval: 10000,
  })

  const getPendingCount = (): number => {
    if (!data) return 0
    return data.meta?.total || 0
  }

  return {
    approvals: data?.data || [],
    total: data?.meta?.total || 0,
    hasMore: data?.meta?.hasMore || false,
    isLoading,
    error,
    pendingCount: getPendingCount(),
    refresh: () => mutate(url),
  }
}

/**
 * Hook for getting single approval
 */
export function useApproval(approvalId: string) {
  const { data, error, isLoading, mutate: refresh } = useSWR(
    approvalId ? `/api/approvals/${approvalId}` : null,
    apiFetch,
    {
      revalidateOnFocus: false,
    }
  )

  return {
    approval: data?.data,
    history: data?.data?.history || [],
    isLoading,
    error,
    refresh,
  }
}

/**
 * Hook for approval actions
 */
export function useApprovalActions() {
  const approve = async (approvalId: string, notes?: string) => {
    try {
      const result = await apiFetch(`/api/approvals/${approvalId}`, {
        method: 'POST',
        body: JSON.stringify({
          action: 'approve',
          notes,
        }),
      })

      // Refresh approvals list
      await mutate(/\/api\/approvals/)

      return result
    } catch (error) {
      console.error('Error approving:', error)
      throw error
    }
  }

  const reject = async (approvalId: string, notes?: string) => {
    try {
      const result = await apiFetch(`/api/approvals/${approvalId}`, {
        method: 'POST',
        body: JSON.stringify({
          action: 'reject',
          notes,
        }),
      })

      // Refresh approvals list
      await mutate(/\/api\/approvals/)

      return result
    } catch (error) {
      console.error('Error rejecting:', error)
      throw error
    }
  }

  const delegate = async (
    approvalId: string,
    delegateTo: string,
    reason?: string
  ) => {
    try {
      const result = await apiFetch(`/api/approvals/${approvalId}`, {
        method: 'POST',
        body: JSON.stringify({
          action: 'delegate',
          delegateTo,
          notes: reason,
        }),
      })

      // Refresh approvals list
      await mutate(/\/api\/approvals/)

      return result
    } catch (error) {
      console.error('Error delegating:', error)
      throw error
    }
  }

  return {
    approve,
    reject,
    delegate,
  }
}
