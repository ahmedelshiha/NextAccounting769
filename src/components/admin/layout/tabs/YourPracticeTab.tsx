/**
 * Your Practice Tab Component
 *
 * Manages practice-specific menu items with:
 * - Drag-and-drop reordering via @dnd-kit
 * - Visibility toggles
 * - Item management
 */

'use client'

import React from 'react'
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core'
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Eye, EyeOff, GripVertical, Trash2 } from 'lucide-react'
import { MenuCustomizationData, PracticeItem } from '@/types/admin/menuCustomization'
import { useMenuCustomizationModalStore } from '@/stores/admin/menuCustomizationModal.store'
import { getPracticeItems } from '@/lib/menu/menuMapping'
import { getIconComponent } from '@/lib/menu/iconMap'

export interface YourPracticeTabProps {
  draftCustomization: MenuCustomizationData
}

/**
 * Draggable practice item component
 */
function DraggablePracticeItem({ 
  item, 
  isVisible, 
  onToggleVisibility, 
  onRemove 
}: { 
  item: PracticeItem
  isVisible: boolean
  onToggleVisibility: () => void
  onRemove: () => void
}) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: item.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  const IconComponent = getIconComponent(item.icon)

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
        <span className={`text-sm font-medium truncate ${isVisible ? 'text-gray-900' : 'text-gray-400 line-through'}`}>
          {item.name}
        </span>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
        {/* Visibility toggle */}
        <button
          onClick={onToggleVisibility}
          className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors text-gray-600 hover:text-gray-900"
          title={isVisible ? 'Hide from menu' : 'Show in menu'}
        >
          {isVisible ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
        </button>

        {/* Remove button */}
        <button
          onClick={onRemove}
          className="p-1.5 rounded-lg hover:bg-red-50 transition-colors text-gray-600 hover:text-red-600"
          title="Remove from practice menu"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}

/**
 * Your Practice tab component for managing practice-specific items
 */
export function YourPracticeTab({ draftCustomization }: YourPracticeTabProps) {
  const practiceItems = getPracticeItems()

  const { setPracticeItems, togglePracticeItemVisibility, removePracticeItem } = useMenuCustomizationModalStore()

  // Get practice items in custom order
  const itemsInOrder = React.useMemo(() => {
    const customItems = draftCustomization.practiceItems

    if (customItems && customItems.length > 0) {
      return [...customItems].sort((a, b) => a.order - b.order)
    }

    return practiceItems
  }, [draftCustomization.practiceItems, practiceItems])

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event

    if (active.id !== over?.id) {
      const oldIndex = itemsInOrder.findIndex((item) => item.id === active.id)
      const newIndex = itemsInOrder.findIndex((item) => item.id === over!.id)

      const newItems = arrayMove(itemsInOrder, oldIndex, newIndex)
      setPracticeItems(newItems)
    }
  }

  if (itemsInOrder.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <p className="text-gray-500 text-sm">No practice items available to customize</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={itemsInOrder.map((i) => i.id)} strategy={verticalListSortingStrategy}>
          <div className="space-y-2">
            {itemsInOrder.map((item) => {
              const isVisible = item.visible !== false

              return (
                <DraggablePracticeItem
                  key={item.id}
                  item={item}
                  isVisible={isVisible}
                  onToggleVisibility={() => togglePracticeItemVisibility(item.id)}
                  onRemove={() => removePracticeItem(item.id)}
                />
              )
            })}
          </div>
        </SortableContext>
      </DndContext>

      {/* Info box */}
      <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-800">
        <p className="font-medium mb-1">💡 Tip:</p>
        <p>Drag items to reorder them in your menu. Use the eye icon to hide/show items, or trash icon to remove them.</p>
      </div>
    </div>
  )
}
