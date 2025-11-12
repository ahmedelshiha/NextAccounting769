'use client'

import React, { useCallback, useMemo } from 'react'
import { VariableSizeList as List } from 'react-window'

export interface VirtualScrollConfig {
  itemCount: number
  itemSize?: number | ((index: number) => number)
  height: number
  width?: number | string
  overscanCount?: number
}

export interface VirtualScrollItem {
  index: number
  style: React.CSSProperties
}

/**
 * Hook for managing virtual scrolling of large lists
 * Uses react-window for optimal performance with 100k+ items
 */
export function useVirtualScroll({
  itemCount,
  itemSize = 48,
  height,
  width = '100%',
  overscanCount = 5
}: VirtualScrollConfig) {
  // Estimate item height if using fixed size
  const getItemSize = useCallback((index: number) => {
    if (typeof itemSize === 'function') {
      return itemSize(index)
    }
    return itemSize as number
  }, [itemSize])

  // Calculate approximate scroll offset for a given item index
  const getOffsetForIndex = useCallback((index: number): number => {
    if (typeof itemSize === 'function') {
      // Sum all item heights up to the index
      let offset = 0
      for (let i = 0; i < index; i++) {
        offset += itemSize(i)
      }
      return offset
    }
    return index * (itemSize as number)
  }, [itemSize])

  return useMemo(() => ({
    itemCount,
    getItemSize,
    getOffsetForIndex,
    height,
    width,
    overscanCount
  }), [itemCount, getItemSize, getOffsetForIndex, height, width, overscanCount])
}

/**
 * Component wrapper for virtual list rendering
 * Handles item rendering with optimal performance
 */
export interface VirtualListProps {
  items: Array<any>
  itemSize: number | ((index: number) => number)
  height: number
  width?: string | number
  overscanCount?: number
  renderItem: (item: any, index: number, style: React.CSSProperties) => React.ReactNode
  className?: string
  onScroll?: (scrollOffset: number, clientHeight: number) => void
}

export const VirtualList = React.memo(
  React.forwardRef<any, VirtualListProps>(function VirtualListComponent(
    {
      items,
      itemSize,
      height,
      width = '100%',
      overscanCount = 5,
      renderItem,
      className,
      onScroll
    }: VirtualListProps,
    ref: React.Ref<any>
  ) {
    const handleScroll = useCallback(
      (args: { scrollOffset: number; clientHeight: number }) => {
        onScroll?.(args.scrollOffset, args.clientHeight)
      },
      [onScroll]
    )

    const itemSizeGetter = useCallback(
      (index: number) => {
        if (typeof itemSize === 'function') {
          return itemSize(index)
        }
        return itemSize as number
      },
      [itemSize]
    )

    const Row = ({ index, style }: { index: number; style: React.CSSProperties }) =>
      React.createElement(
        'div',
        { key: index, style },
        renderItem(items[index], index, style)
      )

    return React.createElement(List, {
      ref,
      height,
      itemCount: items.length,
      itemSize: itemSizeGetter,
      width,
      overscanCount,
      onScroll: handleScroll,
      className,
      children: Row
    } as any)
  })
)
