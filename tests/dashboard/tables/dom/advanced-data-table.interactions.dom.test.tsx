import React from 'react'
import { describe, it, expect, vi } from 'vitest'
import AdvancedDataTable from '@/components/dashboard/tables/AdvancedDataTable'
import { TranslationContext } from '@/lib/i18n'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'

interface Row { id: number; name: string }

function withI18n(children: React.ReactElement) {
  return (
    <TranslationContext.Provider value={{ locale: 'en', translations: { 'dashboard.selectedCount': '{{count}} selected', 'dashboard.actions': 'Actions', 'dashboard.noData': 'No records found' }, setLocale: () => {}, currentGender: undefined, setGender: () => {} }}>
      {children}
    </TranslationContext.Provider>
  )
}

describe('AdvancedDataTable interactions', () => {
  it('select all toggles selection count and calls onSelectionChange', async () => {
    const rows: Row[] = Array.from({ length: 3 }).map((_, i) => ({ id: i + 1, name: `R${i + 1}` }))
    const changes: Array<Array<number>> = []

    const ui = withI18n(
      <AdvancedDataTable<Row>
        columns={[{ key: 'name', label: 'Name' }]}
        rows={rows}
        selectable
        onSelectionChange={(ids) => changes.push(ids as number[])}
      />
    )

    const { container, unmount } = render(ui)
    try {
      const master = container.querySelector('thead input[type="checkbox"]') as HTMLInputElement
      expect(master).toBeTruthy()

      fireEvent.click(master)

      await waitFor(() => {
        const summary = Array.from(container.querySelectorAll('div')).find(d => /3 selected/i.test(d.textContent || ''))
        expect(summary).toBeTruthy()
      }, { timeout: 2000 })

      const summary = Array.from(container.querySelectorAll('div')).find(d => /3 selected/i.test(d.textContent || ''))
      expect(summary && (summary.textContent || '')).toContain('3 selected')
      expect(changes.length).toBeGreaterThan(0)
      expect(changes[changes.length - 1].length).toBe(3)
    } finally {
      unmount()
    }
  })

  it('paginates with Next/Previous buttons', async () => {
    const rows: Row[] = Array.from({ length: 5 }).map((_, i) => ({ id: i + 1, name: `R${i + 1}` }))
    const ui = withI18n(
      <AdvancedDataTable<Row>
        columns={[{ key: 'name', label: 'Name' }]}
        rows={rows}
        pageSize={2}
      />
    )

    const { container, unmount } = render(ui)
    try {
      expect(screen.getByText(/Page 1 of 3/i)).toBeTruthy()
      const next = Array.from(container.querySelectorAll('button')).find(b => /next/i.test(b.textContent || '')) as HTMLButtonElement
      fireEvent.click(next)
      expect(screen.getByText(/Page 2 of 3/i)).toBeTruthy()
    } finally {
      unmount()
    }
  })

  it('emits onSort when sortable column header clicked', async () => {
    const rows: Row[] = [{ id: 1, name: 'A' }, { id: 2, name: 'B' }]
    const calls: string[] = []
    const ui = withI18n(
      <AdvancedDataTable<Row>
        columns={[{ key: 'name', label: 'Name', sortable: true }]}
        rows={rows}
        onSort={(k) => { calls.push(k) }}
      />
    )

    const { container, unmount } = render(ui)
    try {
      const btn = Array.from(container.querySelectorAll('th button')).find(Boolean) as HTMLButtonElement
      fireEvent.click(btn)
      expect(calls).toEqual(['name'])
    } finally {
      unmount()
    }
  })
})
