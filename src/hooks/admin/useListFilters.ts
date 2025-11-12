import { useMemo, useState } from 'react'

export interface ListFilters {
  search: string
  setSearch: (v: string) => void
  values: Record<string, string>
  setFilter: (key: string, value: string) => void
}

export function useListFilters(initial: Record<string, string> = {}): ListFilters {
  const [search, setSearch] = useState('')
  const [values, setValues] = useState<Record<string, string>>(initial)

  const setFilter = (key: string, value: string) => {
    setValues(prev => ({ ...prev, [key]: value }))
  }

  return { search, setSearch, values, setFilter }
}

export function useTextMatch(term: string) {
  const normalized = term.trim().toLowerCase()
  return useMemo(() => (value?: string | null) => {
    if (!normalized) return true
    return (value || '').toLowerCase().includes(normalized)
  }, [normalized])
}
