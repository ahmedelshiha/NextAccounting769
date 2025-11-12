'use client'

import React, { useMemo } from 'react'
import { FixedSizeList as List } from 'react-window'

export interface VirtualListProps<T> {
  items: T[]
  itemHeight: number
  width: string | number
  height: string | number
  renderItem: (index: number, item: T, style: React.CSSProperties) => React.ReactNode
  overscan?: number
  className?: string
  emptyMessage?: string
  loading?: boolean
  minItemsToVirtualize?: number
}

/**
 * VirtualizedList Component
 *
 * Efficiently renders large lists using virtual scrolling
 * Only renders visible items + overscan buffer
 *
 * Use this for lists with 100+ items to maintain 60fps scrolling
 *
 * @example
 * <VirtualizedList
 *   items={users}
 *   itemHeight={72}
 *   width="100%"
 *   height={500}
 *   renderItem={(index, user, style) => (
 *     <div style={style} className="user-row">
 *       {user.name}
 *     </div>
 *   )}
 * />
 */
export function VirtualizedList<T extends { id?: string | number }>({
  items,
  itemHeight,
  width,
  height,
  renderItem,
  overscan = 10,
  className = '',
  emptyMessage = 'No items to display',
  loading = false,
  minItemsToVirtualize = 100
}: VirtualListProps<T>) {
  // Only use virtualization if there are enough items
  const shouldVirtualize = items.length >= minItemsToVirtualize

  if (loading) {
    return (
      <div className={`flex items-center justify-center ${className}`} style={{ height }}>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    )
  }

  if (!items || items.length === 0) {
    return (
      <div className={`flex items-center justify-center text-gray-500 ${className}`} style={{ height }}>
        {emptyMessage}
      </div>
    )
  }

  // If few items, render normally without virtualization
  if (!shouldVirtualize) {
    return (
      <div className={className} style={{ height, overflowY: 'auto' }}>
        {items.map((item, index) =>
          renderItem(index, item, {})
        )}
      </div>
    )
  }

  // Use virtual scrolling for large lists
  const Row = ({ index, style }: { index: number; style: React.CSSProperties }) => {
    const item = items[index]
    return renderItem(index, item, style)
  }

  return (
    <List
      height={typeof height === 'string' ? parseInt(height) : height}
      itemCount={items.length}
      itemSize={itemHeight}
      width={typeof width === 'string' ? width : `${width}px`}
      overscanCount={overscan}
      className={className}
    >
      {Row}
    </List>
  )
}

/**
 * Hook for managing virtualized list state
 */
export function useVirtualizedListState<T>(items: T[]) {
  const memoizedItems = useMemo(() => items, [items])

  return {
    items: memoizedItems,
    itemCount: memoizedItems.length,
    shouldVirtualize: memoizedItems.length >= 100
  }
}

/**
 * Higher-order component to add virtualization to existing list components
 */
export function withVirtualization<T extends { id?: string | number }>(
  ListComponent: React.ComponentType<{ items: T[]; [key: string]: any }>
) {
  const VirtualizationWrapper = React.forwardRef<HTMLDivElement, { items: T[]; virtualizeThreshold?: number; [key: string]: any }>(
    ({ items, virtualizeThreshold = 100, ...props }, ref) => {
      if (items.length < virtualizeThreshold) {
        return <ListComponent ref={ref} items={items} {...props} />
      }

      return (
        <VirtualizedList
          items={items}
          renderItem={(_, item, style) => (
            <div key={item.id} style={style}>
              {/* Component would be rendered here */}
              {JSON.stringify(item)}
            </div>
          )}
          {...(props as any)}
        />
      )
    }
  )

  VirtualizationWrapper.displayName = `withVirtualization(${ListComponent.displayName || ListComponent.name || 'Component'})`

  return VirtualizationWrapper
}
