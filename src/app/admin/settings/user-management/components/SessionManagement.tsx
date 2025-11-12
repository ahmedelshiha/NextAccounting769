'use client'

import React, { useState, useCallback } from 'react'
import { SessionConfig, UserRole } from '../types'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Clock, Shield, Smartphone } from 'lucide-react'
import { toast } from 'sonner'

interface SessionManagementProps {
  config: SessionConfig | null
  isLoading: boolean
  isSaving: boolean
  onUpdate: (config: SessionConfig) => Promise<void>
}

const ROLE_LABELS: Record<UserRole, string> = {
  SUPER_ADMIN: 'Super Admin',
  ADMIN: 'Admin',
  TEAM_LEAD: 'Team Lead',
  TEAM_MEMBER: 'Team Member',
  STAFF: 'Staff',
  CLIENT: 'Client'
}

const ROLES: UserRole[] = ['SUPER_ADMIN', 'ADMIN', 'TEAM_LEAD', 'TEAM_MEMBER', 'STAFF', 'CLIENT']

type SecurityBoolKey = 'requireSSL' | 'httpOnlyTokens' | 'resetTokensOnPasswordChange' | 'invalidateOnPermissionChange' | 'regenerateSessionIdOnLogin'

export function SessionManagement({
  config,
  isLoading,
  isSaving,
  onUpdate
}: SessionManagementProps) {
  const [selectedRole, setSelectedRole] = useState<UserRole>('SUPER_ADMIN')

  const handleUpdateTimeout = useCallback(
    async (role: UserRole, field: string, value: number) => {
      if (!config) return

      try {
        await onUpdate({
          ...config,
          sessionTimeout: {
            ...config.sessionTimeout,
            byRole: {
              ...config.sessionTimeout.byRole,
              [role]: {
                ...config.sessionTimeout.byRole[role],
                [field]: value
              }
            }
          }
        })
        toast.success('Session timeout updated')
      } catch (error) {
        toast.error('Failed to update setting')
      }
    },
    [config, onUpdate]
  )

  const handleUpdateConcurrentSessions = useCallback(
    async (role: UserRole, value: number) => {
      if (!config) return

      try {
        await onUpdate({
          ...config,
          concurrentSessions: {
            ...config.concurrentSessions,
            byRole: {
              ...config.concurrentSessions.byRole,
              [role]: value
            }
          }
        })
        toast.success('Concurrent session limit updated')
      } catch (error) {
        toast.error('Failed to update setting')
      }
    },
    [config, onUpdate]
  )

  const handleToggleSecurity = useCallback(
    async (field: SecurityBoolKey, value: boolean) => {
      if (!config) return

      try {
        await onUpdate({
          ...config,
          security: {
            ...config.security,
            [field]: value
          }
        })
        toast.success('Security setting updated')
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

  const currentTimeout = config.sessionTimeout.byRole[selectedRole]
  const currentConcurrent = config.concurrentSessions.byRole[selectedRole]

  return (
    <div className="space-y-6">
      {/* Session Timeouts */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Session Timeouts
          </CardTitle>
          <CardDescription>
            Configure session duration and inactivity timeouts per role
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Role Selector */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {ROLES.map((role) => (
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

          {/* Timeout Settings for Selected Role */}
          <div className="space-y-4 border-t pt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="absolute-max">Absolute Max Duration (Minutes)</Label>
                <Input
                  id="absolute-max"
                  type="number"
                  value={currentTimeout.absoluteMaxMinutes}
                  onChange={(e) =>
                    handleUpdateTimeout(selectedRole, 'absoluteMaxMinutes', parseInt(e.target.value))
                  }
                  disabled={isSaving}
                  min={30}
                />
              </div>

              <div>
                <Label htmlFor="inactivity">Inactivity Timeout (Minutes)</Label>
                <Input
                  id="inactivity"
                  type="number"
                  value={currentTimeout.inactivityMinutes}
                  onChange={(e) =>
                    handleUpdateTimeout(selectedRole, 'inactivityMinutes', parseInt(e.target.value))
                  }
                  disabled={isSaving}
                  min={1}
                />
              </div>

              <div>
                <Label htmlFor="warning">Warning Before Logout (Minutes)</Label>
                <Input
                  id="warning"
                  type="number"
                  value={currentTimeout.warningBeforeLogoutMinutes}
                  onChange={(e) =>
                    handleUpdateTimeout(selectedRole, 'warningBeforeLogoutMinutes', parseInt(e.target.value))
                  }
                  disabled={isSaving}
                  min={1}
                />
              </div>

              <div>
                <Label htmlFor="max-extensions">Max Extensions</Label>
                <Input
                  id="max-extensions"
                  type="number"
                  value={currentTimeout.maxExtensions}
                  onChange={(e) =>
                    handleUpdateTimeout(selectedRole, 'maxExtensions', parseInt(e.target.value))
                  }
                  disabled={isSaving}
                  min={0}
                />
              </div>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 border rounded">
              <Label htmlFor="allow-extend">Allow Session Extension</Label>
              <Switch
                id="allow-extend"
                checked={currentTimeout.allowExtend}
                onCheckedChange={(value) => {
                  if (!config) return
                  onUpdate({
                    ...config,
                    sessionTimeout: {
                      ...config.sessionTimeout,
                      byRole: {
                        ...config.sessionTimeout.byRole,
                        [selectedRole]: {
                          ...currentTimeout,
                          allowExtend: value
                        }
                      }
                    }
                  })
                }}
                disabled={isSaving}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Concurrent Sessions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Smartphone className="h-5 w-5" />
            Concurrent Sessions
          </CardTitle>
          <CardDescription>
            Control how many active sessions each role can have
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            {ROLES.map((role) => (
              <div key={role} className="flex flex-wrap items-center gap-3 p-2 border rounded">
                <span className="text-sm font-medium flex-1">{ROLE_LABELS[role]}</span>
                <Input
                  type="number"
                  value={config.concurrentSessions.byRole[role]}
                  onChange={(e) =>
                    handleUpdateConcurrentSessions(role, parseInt(e.target.value))
                  }
                  disabled={isSaving}
                  min={1}
                  className="w-full sm:w-24"
                />
                <span className="text-xs text-gray-500 w-16">sessions</span>
              </div>
            ))}
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 border rounded">
            <Label htmlFor="multi-device">Allow Multiple Devices</Label>
            <Switch
              id="multi-device"
              checked={config.concurrentSessions.allowMultipleDevices}
              onCheckedChange={(value) => {
                if (!config) return
                onUpdate({
                  ...config,
                  concurrentSessions: {
                    ...config.concurrentSessions,
                    allowMultipleDevices: value
                  }
                })
              }}
              disabled={isSaving}
            />
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 border rounded">
            <Label htmlFor="kick-oldest">Kick Oldest Session When Limit Reached</Label>
            <Switch
              id="kick-oldest"
              checked={config.concurrentSessions.kickOldestSession}
              onCheckedChange={(value) => {
                if (!config) return
                onUpdate({
                  ...config,
                  concurrentSessions: {
                    ...config.concurrentSessions,
                    kickOldestSession: value
                  }
                })
              }}
              disabled={isSaving}
            />
          </div>
        </CardContent>
      </Card>

      {/* Security Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Security
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">

          <div>
            <Label htmlFor="same-site">SameSite Cookie Policy</Label>
            <Select
              value={config.security.sameSiteCookies}
              onValueChange={(value) => {
                if (!config) return
                onUpdate({
                  ...config,
                  security: {
                    ...config.security,
                    sameSiteCookies: value as 'Strict' | 'Lax' | 'None'
                  }
                })
              }}
              disabled={isSaving}
            >
              <SelectTrigger id="same-site">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Strict">Strict (Most Secure)</SelectItem>
                <SelectItem value="Lax">Lax (Balanced)</SelectItem>
                <SelectItem value="None">None (Allow Cross-Site)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Device Management */}
      <Card>
        <CardHeader>
          <CardTitle>Device Tracking</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {[
            { label: 'Require Device ID', key: 'requireDeviceId' },
            { label: 'Track User Agent', key: 'trackUserAgent' },
            { label: 'Warn on Browser Change', key: 'warnOnBrowserChange' },
            { label: 'Warn on IP Change', key: 'warnOnIPChange' }
          ].map((item) => (
            <div key={item.key} className="flex items-center justify-between p-3 border rounded">
              <Label htmlFor={item.key}>{item.label}</Label>
              <Switch
                id={item.key}
                checked={config.devices[item.key as keyof typeof config.devices]}
                onCheckedChange={(value) => {
                  if (!config) return
                  onUpdate({
                    ...config,
                    devices: {
                      ...config.devices,
                      [item.key]: value
                    }
                  })
                }}
                disabled={isSaving}
              />
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}
