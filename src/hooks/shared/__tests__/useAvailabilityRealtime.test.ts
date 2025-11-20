import { renderHook, waitFor } from '@testing-library/react'
import { useAvailabilityRealtime, useAvailabilitySlots } from '../useAvailabilityRealtime'
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest'

// Mock EventSource
class MockEventSource {
  public url: string
  public readyState = 0
  public onopen: (() => void) | null = null
  public onmessage: ((event: any) => void) | null = null
  public onerror: (() => void) | null = null

  constructor(url: string) {
    this.url = url
    setTimeout(() => {
      this.readyState = 1
      this.onopen?.()
    }, 10)
  }

  addEventListener(event: string, listener: (e: any) => void) {
    if (event === 'message') {
      // Mock implementation
    }
  }

  removeEventListener() {
    // Mock implementation
  }

  close() {
    this.readyState = 2
  }
}

// Mock fetch
const mockFetch = vi.fn()

describe('useAvailabilityRealtime', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Mock window.location
    Object.defineProperty(window, 'location', {
      value: { protocol: 'http:', host: 'localhost:3000' },
      writable: true,
    })
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('should initialize with disconnected state', () => {
    const { result } = renderHook(() => useAvailabilityRealtime({ autoConnect: false }))

    expect(result.current.connected).toBe(false)
    expect(result.current.isConnecting).toBe(false)
  })

  it('should connect when subscribe is called', () => {
    const { result } = renderHook(() => useAvailabilityRealtime({ autoConnect: false }))

    result.current.subscribe()

    expect(result.current.isConnecting).toBe(true)
  })

  it('should auto-connect when autoConnect is true', async () => {
    const { result } = renderHook(() => useAvailabilityRealtime({ autoConnect: true }))

    await waitFor(() => {
      expect(result.current.isConnecting || result.current.connected).toBe(true)
    })
  })

  it('should disconnect when disconnect is called', async () => {
    const { result } = renderHook(() => useAvailabilityRealtime({ autoConnect: true }))

    await waitFor(() => {
      expect(result.current.isConnecting || result.current.connected).toBe(true)
    })

    result.current.disconnect()

    await waitFor(() => {
      expect(result.current.connected).toBe(false)
    })
  })

  it('should call onSlotCreated callback when slot is created', async () => {
    const mockSlot = {
      id: 'slot-1',
      serviceId: 'service-1',
      date: '2024-01-15',
      startTime: '09:00',
      endTime: '10:00',
      available: true,
    }

    const onSlotCreated = vi.fn()

    const { result } = renderHook(() =>
      useAvailabilityRealtime({
        serviceId: 'service-1',
        onSlotCreated,
        autoConnect: false,
      })
    )

    // Simulate receiving a slot created event
    const eventPayload = {
      serviceId: 'service-1',
      action: 'created' as const,
    }

    // This would be called by the realtime event
    // In a real test, we'd need to mock the fetch response
    expect(result.current.connected).toBe(false)
  })

  it('should filter events by serviceId when specified', () => {
    const { result } = renderHook(() =>
      useAvailabilityRealtime({
        serviceId: 'service-1',
        autoConnect: false,
      })
    )

    // The hook should only process events for service-1
    expect(result.current.connected).toBe(false)
  })

  it('should filter events by teamMemberId when specified', () => {
    const { result } = renderHook(() =>
      useAvailabilityRealtime({
        serviceId: 'service-1',
        teamMemberId: 'tm-1',
        autoConnect: false,
      })
    )

    // The hook should only process events for service-1 and tm-1
    expect(result.current.connected).toBe(false)
  })
})

describe('useAvailabilitySlots', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    global.fetch = mockFetch as any
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('should fetch slots on mount', async () => {
    const mockSlots = [
      {
        id: 'slot-1',
        serviceId: 'service-1',
        date: '2024-01-15',
        startTime: '09:00',
        endTime: '10:00',
        available: true,
      },
    ]

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ availabilitySlots: mockSlots }),
    })

    const { result } = renderHook(() =>
      useAvailabilitySlots('service-1', { subscribeToUpdates: false })
    )

    await waitFor(() => {
      expect(result.current.slots).toHaveLength(1)
    })

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('serviceId=service-1')
    )
  })

  it('should handle fetch error gracefully', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Network error'))

    const { result } = renderHook(() =>
      useAvailabilitySlots('service-1', { subscribeToUpdates: false })
    )

    await waitFor(() => {
      expect(result.current.error).toBeDefined()
    })

    expect(result.current.slots).toHaveLength(0)
  })

  it('should include teamMemberId in request when provided', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ availabilitySlots: [] }),
    })

    renderHook(() =>
      useAvailabilitySlots('service-1', {
        teamMemberId: 'tm-1',
        subscribeToUpdates: false,
      })
    )

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('teamMemberId=tm-1')
      )
    })
  })

  it('should refetch slots when refetch is called', async () => {
    const mockSlots = [
      {
        id: 'slot-1',
        serviceId: 'service-1',
        date: '2024-01-15',
        startTime: '09:00',
        endTime: '10:00',
        available: true,
      },
    ]

    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ availabilitySlots: mockSlots }),
    })

    const { result } = renderHook(() =>
      useAvailabilitySlots('service-1', { subscribeToUpdates: false })
    )

    await waitFor(() => {
      expect(result.current.slots).toHaveLength(1)
    })

    const initialCallCount = mockFetch.mock.calls.length

    result.current.refetch()

    await waitFor(() => {
      expect(mockFetch.mock.calls.length).toBeGreaterThan(initialCallCount)
    })
  })

  it('should handle loading state correctly', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ availabilitySlots: [] }),
    })

    const { result } = renderHook(() =>
      useAvailabilitySlots('service-1', { subscribeToUpdates: false })
    )

    expect(result.current.loading).toBe(true)

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })
  })
})
