// @vitest-environment jsdom
import React from 'react'
import { render } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import Sidebar from '@/components/dashboard/Sidebar'
import { AdminContextProvider } from '@/components/admin/providers/AdminContext'
import { navGroups } from '@/components/dashboard/nav.config'

vi.mock('next-auth/react', () => ({
  useSession: () => ({ data: { user: { role: 'ADMIN' } }, status: 'authenticated' })
}))

vi.mock('next/navigation', () => ({
  usePathname: () => '/admin'
}))

vi.mock('@/lib/permissions', () => ({
  hasPermission: () => true,
  checkPermissions: () => true,
}))

describe('Sidebar IA', () => {
  it('renders nav links for all groups with admin permissions', async () => {
    const { container } = render(
      <AdminContextProvider>
        <Sidebar />
      </AdminContextProvider>
    )

    // Collapse sidebar to force all group items to render
    const toggle = container.querySelector('button[aria-label="Toggle sidebar"]') as HTMLButtonElement
    expect(toggle).toBeTruthy()
    toggle.click()

    // Assert that each configured href exists as a link
    const hrefs = navGroups.flatMap(g => g.items.map(i => i.href))
    for (const href of hrefs) {
      const a = container.querySelector(`a[href="${href}"]`)
      expect(a, `expected link for ${href}`).toBeTruthy()
    }
  })
})
