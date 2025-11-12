'use client'

import React, { useState, useCallback } from 'react'
import { RateLimitConfig, UserRole } from '../types'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Zap, TrendingUp } from 'lucide-react'
import { toast } from 'sonner'

interface RateLimitingProps {
  config: RateLimitConfig | null
  isLoading: boolean
  isSaving: boolean
  onUpdate: (config: RateLimitConfig) => Promise<void>
}

const ROLE_ORDER: UserRole[] = ['SUPER_ADMIN', 'ADMIN', 'TEAM_LEAD', 'TEAM_MEMBER', 'STAFF', 'CLIENT']

const ROLE_LABELS: Record<UserRole, string> = {
  SUPER_ADMIN: 'Super Admin',
  ADMIN: 'Admin',
  TEAM_LEAD: 'Team Lead',
  TEAM_MEMBER: 'Team Member',
  STAFF: 'Staff',
  CLIENT: 'Client'
}

export function RateLimiting({
  config,
  isLoading,
  isSaving,
  onUpdate
}: RateLimitingProps) {
  const [selectedRole, setSelectedRole] = useState<UserRole>('SUPER_ADMIN')

  const handleUpdateLimit = useCallback(
    async (role: UserRole, field: string, value: number) => {
      if (!config) return

      try {
        await onUpdate({
          ...config,
          roles: {
            ...config.roles,
            [role]: {
              ...config.roles[role],
              [field]: value
            }
          }
        })
        toast.success(`${ROLE_LABELS[role]} limit updated`)
      } catch (error) {
        toast.error('Failed to update limit')
      }
    },
    [config, onUpdate]
  )

  const handleToggleThrottling = useCallback(
    async (enabled: boolean) => {
      if (!config) return

      try {
        await onUpdate({
          ...config,
          throttling: {
            ...config.throttling,
            enableAdaptiveThrottling: enabled
          }
        })
        toast.success('Throttling ' + (enabled ? 'enabled' : 'disabled'))
      } catch (error) {
        toast.error('Failed to update setting')
      }
    },
    [config, onUpdate]
  )

  if (isLoading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-4 animate-pulse">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-20 bg-gray-200 rounded" />
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!config) return null

  const currentRoleLimits = config.roles[selectedRole]

  return (
    <div className="space-y-6">
      {/* Role Selector */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            API Rate Limits by Role
          </CardTitle>
          <CardDescription>
            Configure rate limiting and resource quotas for each user role
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {ROLE_ORDER.map((role) => (
              <button
                key={role}
                onClick={() => setSelectedRole(role)}
                className={`p-2 rounded-lg border transition-colors ${
                  selectedRole === role
                    ? 'bg-blue-50 border-blue-300 text-blue-900'
                    : 'bg-white border-gray-300 hover:border-gray-400'
                }`}
              >
                <div className="text-sm font-semibold">{ROLE_LABELS[role]}</div>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Limits for Selected Role */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">
            {ROLE_LABELS[selectedRole]} Limits
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="api-min">API Calls Per Minute</Label>
              <Input
                id="api-min"
                type="number"
                value={currentRoleLimits.apiCallsPerMinute}
                onChange={(e) => handleUpdateLimit(selectedRole, 'apiCallsPerMinute', parseInt(e.target.value))}
                disabled={isSaving}
                min={1}
              />
            </div>

            <div>
              <Label htmlFor="api-day">API Calls Per Day</Label>
              <Input
                id="api-day"
                type="number"
                value={currentRoleLimits.apiCallsPerDay}
                onChange={(e) => handleUpdateLimit(selectedRole, 'apiCallsPerDay', parseInt(e.target.value))}
                disabled={isSaving}
                min={1}
              />
            </div>

            <div>
              <Label htmlFor="bulk-limit">Bulk Operation Limit (Rows)</Label>
              <Input
                id="bulk-limit"
                type="number"
                value={currentRoleLimits.bulkOperationLimit}
                onChange={(e) => handleUpdateLimit(selectedRole, 'bulkOperationLimit', parseInt(e.target.value))}
                disabled={isSaving}
                min={1}
              />
            </div>

            <div>
              <Label htmlFor="reports-day">Reports Per Day</Label>
              <Input
                id="reports-day"
                type="number"
                value={currentRoleLimits.reportGenerationPerDay}
                onChange={(e) => handleUpdateLimit(selectedRole, 'reportGenerationPerDay', parseInt(e.target.value))}
                disabled={isSaving}
                min={1}
              />
            </div>

            <div>
              <Label htmlFor="export-size">Export Size Limit (GB)</Label>
              <Input
                id="export-size"
                type="number"
                value={currentRoleLimits.exportSizeGB}
                onChange={(e) => handleUpdateLimit(selectedRole, 'exportSizeGB', parseFloat(e.target.value))}
                disabled={isSaving}
                min={0.1}
                step={0.1}
              />
            </div>

            <div>
              <Label htmlFor="sessions">Concurrent Sessions</Label>
              <Input
                id="sessions"
                type="number"
                value={currentRoleLimits.concurrentSessions}
                onChange={(e) => handleUpdateLimit(selectedRole, 'concurrentSessions', parseInt(e.target.value))}
                disabled={isSaving}
                min={1}
              />
            </div>

            <div className="md:col-span-2">
              <Label htmlFor="upload-size">File Upload Size (MB)</Label>
              <Input
                id="upload-size"
                type="number"
                value={currentRoleLimits.fileUploadSizeMB}
                onChange={(e) => handleUpdateLimit(selectedRole, 'fileUploadSizeMB', parseInt(e.target.value))}
                disabled={isSaving}
                min={1}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Global Limits */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Global Limits
          </CardTitle>
          <CardDescription>
            Organization-wide rate limiting
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="global-api-min">API Calls Per Minute</Label>
              <Input
                id="global-api-min"
                type="number"
                value={config.global.tenantApiCallsPerMinute}
                onChange={(e) => {
                  if (!config) return
                  onUpdate({
                    ...config,
                    global: {
                      ...config.global,
                      tenantApiCallsPerMinute: parseInt(e.target.value)
                    }
                  })
                }}
                disabled={isSaving}
                min={1}
              />
            </div>

            <div>
              <Label htmlFor="global-api-day">API Calls Per Day</Label>
              <Input
                id="global-api-day"
                type="number"
                value={config.global.tenantApiCallsPerDay}
                onChange={(e) => {
                  if (!config) return
                  onUpdate({
                    ...config,
                    global: {
                      ...config.global,
                      tenantApiCallsPerDay: parseInt(e.target.value)
                    }
                  })
                }}
                disabled={isSaving}
                min={1}
              />
            </div>

            <div>
              <Label htmlFor="global-users">Concurrent Users</Label>
              <Input
                id="global-users"
                type="number"
                value={config.global.tenantConcurrentUsers}
                onChange={(e) => {
                  if (!config) return
                  onUpdate({
                    ...config,
                    global: {
                      ...config.global,
                      tenantConcurrentUsers: parseInt(e.target.value)
                    }
                  })
                }}
                disabled={isSaving}
                min={1}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Throttling Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Adaptive Throttling</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 border rounded">
            <Label htmlFor="adaptive-throttling">Enable Adaptive Throttling During Peak Load</Label>
            <Switch
              id="adaptive-throttling"
              checked={config.throttling.enableAdaptiveThrottling}
              onCheckedChange={handleToggleThrottling}
              disabled={isSaving}
            />
          </div>
          <p className="text-sm text-gray-600">
            When enabled, the system will automatically reduce feature complexity during high-load periods to maintain performance
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
