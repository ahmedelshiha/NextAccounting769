'use client'

import { useState, useCallback, useMemo } from 'react'

export interface SelectionState {
  selected: Set<string>
  isAllSelected: boolean
  isIndeterminate: boolean
}

interface UseSelectionOptions {
  initialSelected?: string[]
}

/**
 * Manage multi-select/checkbox state for lists and tables
 * 
 * @example
 * ```tsx
 * const { selected, toggle, toggleAll, clear, isAllSelected } = useSelection(
 *   items.map(i => i.id)
 * )
 * ```
 */
export function useSelection(
  items: string[] = [],
  options: UseSelectionOptions = {}
) {
  const { initialSelected = [] } = options

  const [selected, setSelected] = useState<Set<string>>(
    new Set(initialSelected)
  )

  const isAllSelected = useMemo(
    () => items.length > 0 && selected.size === items.length,
    [items.length, selected.size]
  )

  const isIndeterminate = useMemo(
    () => selected.size > 0 && selected.size < items.length,
    [items.length, selected.size]
  )

  const toggle = useCallback((id: string) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }, [])

  const toggleMultiple = useCallback((ids: string[]) => {
    setSelected((prev) => {
      const next = new Set(prev)
      for (const id of ids) {
        if (next.has(id)) {
          next.delete(id)
        } else {
          next.add(id)
        }
      }
      return next
    })
  }, [])

  const toggleAll = useCallback(() => {
    if (isAllSelected) {
      setSelected(new Set())
    } else {
      setSelected(new Set(items))
    }
  }, [isAllSelected, items])

  const select = useCallback((ids: string | string[]) => {
    const idArray = Array.isArray(ids) ? ids : [ids]
    setSelected(new Set(idArray))
  }, [])

  const deselect = useCallback((ids: string | string[]) => {
    const idArray = Array.isArray(ids) ? ids : [ids]
    setSelected((prev) => {
      const next = new Set(prev)
      for (const id of idArray) {
        next.delete(id)
      }
      return next
    })
  }, [])

  const clear = useCallback(() => {
    setSelected(new Set())
  }, [])

  const isSelected = useCallback((id: string) => selected.has(id), [selected])

  const selectedItems = useMemo(
    () => items.filter((id) => selected.has(id)),
    [items, selected]
  )

  const unselectedItems = useMemo(
    () => items.filter((id) => !selected.has(id)),
    [items, selected]
  )

  return {
    // State
    selected,
    selectedCount: selected.size,
    totalCount: items.length,
    isAllSelected,
    isIndeterminate,

    // Computed
    selectedItems,
    unselectedItems,

    // Actions
    toggle,
    toggleMultiple,
    toggleAll,
    select,
    deselect,
    clear,
    isSelected,

    // Utilities
    isEmpty: selected.size === 0,
    hasSelection: selected.size > 0,
  }
}

export default useSelection
