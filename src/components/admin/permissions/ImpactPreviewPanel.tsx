'use client'

import React, { useState } from 'react'
import {
  AlertCircle,
  AlertTriangle,
  XCircle,
  FileEdit,
  ArrowRight,
  PlusCircle,
  MinusCircle,
  Download,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { cn } from '@/lib/utils'
import { 
  Permission,
  PERMISSION_METADATA,
  RiskLevel,
} from '@/lib/permissions'
import {
  PermissionDiff,
  ValidationResult,
  ValidationError,
  ValidationWarning,
} from '@/lib/permission-engine'

export interface ImpactPreviewPanelProps {
  changes: PermissionDiff
  validation: ValidationResult
  currentRole?: string
  selectedRole?: string
  onExport?: () => void
}

export default function ImpactPreviewPanel({
  changes,
  validation,
  currentRole,
  selectedRole,
  onExport,
}: ImpactPreviewPanelProps) {
  const [showFullList, setShowFullList] = useState(false)
  const hasRoleChange = currentRole && selectedRole && currentRole !== selectedRole
  const hasPermissionChanges = changes.added.length > 0 || changes.removed.length > 0

  if (!hasRoleChange && !hasPermissionChanges) {
    return (
      <div className="flex flex-col items-center justify-center p-6 text-center text-gray-500">
        <AlertCircle className="w-12 h-12 mx-auto mb-3 opacity-50" />
        <p className="font-medium">No changes yet</p>
        <p className="text-sm mt-1">
          Select a role or modify permissions to see impact
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6 p-6">
      {/* Change Summary Header */}
      <div>
        <h3 className="font-semibold mb-4 flex items-center gap-2">
          <FileEdit className="w-4 h-4" />
          Change Summary
        </h3>

        {/* Role Change Section */}
        {hasRoleChange && (
          <div className="p-4 bg-blue-50 rounded-lg mb-4 border border-blue-200">
            <div className="flex items-center gap-3 flex-wrap">
              <Badge variant="outline" className="bg-white">
                {currentRole}
              </Badge>
              <ArrowRight className="w-4 h-4 text-blue-600" />
              <Badge className="bg-blue-600 text-white">
                {selectedRole}
              </Badge>
            </div>
            <p className="text-sm text-gray-600 mt-3">
              Role change will automatically update{' '}
              <span className="font-medium">{changes.added.length} permissions</span>
            </p>
          </div>
        )}

        {/* Permission Changes */}
        {changes.added.length > 0 && (
          <PermissionChangeList
            title="Adding"
            permissions={changes.added}
            variant="added"
            showAll={showFullList}
            onToggle={() => setShowFullList(!showFullList)}
          />
        )}

        {changes.removed.length > 0 && (
          <PermissionChangeList
            title="Removing"
            permissions={changes.removed}
            variant="removed"
            showAll={showFullList}
            onToggle={() => setShowFullList(!showFullList)}
          />
        )}
      </div>

      {/* Validation Errors */}
      {validation.errors.length > 0 && (
        <div>
          <h3 className="font-semibold mb-3 flex items-center gap-2 text-red-600">
            <XCircle className="w-4 h-4" />
            Errors ({validation.errors.length})
          </h3>
          <div className="space-y-2">
            {validation.errors.map((error, index) => (
              <ValidationAlert key={index} error={error} />
            ))}
          </div>
        </div>
      )}

      {/* Validation Warnings */}
      {validation.warnings.length > 0 && (
        <div>
          <h3 className="font-semibold mb-3 flex items-center gap-2 text-amber-600">
            <AlertTriangle className="w-4 h-4" />
            Warnings ({validation.warnings.length})
          </h3>
          <div className="space-y-2">
            {validation.warnings.map((warning, index) => (
              <WarningAlert key={index} warning={warning} />
            ))}
          </div>
        </div>
      )}

      {/* Risk Level and Export */}
      <div className="pt-4 border-t">
        <div className="flex items-center justify-between mb-4">
          <span className="text-sm font-medium">Risk Level</span>
          <RiskIndicator level={validation.riskLevel} />
        </div>

        {onExport && (
          <Button
            variant="outline"
            size="sm"
            className="w-full"
            onClick={onExport}
          >
            <Download className="w-4 h-4 mr-2" />
            Export Change Report
          </Button>
        )}
      </div>
    </div>
  )
}

interface PermissionChangeListProps {
  title: string
  permissions: Permission[]
  variant: 'added' | 'removed'
  showAll: boolean
  onToggle: () => void
}

function PermissionChangeList({
  title,
  permissions,
  variant,
  showAll,
  onToggle,
}: PermissionChangeListProps) {
  const displayCount = showAll ? permissions.length : Math.min(5, permissions.length)
  const hasMore = permissions.length > 5

  return (
    <div className="mb-4">
      <div className="flex items-center gap-2 mb-3">
        {variant === 'added' ? (
          <PlusCircle className="w-4 h-4 text-green-600" />
        ) : (
          <MinusCircle className="w-4 h-4 text-red-600" />
        )}
        <h4 className="font-medium text-sm">
          {title} ({permissions.length} permissions)
        </h4>
      </div>

      <ul className="space-y-2">
        {permissions.slice(0, displayCount).map((permission) => {
          const meta = PERMISSION_METADATA[permission]
          return (
            <li
              key={permission}
              className={cn(
                'text-sm p-3 rounded flex items-center justify-between border',
                variant === 'added'
                  ? 'bg-green-50 border-green-200 text-green-700'
                  : 'bg-red-50 border-red-200 text-red-700'
              )}
            >
              <div className="flex-1">
                <div className="font-medium">{meta.label}</div>
                <div className="text-xs opacity-75 mt-0.5">
                  {meta.description}
                </div>
              </div>
              <RiskBadge risk={meta.risk} />
            </li>
          )
        })}
      </ul>

      {hasMore && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onToggle}
          className="w-full mt-2 text-xs"
        >
          {showAll ? 'Show Less' : `Show ${permissions.length - 5} More`}
        </Button>
      )}
    </div>
  )
}

