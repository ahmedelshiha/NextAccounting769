import { renderHook, waitFor } from '@testing-library/react'
import { useServices } from '../useServices'
import { useBookings } from '../useBookings'
import { useTasks } from '../useTasks'
import { useUsers } from '../useUsers'
import { useDocuments } from '../useDocuments'
import { useInvoices } from '../useInvoices'
import { useMessages } from '../useMessages'
import { useApprovals } from '../useApprovals'
import { apiFetch } from '@/lib/api'
import { vi } from 'vitest'

vi.mock('@/lib/api')

describe('Data Fetching Hooks', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('useServices', () => {
    it('fetches services successfully', async () => {
      const mockData = {
        data: [{ id: '1', name: 'Service 1' }],
        meta: { total: 1, hasMore: false },
      }
      vi.mocked(apiFetch).mockResolvedValueOnce({
        ok: true,
        json: async () => mockData,
      } as any)

      const { result } = renderHook(() => useServices())

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.data).toEqual(mockData.data)
      expect(result.current.total).toBe(1)
    })

    it('passes filters as query parameters', async () => {
      vi.mocked(apiFetch).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: [], meta: { total: 0 } }),
      } as any)

      renderHook(() => useServices({ active: true, category: 'consulting', limit: 20 }))

      await waitFor(() => {
        expect(apiFetch).toHaveBeenCalledWith(
          expect.stringContaining('active=true')
        )
        expect(apiFetch).toHaveBeenCalledWith(
          expect.stringContaining('category=consulting')
        )
        expect(apiFetch).toHaveBeenCalledWith(
          expect.stringContaining('limit=20')
        )
      })
    })

    it('handles errors gracefully', async () => {
      vi.mocked(apiFetch).mockResolvedValueOnce({
        ok: false,
        status: 400,
      } as any)

      const { result } = renderHook(() => useServices())

      await waitFor(() => {
        expect(result.current.error).toBeDefined()
      })
    })
  })

  describe('useBookings', () => {
    it('fetches bookings successfully', async () => {
      const mockData = {
        data: [{ id: '1', serviceId: 'svc-1', status: 'CONFIRMED' }],
        meta: { total: 1, hasMore: false },
      }
      vi.mocked(apiFetch).mockResolvedValueOnce({
        ok: true,
        json: async () => mockData,
      } as any)

      const { result } = renderHook(() => useBookings())

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.data).toEqual(mockData.data)
    })

    it('supports status filter', async () => {
      vi.mocked(apiFetch).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: [], meta: { total: 0 } }),
      } as any)

      renderHook(() => useBookings({ status: 'PENDING', limit: 10 }))

      await waitFor(() => {
        expect(apiFetch).toHaveBeenCalledWith(
          expect.stringContaining('status=PENDING')
        )
      })
    })

    it('returns pagination metadata', async () => {
      const mockData = {
        data: [{ id: '1' }],
        meta: { total: 100, hasMore: true },
      }
      vi.mocked(apiFetch).mockResolvedValueOnce({
        ok: true,
        json: async () => mockData,
      } as any)

      const { result } = renderHook(() => useBookings())

      await waitFor(() => {
        expect(result.current.hasMore).toBe(true)
        expect(result.current.total).toBe(100)
      })
    })
  })

  describe('useTasks', () => {
    it('fetches tasks successfully', async () => {
      const mockData = {
        data: [{ id: '1', title: 'Task 1', status: 'OPEN' }],
        meta: { total: 1, hasMore: false },
      }
      vi.mocked(apiFetch).mockResolvedValueOnce({
        ok: true,
        json: async () => mockData,
      } as any)

      const { result } = renderHook(() => useTasks())

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.data).toEqual(mockData.data)
    })

    it('supports assignedToMe filter', async () => {
      vi.mocked(apiFetch).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: [], meta: { total: 0 } }),
      } as any)

      renderHook(() => useTasks({ assignedToMe: true }))

      await waitFor(() => {
        expect(apiFetch).toHaveBeenCalledWith(
          expect.stringContaining('assignedToMe=true')
        )
      })
    })
  })

  describe('useUsers', () => {
    it('fetches users successfully', async () => {
      const mockData = {
        data: [{ id: '1', name: 'User 1', role: 'ADMIN' }],
        meta: { total: 1, hasMore: false },
      }
      vi.mocked(apiFetch).mockResolvedValueOnce({
        ok: true,
        json: async () => mockData,
      } as any)

      const { result } = renderHook(() => useUsers())

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.data).toEqual(mockData.data)
    })
  })

  describe('useDocuments', () => {
    it('fetches documents successfully', async () => {
      const mockData = {
        data: [{ id: '1', filename: 'doc.pdf', status: 'SAFE' }],
        meta: { total: 1, hasMore: false },
      }
      vi.mocked(apiFetch).mockResolvedValueOnce({
        ok: true,
        json: async () => mockData,
      } as any)

      const { result } = renderHook(() => useDocuments())

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.data).toEqual(mockData.data)
    })
  })

  describe('useInvoices', () => {
    it('fetches invoices successfully', async () => {
      const mockData = {
        data: [{ id: '1', amount: 1000, status: 'SENT' }],
        meta: { total: 1, hasMore: false },
      }
      vi.mocked(apiFetch).mockResolvedValueOnce({
        ok: true,
        json: async () => mockData,
      } as any)

      const { result } = renderHook(() => useInvoices())

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.data).toEqual(mockData.data)
    })
  })

  describe('useMessages', () => {
    it('fetches messages for a thread', async () => {
      const mockData = {
        data: [{ id: '1', content: 'Hello', senderId: 'user-1' }],
        meta: { total: 1, hasMore: false },
      }
      vi.mocked(apiFetch).mockResolvedValueOnce({
        ok: true,
        json: async () => mockData,
      } as any)

      const { result } = renderHook(() =>
        useMessages({ threadId: 'thread-123' })
      )

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.data).toEqual(mockData.data)
    })

    it('requires threadId parameter', () => {
      vi.mocked(apiFetch).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: [], meta: { total: 0 } }),
      } as any)

      renderHook(() =>
        useMessages({ threadId: 'required-thread-id' })
      )

      expect(apiFetch).toHaveBeenCalledWith(
        expect.stringContaining('threadId=required-thread-id')
      )
    })
  })

  describe('useApprovals', () => {
    it('fetches approvals successfully', async () => {
      const mockData = {
        data: [{ id: '1', status: 'PENDING' }],
        meta: { total: 1, hasMore: false },
      }
      vi.mocked(apiFetch).mockResolvedValueOnce({
        ok: true,
        json: async () => mockData,
      } as any)

      const { result } = renderHook(() => useApprovals())

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.data).toEqual(mockData.data)
    })

    it('supports pendingOnly filter', async () => {
      vi.mocked(apiFetch).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: [], meta: { total: 0 } }),
      } as any)

      renderHook(() => useApprovals({ pendingOnly: true }))

      await waitFor(() => {
        expect(apiFetch).toHaveBeenCalledWith(
          expect.stringContaining('pendingOnly=true')
        )
      })
    })
  })

  describe('Hook behavior', () => {
    it('supports manual refresh', async () => {
      const mockData = {
        data: [{ id: '1' }],
        meta: { total: 1, hasMore: false },
      }
      vi.mocked(apiFetch).mockResolvedValue({
        ok: true,
        json: async () => mockData,
      } as any)

      const { result } = renderHook(() => useServices())

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      const initialCallCount = vi.mocked(apiFetch).mock.calls.length

      result.current.refresh()

      await waitFor(() => {
        expect(vi.mocked(apiFetch).mock.calls.length).toBeGreaterThan(
          initialCallCount
        )
      })
    })

    it('provides isValidating state', async () => {
      vi.mocked(apiFetch).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: [], meta: { total: 0 } }),
      } as any)

      const { result } = renderHook(() => useServices())

      expect(result.current.isValidating).toBeDefined()
    })
  })
})
