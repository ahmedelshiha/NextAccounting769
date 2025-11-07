import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import AdvancedDataTable from '@/components/dashboard/tables/AdvancedDataTable'
import { TranslationContext } from '@/lib/i18n'
import { screen } from '@testing-library/react'

interface Row { id: number; name: string }

function withI18n(children: React.ReactElement) {
  return (
    <TranslationContext.Provider value={{ locale: 'en', translations: { 'dashboard.selectedCount': '{{count}} selected', 'dashboard.actions': 'Actions', 'dashboard.noData': 'No records found' }, setLocale: () => {}, currentGender: undefined, setGender: () => {} }}>
      {children}
    </TranslationContext.Provider>
  )
}

describe('AdvancedDataTable a11y focusability', () => {
  it('header sort button and pagination buttons are focusable', () => {
    const rows: Row[] = Array.from({ length: 3 }).map((_, i) => ({ id: i + 1, name: `R${i + 1}` }))
    const ui = withI18n(
      <AdvancedDataTable<Row>
        columns={[{ key: 'name', label: 'Name', sortable: true }]}
        rows={rows}
        pageSize={2}
      />
    )
    const { container, unmount } = render(ui)
    try {
      const sortBtn = container.querySelector('th button') as HTMLButtonElement
      const prev = screen.getByRole('button', { name: /Previous/i }) as HTMLButtonElement
      const next = screen.getByRole('button', { name: /Next/i }) as HTMLButtonElement
      expect(sortBtn).toBeTruthy()
      expect(prev).toBeTruthy()
      expect(next).toBeTruthy()

      // ensure elements can receive focus
      sortBtn?.focus()
      expect(document.activeElement).toBe(sortBtn)
      prev.focus()
      expect(document.activeElement).toBe(prev)
      next.focus()
      expect(document.activeElement).toBe(next)
    } finally {
      unmount()
    }
  })
})
