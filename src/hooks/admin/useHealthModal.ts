'use client'

import { useState, useCallback } from 'react'

/**
 * Hook to manage health detail modal state and actions
 * 
 * Features:
 * - Open/close modal
 * - Track loading and refreshing states
 * - Handle manual refresh
 * - Integrate with useSystemHealth hook
 */
export function useHealthModal() {
  const [isOpen, setIsOpen] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)

  const openModal = useCallback(() => {
    setIsOpen(true)
  }, [])

  const closeModal = useCallback(() => {
    setIsOpen(false)
  }, [])

  const toggleModal = useCallback(() => {
    setIsOpen(prev => !prev)
  }, [])

  const setRefreshing = useCallback((refreshing: boolean) => {
    setIsRefreshing(refreshing)
  }, [])

  return {
    isOpen,
    setIsOpen,
    openModal,
    closeModal,
    toggleModal,
    isRefreshing,
    setRefreshing,
  }
}

export default useHealthModal
