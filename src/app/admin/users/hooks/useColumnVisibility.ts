'use client'

import { useState, useCallback, useEffect } from 'react'

export interface ColumnConfig {
  id: string
  label: string
  visible: boolean
  sortable?: boolean
}

const DEFAULT_COLUMNS: ColumnConfig[] = [
  { id: 'name', label: 'Name', visible: true, sortable: true },
  { id: 'email', label: 'Email', visible: true, sortable: true },
  { id: 'phone', label: 'Phone', visible: true, sortable: false },
  { id: 'role', label: 'Role', visible: true, sortable: true },
  { id: 'status', label: 'Status', visible: true, sortable: true },
  { id: 'department', label: 'Department', visible: false, sortable: true },
  { id: 'position', label: 'Position', visible: false, sortable: true },
  { id: 'createdAt', label: 'Created', visible: true, sortable: true },
  { id: 'lastLoginAt', label: 'Last Login', visible: false, sortable: true }
]

const STORAGE_KEY = 'user-directory-column-visibility'

export function useColumnVisibility() {
  const [columns, setColumns] = useState<ColumnConfig[]>(DEFAULT_COLUMNS)
  const [isLoaded, setIsLoaded] = useState(false)

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) {
        const savedColumns = JSON.parse(saved) as ColumnConfig[]
        setColumns(savedColumns)
      }
    } catch (error) {
      console.error('Failed to load column visibility settings:', error)
    }
    setIsLoaded(true)
  }, [])

  // Save to localStorage when columns change
  useEffect(() => {
    if (!isLoaded) return

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(columns))
    } catch (error) {
      console.error('Failed to save column visibility settings:', error)
    }
  }, [columns, isLoaded])

  const toggleColumn = useCallback((columnId: string) => {
    setColumns(prev =>
      prev.map(col =>
        col.id === columnId ? { ...col, visible: !col.visible } : col
      )
    )
  }, [])

  const setVisibleColumns = useCallback((columnIds: string[]) => {
    setColumns(prev =>
      prev.map(col => ({
        ...col,
        visible: columnIds.includes(col.id)
      }))
    )
  }, [])

  const resetToDefaults = useCallback(() => {
    setColumns(DEFAULT_COLUMNS)
  }, [])

  const visibleColumns = columns.filter(col => col.visible)

  return {
    columns,
    visibleColumns,
    toggleColumn,
    setVisibleColumns,
    resetToDefaults,
    isLoaded
  }
}
