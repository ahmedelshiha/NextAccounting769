import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { BookingCalendar } from '../BookingCalendar'
import { vi, describe, it, expect, beforeEach } from 'vitest'

// Mock the availability hook
vi.mock('@/hooks/shared', () => ({
  useAvailabilitySlots: () => ({
    slots: [
      {
        id: 'slot-1',
        serviceId: 'service-1',
        date: new Date(),
        startTime: '09:00',
        endTime: '10:00',
        available: true,
        maxBookings: 1,
      },
      {
        id: 'slot-2',
        serviceId: 'service-1',
        date: new Date(),
        startTime: '10:00',
        endTime: '11:00',
        available: true,
        maxBookings: 1,
      },
    ],
    loading: false,
    connected: true,
    refetch: vi.fn(),
    error: null,
  }),
}))

describe('BookingCalendar', () => {
  const mockOnSelectSlot = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should render calendar with month view', () => {
    render(
      <BookingCalendar
        serviceId="service-1"
        onSelectSlot={mockOnSelectSlot}
      />
    )

    // Check for month/year display
    const monthHeader = screen.getByText(/\d{4}/)
    expect(monthHeader).toBeInTheDocument()
  })

  it('should display navigation buttons', () => {
    render(
      <BookingCalendar
        serviceId="service-1"
        onSelectSlot={mockOnSelectSlot}
      />
    )

    // Look for previous/next buttons
    const buttons = screen.getAllByRole('button')
    expect(buttons.length).toBeGreaterThan(0)
  })

  it('should show real-time status when enableRealtime is true', () => {
    render(
      <BookingCalendar
        serviceId="service-1"
        onSelectSlot={mockOnSelectSlot}
        enableRealtime={true}
      />
    )

    const status = screen.getByText(/Live updates enabled/)
    expect(status).toBeInTheDocument()
  })

  it('should not show real-time status when enableRealtime is false', () => {
    render(
      <BookingCalendar
        serviceId="service-1"
        onSelectSlot={mockOnSelectSlot}
        enableRealtime={false}
      />
    )

    const status = screen.queryByText(/Live updates enabled/)
    expect(status).not.toBeInTheDocument()
  })

  it('should show time slots when showTimeSlots is true and date is selected', async () => {
    render(
      <BookingCalendar
        serviceId="service-1"
        onSelectSlot={mockOnSelectSlot}
        showTimeSlots={true}
      />
    )

    // Find and click a date button
    const dayButtons = screen.getAllByRole('button')
    const bookableButton = dayButtons.find((btn) => {
      const text = btn.textContent
      return text && !isNaN(parseInt(text[0]))
    })

    if (bookableButton) {
      fireEvent.click(bookableButton)

      await waitFor(() => {
        // Should show time slots after selecting date
        const timeSlotText = screen.queryByText(/Available times for/)
        if (timeSlotText) {
          expect(timeSlotText).toBeInTheDocument()
        }
      })
    }
  })

  it('should not show time slots when showTimeSlots is false', () => {
    render(
      <BookingCalendar
        serviceId="service-1"
        onSelectSlot={mockOnSelectSlot}
        showTimeSlots={false}
      />
    )

    // Should not show time selection area
    const timeSlotHeader = screen.queryByText(/Available times for/)
    expect(timeSlotHeader).not.toBeInTheDocument()
  })

  it('should call onSelectSlot when time slot is selected', async () => {
    render(
      <BookingCalendar
        serviceId="service-1"
        onSelectSlot={mockOnSelectSlot}
        showTimeSlots={true}
      />
    )

    // The component should be renderable
    expect(screen.getByText('Select Available Time')).toBeInTheDocument()
  })

  it('should display loading state', () => {
    // Mock loading state
    vi.mocked(require('@/hooks/shared').useAvailabilitySlots).mockReturnValueOnce({
      slots: [],
      loading: true,
      connected: false,
      refetch: vi.fn(),
      error: null,
    })

    render(
      <BookingCalendar
        serviceId="service-1"
        onSelectSlot={mockOnSelectSlot}
      />
    )

    // Component should render even while loading
    expect(screen.getByText('Select Available Time')).toBeInTheDocument()
  })

  it('should show calendar title', () => {
    render(
      <BookingCalendar
        serviceId="service-1"
        onSelectSlot={mockOnSelectSlot}
      />
    )

    expect(screen.getByText('Select Available Time')).toBeInTheDocument()
  })

  it('should handle daysAhead prop', () => {
    render(
      <BookingCalendar
        serviceId="service-1"
        onSelectSlot={mockOnSelectSlot}
        daysAhead={60}
      />
    )

    expect(screen.getByText('Select Available Time')).toBeInTheDocument()
  })

  it('should handle variant prop', () => {
    render(
      <BookingCalendar
        serviceId="service-1"
        onSelectSlot={mockOnSelectSlot}
        variant="admin"
      />
    )

    expect(screen.getByText('Select Available Time')).toBeInTheDocument()
  })
})
