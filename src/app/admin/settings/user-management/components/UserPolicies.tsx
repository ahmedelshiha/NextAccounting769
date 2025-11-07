'use client'

import React, { useState, useCallback } from 'react'
import { UserPolicies as UserPoliciesType } from '../types'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { AlertCircle, Archive, Lock, Eye } from 'lucide-react'
import { toast } from 'sonner'

interface UserPoliciesProps {
  policies: UserPoliciesType | null
  isLoading: boolean
  isSaving: boolean
  onUpdate: (policies: UserPoliciesType) => Promise<void>
}

type ActivityMonitoringBoolKey = 'trackLoginAttempts' | 'trackDataAccess' | 'trackPermissionChanges' | 'trackBulkActions' | 'alertOnSuspiciousActivity'

export function UserPolicies({
  policies,
  isLoading,
  isSaving,
  onUpdate
}: UserPoliciesProps) {
  const [expandedSection, setExpandedSection] = useState<string | null>('dataRetention')

  const handleUpdateNumber = useCallback(
    async (path: string, value: number) => {
      if (!policies) return

      try {
        const [section, field] = path.split('.')
        await onUpdate({
          ...policies,
          [section]: {
            ...policies[section as keyof UserPoliciesType],
            [field]: value
          }
        })
        toast.success('Policy updated')
      } catch (error) {
        toast.error('Failed to update policy')
      }
    },
    [policies, onUpdate]
  )

  const handleToggleBoolean = useCallback(
    async (path: string, value: boolean) => {
      if (!policies) return

      try {
        const [section, field] = path.split('.')
        await onUpdate({
          ...policies,
          [section]: {
            ...policies[section as keyof UserPoliciesType],
            [field]: value
          }
        })
        toast.success('Policy updated')
      } catch (error) {
        toast.error('Failed to update policy')
      }
    },
    [policies, onUpdate]
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

  if (!policies) return null

  return (
    <div className="space-y-6">
      {/* Data Retention */}
      <Card>
        <CardHeader
          className="cursor-pointer hover:bg-gray-50"
          onClick={() => setExpandedSection(expandedSection === 'dataRetention' ? null : 'dataRetention')}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Archive className="h-5 w-5" />
              <div>
                <CardTitle>Data Retention & Archival</CardTitle>
                <CardDescription>
                  Configure user lifecycle and data archival policies
                </CardDescription>
              </div>
            </div>
            <span className="text-xl">{expandedSection === 'dataRetention' ? '−' : '+'}</span>
          </div>
        </CardHeader>

        {expandedSection === 'dataRetention' && (
          <CardContent className="space-y-4 border-t pt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="inactive-days">Mark Inactive After (Days)</Label>
                <Input
                  id="inactive-days"
                  type="number"
                  value={policies.dataRetention.inactiveUserDays}
                  onChange={(e) => handleUpdateNumber('dataRetention.inactiveUserDays', parseInt(e.target.value))}
                  disabled={isSaving}
                  min={1}
                />
              </div>

              <div>
                <Label htmlFor="archive-days">Archive Inactive After (Days)</Label>
                <Input
                  id="archive-days"
                  type="number"
                  value={policies.dataRetention.archiveInactiveAfterDays || ''}
                  onChange={(e) => handleUpdateNumber('dataRetention.archiveInactiveAfterDays', parseInt(e.target.value))}
                  disabled={isSaving}
                  placeholder="Leave empty to disable"
                />
              </div>

              <div>
                <Label htmlFor="delete-days">Delete Archived After (Days)</Label>
                <Input
                  id="delete-days"
                  type="number"
                  value={policies.dataRetention.deleteArchivedAfterDays || ''}
                  onChange={(e) => handleUpdateNumber('dataRetention.deleteArchivedAfterDays', parseInt(e.target.value))}
                  disabled={isSaving}
                  placeholder="Leave empty to disable"
                />
              </div>

              <div>
                <Label htmlFor="audit-retention">Audit Log Retention (Years)</Label>
                <Input
                  id="audit-retention"
                  type="number"
                  value={policies.dataRetention.auditLogRetentionYears}
                  onChange={(e) => handleUpdateNumber('dataRetention.auditLogRetentionYears', parseInt(e.target.value))}
                  disabled={isSaving}
                  min={1}
                />
              </div>
            </div>

            <div className="flex items-center justify-between p-3 border rounded">
              <Label htmlFor="keep-logs" className="flex-1">Keep Audit Logs</Label>
              <Switch
                id="keep-logs"
                checked={policies.dataRetention.keepAuditLogs}
                onCheckedChange={(value) => handleToggleBoolean('dataRetention.keepAuditLogs', value)}
                disabled={isSaving}
              />
            </div>
          </CardContent>
        )}
      </Card>

      {/* Activity Monitoring */}
      <Card>
        <CardHeader
          className="cursor-pointer hover:bg-gray-50"
          onClick={() => setExpandedSection(expandedSection === 'monitoring' ? null : 'monitoring')}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Eye className="h-5 w-5" />
              <div>
                <CardTitle>Activity Monitoring</CardTitle>
                <CardDescription>
                  Track and monitor user activities
                </CardDescription>
              </div>
            </div>
            <span className="text-xl">{expandedSection === 'monitoring' ? '−' : '+'}</span>
          </div>
        </CardHeader>

        {expandedSection === 'monitoring' && (
          <CardContent className="space-y-4 border-t pt-4">
            <div className="space-y-3">

            </div>

            <div>
              <Label htmlFor="retention-days">Retention Days</Label>
              <Input
                id="retention-days"
                type="number"
                value={policies.activityMonitoring.retentionDays}
                onChange={(e) => handleUpdateNumber('activityMonitoring.retentionDays', parseInt(e.target.value))}
                disabled={isSaving}
                min={1}
              />
            </div>
          </CardContent>
        )}
      </Card>

      {/* Access Control */}
      <Card>
        <CardHeader
          className="cursor-pointer hover:bg-gray-50"
          onClick={() => setExpandedSection(expandedSection === 'access' ? null : 'access')}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Lock className="h-5 w-5" />
              <div>
                <CardTitle>Access Control</CardTitle>
                <CardDescription>
                  Configure authentication and access restrictions
                </CardDescription>
              </div>
            </div>
            <span className="text-xl">{expandedSection === 'access' ? '−' : '+'}</span>
          </div>
        </CardHeader>

        {expandedSection === 'access' && (
          <CardContent className="space-y-4 border-t pt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="min-pwd-age">Min Password Age (Days)</Label>
                <Input
                  id="min-pwd-age"
                  type="number"
                  value={policies.accessControl.minPasswordAgeDays}
                  onChange={(e) => handleUpdateNumber('accessControl.minPasswordAgeDays', parseInt(e.target.value))}
                  disabled={isSaving}
                  min={0}
                />
              </div>

              <div>
                <Label htmlFor="max-pwd-age">Max Password Age (Days)</Label>
                <Input
                  id="max-pwd-age"
                  type="number"
                  value={policies.accessControl.maxPasswordAgeDays}
                  onChange={(e) => handleUpdateNumber('accessControl.maxPasswordAgeDays', parseInt(e.target.value))}
                  disabled={isSaving}
                  min={1}
                />
              </div>

              <div>
                <Label htmlFor="lockout-attempts">Lockout After Failed Attempts</Label>
                <Input
                  id="lockout-attempts"
                  type="number"
                  value={policies.accessControl.lockoutAfterFailedAttempts}
                  onChange={(e) => handleUpdateNumber('accessControl.lockoutAfterFailedAttempts', parseInt(e.target.value))}
                  disabled={isSaving}
                  min={1}
                />
              </div>

              <div>
                <Label htmlFor="lockout-duration">Lockout Duration (Minutes)</Label>
                <Input
                  id="lockout-duration"
                  type="number"
                  value={policies.accessControl.lockoutDurationMinutes}
                  onChange={(e) => handleUpdateNumber('accessControl.lockoutDurationMinutes', parseInt(e.target.value))}
                  disabled={isSaving}
                  min={1}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="prevent-reuse">Prevent Password Reuse (Last N Passwords)</Label>
              <Input
                id="prevent-reuse"
                type="number"
                value={policies.accessControl.preventPreviousPasswords}
                onChange={(e) => handleUpdateNumber('accessControl.preventPreviousPasswords', parseInt(e.target.value))}
                disabled={isSaving}
                min={0}
              />
            </div>
          </CardContent>
        )}
      </Card>

      {/* Info Box */}
      <Card className="border-blue-200 bg-blue-50">
        <CardHeader>
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
            <div>
              <CardTitle className="text-base text-blue-900">Policy Impact</CardTitle>
              <p className="text-sm text-blue-800 mt-2">
                Changes to these policies affect all users immediately. Consider testing policies with a small group before rolling out organization-wide changes.
              </p>
            </div>
          </div>
        </CardHeader>
      </Card>
    </div>
  )
}
