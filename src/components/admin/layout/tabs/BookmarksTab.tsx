/**
 * Bookmarks Tab Component
 *
 * Allows users to:
 * - Search for pages to bookmark
 * - Manage bookmarked items
 * - Reorder bookmarks via drag-and-drop
 */

'use client'

import React, { useState, useMemo } from 'react'
import { Search, Trash2, GripVertical } from 'lucide-react'
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core'
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { MenuCustomizationData, Bookmark } from '@/types/admin/menuCustomization'
import { useMenuCustomizationModalStore } from '@/stores/admin/menuCustomizationModal.store'
import { getBookmarkableItems } from '@/lib/menu/menuMapping'
import { getIconComponent } from '@/lib/menu/iconMap'
import Fuse from 'fuse.js'

export interface BookmarksTabProps {
  draftCustomization: MenuCustomizationData
}

/**
 * Draggable bookmark item component
 */
function DraggableBookmarkItem({
  bookmark,
  onRemove,
}: {
  bookmark: Bookmark
  onRemove: () => void
}) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: bookmark.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  const IconComponent = getIconComponent(bookmark.icon)

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-3 px-4 py-3 bg-white border border-gray-200 rounded-lg hover:shadow-md transition-shadow group"
    >
      {/* Drag handle */}
      <div {...attributes} {...listeners} className="flex-shrink-0 cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600">
        <GripVertical className="h-5 w-5" />
      </div>

      {/* Icon and name */}
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <div className="flex-shrink-0 w-9 h-9 flex items-center justify-center rounded-lg bg-blue-50">
          <IconComponent className="h-5 w-5 text-blue-600" />
        </div>
        <span className="text-sm font-medium text-gray-900 truncate">{bookmark.name}</span>
      </div>

      {/* Remove button */}
      <button
        onClick={onRemove}
        className="p-1.5 rounded-lg hover:bg-red-50 transition-colors text-gray-600 hover:text-red-600 opacity-0 group-hover:opacity-100"
        title="Remove bookmark"
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </div>
  )
}

/**
 * Bookmarks tab component for managing bookmarked pages
 */
export function BookmarksTab({ draftCustomization }: BookmarksTabProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const bookmarkableItems = getBookmarkableItems()

  const { addBookmark, setBookmarks, removeBookmark } = useMenuCustomizationModalStore()

  // Search functionality using Fuse.js
  const fuse = useMemo(
    () =>
      new Fuse(bookmarkableItems, {
        keys: ['name'],
        threshold: 0.3,
        minMatchCharLength: 2,
      }),
    [bookmarkableItems]
  )

  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) {
      return bookmarkableItems
    }

    return fuse.search(searchQuery).map((result) => result.item)
  }, [searchQuery, fuse, bookmarkableItems])

  const filteredResults = useMemo(
    () =>
      searchResults.filter(
        (item) =>
          !draftCustomization.bookmarks.some((b) => b.id === item.id)
      ),
    [searchResults, draftCustomization.bookmarks]
  )

  const bookmarksInOrder = useMemo(
    () => [...draftCustomization.bookmarks].sort((a, b) => a.order - b.order),
    [draftCustomization.bookmarks]
  )

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event

    if (active.id !== over?.id) {
      const oldIndex = bookmarksInOrder.findIndex((b) => b.id === active.id)
      const newIndex = bookmarksInOrder.findIndex((b) => b.id === over!.id)

      const newBookmarks = arrayMove(bookmarksInOrder, oldIndex, newIndex)
      setBookmarks(newBookmarks)
    }
  }

  const handleAddBookmark = (item: any) => {
    const bookmark: Bookmark = {
      id: item.id,
      name: item.name,
      href: item.href || '',
      icon: item.icon || 'Bookmark',
      order: draftCustomization.bookmarks.length,
    }
    addBookmark(bookmark)
    setSearchQuery('')
  }

  return (
    <div className="space-y-4">
      {/* Search Box */}
      <div className="relative">
        <Search className="absolute left-3 top-3.5 h-4 w-4 text-gray-400" />
        <input
          type="text"
          placeholder="Search pages to bookmark..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-sm placeholder-gray-400 transition-colors"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* Available Pages */}
        <div className="border border-gray-200 rounded-lg overflow-hidden flex flex-col">
          <div className="bg-gradient-to-r from-blue-50 to-transparent px-4 py-3 border-b border-gray-200">
            <h3 className="font-semibold text-sm text-gray-900">
              Available Pages
            </h3>
            <p className="text-xs text-gray-600 mt-0.5">{filteredResults.length} pages</p>
          </div>
          <div className="flex-1 overflow-y-auto divide-y divide-gray-200 bg-white">
            {filteredResults.length === 0 ? (
              <div className="px-4 py-8 text-center text-sm text-gray-500">
                <p>{searchQuery ? '🔍 No matching pages' : '✓ All pages bookmarked'}</p>
              </div>
            ) : (
              filteredResults.map((item) => {
                const IconComponent = getIconComponent(item.icon)
                return (
                  <button
                    key={item.id}
                    onClick={() => handleAddBookmark(item)}
                    className="w-full px-4 py-3 text-left hover:bg-blue-50 transition-colors flex items-center gap-3 group border-b border-gray-100 last:border-0"
                  >
                    <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-lg bg-gray-100 group-hover:bg-blue-100">
                      <IconComponent className="h-4 w-4 text-gray-600 group-hover:text-blue-600" />
                    </div>
                    <span className="text-sm font-medium text-gray-900 group-hover:text-blue-600 flex-1 truncate">
                      {item.name}
                    </span>
                    <span className="text-blue-600 opacity-0 group-hover:opacity-100 text-lg font-bold">
                      +
                    </span>
                  </button>
                )
              })
            )}
          </div>
        </div>

        {/* My Bookmarks */}
        <div className="border border-gray-200 rounded-lg overflow-hidden flex flex-col">
          <div className="bg-gradient-to-r from-blue-50 to-transparent px-4 py-3 border-b border-gray-200">
            <h3 className="font-semibold text-sm text-gray-900">
              My Bookmarks
            </h3>
            <p className="text-xs text-gray-600 mt-0.5">{bookmarksInOrder.length} bookmarks</p>
          </div>
          <div className="flex-1 overflow-y-auto bg-white">
            {bookmarksInOrder.length === 0 ? (
              <div className="px-4 py-8 text-center text-sm text-gray-500">
                <p>📌 Add your first bookmark from the left</p>
              </div>
            ) : (
              <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                <SortableContext items={bookmarksInOrder.map((b) => b.id)} strategy={verticalListSortingStrategy}>
                  <div className="space-y-2 p-3">
                    {bookmarksInOrder.map((bookmark) => (
                      <DraggableBookmarkItem
                        key={bookmark.id}
                        bookmark={bookmark}
                        onRemove={() => removeBookmark(bookmark.id)}
                      />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
            )}
          </div>
        </div>
      </div>

      {/* Info box */}
      <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-800">
        <p className="font-medium mb-1">💡 Tip:</p>
        <p>Search and click pages to add them to bookmarks. Drag bookmarks to reorder, or remove with the trash icon.</p>
      </div>
    </div>
  )
}
