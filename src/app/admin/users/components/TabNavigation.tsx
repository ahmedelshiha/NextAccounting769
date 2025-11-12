'use client'

import React from 'react'
import { cn } from '@/lib/utils'

export type TabType = 'dashboard' | 'workflows' | 'bulk-operations' | 'audit' | 'rbac' | 'admin'

interface TabNavigationProps {
  activeTab: TabType
  onTabChange: (tab: TabType) => void
}

function getTabs(): Array<{
  id: TabType
  label: string
  icon: string
  description: string
}> {
  return [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: '📊',
      description: 'Operations overview and user management'
    },
    {
      id: 'workflows',
      label: 'Workflows',
      icon: '🔄',
      description: 'User lifecycle workflows (onboarding, offboarding, etc.)'
    },
    {
      id: 'bulk-operations',
      label: 'Bulk Operations',
      icon: '⚙️',
      description: 'Batch user operations and mass updates'
    },
    {
      id: 'audit',
      label: 'Audit Log',
      icon: '🔐',
      description: 'Compliance and audit trail'
    },
    {
      id: 'rbac',
      label: 'Roles & Permissions',
      icon: '🔒',
      description: 'Manage roles and user access'
    },
    {
      id: 'admin',
      label: 'Admin Settings',
      icon: '⚙️',
      description: 'System configuration and templates'
    }
  ]
}

/**
 * Enterprise-grade tab navigation for Admin Users page
 * Supports 5 major tabs with icons and descriptions
 * 
 * Features:
 * - Clean, accessible tab interface
 * - Keyboard navigation support
 * - Visual feedback for active tab
 * - Responsive design
 */
export function TabNavigation({ activeTab, onTabChange }: TabNavigationProps) {
  const tabs = getTabs()

  return (
    <div className="border-b border-gray-200 bg-white">
      <nav className="flex gap-4 px-4 sm:px-6 lg:px-8 overflow-x-auto" role="tablist">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            role="tab"
            aria-selected={activeTab === tab.id}
            aria-controls={`${tab.id}-panel`}
            onClick={() => onTabChange(tab.id)}
            className={cn(
              'whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors',
              activeTab === tab.id
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            )}
            title={tab.description}
          >
            <span className="mr-2">{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </nav>
    </div>
  )
}
