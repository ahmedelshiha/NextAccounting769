import { renderHook, waitFor, act } from '@testing-library/react'
import { describe, it, beforeEach, vi, expect } from 'vitest'
import { useUsersList } from '../hooks/useUsersList'

// Mock apiFetch
vi.mock('@/lib/api', () => ({
  apiFetch: vi.fn()
}))

import { apiFetch } from '@/lib/api'

describe('useUsersList', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should return initial empty state', () => {
    const { result } = renderHook(() => useUsersList())

    expect(result.current.users).toEqual([])
    expect(result.current.isLoading).toBe(false)
    expect(result.current.error).toBe(null)
  })

  it('should fetch users when refetch is called', async () => {
    const mockUsers = [
      { id: '1', name: 'John Doe', email: 'john@example.com', role: 'ADMIN', createdAt: '2025-01-01' },
      { id: '2', name: 'Jane Smith', email: 'jane@example.com', role: 'TEAM_MEMBER', createdAt: '2025-01-02' }
    ]

    ;(apiFetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ users: mockUsers })
    })

    const { result } = renderHook(() => useUsersList())

    await act(async () => {
      await result.current.refetch()
    })

    await waitFor(() => {
      expect(result.current.users).toEqual(mockUsers)
      expect(result.current.isLoading).toBe(false)
      expect(result.current.error).toBe(null)
    })
  })

  it('should handle fetch errors gracefully', async () => {
    ;(apiFetch as any).mockResolvedValueOnce({
      ok: false,
      status: 500
    })

    const onError = vi.fn()
    const { result } = renderHook(() => useUsersList({ onError }))

    await act(async () => {
      await result.current.refetch()
    })

    await waitFor(() => {
      expect(result.current.users).toEqual([])
      expect(result.current.error).toBeTruthy()
      expect(onError).toHaveBeenCalled()
    })
  })

  it('should provide refetch function and allow multiple calls', async () => {
    const mockUsers = [{ id: '1', name: 'John', email: 'john@example.com', role: 'ADMIN', createdAt: '2025-01-01' }]

    ;(apiFetch as any).mockResolvedValue({
      ok: true,
      json: async () => ({ users: mockUsers })
    })

    const { result } = renderHook(() => useUsersList())

    // Initial state should be empty
    expect(result.current.users).toEqual([])

    // First refetch call
    await act(async () => {
      await result.current.refetch()
    })

    await waitFor(() => {
      expect(result.current.users).toEqual(mockUsers)
    })

    // Second refetch call
    await act(async () => {
      await result.current.refetch()
    })

    expect(apiFetch).toHaveBeenCalledTimes(2)
  })

  it('should handle empty user list', async () => {
    ;(apiFetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ users: [] })
    })

    const { result } = renderHook(() => useUsersList())

    await act(async () => {
      await result.current.refetch()
    })

    await waitFor(() => {
      expect(result.current.users).toEqual([])
      expect(result.current.isLoading).toBe(false)
      expect(result.current.error).toBe(null)
    })
  })

  it('should provide refetch method for manual data refresh', async () => {
    const { result } = renderHook(() => useUsersList())

    // Verify refetch is a callable function
    expect(typeof result.current.refetch).toBe('function')
  })
})
