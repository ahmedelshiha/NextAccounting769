import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'

vi.mock('next/navigation', () => ({ usePathname: () => '/admin/services' }))

let sidebarCollapsedState = false
vi.mock('@/components/admin/providers/AdminContext', () => ({
  useAdminContext: () => ({
    sidebarCollapsed: sidebarCollapsedState,
    setSidebarCollapsed: (v: boolean) => { sidebarCollapsedState = v },
    currentTenant: null,
    userPermissions: [],
    isLoading: false
  })
}))

import Sidebar from '@/components/dashboard/Sidebar'

describe('Sidebar a11y and keyboard support', () => {
  beforeEach(() => {
    sidebarCollapsedState = false
  })

  it('exposes navigation landmark and supports toggle via accessible button', async () => {
    const { container } = render(<Sidebar />)

    const nav = container.querySelector('nav[role="navigation"][aria-label="Admin navigation"]')
    expect(nav).toBeTruthy()

    const active = Array.from(container.querySelectorAll('a')).find(a => a.getAttribute('href') === '/admin/services') as HTMLAnchorElement
    expect(active?.getAttribute('aria-current')).toBe('page')

    const btn = container.querySelector('button[aria-label="Toggle sidebar"]') as HTMLButtonElement
    expect(btn).toBeTruthy()
    expect(btn.getAttribute('aria-pressed')).toBe('false')

    fireEvent.click(btn)

    // After clicking, the state should be updated
    expect(sidebarCollapsedState).toBe(true)
  })
})
