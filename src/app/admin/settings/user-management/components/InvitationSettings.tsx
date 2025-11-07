'use client'

import React, { useState, useCallback } from 'react'
import { InvitationConfig, UserRole } from '../types'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Mail, Plus, Trash2, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'

interface InvitationSettingsProps {
  config: InvitationConfig | null
  isLoading: boolean
  isSaving: boolean
  onUpdate: (config: InvitationConfig) => Promise<void>
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

export function InvitationSettings({
  config,
  isLoading,
  isSaving,
  onUpdate
}: InvitationSettingsProps) {
  const [isDomainDialogOpen, setIsDomainDialogOpen] = useState(false)
  const [domainToDelete, setDomainToDelete] = useState<number | null>(null)
  const [newDomain, setNewDomain] = useState({
    emailDomain: '',
    assignRole: 'TEAM_MEMBER' as UserRole,
    assignDepartment: '',
    assignManager: null as string | null
  })

  const handleUpdateInvitation = useCallback(
    async (field: string, value: unknown) => {
      if (!config) return

      try {
        await onUpdate({
          ...config,
          invitations: {
            ...config.invitations,
            [field]: value
          }
        })
        toast.success('Invitation setting updated')
      } catch (error) {
        toast.error('Failed to update setting')
      }
    },
    [config, onUpdate]
  )

  const handleToggleSignup = useCallback(
    async (enabled: boolean) => {
      if (!config) return

      try {
        await onUpdate({
          ...config,
          signUp: {
            ...config.signUp,
            enabled
          }
        })
        toast.success('Sign-up ' + (enabled ? 'enabled' : 'disabled'))
      } catch (error) {
        toast.error('Failed to update setting')
      }
    },
    [config, onUpdate]
  )

  const handleAddDomainRule = useCallback(async () => {
    if (!newDomain.emailDomain.trim()) {
      toast.error('Email domain is required')
      return
    }

    if (!config) return

    try {
      await onUpdate({
        ...config,
        domainAutoAssign: {
          ...config.domainAutoAssign,
          rules: [
            ...config.domainAutoAssign.rules,
            newDomain
          ]
        }
      })
      setNewDomain({
        emailDomain: '',
        assignRole: 'TEAM_MEMBER',
        assignDepartment: '',
        assignManager: null
      })
      setIsDomainDialogOpen(false)
      toast.success('Domain rule added')
    } catch (error) {
      toast.error('Failed to add domain rule')
    }
  }, [config, newDomain, onUpdate])

  const handleDeleteDomainRule = useCallback(
    async (index: number) => {
      if (!config) return

      try {
        const updatedRules = config.domainAutoAssign.rules.filter((_, i) => i !== index)
        await onUpdate({
          ...config,
          domainAutoAssign: {
            ...config.domainAutoAssign,
            rules: updatedRules
          }
        })
        setDomainToDelete(null)
        toast.success('Domain rule deleted')
      } catch (error) {
        toast.error('Failed to delete rule')
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

  return (
    <div className="space-y-6">
      {/* Invitation Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Invitation Settings
          </CardTitle>
          <CardDescription>
            Configure how users are invited to join your organization
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="default-invite-role">Default Role on Invitation</Label>
              <Select
                value={config.invitations.defaultRole}
                onValueChange={(value) => handleUpdateInvitation('defaultRole', value)}
                disabled={isSaving}
              >
                <SelectTrigger id="default-invite-role">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ROLES.map((role) => (
                    <SelectItem key={role} value={role}>
                      {ROLE_LABELS[role]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="invite-expiry">Invitation Expiry (Days)</Label>
              <Input
                id="invite-expiry"
                type="number"
                value={config.invitations.expiryDays}
                onChange={(e) => handleUpdateInvitation('expiryDays', parseInt(e.target.value))}
                disabled={isSaving}
                min={1}
              />
            </div>

            <div>
              <Label htmlFor="resend-limit">Resend Limit</Label>
              <Input
                id="resend-limit"
                type="number"
                value={config.invitations.resendLimit}
                onChange={(e) => handleUpdateInvitation('resendLimit', parseInt(e.target.value))}
                disabled={isSaving}
                min={1}
              />
            </div>
          </div>

          <div className="space-y-3 border-t pt-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 border rounded">
              <Label htmlFor="require-email">Require Email</Label>
              <Switch
                id="require-email"
                checked={config.invitations.requireEmail}
                onCheckedChange={(value) => handleUpdateInvitation('requireEmail', value)}
                disabled={isSaving}
              />
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 border rounded">
              <Label htmlFor="allow-multiple">Allow Multiple Invites for Same Email</Label>
              <Switch
                id="allow-multiple"
                checked={config.invitations.allowMultipleInvites}
                onCheckedChange={(value) => handleUpdateInvitation('allowMultipleInvites', value)}
                disabled={isSaving}
              />
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 border rounded">
              <Label htmlFor="notify-email">Send Notification Email</Label>
              <Switch
                id="notify-email"
                checked={config.invitations.notificationEmail}
                onCheckedChange={(value) => handleUpdateInvitation('notificationEmail', value)}
                disabled={isSaving}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Sign Up Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Public Sign-Up</CardTitle>
          <CardDescription>
            Configure self-service registration for your platform
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 border rounded">
            <Label htmlFor="enable-signup">Enable Public Sign-Up</Label>
            <Switch
              id="enable-signup"
              checked={config.signUp.enabled}
              onCheckedChange={handleToggleSignup}
              disabled={isSaving}
            />
          </div>

          {config.signUp.enabled && (
            <div className="space-y-4 border-t pt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="signup-default-role">Default Role for Sign-Ups</Label>
                  <Select
                    value={config.signUp.defaultRole}
                    onValueChange={(value) => {
                      if (!config) return
                      onUpdate({
                        ...config,
                        signUp: {
                          ...config.signUp,
                          defaultRole: value as UserRole
                        }
                      })
                    }}
                    disabled={isSaving}
                  >
                    <SelectTrigger id="signup-default-role">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ROLES.map((role) => (
                        <SelectItem key={role} value={role}>
                          {ROLE_LABELS[role]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 border rounded">
                <Label htmlFor="require-approval">Require Admin Approval</Label>
                <Switch
                  id="require-approval"
                  checked={config.signUp.requireApproval}
                  onCheckedChange={(value) => {
                    if (!config) return
                    onUpdate({
                      ...config,
                      signUp: {
                        ...config.signUp,
                        requireApproval: value
                      }
                    })
                  }}
                  disabled={isSaving}
                />
              </div>

              <div className="bg-blue-50 border border-blue-200 p-3 rounded">
                <p className="text-sm text-blue-900">
                  <strong>Required Fields:</strong> Email is always required. Configure additional fields below.
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Domain-Based Auto-Assignment */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <CardTitle>Domain-Based Auto-Assignment</CardTitle>
              <CardDescription>
                Automatically assign roles based on email domain
              </CardDescription>
            </div>
            <Switch
              checked={config.domainAutoAssign.enabled}
              onCheckedChange={(value) => {
                if (!config) return
                onUpdate({
                  ...config,
                  domainAutoAssign: {
                    ...config.domainAutoAssign,
                    enabled: value
                  }
                })
              }}
              disabled={isSaving}
            />
          </div>
        </CardHeader>

        {config.domainAutoAssign.enabled && (
          <CardContent className="space-y-4">
            {config.domainAutoAssign.rules.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <AlertCircle className="h-12 w-12 mx-auto mb-2 opacity-30" />
                <p>No domain rules configured yet</p>
              </div>
            ) : (
              <div className="space-y-2">
                {config.domainAutoAssign.rules.map((rule, idx) => (
                  <div key={idx} className="p-3 border rounded flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                    <div className="flex-1">
                      <p className="font-semibold text-sm">@{rule.emailDomain}</p>
                      <p className="text-sm text-gray-600">
                        Role: {ROLE_LABELS[rule.assignRole]}
                        {rule.assignDepartment && ` • Dept: ${rule.assignDepartment}`}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setDomainToDelete(idx)}
                      disabled={isSaving}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}

            <Button
              onClick={() => setIsDomainDialogOpen(true)}
              disabled={isSaving}
              variant="outline"
              size="sm"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Domain Rule
            </Button>
          </CardContent>
        )}
      </Card>

      {/* Email Domain Dialog */}
      <Dialog open={isDomainDialogOpen} onOpenChange={setIsDomainDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Domain Auto-Assignment Rule</DialogTitle>
            <DialogDescription>
              Configure automatic role assignment for a specific email domain
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="domain">Email Domain</Label>
              <div className="flex items-center">
                <span className="text-gray-600 mr-2">@</span>
                <Input
                  id="domain"
                  placeholder="example.com"
                  value={newDomain.emailDomain}
                  onChange={(e) =>
                    setNewDomain({ ...newDomain, emailDomain: e.target.value })
                  }
                />
              </div>
            </div>

            <div>
              <Label htmlFor="rule-role">Assign Role</Label>
              <Select
                value={newDomain.assignRole}
                onValueChange={(value) =>
                  setNewDomain({ ...newDomain, assignRole: value as UserRole })
                }
              >
                <SelectTrigger id="rule-role">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ROLES.map((role) => (
                    <SelectItem key={role} value={role}>
                      {ROLE_LABELS[role]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="rule-dept">Department (Optional)</Label>
              <Input
                id="rule-dept"
                placeholder="e.g., Accounting"
                value={newDomain.assignDepartment}
                onChange={(e) =>
                  setNewDomain({ ...newDomain, assignDepartment: e.target.value })
                }
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDomainDialogOpen(false)}
              disabled={isSaving}
            >
              Cancel
            </Button>
            <Button onClick={handleAddDomainRule} disabled={isSaving}>
              Add Rule
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
