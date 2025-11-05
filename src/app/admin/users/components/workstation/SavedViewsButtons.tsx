'use client'

import React from 'react'
import { Users, Building2, Shield, Users2 } from 'lucide-react'
import './workstation.css'

interface SavedView {
  name: string
  label: string
  icon: React.ReactNode
  roleFilter?: string
  count?: number
  description: string
}

interface SavedViewsButtonsProps {
  activeView?: string
  onViewChange: (viewName: string, roleFilter?: string) => void
  viewCounts?: Record<string, number>
  className?: string
}

/**
 * SavedViewsButtons Component
 * Quick access buttons for common user role filters
 * 
 * Views:
 * - All Users: No filter
 * - Clients: role=CLIENT
 * - Team: role=TEAM_MEMBER|TEAM_LEAD|STAFF
 * - Admins: role=ADMIN
 */
export function SavedViewsButtons({
  activeView = 'all',
  onViewChange,
  viewCounts = {},
  className
}: SavedViewsButtonsProps) {
  const savedViews: SavedView[] = [
    {
      name: 'all',
      label: 'All Users',
      icon: <Users size={16} />,
      description: 'View all users in the system',
      count: viewCounts.all || 0
    },
    {
      name: 'clients',
      label: 'Clients',
      icon: <Building2 size={16} />,
      roleFilter: 'CLIENT',
      description: 'Client user accounts',
      count: viewCounts.clients || 0
    },
    {
      name: 'team',
      label: 'Team',
      icon: <Users2 size={16} />,
      roleFilter: 'TEAM',
      description: 'Internal team members',
      count: viewCounts.team || 0
    },
    {
      name: 'admins',
      label: 'Admins',
      icon: <Shield size={16} />,
      roleFilter: 'ADMIN',
      description: 'Administrator accounts',
      count: viewCounts.admins || 0
    }
  ]

  return (
    <div className={`sidebar-section ${className || ''}`} data-testid="saved-views-section">
      <h3 className="sidebar-title">Saved Views</h3>
      <div className="sidebar-views-container" data-testid="saved-views-container">
        {savedViews.map(view => (
          <button
            key={view.name}
            onClick={() => onViewChange(view.name, view.roleFilter)}
            className={`view-btn ${activeView === view.name ? 'active' : ''}`}
            title={view.description}
            aria-pressed={activeView === view.name}
            aria-label={`${view.label} (${view.count || 0} users)`}
            data-testid={`view-btn-${view.name}`}
          >
            <span className="flex items-center gap-1">
              {view.icon}
              <span className="text-xs font-medium">{view.label}</span>
            </span>
            {view.count !== undefined && view.count > 0 && (
              <span className="text-xs font-semibold text-muted-foreground ml-auto">
                {view.count > 99 ? '99+' : view.count}
              </span>
            )}
          </button>
        ))}
      </div>
    </div>
  )
}

export default SavedViewsButtons
