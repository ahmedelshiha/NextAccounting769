import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, waitFor, fireEvent, screen } from '@testing-library/react'
vi.mock('@/components/PermissionGate', () => ({ __esModule: true, default: ({ children }: any) => <>{children}</>, PermissionGate: ({ children }: any) => <>{children}</> }))
import AnalyticsSettingsPage from '@/app/admin/settings/analytics/page'

vi.mock('next-auth/next', () => ({ getServerSession: vi.fn(async () => ({ user: { id: 'admin1', role: 'ADMIN' } })) }))
vi.mock('@/lib/auth', () => ({ authOptions: {} }))

const originalFetch = global.fetch as any

beforeEach(() => {
  // Stub URL.createObjectURL for jsdom environment without clobbering URL constructor
  ;(window as any).URL = (window as any).URL || (global as any).URL
  ;(window as any).URL.createObjectURL = vi.fn(() => 'blob:mock')
  ;(window as any).HTMLAnchorElement = (window as any).HTMLAnchorElement || (global as any).HTMLAnchorElement
  if ((window as any).HTMLAnchorElement) { (window as any).HTMLAnchorElement.prototype.click = vi.fn() }
  global.fetch = vi.fn(async (url: any, opts: any) => {
    const u = String(url)
    if (u.endsWith('/api/admin/analytics-settings') && (!opts || opts.method === 'GET')) {
      return { ok: true, json: async () => ({ dashboards: [], metrics: [], exportsEnabled: true, dataRetentionDays: 365, integrations: [] }) }
    }
    if (u.endsWith('/api/admin/analytics-settings') && opts && opts.method === 'PUT') {
      return { ok: true, json: async () => JSON.parse(opts.body || '{}') }
    }
    if (u.endsWith('/api/admin/analytics-settings/export') && (!opts || opts.method === 'GET')) {
      return { ok: true, json: async () => ({ settings: { dashboards: [], metrics: [] } }) }
    }
    if (u.endsWith('/api/admin/analytics-settings/import') && opts && opts.method === 'POST') {
      return { ok: true, json: async () => ({ ok: true }) }
    }
    return { ok: false, json: async () => ({}) }
  }) as any
})

afterEach(() => { global.fetch = originalFetch })

describe('Analytics Settings Export/Import UI', () => {
  it('shows Export/Import and posts import', async () => {
    const { getByText, container } = render(<AnalyticsSettingsPage />)
    await waitFor(() => expect((global.fetch as any).mock.calls.length).toBeGreaterThan(0))

    const exportBtn = getByText('Export')
    expect(exportBtn).toBeTruthy()
    fireEvent.click(exportBtn as any)
    await waitFor(() => expect((global.fetch as any).mock.calls.some((c: any[]) => String(c[0]).endsWith('/api/admin/analytics-settings/export'))).toBe(true))

    const importButtons = Array.from(screen.getAllByText('Import'))
    fireEvent.click(importButtons[0] as any)
    await waitFor(() => screen.getByText('Import Analytics & Reporting Settings'))

    const input = document.querySelector('input[type="file"]') as HTMLInputElement
    const file = new File([JSON.stringify({ settings: { dashboards: [] } })], 'analytics.json', { type: 'application/json' })
    const dt = { files: [file] } as any
    fireEvent.change(input, dt)

    const confirmButtons = Array.from(screen.getAllByText('Import'))
    fireEvent.click(confirmButtons[confirmButtons.length - 1] as any)

    await waitFor(() => expect((global.fetch as any).mock.calls.some((c: any[]) => String(c[0]).endsWith('/api/admin/analytics-settings/import'))).toBe(true))
  })
})
