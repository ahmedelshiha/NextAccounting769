'use client'

import React, { useState, useCallback } from 'react'
import { RoleConfig, CustomRole, UserRole } from '../types'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import { Plus, Trash2, Edit2, Users, Shield, Copy } from 'lucide-react'
import { toast } from 'sonner'

interface RoleManagementProps {
  roleConfig: RoleConfig | null
  isLoading: boolean
  isSaving: boolean
  onUpdate: (updates: Partial<RoleConfig>) => Promise<void>
}

export function RoleManagement({
  roleConfig,
  isLoading,
  isSaving,
  onUpdate
}: RoleManagementProps) {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [editingRole, setEditingRole] = useState<CustomRole | null>(null)
  const [roleToDelete, setRoleToDelete] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    baseRole: 'TEAM_MEMBER' as UserRole
  })

  const systemRoles = roleConfig?.systemRoles ? Object.values(roleConfig.systemRoles) : []
  const customRoles = roleConfig?.customRoles || []

  const handleCreateRole = useCallback(async () => {
    if (!formData.name.trim()) {
      toast.error('Role name is required')
      return
    }

    const newRole: CustomRole = {
      id: `custom_${Date.now()}`,
      name: formData.name,
      description: formData.description,
      baseRole: formData.baseRole,
      customPermissions: [],
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      usageCount: 0
    }

    try {
      await onUpdate({
        ...roleConfig,
        customRoles: [...customRoles, newRole]
      })
      setFormData({ name: '', description: '', baseRole: 'TEAM_MEMBER' })
      setIsCreateDialogOpen(false)
      toast.success('Role created successfully')
    } catch (error) {
      toast.error('Failed to create role')
    }
  }, [formData, roleConfig, customRoles, onUpdate])

  const handleDeleteRole = useCallback(async () => {
    if (!roleToDelete) return

    try {
      const updatedRoles = customRoles.filter(r => r.id !== roleToDelete)
      await onUpdate({
        ...roleConfig,
        customRoles: updatedRoles
      })
      setRoleToDelete(null)
      toast.success('Role deleted successfully')
    } catch (error) {
      toast.error('Failed to delete role')
    }
  }, [roleToDelete, customRoles, roleConfig, onUpdate])

  const handleUpdateSignupRole = useCallback(async (role: UserRole) => {
    try {
      await onUpdate({
        ...roleConfig,
        defaultRoleOnSignup: role
      })
      toast.success('Default signup role updated')
    } catch (error) {
      toast.error('Failed to update default role')
    }
  }, [roleConfig, onUpdate])

  const handleUpdateInviteRole = useCallback(async (role: UserRole) => {
    try {
      await onUpdate({
        ...roleConfig,
        defaultRoleOnInvite: role
      })
      toast.success('Default invite role updated')
    } catch (error) {
      toast.error('Failed to update default role')
    }
  }, [roleConfig, onUpdate])

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

  return (
    <div className="space-y-6">
      {/* System Roles */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            System Roles
          </CardTitle>
          <CardDescription>
            Built-in roles that cannot be modified or deleted
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {systemRoles.map((role) => (
              <div key={role.name} className="p-4 border rounded-lg flex items-start justify-between hover:bg-gray-50">
                <div className="flex-1">
                  <div className="font-semibold text-sm flex items-center gap-2">
                    {role.displayName}
                    {role.maxInstances && (
                      <Badge variant="outline" className="text-xs">
                        Max: {role.maxInstances}
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 mt-1">{role.description}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-xs text-gray-500">
                      {role.permissions.length} permissions
                    </span>
                    {role.canDelegate && (
                      <Badge variant="secondary" className="text-xs">
                        Can Delegate
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Default Roles */}
      <Card>
        <CardHeader>
          <CardTitle>Default Role Assignment</CardTitle>
          <CardDescription>
            Select default roles for different signup scenarios
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="signup-role">Default Role on Sign Up</Label>
              <Select
                value={roleConfig?.defaultRoleOnSignup || 'CLIENT'}
                onValueChange={(value) => handleUpdateSignupRole(value as UserRole)}
                disabled={isSaving}
              >
                <SelectTrigger id="signup-role">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {systemRoles.map((role) => (
                    <SelectItem key={role.name} value={role.name}>
                      {role.displayName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="invite-role">Default Role on Invitation</Label>
              <Select
                value={roleConfig?.defaultRoleOnInvite || 'TEAM_MEMBER'}
                onValueChange={(value) => handleUpdateInviteRole(value as UserRole)}
                disabled={isSaving}
              >
                <SelectTrigger id="invite-role">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {systemRoles.map((role) => (
                    <SelectItem key={role.name} value={role.name}>
                      {role.displayName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Custom Roles */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Custom Roles
              </CardTitle>
              <CardDescription>
                Create custom roles based on system roles
              </CardDescription>
            </div>
            <Button
              onClick={() => setIsCreateDialogOpen(true)}
              disabled={isSaving}
              size="sm"
            >
              <Plus className="h-4 w-4 mr-2" />
              New Role
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {customRoles.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Users className="h-12 w-12 mx-auto mb-2 opacity-30" />
              <p>No custom roles yet. Create one to get started.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {customRoles.map((role) => (
                <div key={role.id} className="p-4 border rounded-lg flex items-start justify-between hover:bg-gray-50">
                  <div className="flex-1">
                    <div className="font-semibold text-sm flex items-center gap-2">
                      {role.name}
                      {!role.isActive && (
                        <Badge variant="secondary">Inactive</Badge>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 mt-1">{role.description}</p>
                    <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                      <span>Based on: {role.baseRole}</span>
                      <span>•</span>
                      <span>{role.usageCount} users</span>
                      {role.customPermissions.length > 0 && (
                        <>
                          <span>•</span>
                          <span>{role.customPermissions.length} custom permissions</span>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setEditingRole(role)}
                      disabled={isSaving}
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setRoleToDelete(role.id)}
                      disabled={isSaving || role.usageCount > 0}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Role Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Custom Role</DialogTitle>
            <DialogDescription>
              Create a new custom role based on an existing system role
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="role-name">Role Name</Label>
              <Input
                id="role-name"
                placeholder="e.g., Accountant, Finance Manager"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>

            <div>
              <Label htmlFor="role-description">Description</Label>
              <Textarea
                id="role-description"
                placeholder="What is this role responsible for?"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="base-role">Base Role</Label>
              <Select
                value={formData.baseRole}
                onValueChange={(value) =>
                  setFormData({ ...formData, baseRole: value as UserRole })
                }
              >
                <SelectTrigger id="base-role">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {systemRoles.map((role) => (
                    <SelectItem key={role.name} value={role.name}>
                      {role.displayName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsCreateDialogOpen(false)}
              disabled={isSaving}
            >
              Cancel
            </Button>
            <Button onClick={handleCreateRole} disabled={isSaving}>
              Create Role
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!roleToDelete} onOpenChange={(open) => !open && setRoleToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Role</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this custom role? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSaving}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteRole} disabled={isSaving}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