interface ValidationAlertProps {
  error: ValidationError
}

function ValidationAlert({ error }: ValidationAlertProps) {
  return (
    <Alert variant="destructive">
      <XCircle className="h-4 w-4" />
      <AlertDescription>
        <div className="flex items-start gap-3">
          <div className="flex-1">
            <div className="font-medium text-sm">
              {PERMISSION_METADATA[error.permission]?.label || error.permission}
            </div>
            <div className="text-xs mt-1">{error.message}</div>
          </div>
        </div>
      </AlertDescription>
    </Alert>
  )
}

interface WarningAlertProps {
  warning: ValidationWarning
}

function WarningAlert({ warning }: WarningAlertProps) {
  return (
    <Alert className="border-yellow-200 bg-yellow-50">
      <AlertTriangle className="h-4 w-4 text-yellow-600" />
      <AlertDescription>
        <div className="flex items-start gap-3">
          <div className="flex-1">
            <div className="font-medium text-sm">
              {PERMISSION_METADATA[warning.permission]?.label || warning.permission}
            </div>
            <div className="text-xs mt-1">{warning.message}</div>
          </div>
        </div>
      </AlertDescription>
    </Alert>
  )
}

interface RiskBadgeProps {
  risk: RiskLevel
}

function RiskBadge({ risk }: RiskBadgeProps) {
  const riskStyles = {
    low: 'bg-green-100 text-green-800',
    medium: 'bg-yellow-100 text-yellow-800',
    high: 'bg-orange-100 text-orange-800',
    critical: 'bg-red-100 text-red-800',
  }

  return (
    <Badge
      variant="outline"
      className={cn('text-xs capitalize', riskStyles[risk])}
    >
      {risk}
    </Badge>
  )
}

interface RiskIndicatorProps {
  level: RiskLevel
}

function RiskIndicator({ level }: RiskIndicatorProps) {
  const riskConfig = {
    low: { icon: '🟢', label: 'Low', color: 'text-green-600' },
    medium: { icon: '🟡', label: 'Medium', color: 'text-yellow-600' },
    high: { icon: '🟠', label: 'High', color: 'text-orange-600' },
    critical: { icon: '🔴', label: 'Critical', color: 'text-red-600' },
  }

  const config = riskConfig[level]

  return (
    <div className={cn('text-sm font-medium', config.color)}>
      <span className="mr-2">{config.icon}</span>
      {config.label}
    </div>
  )
}
