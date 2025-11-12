'use client'

import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { AlertTriangle, CheckCircle, GitCompare } from 'lucide-react'

interface PermissionConflict {
  id: string
  userId: string
  resource: string
  roleA: string
  roleB: string
  conflictType: 'DENY_ALLOW' | 'PRIORITY' | 'SCOPE'
  severity: 'HIGH' | 'MEDIUM' | 'LOW'
  resolution?: 'DENY_WINS' | 'HIGHEST_PRIORITY' | 'EXPLICIT' | 'CUSTOM'
}

interface ConflictResolverProps {
  conflicts?: PermissionConflict[]
  onResolve?: (conflictId: string, resolution: string) => Promise<void>
}

export function ConflictResolver({ conflicts = DEFAULT_CONFLICTS, onResolve }: ConflictResolverProps) {
  const [resolvedConflicts, setResolvedConflicts] = useState<Map<string, string>>(new Map())
  const [isResolving, setIsResolving] = useState<string | null>(null)

  const unresolvedConflicts = conflicts.filter(c => !resolvedConflicts.has(c.id))

  const handleResolve = async (conflict: PermissionConflict, resolution: string) => {
    setIsResolving(conflict.id)
    try {
      await onResolve?.(conflict.id, resolution)
      setResolvedConflicts(new Map(resolvedConflicts).set(conflict.id, resolution))
    } finally {
      setIsResolving(null)
    }
  }

  const handleResolveAll = async () => {
    for (const conflict of unresolvedConflicts) {
      await handleResolve(conflict, getDefaultResolution(conflict))
    }
  }

  const severityColor = {
    HIGH: 'text-red-600',
    MEDIUM: 'text-amber-600',
    LOW: 'text-yellow-600'
  }

  const severityBg = {
    HIGH: 'bg-red-50',
    MEDIUM: 'bg-amber-50',
    LOW: 'bg-yellow-50'
  }

  return (
    <div className="space-y-6">
      {/* Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Conflict Resolution</span>
            <Badge variant="outline">
              {unresolvedConflicts.length} Unresolved
            </Badge>
          </CardTitle>
          <CardDescription>
            {conflicts.length - resolvedConflicts.size} of {conflicts.length} conflicts
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <MetricBox
              label="Total Conflicts"
              value={conflicts.length}
              icon="⚠️"
            />
            <MetricBox
              label="Resolved"
              value={resolvedConflicts.size}
              icon="✅"
            />
            <MetricBox
              label="Unresolved"
              value={unresolvedConflicts.length}
              icon="🔴"
            />
          </div>

          {unresolvedConflicts.length > 0 && (
            <Button onClick={handleResolveAll} className="w-full">
              <CheckCircle className="w-4 h-4 mr-2" />
              Resolve All with Recommended Actions
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Conflicts List */}
      <div className="space-y-4">
        {unresolvedConflicts.length === 0 ? (
          <Card className="bg-green-50 border-green-200">
            <CardContent className="pt-6 text-center">
              <CheckCircle className="w-8 h-8 text-green-600 mx-auto mb-2" />
              <p className="text-green-800 font-medium">All conflicts resolved!</p>
            </CardContent>
          </Card>
        ) : (
          unresolvedConflicts.map(conflict => (
            <ConflictCard
              key={conflict.id}
              conflict={conflict}
              isResolving={isResolving === conflict.id}
              onResolve={(resolution) => handleResolve(conflict, resolution)}
              severityColor={severityColor}
              severityBg={severityBg}
            />
          ))
        )}
      </div>

      {/* Resolved Conflicts (Summary) */}
      {resolvedConflicts.size > 0 && (
        <Card className="bg-blue-50 border-blue-200">
          <CardHeader>
            <CardTitle className="text-base">Resolved Conflicts</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {conflicts
              .filter(c => resolvedConflicts.has(c.id))
              .map(conflict => (
                <div key={conflict.id} className="flex items-center justify-between text-sm p-2 bg-white rounded border border-blue-100">
                  <span className="text-muted-foreground">
                    {conflict.userId} on {conflict.resource}
                  </span>
                  <Badge variant="secondary">
                    {resolvedConflicts.get(conflict.id)}
                  </Badge>
                </div>
              ))}
          </CardContent>
        </Card>
      )}
    </div>
  )
}

/**
 * Conflict Card Component
 */
