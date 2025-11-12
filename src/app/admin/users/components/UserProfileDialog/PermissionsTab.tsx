'use client'

import React, { memo, useCallback, useState, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { UserItem } from '../../contexts/UsersContextProvider'
import { useUsersContext } from '../../contexts/UsersContextProvider'
import { Shield, AlertCircle, CheckCircle2, Save, RotateCcw, Eye, EyeOff, Loader2, Search } from 'lucide-react'
import { toast } from 'sonner'
import { apiFetch } from '@/lib/api'
import type { Permission } from '@/lib/permissions'
import { PERMISSIONS, PERMISSION_METADATA, ROLE_PERMISSIONS } from '@/lib/permissions'
import { cn } from '@/lib/utils'

interface PermissionsTabProps {
  user: UserItem
}

type TabType = 'role' | 'custom' | 'history'

export const PermissionsTab = memo(function PermissionsTab({ user }: PermissionsTabProps) {
  const { setSelectedUser } = useUsersContext()
  const [activeTab, setActiveTab] = useState<TabType>('role')
  const [isSaving, setIsSaving] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [selectedRole, setSelectedRole] = useState<'ADMIN' | 'CLIENT' | 'TEAM_MEMBER' | 'TEAM_LEAD' | 'STAFF' | 'VIEWER'>(
    (user.role as 'ADMIN' | 'CLIENT' | 'TEAM_MEMBER' | 'TEAM_LEAD' | 'STAFF' | 'VIEWER') || 'CLIENT'
  )
  const [selectedPermissions, setSelectedPermissions] = useState<Permission[]>(
    (user.permissions as Permission[]) || []
  )
  const [error, setError] = useState<string | null>(null)
  const [changeHistory, setChangeHistory] = useState<Array<{ role: 'ADMIN' | 'CLIENT' | 'TEAM_MEMBER' | 'TEAM_LEAD' | 'STAFF' | 'VIEWER'; permissions: Permission[] }>>([])

  // Check if there are changes
  const changeCount = useMemo(() => {
    const added = selectedPermissions.filter(p => !(user.permissions as Permission[])?.includes(p))
    const removed = ((user.permissions as Permission[]) || []).filter(p => !selectedPermissions.includes(p))
    return added.length + removed.length
  }, [selectedPermissions, user])

  const hasChanges = useMemo(() => {
    return selectedRole !== user.role || changeCount > 0
  }, [selectedRole, user.role, changeCount])

  // Get available roles
  const availableRoles = useMemo(() => {
    return Object.keys(ROLE_PERMISSIONS || {})
  }, [])

  // Get available permissions for the selected role
  const availablePermissions = useMemo(() => {
    return Object.values(PERMISSIONS || {})
      .filter(perm => {
        if (!searchQuery) return true
        return perm.toLowerCase().includes(searchQuery.toLowerCase())
      })
  }, [searchQuery])

  const handleRoleChange = useCallback((newRole: string) => {
    setSelectedRole(newRole as 'ADMIN' | 'CLIENT' | 'TEAM_MEMBER' | 'TEAM_LEAD' | 'STAFF' | 'VIEWER')
    setError(null)
    // Add to history
    setChangeHistory(prev => [...prev, { role: selectedRole, permissions: selectedPermissions }])
    // Update permissions based on role
    if (ROLE_PERMISSIONS && ROLE_PERMISSIONS[newRole]) {
      setSelectedPermissions((ROLE_PERMISSIONS[newRole] as unknown as string[]) as Permission[])
    }
  }, [selectedRole, selectedPermissions])

  const handlePermissionToggle = useCallback(
    (permission: Permission) => {
      setSelectedPermissions(prev => {
        if (prev.includes(permission)) {
          return prev.filter(p => p !== permission)
        } else {
          return [...prev, permission]
        }
      })
      setError(null)
    },
    []
  )

  const handleReset = useCallback(() => {
    setSelectedRole(user.role || 'CLIENT')
    setSelectedPermissions((user.permissions as Permission[]) || [])
    setChangeHistory([])
    setError(null)
  }, [user])

  const handleUndo = useCallback(() => {
    if (changeHistory.length > 0) {
      const previousState = changeHistory[changeHistory.length - 1]
      setSelectedRole(previousState.role)
      setSelectedPermissions(previousState.permissions)
      setChangeHistory(prev => prev.slice(0, -1))
    }
  }, [changeHistory])

  const handleSave = useCallback(async () => {
    if (!selectedRole) {
      setError('Please select a role')
      return
    }

    setIsSaving(true)
    setError(null)

    try {
      const res = await apiFetch(
        `/api/admin/users/${user.id}/permissions`,
        {
          method: 'PUT',
          body: JSON.stringify({
            targetIds: [user.id],
            roleChange: {
              from: user.role,
              to: selectedRole,
            },
            permissionChanges: {
              added: selectedPermissions.filter(p => !(user.permissions as Permission[])?.includes(p)),
              removed: ((user.permissions as Permission[]) || []).filter(p => !selectedPermissions.includes(p)),
            },
          }),
        }
      )

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}))
        throw new Error(errorData.message || 'Failed to update permissions')
      }

      toast.success('Permissions updated successfully')
      setChangeHistory([])

      // Update the selected user in context
      setSelectedUser({
        ...user,
        role: selectedRole,
        permissions: selectedPermissions,
      })
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update permissions'
      setError(message)
      toast.error(message)
    } finally {
      setIsSaving(false)
    }
  }, [user, selectedRole, selectedPermissions, setSelectedUser])

  return (
    <div className="w-full space-y-4">
      {/* Header with change indicator */}
      {hasChanges && (
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-blue-600" />
            <span className="text-sm font-medium text-blue-900">
              {changeCount} permission{changeCount === 1 ? '' : 's'} will be changed
            </span>
          </div>
          <Button
            onClick={handleReset}
            disabled={isSaving}
            variant="ghost"
            size="sm"
            className="text-blue-600 hover:text-blue-700"
          >
            Reset
          </Button>
        </div>
      )}

      {/* Professional Tabs */}
      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as TabType)} className="w-full">
        <TabsList className="grid w-full grid-cols-3 h-auto bg-slate-100">
          <TabsTrigger value="role" className="relative">
            Role Assignment
            {selectedRole !== user.role && (
              <Badge className="ml-2 h-5 rounded px-1 text-xs bg-orange-100 text-orange-800">
                Changed
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="custom" className="relative">
            Permissions
            {changeCount > 0 && (
              <Badge className="ml-2 h-5 rounded px-1 text-xs bg-blue-100 text-blue-800">
                {changeCount}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="history" className="relative">
            History
            {changeHistory.length > 0 && (
              <Badge className="ml-2 h-5 rounded px-1 text-xs bg-gray-100 text-gray-800">
                {changeHistory.length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        {/* Role Selection Tab */}
        <TabsContent value="role" className="space-y-4 mt-4">
          <div className="bg-white border border-slate-200 rounded-lg p-6 space-y-4">
            <div>
              <label htmlFor="role-select" className="text-sm font-semibold text-slate-900 block mb-3">
                Select Role <span className="text-red-600">*</span>
              </label>
              <Select value={selectedRole} onValueChange={handleRoleChange}>
                <SelectTrigger id="role-select" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {availableRoles.map(role => (
                    <SelectItem key={role} value={role}>
                      {role}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-slate-600 mt-2">
                Select a role to automatically assign standard permissions for that role
              </p>
            </div>

            <div className="pt-4 border-t border-slate-200">
              <p className="text-sm font-semibold text-slate-900 mb-3">Current Role</p>
              <div className="flex items-center gap-2">
                <Badge className="bg-blue-100 text-blue-800 border border-blue-200 text-base py-2">
                  {selectedRole}
                </Badge>
                {selectedRole !== user.role && (
                  <Badge variant="outline" className="text-amber-700 border-amber-200">
                    Updated from {user.role}
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </TabsContent>

        {/* Permissions Tab */}
        <TabsContent value="custom" className="space-y-4 mt-4">
          <div className="bg-white border border-slate-200 rounded-lg p-6 space-y-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder="Search permissions..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Current Permissions */}
            {selectedPermissions.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-slate-700 uppercase tracking-wide mb-3">
                  Assigned ({selectedPermissions.length})
                </p>
                <div className="flex flex-wrap gap-2 p-4 bg-green-50 rounded-lg border border-green-200">
                  {selectedPermissions.map(perm => (
                    <Badge
                      key={perm}
                      className="bg-green-100 text-green-800 border border-green-200 font-normal cursor-pointer hover:bg-green-200"
                      onClick={() => handlePermissionToggle(perm)}
                      title={`Click to remove ${perm}`}
                    >
                      ✓ {perm}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Available Permissions */}
            <div>
              <p className="text-xs font-semibold text-slate-700 uppercase tracking-wide mb-3">
                Available Permissions ({availablePermissions.length})
              </p>
              <div className="max-h-96 overflow-y-auto space-y-2">
                {availablePermissions.map(perm => {
                  const isSelected = selectedPermissions.includes(perm)
                  const metadata = PERMISSION_METADATA?.[perm]

                  return (
                    <label
                      key={perm}
                      className={cn(
                        'flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors',
                        isSelected
                          ? 'bg-blue-50 border-blue-200'
                          : 'bg-white border-slate-200 hover:bg-slate-50'
                      )}
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handlePermissionToggle(perm)}
                        className="mt-1 w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-900">{perm}</p>
                        {metadata?.description && (
                          <p className="text-xs text-slate-600 mt-1">{metadata.description}</p>
                        )}
                      </div>
                    </label>
                  )
                })}
              </div>
              {availablePermissions.length === 0 && (
                <p className="text-sm text-slate-600 text-center py-4">No permissions match your search</p>
              )}
            </div>
          </div>
        </TabsContent>

        {/* History Tab */}
        <TabsContent value="history" className="space-y-4 mt-4">
          <div className="bg-white border border-slate-200 rounded-lg p-6">
            {changeHistory.length > 0 ? (
              <div className="space-y-3">
                <p className="text-xs font-semibold text-slate-700 uppercase tracking-wide mb-4">
                  Change History ({changeHistory.length})
                </p>
                {changeHistory.map((change, idx) => (
                  <div key={idx} className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                    <div className="text-xs text-slate-600 mb-2">Change #{changeHistory.length - idx}</div>
                    <div className="text-sm">
                      <p className="font-medium text-slate-900">Role: <Badge className="ml-2">{change.role}</Badge></p>
                      <p className="text-xs text-slate-600 mt-1">
                        Permissions: {change.permissions.length} assigned
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-sm text-slate-600">No changes made yet</p>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Error State */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-red-900">Error</p>
            <p className="text-sm text-red-800 mt-1">{error}</p>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex items-center gap-2 pt-4 border-t border-slate-200">
        <Button
          onClick={handleSave}
          disabled={isSaving || !hasChanges}
          className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2"
        >
          {isSaving ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              Save Changes
            </>
          )}
        </Button>

        {changeHistory.length > 0 && (
          <Button
            onClick={handleUndo}
            disabled={isSaving}
            variant="outline"
            className="border-slate-300 text-slate-700 hover:bg-slate-50"
          >
            <RotateCcw className="w-4 h-4 mr-2 transform scale-x-[-1]" />
            Undo
          </Button>
        )}

        <Button
          onClick={handleReset}
          disabled={isSaving || !hasChanges}
          variant="outline"
          className="border-slate-300 text-slate-700 hover:bg-slate-50 ml-auto"
        >
          <RotateCcw className="w-4 h-4 mr-2" />
          Reset
        </Button>
      </div>

      {!hasChanges && selectedPermissions.length > 0 && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-start gap-3">
          <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-green-900">No changes</p>
            <p className="text-sm text-green-800 mt-1">
              Current permissions are up to date
            </p>
          </div>
        </div>
      )}
    </div>
  )
})

PermissionsTab.displayName = 'PermissionsTab'
