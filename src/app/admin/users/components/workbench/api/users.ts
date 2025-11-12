/**
 * Users API wrapper
 *
 * Provides functions to interact with the /api/admin/users endpoints.
 * Maintains backward compatibility with existing API contracts.
 */

import { UserItem } from '../../../contexts/UsersContextProvider'

export interface GetUsersParams {
  limit?: number
  offset?: number
  search?: string
  role?: string
  status?: string
  sort?: string
  sortOrder?: 'asc' | 'desc'
}

export interface GetUsersResponse {
  users: UserItem[]
  total: number
}

/**
 * Fetch users from the API
 *
 * GET /api/admin/users
 * Query params: limit, offset, search, role, status, sort, sortOrder
 */
export async function getUsers(params: GetUsersParams = {}): Promise<GetUsersResponse> {
  const query = new URLSearchParams()

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      query.append(key, String(value))
    }
  })

  const url = `/api/admin/users${query.toString() ? `?${query.toString()}` : ''}`
  const res = await fetch(url)

  if (!res.ok) {
    throw new Error(`Failed to fetch users: ${res.statusText}`)
  }

  return res.json()
}

/**
 * Update a single user
 *
 * PATCH /api/admin/users/{id}
 * Body: Partial<UserItem>
 */
export async function updateUser(
  id: string,
  data: Partial<UserItem>
): Promise<{ user: UserItem; success: boolean }> {
  const res = await fetch(`/api/admin/users/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  })

  if (!res.ok) {
    throw new Error(`Failed to update user: ${res.statusText}`)
  }

  return res.json()
}

/**
 * Get user by ID
 *
 * GET /api/admin/users/{id}
 */
export async function getUser(id: string): Promise<UserItem> {
  const res = await fetch(`/api/admin/users/${id}`)

  if (!res.ok) {
    throw new Error(`Failed to fetch user: ${res.statusText}`)
  }

  return res.json()
}

/**
 * Delete a user
 *
 * DELETE /api/admin/users/{id}
 */
export async function deleteUser(id: string): Promise<{ success: boolean }> {
  const res = await fetch(`/api/admin/users/${id}`, {
    method: 'DELETE'
  })

  if (!res.ok) {
    throw new Error(`Failed to delete user: ${res.statusText}`)
  }

  return res.json()
}
