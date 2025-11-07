import { useState } from 'react'

export interface ListState<T> {
  rows: T[]
  loading: boolean
  error: string | null
  setRows: (rows: T[]) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
}

export function useListState<T>(initial: T[] = []): ListState<T> {
  const [rows, setRows] = useState<T[]>(initial)
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)

  return { rows, loading, error, setRows, setLoading, setError }
}
