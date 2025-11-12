'use client'

import React from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { FilterState } from '../hooks/useFilterState'
import { UserItem } from '../contexts/UserDataContext'

export interface QuickFilterDef {
  id: string
  label: string
  description?: string
  getFilters: (users: UserItem[]) => FilterState
  icon?: React.ReactNode
  count?: number
}

export interface QuickFilterButtonsProps {
  quickFilters: QuickFilterDef[]
  onApplyFilter: (filters: FilterState) => void
  currentFilters: FilterState
  users: UserItem[]
}

/**
 * Generates a list of quick filter definitions
 */
export function createDefaultQuickFilters(): QuickFilterDef[] {
  return [
    {
      id: 'active-users',
      label: 'Active Users',
      description: 'Only active status',
      getFilters: () => ({
        search: '',
        roles: [],
        statuses: ['ACTIVE']
      })
    },
    {
      id: 'inactive-users',
      label: 'Inactive Users',
      description: 'Only inactive status',
      getFilters: () => ({
        search: '',
        roles: [],
        statuses: ['INACTIVE']
      })
    },
    {
      id: 'admin-only',
      label: 'Admins',
      description: 'Admin role only',
      getFilters: () => ({
        search: '',
        roles: ['ADMIN'],
        statuses: []
      })
    },
    {
      id: 'team-members',
      label: 'Team Members',
      description: 'Team member role only',
      getFilters: () => ({
        search: '',
        roles: ['TEAM_MEMBER'],
        statuses: []
      })
    },
    {
      id: 'leads',
      label: 'Team Leads',
      description: 'Team lead role only',
      getFilters: () => ({
        search: '',
        roles: ['TEAM_LEAD'],
        statuses: []
      })
    },
    {
      id: 'new-this-month',
      label: 'New This Month',
      description: 'Users created in the last 30 days',
      getFilters: (users: UserItem[]) => {
        const thirtyDaysAgo = new Date()
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

        const newUserIds = users
          .filter(u => new Date(u.createdAt) >= thirtyDaysAgo)
          .map(u => u.name)
          .filter((name): name is string => name !== null)

        return {
          search: newUserIds.length > 0 ? `^${newUserIds[0]}` : '',
          roles: [],
          statuses: []
        }
      }
    },
    {
      id: 'never-logged-in',
      label: 'Never Logged In',
      description: 'Users with no login history',
      getFilters: (users: UserItem[]) => {
        // This filter would require a search that finds users without lastLoginAt
        // For now, we'll create a special marker in search
        return {
          search: '[never-logged-in]',
          roles: [],
          statuses: []
        }
      }
    },
    {
      id: 'clients-only',
      label: 'Clients',
      description: 'Client role only',
      getFilters: () => ({
        search: '',
        roles: ['CLIENT'],
        statuses: []
      })
    }
  ]
}

export function QuickFilterButtons({
  quickFilters,
  onApplyFilter,
  currentFilters,
  users
}: QuickFilterButtonsProps) {
  const isFilterActive = (filter: QuickFilterDef): boolean => {
    const filterState = filter.getFilters(users)
    return (
      JSON.stringify(filterState) === JSON.stringify(currentFilters)
    )
  }

  if (quickFilters.length === 0) {
    return null
  }

  return (
    <div
      className="px-3 py-3 border-t border-gray-200 bg-gray-50"
      role="group"
      aria-label="Quick filter buttons"
    >
      <div className="flex items-center gap-2 overflow-x-auto pb-2">
        <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide flex-shrink-0">
          Quick Filters:
        </span>
        <div className="flex gap-2 flex-shrink-0">
          {quickFilters.map(filter => {
            const isActive = isFilterActive(filter)
            return (
              <button
                key={filter.id}
                onClick={() => onApplyFilter(filter.getFilters(users))}
                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors flex items-center gap-2 whitespace-nowrap ${
                  isActive
                    ? 'bg-blue-100 text-blue-700 border border-blue-300'
                    : 'bg-white text-gray-700 border border-gray-300 hover:border-blue-300 hover:text-blue-600'
                }`}
                title={filter.description}
                type="button"
              >
                {filter.icon}
                {filter.label}
                {filter.count !== undefined && (
                  <Badge variant="secondary" className="ml-1 text-xs">
                    {filter.count}
                  </Badge>
                )}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
