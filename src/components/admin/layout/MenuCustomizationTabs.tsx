/**
 * Menu Customization Tabs Navigation
 *
 * Tab navigation for the menu customization modal.
 * Displays four tabs for different customization workflows.
 */

'use client'

import React from 'react'
import { Sliders, Layout, Bookmark, DollarSign } from 'lucide-react'

export interface MenuCustomizationTabsProps {
  selectedTab: 'sections' | 'practice' | 'bookmarks' | 'books'
  onTabChange: (tab: 'sections' | 'practice' | 'bookmarks' | 'books') => void
}

/**
 * Tab configuration with icons and labels
 */
const TABS = [
  {
    id: 'sections' as const,
    label: 'Sections',
    icon: Layout,
    description: 'Reorder and hide sections',
  },
  {
    id: 'practice' as const,
    label: 'Your Practice',
    icon: Sliders,
    description: 'Manage practice items',
  },
  {
    id: 'bookmarks' as const,
    label: 'Bookmarks',
    icon: Bookmark,
    description: 'Bookmark pages',
  },
  {
    id: 'books' as const,
    label: 'Your Books',
    icon: DollarSign,
    description: 'Financial items',
  },
]

/**
 * Tab navigation component
 */
export function MenuCustomizationTabs({
  selectedTab,
  onTabChange,
}: MenuCustomizationTabsProps) {
  return (
    <div className="border-b border-gray-200 bg-white">
      <div className="flex overflow-x-auto">
        {TABS.map((tab) => {
          const Icon = tab.icon
          const isSelected = selectedTab === tab.id

          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`
                flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap
                ${
                  isSelected
                    ? 'border-blue-600 text-blue-600 bg-white'
                    : 'border-transparent text-gray-600 hover:text-gray-900 bg-white'
                }
              `}
              aria-selected={isSelected}
              role="tab"
            >
              <Icon className="h-4 w-4" />
              <span>{tab.label}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
