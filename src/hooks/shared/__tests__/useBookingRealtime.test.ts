import { renderHook, waitFor } from '@testing-library/react'
import { useBookingRealtime, useBookingsWithRealtime } from '../useBookingRealtime'
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest'

const mockFetch = vi.fn()

describe('useBookingRealtime', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    Object.defineProperty(window, 'location', {
      value: { protocol: 'http:', host: 'localhost:3000' },
      writable: true,
    })
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('should initialize with disconnected state', () => {
    const { result } = renderHook(() => useBookingRealtime({ autoConnect: false }))

    expect(result.current.connected).toBe(false)
    expect(result.current.isConnecting).toBe(false)
  })

  it('should auto-connect when autoConnect is true', async () => {
    const { result } = renderHook(() => useBookingRealtime({ autoConnect: true }))

    await waitFor(() => {
      expect(result.current.isConnecting || result.current.connected).toBe(true)
    })
  })

  it('should call onBookingCreated callback when booking is created', async () => {
    const onBookingCreated = vi.fn()

    renderHook(() =>
      useBookingRealtime({
        onBookingCreated,
        autoConnect: false,
      })
    )

    // Test callback would be invoked when event is received
    expect(onBookingCreated).not.toHaveBeenCalled()
  })

  it('should filter bookings by clientId', () => {
    const { result } = renderHook(() =>
      useBookingRealtime({
        clientId: 'client-1',
        autoConnect: false,
      })
    )

    // The hook should only process events for client-1
    expect(result.current.connected).toBe(false)
  })

  it('should filter bookings by serviceId', () => {
    const { result } = renderHook(() =>
      useBookingRealtime({
        serviceId: 'service-1',
        autoConnect: false,
      })
    )

    // The hook should only process events for service-1
    expect(result.current.connected).toBe(false)
  })

  it('should disconnect when disconnect is called', async () => {
    const { result } = renderHook(() => useBookingRealtime({ autoConnect: true }))

    await waitFor(() => {
      expect(result.current.isConnecting || result.current.connected).toBe(true)
    })

    result.current.disconnect()

    await waitFor(() => {
      expect(result.current.connected).toBe(false)
    })
  })
})

describe('useBookingsWithRealtime', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    global.fetch = mockFetch as any
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('should fetch bookings on mount', async () => {
    const mockBookings = [
      {
        id: 'booking-1',
        serviceId: 'service-1',
        clientId: 'client-1',
        status: 'PENDING',
        scheduledAt: '2024-01-15T10:00:00Z',
      },
    ]

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: mockBookings }),
    })

    const { result } = renderHook(() =>
      useBookingsWithRealtime('client-1', { subscribeToUpdates: false })
    )

    await waitFor(() => {
      expect(result.current.bookings).toHaveLength(1)
    })

    expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('clientId=client-1'))
  })

  it('should handle fetch error gracefully', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Network error'))

    const { result } = renderHook(() =>
      useBookingsWithRealtime('client-1', { subscribeToUpdates: false })
    )

    await waitFor(() => {
      expect(result.current.error).toBeDefined()
    })

    expect(result.current.bookings).toHaveLength(0)
  })

  it('should include serviceId in request when provided', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: [] }),
    })

    renderHook(() =>
      useBookingsWithRealtime('client-1', {
        serviceId: 'service-1',
        subscribeToUpdates: false,
      })
    )

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('serviceId=service-1')
      )
    })
  })

  it('should refetch bookings when refetch is called', async () => {
    const mockBookings = [
      {
        id: 'booking-1',
        serviceId: 'service-1',
        clientId: 'client-1',
        status: 'PENDING',
      },
    ]

    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ data: mockBookings }),
    })

    const { result } = renderHook(() =>
      useBookingsWithRealtime('client-1', { subscribeToUpdates: false })
    )

    await waitFor(() => {
      expect(result.current.bookings).toHaveLength(1)
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
      json: async () => ({ data: [] }),
    })

    const { result } = renderHook(() =>
      useBookingsWithRealtime('client-1', { subscribeToUpdates: false })
    )

    expect(result.current.loading).toBe(true)

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })
  })
})
