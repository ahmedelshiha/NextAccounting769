'use client'

import React, { useState } from 'react'
import {
  AlertTriangle,
  Users,
  Settings,
  ChevronRight,
  Copy,
  RefreshCw,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { cn } from '@/lib/utils'

export interface BulkUser {
  id: string
  name: string
  email: string
  currentRole: string
}

export type UpdateStrategy =
  | 'upgrade-role'
  | 'add-permissions'
  | 'replace-permissions'

export interface BulkOperationsModeProps {
  users: BulkUser[]
  selectedRole?: string
  onStrategySelect: (strategy: UpdateStrategy) => void
  onContinue?: () => void
  onCancel?: () => void
}

export default function BulkOperationsMode({
  users,
  selectedRole,
  onStrategySelect,
  onContinue,
  onCancel,
}: BulkOperationsModeProps) {
  const [selectedStrategy, setSelectedStrategy] = useState<UpdateStrategy | null>(
    null
  )

  const uniqueRoles = [...new Set(users.map((u) => u.currentRole))]
  const hasMultipleRoles = uniqueRoles.length > 1

  const handleStrategySelect = (strategy: UpdateStrategy) => {
    setSelectedStrategy(strategy)
    onStrategySelect(strategy)
  }

  const handleContinue = () => {
    if (selectedStrategy && onContinue) {
      onContinue()
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-6 border-b">
        <div className="flex items-center gap-3 mb-2">
          <div className="bg-blue-100 rounded-full p-3">
            <Users className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h2 className="text-lg font-semibold">
              Bulk Update: {users.length} users selected
            </h2>
            <p className="text-sm text-gray-600">
              Choose how to apply changes across selected users
            </p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-6 space-y-6">
          {/* Selected Users */}
          <div>
            <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
              <Users className="w-4 h-4" />
              Selected Users ({users.length})
            </h3>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {users.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded border"
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{user.name}</p>
                    <p className="text-xs text-gray-600 truncate">
                      {user.email}
                    </p>
                  </div>
                  <Badge variant="outline" className="ml-2 flex-shrink-0">
                    {user.currentRole}
                  </Badge>
                </div>
              ))}
            </div>
          </div>

          {/* Warning */}
          {hasMultipleRoles && (
            <Alert className="border-yellow-200 bg-yellow-50">
              <AlertTriangle className="h-4 w-4 text-yellow-600" />
              <AlertDescription>
                <div>
                  <p className="font-medium text-sm">
                    Users have different current roles
                  </p>
                  <p className="text-xs text-gray-700 mt-1">
                    Current roles: {uniqueRoles.join(', ')}
                  </p>
                </div>
              </AlertDescription>
            </Alert>
          )}

          {/* Update Strategies */}
          <div>
            <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
              <Settings className="w-4 h-4" />
              Choose Update Strategy
            </h3>

            <div className="space-y-2">
              <StrategyCard
                id="upgrade-role"
                title="Upgrade all to selected role"
                description="Replace current roles with new role and update permissions accordingly"
                icon={<ChevronRight className="w-5 h-5" />}
                selected={selectedStrategy === 'upgrade-role'}
                onClick={() => handleStrategySelect('upgrade-role')}
                disabled={!selectedRole}
              />

              <StrategyCard
                id="add-permissions"
                title="Add permissions only"
                description="Keep current roles and add new permissions to each user"
                icon={<Copy className="w-5 h-5" />}
                selected={selectedStrategy === 'add-permissions'}
                onClick={() => handleStrategySelect('add-permissions')}
              />

              <StrategyCard
                id="replace-permissions"
                title="Replace permissions entirely"
                description="Remove current permissions and apply selected ones (keep roles)"
                icon={<RefreshCw className="w-5 h-5" />}
                selected={selectedStrategy === 'replace-permissions'}
                onClick={() => handleStrategySelect('replace-permissions')}
              />
            </div>
          </div>

          {/* Strategy Info */}
          {selectedStrategy && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <StrategyExplanation strategy={selectedStrategy} />
              </AlertDescription>
            </Alert>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="p-6 border-t bg-gray-50 flex gap-2 justify-end">
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button
          onClick={handleContinue}
          disabled={!selectedStrategy}
          className="bg-blue-600 hover:bg-blue-700"
        >
          Continue
          <ChevronRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </div>
  )
}

interface StrategyCardProps {
  id: string
  title: string
  description: string
  icon: React.ReactNode
  selected: boolean
  onClick: () => void
  disabled?: boolean
}

function StrategyCard({
  id,
  title,
  description,
  icon,
  selected,
  onClick,
  disabled = false,
}: StrategyCardProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'w-full text-left p-4 rounded-lg border-2 transition-all',
        selected ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300',
        disabled && 'opacity-50 cursor-not-allowed'
      )}
    >
      <div className="flex items-start gap-3">
        <div
          className={cn(
            'flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center',
            selected
              ? 'bg-blue-100 text-blue-600'
              : 'bg-gray-100 text-gray-600'
          )}
        >
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm">{title}</p>
          <p className="text-xs text-gray-600 mt-1">{description}</p>
        </div>
        {selected && (
          <div className="flex-shrink-0 w-5 h-5 rounded-full bg-blue-600 flex items-center justify-center">
            <svg
              className="w-3 h-3 text-white"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
        )}
      </div>
    </button>
  )
}

interface StrategyExplanationProps {
  strategy: UpdateStrategy
}

function StrategyExplanation({ strategy }: StrategyExplanationProps) {
  const explanations = {
    'upgrade-role': {
      title: 'Upgrade all to selected role',
      details:
        'All users will be promoted to the selected role. Their existing permissions will be replaced with permissions appropriate for the new role.',
    },
    'add-permissions': {
      title: 'Add permissions only',
      details:
        'Selected permissions will be added to each user while keeping their current roles and existing permissions intact. No permissions will be removed.',
    },
    'replace-permissions': {
      title: 'Replace permissions entirely',
      details:
        'Selected permissions will replace all current permissions for each user. Their roles will remain unchanged. This is useful for resetting to a specific permission set.',
    },
  }

  const explanation = explanations[strategy]

  return (
    <div>
      <p className="font-medium text-sm">{explanation.title}</p>
      <p className="text-xs text-gray-700 mt-1">{explanation.details}</p>
    </div>
  )
}
