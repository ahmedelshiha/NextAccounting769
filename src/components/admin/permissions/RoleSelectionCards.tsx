'use client'

import React from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Check, ArrowRight, Info } from 'lucide-react'
import { cn } from '@/lib/utils'
import { PermissionEngine, PermissionDiff } from '@/lib/permission-engine'

/**
 * Role definition for display
 */
interface RoleDefinition {
  key: string
  label: string
  description: string
  color: string
  icon: string
  permissionCount: number | string
}

/**
 * Props for RoleSelectionCards component
 */
interface RoleSelectionCardsProps {
  selectedRole?: string
  currentRole?: string
  onSelectRole: (role: string) => void
  onCompareRole?: (role: string) => void
  changes?: PermissionDiff
  showComparison?: boolean
}

/**
 * Standard roles available in the system
 */
const STANDARD_ROLES: RoleDefinition[] = [
  {
    key: 'CLIENT',
    label: 'Client',
    description: 'View own data and requests only',
    color: 'pink',
    icon: '👤',
    permissionCount: 3,
  },
  {
    key: 'TEAM_MEMBER',
    label: 'Team Member',
    description: 'Limited access and basic features',
    color: 'gray',
    icon: '👥',
    permissionCount: 12,
  },
  {
    key: 'TEAM_LEAD',
    label: 'Team Lead',
    description: 'Manage team and team-specific settings',
    color: 'green',
    icon: '🛡️',
    permissionCount: 25,
  },
  {
    key: 'ADMIN',
    label: 'Admin',
    description: 'Manage organization and all settings',
    color: 'blue',
    icon: '⚙️',
    permissionCount: 85,
  },
  {
    key: 'SUPER_ADMIN',
    label: 'Super Admin',
    description: 'Full system access and administration',
    color: 'purple',
    icon: '👑',
    permissionCount: 'All',
  },
]

/**
 * Color mapping for role cards
 */
const COLOR_CLASSES = {
  pink: {
    bg: 'bg-pink-50',
    border: 'border-pink-300',
    selectedBg: 'bg-pink-100',
    selectedBorder: 'border-pink-500',
    text: 'text-pink-900',
    badge: 'bg-pink-200 text-pink-900',
  },
  gray: {
    bg: 'bg-gray-50',
    border: 'border-gray-300',
    selectedBg: 'bg-gray-100',
    selectedBorder: 'border-gray-500',
    text: 'text-gray-900',
    badge: 'bg-gray-200 text-gray-900',
  },
  green: {
    bg: 'bg-green-50',
    border: 'border-green-300',
    selectedBg: 'bg-green-100',
    selectedBorder: 'border-green-500',
    text: 'text-green-900',
    badge: 'bg-green-200 text-green-900',
  },
  blue: {
    bg: 'bg-blue-50',
    border: 'border-blue-300',
    selectedBg: 'bg-blue-100',
    selectedBorder: 'border-blue-500',
    text: 'text-blue-900',
    badge: 'bg-blue-200 text-blue-900',
  },
  purple: {
    bg: 'bg-purple-50',
    border: 'border-purple-300',
    selectedBg: 'bg-purple-100',
    selectedBorder: 'border-purple-500',
    text: 'text-purple-900',
    badge: 'bg-purple-200 text-purple-900',
  },
}

type ColorKey = keyof typeof COLOR_CLASSES

/**
 * RoleSelectionCards Component
 * 
 * Visual selection interface for choosing a role with:
 * - Color-coded role cards
 * - Permission counts
 * - Current role indicator
 * - Selection state with checkmark
 * - Comparison view
 */
export function RoleSelectionCards({
  selectedRole,
  currentRole,
  onSelectRole,
  onCompareRole,
  changes,
  showComparison = true,
}: RoleSelectionCardsProps) {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900">Select a Role</h3>
        <p className="text-sm text-gray-600 mt-1">
          Each role comes with predefined permissions. Select one to automatically update permissions.
        </p>
      </div>

      {/* Role Cards Grid */}
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
        {STANDARD_ROLES.map(role => (
          <RoleCard
            key={role.key}
            role={role}
            selected={selectedRole === role.key}
            isCurrent={currentRole === role.key}
            onSelect={() => onSelectRole(role.key)}
            onCompare={() => onCompareRole?.(role.key)}
            showComparison={showComparison}
          />
        ))}
      </div>

      {/* Preview Section */}
      {selectedRole && selectedRole !== currentRole && changes && showComparison && (
        <ChangePreview
          selectedRole={selectedRole}
          currentRole={currentRole}
          changes={changes}
        />
      )}
    </div>
  )
}

