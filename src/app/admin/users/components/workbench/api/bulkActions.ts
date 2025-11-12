/**
 * Bulk Actions API wrapper
 * 
 * Provides functions to perform bulk operations on multiple users.
 */

export interface BulkActionPayload {
  userIds: string[]
  action: string
  value: unknown
}

export interface BulkActionResponse {
  operationId: string
  affectedCount: number
  success: boolean
  timestamp: string
}

export interface DryRunResponse {
  preview: BulkActionPreview
  estimatedTime: number
  affectedCount: number
}

export interface BulkActionPreview {
  action: string
  value: unknown
  userCount: number
  changes: Array<{
    userId: string
    before: unknown
    after: unknown
  }>
}

/**
 * Apply a bulk action to multiple users
 *
 * POST /api/admin/users/bulk-action
 * Body: { userIds: string[], action: string, value: unknown }
 */
export async function applyBulkAction(payload: BulkActionPayload): Promise<BulkActionResponse> {
  const res = await fetch('/api/admin/users/bulk-action', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  })

  if (!res.ok) {
    throw new Error(`Failed to apply bulk action: ${res.statusText}`)
  }

  return res.json()
}

/**
 * Preview a bulk action before applying
 *
 * POST /api/admin/users/bulk-action/dry-run
 * Body: { userIds: string[], action: string, value: unknown }
 */
export async function previewBulkAction(payload: BulkActionPayload): Promise<DryRunResponse> {
  const res = await fetch('/api/admin/users/bulk-action/dry-run', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  })

  if (!res.ok) {
    throw new Error(`Failed to preview bulk action: ${res.statusText}`)
  }

  return res.json()
}

/**
 * Undo a bulk action
 *
 * POST /api/admin/users/bulk-action/undo
 * Body: { operationId: string }
 */
export async function undoBulkAction(operationId: string): Promise<{ success: boolean }> {
  const res = await fetch('/api/admin/users/bulk-action/undo', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ operationId })
  })

  if (!res.ok) {
    throw new Error(`Failed to undo bulk action: ${res.statusText}`)
  }

  return res.json()
}

/**
 * Get bulk action history
 *
 * GET /api/admin/users/bulk-action/history
 */
export async function getBulkActionHistory(limit: number = 20): Promise<BulkActionResponse[]> {
  const res = await fetch(`/api/admin/users/bulk-action/history?limit=${limit}`)

  if (!res.ok) {
    throw new Error(`Failed to fetch bulk action history: ${res.statusText}`)
  }

  return res.json()
}
