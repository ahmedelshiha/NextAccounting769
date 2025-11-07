import { describe, it, expect } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import AutomatedBillingSequences from '@/components/invoicing/automated-billing'

describe('AutomatedBillingSequences UI (SSR snapshot-ish)', () => {
  it('renders form fields and preview list with defaults', async () => {
    const { container } = render(<AutomatedBillingSequences />)

    expect(screen.getByText('Automated Billing Sequences')).toBeTruthy()
    expect(screen.getByText('Create a recurring invoice schedule with predictable cadence.')).toBeTruthy()
    expect(screen.getByText('Next runs')).toBeTruthy()

    await waitFor(() => {
      const listItems = container.querySelectorAll('li')
      let foundCurrency = false
      for (const li of listItems) {
        if (li.textContent && li.textContent.includes('USD') && li.textContent.includes('500.00')) {
          foundCurrency = true
          break
        }
      }
      expect(foundCurrency).toBe(true)
    }, { timeout: 2000 })

    expect(screen.getByText('Save Sequence')).toBeTruthy()
  })
})