/**
 * Individual Role Card Component
 */
interface RoleCardProps {
  role: RoleDefinition
  selected: boolean
  isCurrent: boolean
  onSelect: () => void
  onCompare?: () => void
  showComparison: boolean
}

function RoleCard({
  role,
  selected,
  isCurrent,
  onSelect,
  onCompare,
  showComparison,
}: RoleCardProps) {
  const colors = COLOR_CLASSES[role.color as ColorKey]
  
  const cardClasses = cn(
    'relative p-5 rounded-lg border-2 transition-all duration-200 cursor-pointer group hover:shadow-md',
    selected
      ? `${colors.selectedBg} ${colors.selectedBorder} shadow-lg`
      : `${colors.bg} border-gray-200 hover:border-gray-300`
  )

  return (
    <button
      onClick={onSelect}
      className={cardClasses}
    >
      {/* Selected Indicator */}
      {selected && (
        <div className="absolute top-3 right-3">
          <div className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-green-500 text-white">
            <Check className="h-4 w-4" />
          </div>
        </div>
      )}

      {/* Current Role Badge */}
      {isCurrent && !selected && (
        <div className="absolute top-3 left-3">
          <Badge variant="secondary" className="text-xs">
            Current
          </Badge>
        </div>
      )}

      {/* Content */}
      <div className="text-left">
        {/* Icon and Title */}
        <div className="flex items-start gap-3 mb-3">
          <span className="text-3xl">{role.icon}</span>
          <div className="flex-1">
            <h4 className={cn('font-semibold text-sm', colors.text)}>
              {role.label}
            </h4>
            <p className="text-xs text-gray-600 mt-0.5 line-clamp-2">
              {role.description}
            </p>
          </div>
        </div>

        {/* Permission Count */}
        <div className="flex items-center justify-between pt-3 border-t border-gray-200">
          <span className="text-xs font-medium text-gray-600">
            {role.permissionCount} permissions
          </span>
          {showComparison && onCompare && (
            <Button
              variant="ghost"
              size="sm"
              className="h-6 px-2 text-xs opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={(e) => {
                e.stopPropagation()
                onCompare()
              }}
            >
              <Info className="h-3 w-3" />
            </Button>
          )}
        </div>
      </div>
    </button>
  )
}

/**
 * Change Preview Component
 */
interface ChangePreviewProps {
  selectedRole: string
  currentRole?: string
  changes: PermissionDiff
}

function ChangePreview({
  selectedRole,
  currentRole,
  changes,
}: ChangePreviewProps) {
  const riskLevel = changes.added.length > 20 ? 'medium' : 'low'

  return (
    <div className="p-4 rounded-lg bg-blue-50 border border-blue-200 space-y-3">
      <div className="flex items-start gap-3">
        <div className="flex-1">
          <h4 className="font-semibold text-sm text-blue-900 mb-2">
            Changes to {selectedRole}
          </h4>

          {/* Role Change */}
          <div className="flex items-center gap-2 mb-3 text-sm">
            <Badge variant="outline">{currentRole}</Badge>
            <ArrowRight className="h-4 w-4 text-blue-600" />
            <Badge className="bg-blue-600">{selectedRole}</Badge>
          </div>

          {/* Permission Changes */}
          <div className="space-y-1 text-sm">
            {changes.added.length > 0 && (
              <p className="text-blue-800">
                <span className="font-medium">+{changes.added.length}</span> permissions added
              </p>
            )}
            {changes.removed.length > 0 && (
              <p className="text-blue-800">
                <span className="font-medium">-{changes.removed.length}</span> permissions removed
              </p>
            )}
          </div>

          {/* Risk Indicator */}
          <div className="mt-3 flex items-center gap-2">
            <div className={cn(
              'h-2 w-2 rounded-full',
              riskLevel === 'medium' ? 'bg-yellow-500' : 'bg-green-500'
            )} />
            <span className="text-xs text-blue-700">
              Risk level: <span className="font-medium capitalize">{riskLevel}</span>
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