function ConflictCard({
  conflict,
  isResolving,
  onResolve,
  severityColor,
  severityBg
}: {
  conflict: PermissionConflict
  isResolving: boolean
  onResolve: (resolution: string) => void
  severityColor: Record<string, string>
  severityBg: Record<string, string>
}) {
  const getResolutions = (conflict: PermissionConflict) => {
    switch (conflict.conflictType) {
      case 'DENY_ALLOW':
        return [
          { value: 'DENY_WINS', label: 'Deny Wins (Most Secure)', icon: '🔒' },
          { value: 'ALLOW_WINS', label: 'Allow Wins (Most Permissive)', icon: '🔓' }
        ]
      case 'PRIORITY':
        return [
          { value: 'HIGHEST_PRIORITY', label: 'Use Highest Priority Role', icon: '⬆️' },
          { value: 'LOWEST_PRIORITY', label: 'Use Lowest Priority Role', icon: '⬇️' }
        ]
      case 'SCOPE':
        return [
          { value: 'EXPLICIT', label: 'Use Explicit Assignment', icon: '📌' },
          { value: 'INHERITED', label: 'Use Inherited Permission', icon: '🔗' }
        ]
      default:
        return []
    }
  }

  const recommendations = {
    HIGH: 'Apply deny-wins principle for security',
    MEDIUM: 'Review and choose most appropriate role',
    LOW: 'Either resolution is acceptable'
  }

  return (
    <Card className={severityBg[conflict.severity] + ' border-l-4 ' + ({
      HIGH: 'border-l-red-600',
      MEDIUM: 'border-l-amber-600',
      LOW: 'border-l-yellow-600'
    }[conflict.severity])}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <AlertTriangle className={`w-5 h-5 ${severityColor[conflict.severity]}`} />
              <CardTitle className="text-base">
                {conflict.userId}
              </CardTitle>
              <Badge className={severityColor[conflict.severity]}>
                {conflict.severity}
              </Badge>
            </div>
            <CardDescription className="mt-1">
              Resource: <code className="bg-white px-1 rounded">{conflict.resource}</code>
              {' '} • Type: <code className="bg-white px-1 rounded">{conflict.conflictType}</code>
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Conflict Details */}
        <div className="bg-white p-3 rounded space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium">{conflict.roleA}</span>
            <GitCompare className="w-4 h-4 text-muted-foreground" />
            <span className="font-medium">{conflict.roleB}</span>
          </div>
          <p className="text-xs text-muted-foreground">
            {getConflictDescription(conflict)}
          </p>
        </div>

        {/* Recommendation */}
        <Alert className="bg-blue-100 border-blue-200">
          <AlertDescription className="text-sm text-blue-800">
            💡 <strong>Recommendation:</strong> {recommendations[conflict.severity]}
          </AlertDescription>
        </Alert>

        {/* Resolution Options */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {getResolutions(conflict).map(option => (
            <Button
              key={option.value}
              variant="outline"
              onClick={() => onResolve(option.value)}
              disabled={isResolving}
              className="justify-start text-left h-auto py-3"
            >
              <div className="text-xl mr-3">{option.icon}</div>
              <div className="text-left">
                <p className="font-medium text-sm">{option.label}</p>
              </div>
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

/**
 * Metric Box Component
 */
function MetricBox({
  label,
  value,
  icon
}: {
  label: string
  value: number
  icon: string
}) {
  return (
    <div className="border rounded p-4 text-center">
      <div className="text-3xl mb-2">{icon}</div>
      <div className="text-2xl font-bold">{value}</div>
      <div className="text-xs text-muted-foreground mt-1">{label}</div>
    </div>
  )
}

/**
 * Get conflict description
 */
function getConflictDescription(conflict: PermissionConflict): string {
  switch (conflict.conflictType) {
    case 'DENY_ALLOW':
      return `Role '${conflict.roleA}' denies access but '${conflict.roleB}' allows it`
    case 'PRIORITY':
      return `Both roles grant access but have different priority levels`
    case 'SCOPE':
      return `Explicit permission in '${conflict.roleA}' conflicts with inherited in '${conflict.roleB}'`
    default:
      return 'Unknown conflict type'
  }
}

/**
 * Get default resolution based on conflict
 */
function getDefaultResolution(conflict: PermissionConflict): string {
  // High severity: deny wins (most secure)
  if (conflict.severity === 'HIGH') return 'DENY_WINS'
  // Medium: use explicit
  if (conflict.severity === 'MEDIUM') return 'EXPLICIT'
  // Low: allow wins (most permissive)
  return 'ALLOW_WINS'
}

// Default conflicts for demo
const DEFAULT_CONFLICTS: PermissionConflict[] = [
  {
    id: '1',
    userId: 'user@company.com',
    resource: 'financial_reports',
    roleA: 'FINANCE_ANALYST',
    roleB: 'RESTRICTED_USER',
    conflictType: 'DENY_ALLOW',
    severity: 'HIGH'
  },
  {
    id: '2',
    userId: 'manager@company.com',
    resource: 'employee_data',
    roleA: 'MANAGER',
    roleB: 'HR_ADMIN',
    conflictType: 'PRIORITY',
    severity: 'MEDIUM'
  },
  {
    id: '3',
    userId: 'contractor@company.com',
    resource: 'project_files',
    roleA: 'CONTRACTOR',
    roleB: 'TEAM_MEMBER',
    conflictType: 'SCOPE',
    severity: 'LOW'
  }
]
