/**
 * Stats API wrapper
 * 
 * Provides functions to fetch dashboard statistics and KPI metrics.
 */

export interface StatsResponse {
  activeUsers: number
  pendingApprovals: number
  inProgressWorkflows: number
  dueThisWeek: number
  systemHealth: number
  costPerUser: number
  roleDistribution: Record<string, number>
  userGrowth: Array<{ month: string; count: number }>
  lastUpdated: string
}

/**
 * Fetch dashboard statistics
 *
 * GET /api/admin/users/stats
 */
export async function getStats(): Promise<StatsResponse> {
  const res = await fetch('/api/admin/users/stats')

  if (!res.ok) {
    throw new Error(`Failed to fetch stats: ${res.statusText}`)
  }

  return res.json()
}

/**
 * Get simplified stats (faster response)
 *
 * GET /api/admin/users/stats?simple=true
 */
export async function getSimpleStats(): Promise<Partial<StatsResponse>> {
  const res = await fetch('/api/admin/users/stats?simple=true')

  if (!res.ok) {
    throw new Error(`Failed to fetch simple stats: ${res.statusText}`)
  }

  return res.json()
}
