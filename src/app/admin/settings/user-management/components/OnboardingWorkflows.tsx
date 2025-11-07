'use client'

import React, { useState, useCallback } from 'react'
import { OnboardingConfig } from '../types'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Plus, Trash2, Mail, Zap } from 'lucide-react'
import { toast } from 'sonner'

interface OnboardingWorkflowsProps {
  config: OnboardingConfig | null
  isLoading: boolean
  isSaving: boolean
  onUpdate: (config: OnboardingConfig) => Promise<void>
}

export function OnboardingWorkflows({
  config,
  isLoading,
  isSaving,
  onUpdate
}: OnboardingWorkflowsProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [formData, setFormData] = useState({
    subject: config?.welcomeEmail.subject || '',
    template: config?.welcomeEmail.templateId || ''
  })

  const handleSaveWelcomeEmail = useCallback(async () => {
    if (!config) return

    try {
      await onUpdate({
        ...config,
        welcomeEmail: {
          ...config.welcomeEmail,
          subject: formData.subject,
          templateId: formData.template
        }
      })
      setIsDialogOpen(false)
      toast.success('Welcome email settings saved')
    } catch (error) {
      toast.error('Failed to save settings')
    }
  }, [config, formData, onUpdate])

  const handleToggleWelcomeEmail = useCallback(async (enabled: boolean) => {
    if (!config) return

    try {
      await onUpdate({
        ...config,
        welcomeEmail: {
          ...config.welcomeEmail,
          enabled
        }
      })
      toast.success('Welcome email ' + (enabled ? 'enabled' : 'disabled'))
    } catch (error) {
      toast.error('Failed to update settings')
    }
  }, [config, onUpdate])

  const handleToggleAutoAssignment = useCallback(async (enabled: boolean) => {
    if (!config) return

    try {
      await onUpdate({
        ...config,
        autoAssignment: {
          ...config.autoAssignment,
          enabled
        }
      })
      toast.success('Auto-assignment ' + (enabled ? 'enabled' : 'disabled'))
    } catch (error) {
      toast.error('Failed to update settings')
    }
  }, [config, onUpdate])

  const handleToggleChecklist = useCallback(async (enabled: boolean) => {
    if (!config) return

    try {
      await onUpdate({
        ...config,
        checklist: {
          ...config.checklist,
          enabled
        }
      })
      toast.success('Checklist ' + (enabled ? 'enabled' : 'disabled'))
    } catch (error) {
      toast.error('Failed to update settings')
    }
  }, [config, onUpdate])

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
      {/* Welcome Email */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-3">
              <Mail className="h-5 w-5" />
              <div>
                <CardTitle>Welcome Email</CardTitle>
                <CardDescription>
                  Automated welcome email sent to new users
                </CardDescription>
              </div>
            </div>
            <Switch
              checked={config.welcomeEmail.enabled}
              onCheckedChange={handleToggleWelcomeEmail}
              disabled={isSaving}
            />
          </div>
        </CardHeader>
        {config.welcomeEmail.enabled && (
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="email-subject">Email Subject</Label>
              <Input
                id="email-subject"
                value={config.welcomeEmail.subject}
                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                placeholder="Welcome to {{company_name}}!"
              />
            </div>
            <div>
              <Button
                variant="outline"
                onClick={() => setIsDialogOpen(true)}
                disabled={isSaving}
              >
                Edit Email Template
              </Button>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Auto Assignment */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-3">
              <Zap className="h-5 w-5" />
              <div>
                <CardTitle>Auto-Assignment</CardTitle>
                <CardDescription>
                  Automatically assign roles and permissions to new users
                </CardDescription>
              </div>
            </div>
            <Switch
              checked={config.autoAssignment.enabled}
              onCheckedChange={handleToggleAutoAssignment}
              disabled={isSaving}
            />
          </div>
        </CardHeader>
        {config.autoAssignment.enabled && (
          <CardContent className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 p-3 rounded text-sm text-blue-900">
              <p className="font-semibold mb-2">Auto-assignment is enabled</p>
              <ul className="list-disc list-inside space-y-1 text-sm">
                {config.autoAssignment.assignToManager && (
                  <li>Assign new users to their inviter&apos;s manager</li>
                )}
                {config.autoAssignment.departmentFromInviter && (
                  <li>Assign department from inviting user</li>
                )}
                <li>Apply permission template: {config.autoAssignment.permissionTemplate}</li>
              </ul>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Onboarding Checklist */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <CardTitle>Onboarding Checklist</CardTitle>
              <CardDescription>
                Guide new users through important setup steps
              </CardDescription>
            </div>
            <Switch
              checked={config.checklist.enabled}
              onCheckedChange={handleToggleChecklist}
              disabled={isSaving}
            />
          </div>
        </CardHeader>
        {config.checklist.enabled && (
          <CardContent className="space-y-4">
            {config.checklist.items.length > 0 ? (
              <div className="space-y-2">
                {config.checklist.items.map((item, idx) => (
                  <div key={idx} className="p-3 border rounded flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                    <div className="flex-1">
                      <p className="font-semibold text-sm">{item.title}</p>
                      {item.description && (
                        <p className="text-sm text-gray-600">{item.description}</p>
                      )}
                      <p className="text-xs text-gray-500 mt-1">
                        Due in {item.dueInDays} days
                        {item.required && (
                          <>
                            <span className="mx-1">•</span>
                            <Badge className="inline-block" variant="secondary">Required</Badge>
                          </>
                        )}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500">No checklist items configured</p>
            )}
            <Button variant="outline" size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Add Checklist Item
            </Button>
          </CardContent>
        )}
      </Card>

      {/* First Login Requirements */}
      <Card>
        <CardHeader>
          <CardTitle>First Login Requirements</CardTitle>
          <CardDescription>
            Configure what users must do on their first login
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            {[
              {
                label: 'Force password change',
                value: config.firstLogin.forcePasswordChange
              },
              {
                label: 'Require profile completion',
                value: config.firstLogin.requireProfileCompletion
              },
              {
                label: 'Show tutorial',
                value: config.firstLogin.showTutorial
              }
            ].map((item) => (
              <div key={item.label} className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-2 border rounded">
                <span className="text-sm font-medium">{item.label}</span>
                <Badge variant={item.value ? 'default' : 'secondary'}>
                  {item.value ? 'Enabled' : 'Disabled'}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Email Template Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Welcome Email Template</DialogTitle>
            <DialogDescription>
              Customize the welcome email sent to new users
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="template-subject">Subject Line</Label>
              <Input
                id="template-subject"
                value={formData.subject}
                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
              />
            </div>

            <div>
              <Label htmlFor="template-body">Email Body</Label>
              <Textarea
                id="template-body"
                rows={8}
                value="Welcome email template editor coming soon..."
                disabled
              />
              <p className="text-xs text-gray-500 mt-2">
                You can use variables like {'{company_name}'}, {'{user_name}'}, {'{login_link}'} in the template
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveWelcomeEmail} disabled={isSaving}>
              Save Template
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
