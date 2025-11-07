'use client'

import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react'

interface VirtualScrollerProps<T> {
  items: T[]
  itemHeight: number
  maxHeight: string | number
  renderItem: (item: T, index: number) => React.ReactNode
  overscan?: number
  onScroll?: (scrollTop: number) => void
  className?: string
  getKey?: (item: T, index: number) => string | number
}

/**
 * ✅ Virtual Scroller Component
 * 
 * Renders only visible items instead of all items.
 * Perfect for lists with 100+ items.
 * 
 * Performance benefits:
 * - O(1) DOM elements instead of O(n)
 * - Can handle 10,000+ items smoothly
 * - Constant memory usage
 * - 60 FPS scrolling even on low-end devices
 * 
 * How it works:
 * 1. Calculate which items are visible in viewport
 * 2. Render only those items + overscan buffer
 * 3. Use transform to position items correctly
 * 4. Update on scroll
 */
export function VirtualScroller<T>({
  items,
  itemHeight,
  maxHeight,
  renderItem,
  overscan = 5,
  onScroll,
  className = '',
  getKey = (_, index) => index
}: VirtualScrollerProps<T>) {
  const [scrollTop, setScrollTop] = useState(0)
  const containerRef = useRef<HTMLDivElement>(null)

  // Convert maxHeight to pixels
  const maxHeightPx = typeof maxHeight === 'number' ? maxHeight : parseInt(maxHeight)

  // Calculate visible range
  const visibleCount = Math.ceil(maxHeightPx / itemHeight)
  const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan)
  const endIndex = Math.min(items.length, startIndex + visibleCount + overscan * 2)

  // Get visible items
  const visibleItems = useMemo(() => {
    return items.slice(startIndex, endIndex)
  }, [items, startIndex, endIndex])

  // Calculate offset for transform
  const offsetY = startIndex * itemHeight

  // Handle scroll event
  const handleScroll = useCallback(
    (e: React.UIEvent<HTMLDivElement>) => {
      const newScrollTop = e.currentTarget.scrollTop
      setScrollTop(newScrollTop)
      onScroll?.(newScrollTop)
    },
    [onScroll]
  )

  // Keyboard navigation support
  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const handleKeyDown = (e: KeyboardEvent) => {
      const scrollAmount = itemHeight * 5 // 5 items at a time
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault()
          container.scrollTop += itemHeight
          break
        case 'ArrowUp':
          e.preventDefault()
          container.scrollTop -= itemHeight
          break
        case 'PageDown':
          e.preventDefault()
          container.scrollTop += scrollAmount
          break
        case 'PageUp':
          e.preventDefault()
          container.scrollTop -= scrollAmount
          break
        case 'Home':
          e.preventDefault()
          container.scrollTop = 0
          break
        case 'End':
          e.preventDefault()
          container.scrollTop = items.length * itemHeight
          break
      }
    }

    container.addEventListener('keydown', handleKeyDown)
    return () => container.removeEventListener('keydown', handleKeyDown)
  }, [itemHeight, items.length])

  return (
    <div
      ref={containerRef}
      className={`overflow-y-auto ${className}`}
      style={{ maxHeight: maxHeightPx }}
      onScroll={handleScroll}
      role="listbox"
      tabIndex={0}
      aria-label="Scrollable list"
    >
      {/* Spacer to maintain scroll height */}
      <div style={{ height: items.length * itemHeight, position: 'relative' }}>
        {/* Render visible items */}
        <div
          style={{
            transform: `translateY(${offsetY}px)`,
            willChange: 'transform'
          }}
        >
          {visibleItems.map((item, idx) => (
            <div
              key={getKey(item, startIndex + idx)}
              style={{ height: itemHeight }}
            >
              {renderItem(item, startIndex + idx)}
            </div>
          ))}
        </div>
      </div>

      {/* Empty state */}
      {items.length === 0 && (
        <div
          style={{ height: maxHeightPx }}
          className="flex items-center justify-center text-gray-500"
        >
          No items to display
        </div>
      )}
    </div>
  )
}

/**
 * Hook to measure item heights dynamically if they vary
 * Useful for items with dynamic content
 */
export function useVirtualScroller<T>(
  items: T[],
  estimatedItemHeight: number = 80
) {
  const measuredHeights = useRef<Map<number, number>>(new Map())

  const measureItem = useCallback(
    (index: number, el: HTMLElement | null) => {
      if (!el) return
      const height = el.getBoundingClientRect().height
      measuredHeights.current.set(index, height)
    },
    []
  )

  const getItemHeight = useCallback((index: number) => {
    return measuredHeights.current.get(index) ?? estimatedItemHeight
  }, [estimatedItemHeight])

  const getTotalHeight = useCallback(() => {
    let total = 0
    for (let i = 0; i < items.length; i++) {
      total += getItemHeight(i)
    }
    return total
  }, [items.length, getItemHeight])

  return { measureItem, getItemHeight, getTotalHeight, measuredHeights }
}
