'use client'

import { useState, useCallback, useMemo } from 'react'

export interface EditingCell {
  rowId: string
  field: string
  originalValue: any
  currentValue: any
}

interface UseInlineEditResult {
  editingCell: EditingCell | null
  isEditing: boolean
  startEdit: (rowId: string, field: string, currentValue: any) => void
  updateValue: (value: any) => void
  cancelEdit: () => void
  confirmEdit: (callback?: (cell: EditingCell) => Promise<void>) => Promise<void>
  hasChanges: boolean
  resetState: () => void
}

/**
 * Hook for managing inline cell editing state
 * 
 * Features:
 * - Track which cell is being edited
 * - Store original and current values
 * - Detect if value has changed
 * - Support for async save callbacks
 * - Cancel/confirm edit functionality
 * - State reset capability
 * 
 * Usage:
 * - Call startEdit when cell is double-clicked
 * - Call updateValue on input change
 * - Call confirmEdit or cancelEdit on blur/keydown
 */
export function useInlineEdit(): UseInlineEditResult {
  const [editingCell, setEditingCell] = useState<EditingCell | null>(null)

  const startEdit = useCallback(
    (rowId: string, field: string, currentValue: any) => {
      setEditingCell({
        rowId,
        field,
        originalValue: currentValue,
        currentValue
      })
    },
    []
  )

  const updateValue = useCallback((value: any) => {
    setEditingCell((prev) => {
      if (!prev) return null
      return {
        ...prev,
        currentValue: value
      }
    })
  }, [])

  const cancelEdit = useCallback(() => {
    setEditingCell(null)
  }, [])

  const confirmEdit = useCallback(
    async (callback?: (cell: EditingCell) => Promise<void>) => {
      if (!editingCell) return

      try {
        if (callback && hasChanges) {
          await callback(editingCell)
        }
      } finally {
        setEditingCell(null)
      }
    },
    [editingCell]
  )

  const resetState = useCallback(() => {
    setEditingCell(null)
  }, [])

  // Detect if the current value differs from original
  const hasChanges = useMemo(() => {
    if (!editingCell) return false
    return editingCell.currentValue !== editingCell.originalValue
  }, [editingCell])

  const isEditing = editingCell !== null

  return {
    editingCell,
    isEditing,
    startEdit,
    updateValue,
    cancelEdit,
    confirmEdit,
    hasChanges,
    resetState
  }
}

/**
 * Hook to handle keyboard shortcuts in editing mode
 * 
 * @param onSave - Called on Enter
 * @param onCancel - Called on Escape
 */
export function useEditingKeyboard(
  onSave?: () => void,
  onCancel?: () => void
) {
  return useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      onSave?.()
    } else if (e.key === 'Escape') {
      e.preventDefault()
      onCancel?.()
    }
  }, [onSave, onCancel])
}
