/**
 * Sections Tab Component
 *
 * Allows users to:
 * - Reorder menu sections using accessible drag-and-drop
 * - Toggle visibility of items within sections
 */

'use client'

import React from 'react'
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core'
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { ChevronDown, ChevronUp, Eye, EyeOff, GripVertical } from 'lucide-react'
import { MenuCustomizationData, MenuSection, MenuItem } from '@/types/admin/menuCustomization'
import { useMenuCustomizationModalStore } from '@/stores/admin/menuCustomizationModal.store'
import { DEFAULT_MENU_SECTIONS } from '@/lib/menu/defaultMenu'

export interface SectionsTabProps {
  draftCustomization: MenuCustomizationData
}

/**
 * Draggable Section Item Component
 */
function SortableSection({ section, expandedSections, toggleSectionExpanded, toggleItemVisibility, draftCustomization }: { section: MenuSection; expandedSections: Set<string>; toggleSectionExpanded: (id: string) => void; toggleItemVisibility: (path: string) => void; draftCustomization: MenuCustomizationData }) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: section.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  const isExpanded = expandedSections.has(section.id)
  const visibleItems = section.items.filter(
    (item) => !draftCustomization.hiddenItems.includes(item.href || '')
  )
  const hiddenCount = section.items.length - visibleItems.length

  return (
    <div ref={setNodeRef} style={style} className="border border-gray-200 rounded-lg overflow-hidden mb-4 bg-white hover:shadow-md transition-shadow">
      {/* Section Header */}
      <div
        className="w-full px-4 py-3 flex items-center justify-between bg-gradient-to-r from-blue-50 to-transparent hover:from-blue-100 transition-colors border-b border-gray-200"
      >
        <div {...attributes} {...listeners} className="flex items-center gap-3 flex-1 cursor-grab active:cursor-grabbing">
          <GripVertical className="h-5 w-5 text-blue-400" />
          <span className="font-semibold text-gray-900">{section.name}</span>
          <span className="text-xs bg-blue-100 text-blue-700 px-2.5 py-0.5 rounded-full font-medium">
            {visibleItems.length}
          </span>
          {hiddenCount > 0 && (
            <span className="text-xs bg-gray-200 text-gray-600 px-2.5 py-0.5 rounded-full font-medium">
              {hiddenCount} hidden
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => toggleSectionExpanded(section.id)}
            className="p-1.5 rounded-lg hover:bg-blue-100 transition-colors text-gray-600 hover:text-blue-600"
            title={isExpanded ? 'Collapse section' : 'Expand section'}
          >
            {isExpanded ? (
              <ChevronUp className="h-5 w-5" />
            ) : (
              <ChevronDown className="h-5 w-5" />
            )}
          </button>
        </div>
      </div>

      {/* Section Items */}
      {isExpanded && (
        <div className="divide-y divide-gray-200">
          {section.items.length === 0 ? (
            <div className="px-4 py-3 text-sm text-gray-500">
              No items in this section
            </div>
          ) : (
            section.items.map((item) => {
              // Check if the item is hidden using its href as the unique identifier
              const isHidden = draftCustomization.hiddenItems.includes(
                item.href || ''
              )

              // Recursively render children if they exist and are not hidden
              const renderItem = (currentItem: MenuItem, depth = 0) => {
                const currentIsHidden = draftCustomization.hiddenItems.includes(currentItem.href || '')
                const hasChildren = currentItem.children && currentItem.children.length > 0

                return (
                  <React.Fragment key={currentItem.id}>
                    <div
                      className={`px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors ${depth > 0 ? 'pl-8' : ''}`}
                    >
                      <div className="flex items-center gap-3 flex-1">
                        {currentItem.icon && (
                          <div className="text-gray-500 flex-shrink-0">
                            {/* Assuming item.icon is a React component or element */}
                            {currentItem.icon}
                          </div>
                        )}
                        <span
                          className={`text-sm ${currentIsHidden ? 'text-gray-400 line-through' : 'text-gray-900'}`}
                        >
                          {currentItem.name}
                          {hasChildren && <span className="ml-2 text-xs text-gray-500">(Section)</span>}
                        </span>
                      </div>

                      <button
                        onClick={() => toggleItemVisibility(currentItem.href || '')}
                        className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors text-gray-600 hover:text-gray-900"
                        title={currentIsHidden ? 'Show item' : 'Hide item'}
                      >
                        {currentIsHidden ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                    {hasChildren && !currentIsHidden && currentItem.children?.map(child => renderItem(child, depth + 1))}
                  </React.Fragment>
                )
              }

              // Only render top-level items here, as the recursion handles children
              // This assumes the menu structure is flat within the section.items array for the modal.
              // If the menu structure is nested (which it is, based on the original code), the logic needs to handle it.
              // Let's stick to the simpler flat structure as implied by the original SectionsTab logic.
              if (item.children && item.children.length > 0) {
                // If it's a parent item, we need to handle its visibility and its children's visibility
                return renderItem(item)
              } else {
                // If it's a simple item
                return renderItem(item)
              }
            })
          )}
        </div>
      )}
    </div>
  )
}

/**
 * Sections tab component for managing section order and item visibility
 */
export function SectionsTab({ draftCustomization }: SectionsTabProps) {
  const [expandedSections, setExpandedSections] = React.useState<Set<string>>(
    new Set(['dashboard', 'business'])
  )

  const { setSectionOrder, addHiddenItem, removeHiddenItem } = useMenuCustomizationModalStore()

  // 1. Get sections in custom order
  const sectionsInOrder = React.useMemo(() => {
    const orderMap = new Map(
      draftCustomization.sectionOrder.map((id, index) => [id, index])
    )

    // Filter out any section IDs in draftCustomization.sectionOrder that are not in DEFAULT_MENU_SECTIONS
    const validSectionIds = draftCustomization.sectionOrder.filter(id => DEFAULT_MENU_SECTIONS.some(s => s.id === id));
    
    // Merge with any missing default sections (should appear at the end)
    const missingDefaultSections = DEFAULT_MENU_SECTIONS.filter(s => !validSectionIds.includes(s.id));
    const finalSectionOrder = [...validSectionIds, ...missingDefaultSections.map(s => s.id)];

    const merged = finalSectionOrder.map(id => DEFAULT_MENU_SECTIONS.find(s => s.id === id)).filter((s): s is MenuSection => Boolean(s))
    return merged

  }, [draftCustomization.sectionOrder])


  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event

    if (active.id !== over?.id) {
      const oldIndex = draftCustomization.sectionOrder.indexOf(active.id as string)
      const newIndex = draftCustomization.sectionOrder.indexOf(over!.id as string)
      
      // Use the sectionOrder from the draft state for the move operation
      const newOrder = arrayMove(draftCustomization.sectionOrder, oldIndex, newIndex)
      setSectionOrder(newOrder)
    }
  }

  const toggleSectionExpanded = (sectionId: string) => {
    setExpandedSections(prev => {
      const newExpanded = new Set(prev);
      if (newExpanded.has(sectionId)) {
        newExpanded.delete(sectionId);
      } else {
        newExpanded.add(sectionId);
      }
      return newExpanded;
    });
  }

  const toggleItemVisibility = (itemPath: string) => {
    const isHidden = draftCustomization.hiddenItems.includes(itemPath)
    if (isHidden) {
      removeHiddenItem(itemPath)
    } else {
      addHiddenItem(itemPath)
    }
  }

  return (
    <div className="space-y-4">
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={sectionsInOrder.map(s => s.id)} strategy={verticalListSortingStrategy}>
          {sectionsInOrder.map((section) => (
            <SortableSection
              key={section.id}
              section={section}
              expandedSections={expandedSections}
              toggleSectionExpanded={toggleSectionExpanded}
              toggleItemVisibility={toggleItemVisibility}
              draftCustomization={draftCustomization}
            />
          ))}
        </SortableContext>
      </DndContext>

      {/* Info box */}
      <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-800">
        <p className="font-medium mb-1">💡 Tip:</p>
        <p>Use the drag handle (⠿) to reorder sections, and click the eye icon to hide/show items within each section.</p>
      </div>
    </div>
  )
}
