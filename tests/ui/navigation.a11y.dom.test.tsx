import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { Navigation } from '@/components/ui/navigation'

vi.mock('next/navigation', () => ({
  usePathname: () => '/services',
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    prefetch: vi.fn(),
    refresh: vi.fn(),
  }),
}))
vi.mock('next-auth/react', () => ({
  useSession: () => ({ data: { user: { role: 'ADMIN', name: 'Test User', email: 'test@example.com' } }, status: 'authenticated' }),
  signOut: vi.fn(),
}))

describe('Navigation a11y', () => {
  it('has nav landmark, aria-current on active link, and accessible mobile toggle', () => {
    const { container } = render(<Navigation />)

    const nav = container.querySelector('nav[aria-label="Top"]') as HTMLElement
    expect(nav).toBeTruthy()

    const active = Array.from(container.querySelectorAll('a')).find(a => a.getAttribute('href') === '/services') as HTMLAnchorElement
    expect(active?.getAttribute('aria-current')).toBe('page')

    const toggle = container.querySelector('button[aria-controls="primary-mobile-nav"]') as HTMLButtonElement
    expect(toggle).toBeTruthy()
    expect(toggle.getAttribute('aria-expanded')).toBe('false')
    fireEvent.click(toggle)
    expect(toggle.getAttribute('aria-expanded')).toBe('true')

    const logo = container.querySelector('a[aria-label="Accounting Firm home"]')
    expect(logo).toBeTruthy()
  })
})
