'use client'

import React, { useState, useMemo } from 'react'
import {
  BarChart3,
  Briefcase,
  Users,
  MessageSquare,
  Plus,
  Trash2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { Permission, PERMISSIONS, PERMISSION_METADATA } from '@/lib/permissions'

export interface PermissionTemplate {
  id: string
  name: string
  description: string
  icon: React.ReactNode
  color: string
  permissions: Permission[]
  category: 'preset' | 'custom'
}

export interface PermissionTemplatesTabProps {
  onApplyTemplate: (template: PermissionTemplate) => void
  onCreateTemplate?: () => void
  customTemplates?: PermissionTemplate[]
  currentPermissions?: Permission[]
}

// Predefined templates
const PRESET_TEMPLATES: PermissionTemplate[] = [
  {
    id: 'analytics-manager',
    name: 'Analytics Manager',
    description: 'View all reports, export data, create dashboards',
    icon: <BarChart3 className="w-6 h-6" />,
    color: 'bg-blue-100 text-blue-800 border-blue-300',
    category: 'preset',
    permissions: [
      PERMISSIONS.ANALYTICS_VIEW,
      PERMISSIONS.ANALYTICS_EXPORT,
      PERMISSIONS.SERVICES_ANALYTICS,
    ],
  },
  {
    id: 'operations-manager',
    name: 'Operations Manager',
    description: 'Manage bookings, team scheduling, service configuration',
    icon: <Briefcase className="w-6 h-6" />,
    color: 'bg-green-100 text-green-800 border-green-300',
    category: 'preset',
    permissions: [
      PERMISSIONS.SERVICES_VIEW,
      PERMISSIONS.SERVICES_EDIT,
      PERMISSIONS.BOOKING_SETTINGS_VIEW,
      PERMISSIONS.BOOKING_SETTINGS_EDIT,
      PERMISSIONS.TEAM_MANAGE,
    ],
  },
  {
    id: 'hr-specialist',
    name: 'HR Specialist',
    description: 'User management, team oversight, basic analytics',
    icon: <Users className="w-6 h-6" />,
    color: 'bg-purple-100 text-purple-800 border-purple-300',
    category: 'preset',
    permissions: [
      PERMISSIONS.USERS_MANAGE,
      PERMISSIONS.USERS_VIEW,
      PERMISSIONS.TEAM_VIEW,
      PERMISSIONS.ANALYTICS_VIEW,
    ],
  },
  {
    id: 'support-agent',
    name: 'Support Agent',
    description: 'View tickets, handle service requests, basic bookings',
    icon: <MessageSquare className="w-6 h-6" />,
    color: 'bg-orange-100 text-orange-800 border-orange-300',
    category: 'preset',
    permissions: [
      PERMISSIONS.SERVICE_REQUESTS_READ_ALL,
      PERMISSIONS.SERVICE_REQUESTS_UPDATE,
      PERMISSIONS.SERVICES_VIEW,
    ],
  },
]

export default function PermissionTemplatesTab({
  onApplyTemplate,
  onCreateTemplate,
  customTemplates = [],
  currentPermissions = [],
}: PermissionTemplatesTabProps) {
  const allTemplates = [...PRESET_TEMPLATES, ...customTemplates]

  const templateCoverage = useMemo(() => {
    const coverage: Record<string, number> = {}
    allTemplates.forEach((template) => {
      const matchCount = template.permissions.filter((p) =>
        currentPermissions.includes(p)
      ).length
      coverage[template.id] = Math.round(
        (matchCount / template.permissions.length) * 100
      )
    })
    return coverage
  }, [allTemplates, currentPermissions])

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b">
        <h2 className="text-lg font-semibold mb-2">Permission Templates</h2>
        <p className="text-sm text-gray-600">
          Quickly apply preset role templates or create custom ones
        </p>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-4 space-y-4">
          {/* Preset Templates */}
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-3">
              Preset Templates
            </h3>
            <div className="grid grid-cols-1 gap-3">
              {PRESET_TEMPLATES.map((template) => (
                <TemplateCard
                  key={template.id}
                  template={template}
                  coverage={templateCoverage[template.id]}
                  onApply={() => onApplyTemplate(template)}
                  isPreset
                />
              ))}
            </div>
          </div>

          {/* Custom Templates */}
          {customTemplates.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-3">
                Custom Templates
              </h3>
              <div className="grid grid-cols-1 gap-3">
                {customTemplates.map((template) => (
                  <TemplateCard
                    key={template.id}
                    template={template}
                    coverage={templateCoverage[template.id]}
                    onApply={() => onApplyTemplate(template)}
                    isPreset={false}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="p-4 border-t">
        {onCreateTemplate && (
          <Button
            variant="outline"
            className="w-full"
            onClick={onCreateTemplate}
          >
            <Plus className="w-4 h-4 mr-2" />
            Create Custom Template
          </Button>
        )}
      </div>
    </div>
  )
}

interface TemplateCardProps {
  template: PermissionTemplate
  coverage: number
  onApply: () => void
  isPreset: boolean
}

function TemplateCard({
  template,
  coverage,
  onApply,
  isPreset,
}: TemplateCardProps) {
  return (
    <div
      className={cn(
        'p-4 rounded-lg border-2 transition-all hover:shadow-md',
        template.color,
        'border-current'
      )}
    >
      <div className="flex items-start gap-3 mb-3">
        <div className="flex-shrink-0 opacity-80">{template.icon}</div>
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-sm">{template.name}</h4>
          <p className="text-xs opacity-75 mt-1">{template.description}</p>
        </div>
      </div>

      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-xs opacity-75">
            {template.permissions.length} permissions
          </span>
          {coverage > 0 && (
            <Badge variant="secondary" className="text-xs">
              {coverage}% match
            </Badge>
          )}
        </div>
        {!isPreset && (
          <div className="flex gap-1">
            <Button
              size="icon"
              variant="ghost"
              className="h-6 w-6"
              title="Delete template"
            >
              <Trash2 className="w-3 h-3" />
            </Button>
          </div>
        )}
      </div>

      <Button
        size="sm"
        className="w-full"
        onClick={onApply}
        variant={coverage > 0 ? 'outline' : 'default'}
      >
        Apply Template
      </Button>
    </div>
  )
}
