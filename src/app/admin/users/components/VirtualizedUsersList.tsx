'use client'

import React, { useCallback, useMemo } from 'react'
import { FixedSizeList as List } from 'react-window'
import type { ListOnScrollProps } from 'react-window'
import { UserItem } from '../contexts/UserDataContext'

export interface VirtualizedUsersListProps {
  users: UserItem[]
  height: number
  width?: string | number
  overscanCount?: number
  renderItem: (user: UserItem, index: number, style: React.CSSProperties) => React.ReactNode
  className?: string
  onScroll?: (scrollOffset: number, clientHeight: number) => void
  isLoading?: boolean
  loadingPlaceholder?: React.ReactNode
}

/**
 * Virtualized users list component for optimal performance with 100k+ items
 * Uses react-window FixedSizeList for consistent item heights
 */
export const VirtualizedUsersList = React.memo(function VirtualizedUsersList({
  users,
  height,
  width = '100%',
  overscanCount = 5,
  renderItem,
  className,
  onScroll,
  isLoading,
  loadingPlaceholder
}: VirtualizedUsersListProps) {
  const listRef = React.useRef<List>(null)

  const ITEM_HEIGHT = 48 // Standard row height in pixels

  const handleScroll = useCallback((props: ListOnScrollProps) => {
    onScroll?.(props.scrollOffset, props.scrollUpdateWasRequested ? 0 : props.scrollOffset)
  }, [onScroll])

  // Scroll to item by index
  const scrollToItem = useCallback((index: number, align: 'auto' | 'start' | 'center' | 'end' = 'auto') => {
    if (listRef.current) {
      listRef.current.scrollToItem(index, align)
    }
  }, [])

  if (isLoading) {
    return loadingPlaceholder ?? (
      <div className="flex items-center justify-center" style={{ height }}>
        <div className="text-gray-500">Loading users...</div>
      </div>
    )
  }

  if (users.length === 0) {
    return (
      <div className="flex items-center justify-center" style={{ height }}>
        <div className="text-gray-500">No users found</div>
      </div>
    )
  }

  const Row = ({ index, style }: { index: number; style: React.CSSProperties }) => (
    <div key={users[index].id} style={style}>
      {renderItem(users[index], index, style)}
    </div>
  )

  return (
    <List
      ref={listRef}
      height={height}
      itemCount={users.length}
      itemSize={ITEM_HEIGHT}
      width={width}
      overscanCount={overscanCount}
      onScroll={handleScroll}
      className={className}
    >
      {Row}
    </List>
  )
})
