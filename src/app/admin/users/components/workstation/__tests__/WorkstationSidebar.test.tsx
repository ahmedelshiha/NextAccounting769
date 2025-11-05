import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { WorkstationSidebar } from '../WorkstationSidebar'

describe('WorkstationSidebar', () => {
  it('renders quick stats section', () => {
    render(<WorkstationSidebar />)
    expect(screen.getByText('Quick Stats')).toBeInTheDocument()
  })

  it('renders saved views section', () => {
    render(<WorkstationSidebar />)
    expect(screen.getByText('Saved Views')).toBeInTheDocument()
  })

  it('renders filters section', () => {
    render(<WorkstationSidebar />)
    expect(screen.getByText('Filters')).toBeInTheDocument()
  })

  it('renders reset filters button', () => {
    render(<WorkstationSidebar />)
    expect(screen.getByRole('button', { name: /reset filters/i })).toBeInTheDocument()
  })

  it('calls onReset when reset button is clicked', async () => {
    const user = userEvent.setup()
    const onReset = vi.fn()
    render(<WorkstationSidebar onReset={onReset} />)

    const resetButton = screen.getByRole('button', { name: /reset filters/i })
    await user.click(resetButton)

    expect(onReset).toHaveBeenCalled()
  })

  // TODO: Add tests for filter state changes
  // TODO: Add tests for real-time stats updates
  // TODO: Add tests for mobile drawer behavior
})
