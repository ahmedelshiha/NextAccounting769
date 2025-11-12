'use client'

import { useCallback, useMemo, useState } from 'react'

export interface VirtualizationConfig {
  itemHeight: number
  containerHeight: number
  bufferSize?: number
}

interface UseVirtualizedTableResult<T> {
  visibleItems: T[]
  startIndex: number
  endIndex: number
  scrollTop: number
  setScrollTop: (top: number) => void
  getItemOffset: (index: number) => number
  getTotalHeight: () => number
}

/**
 * Hook for virtualized table rendering
 * 
 * Features:
 * - Calculates visible items based on scroll position
 * - Provides offsets for virtual scrolling
 * - Supports custom buffer size for smooth scrolling
 * - Optimized for large datasets (10k+ rows)
 * - Returns only necessary items to render
 */
export function useVirtualizedTable<T>(
  items: T[],
  config: VirtualizationConfig
): UseVirtualizedTableResult<T> {
  const { itemHeight, containerHeight, bufferSize = 5 } = config
  const [scrollTop, setScrollTop] = useState(0)

  // Calculate visible range with buffer
  const { startIndex, endIndex } = useMemo(() => {
    const visibleCount = Math.ceil(containerHeight / itemHeight)
    const bufferStart = Math.max(0, Math.floor(scrollTop / itemHeight) - bufferSize)
    const bufferEnd = Math.min(
      items.length,
      bufferStart + visibleCount + bufferSize * 2
    )

    return {
      startIndex: bufferStart,
      endIndex: bufferEnd
    }
  }, [scrollTop, itemHeight, containerHeight, bufferSize, items.length])

  // Get visible items
  const visibleItems = useMemo(
    () => items.slice(startIndex, endIndex),
    [items, startIndex, endIndex]
  )

  // Calculate offset for individual item
  const getItemOffset = useCallback(
    (index: number) => index * itemHeight,
    [itemHeight]
  )

  // Calculate total height of all items
  const getTotalHeight = useCallback(
    () => items.length * itemHeight,
    [items.length, itemHeight]
  )

  // Calculate top offset for the visible range
  const offsetY = startIndex * itemHeight

  return {
    visibleItems,
    startIndex,
    endIndex,
    scrollTop,
    setScrollTop,
    getItemOffset,
    getTotalHeight
  }
}

/**
 * Hook to handle scroll events and debounce updates
 * 
 * @param onScroll - Callback when scroll position changes
 * @param debounceMs - Debounce delay in milliseconds
 */
export function useTableScroll(
  onScroll?: (scrollTop: number) => void,
  debounceMs: number = 0
) {
  const [scrollTop, setScrollTop] = useState(0)
  let debounceTimer: ReturnType<typeof setTimeout> | null = null

  const handleScroll = useCallback(
    (e: React.UIEvent<HTMLDivElement>) => {
      const target = e.currentTarget
      const top = target.scrollTop

      setScrollTop(top)

      if (debounceMs > 0 && debounceTimer) {
        clearTimeout(debounceTimer)
      }

      if (debounceMs > 0) {
        debounceTimer = setTimeout(() => {
          onScroll?.(top)
        }, debounceMs)
      } else {
        onScroll?.(top)
      }
    },
    [onScroll, debounceMs]
  )

  return {
    scrollTop,
    handleScroll
  }
}
