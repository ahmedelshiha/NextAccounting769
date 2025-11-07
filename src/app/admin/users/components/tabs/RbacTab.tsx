'use client'
import React, { useState, useCallback, useEffect } from 'react'
import RolePermissionsViewer from '@/components/admin/permissions/RolePermissionsViewer'
import UserPermissionsInspector from '@/components/admin/permissions/UserPermissionsInspector'
import UnifiedPermissionModal, { RoleFormData, PermissionChangeSet } from '@/components/admin/permissions/UnifiedPermissionModal'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Plus, Edit3, Trash2, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { globalEventEmitter } from '@/lib/event-emitter'
import { PermissionHierarchy } from '@/app/admin/users/components/PermissionHierarchy'
import { PermissionSimulator } from '@/app/admin/users/components/PermissionSimulator'
import { ConflictResolver } from '@/app/admin/users/components/ConflictResolver'

interface Role {
  id: string
  name: string
  description: string
  permissions: string[]
  createdAt?: string
  updatedAt?: string
}

export function RbacTab() {
  const [roles, setRoles] = useState<Role[]>([])
  const [loadingRoles, setLoadingRoles] = useState(true)
  const [activeTab, setActiveTab] = useState('roles')
  const [roleModal, setRoleModal] = useState({
    isOpen: false,
    mode: 'create' as 'role-create' | 'role-edit',
    data: undefined as Partial<RoleFormData> | undefined
  })

  // Load roles on mount and listen for role changes
  useEffect(() => {
    loadRoles()

    // Listen for role events
    const unsubscribeRoleCreated = globalEventEmitter.on('role:created', () => {
      loadRoles()
    })

    const unsubscribeRoleUpdated = globalEventEmitter.on('role:updated', () => {
      loadRoles()
    })

    // Legacy event listener for compatibility
    const handleRefresh = () => loadRoles()
    window.addEventListener('refresh-roles', handleRefresh)

    return () => {
      unsubscribeRoleCreated()
      unsubscribeRoleUpdated()
      window.removeEventListener('refresh-roles', handleRefresh)
    }
  }, [])

  const loadRoles = useCallback(async () => {
    try {
      setLoadingRoles(true)
      const response = await fetch('/api/admin/roles')
      if (!response.ok) throw new Error('Failed to load roles')
      const data = await response.json()
      setRoles(Array.isArray(data) ? data : data.roles || [])
    } catch (err) {
      console.error('Failed to load roles:', err)
      toast.error('Failed to load roles')
    } finally {
      setLoadingRoles(false)
    }
  }, [])

  const openRoleModal = useCallback((role?: Role) => {
    if (role) {
      setRoleModal({
        isOpen: true,
        mode: 'role-edit',
        data: {
          id: role.id,
          name: role.name,
          description: role.description,
          permissions: role.permissions as any,
        }
      })
    } else {
      setRoleModal({
        isOpen: true,
        mode: 'role-create',
        data: { name: '', description: '', permissions: [] }
      })
    }
  }, [])

  const closeRoleModal = useCallback(() => {
    setRoleModal({ isOpen: false, mode: 'role-create', data: undefined })
  }, [])

  const handleDeleteRole = useCallback(async (roleId: string) => {
    if (!confirm('Are you sure you want to delete this role?')) return
    try {
      const response = await fetch(`/api/admin/roles/${roleId}`, { method: 'DELETE' })
      if (!response.ok) throw new Error('Failed to delete role')
      toast.success('Role deleted successfully')
      loadRoles()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete role')
    }
  }, [loadRoles])

  const handleRoleModalSave = useCallback(async (changes: PermissionChangeSet | RoleFormData) => {
    try {
      // Type guard: ensure we have RoleFormData for role operations
      if (!('name' in changes && 'description' in changes && 'permissions' in changes)) {
        throw new Error('Invalid role data provided')
      }

      const formData = changes as RoleFormData
      const endpoint = roleModal.mode === 'role-create'
        ? '/api/admin/roles'
        : `/api/admin/roles/${formData.id}`
      const method = roleModal.mode === 'role-create' ? 'POST' : 'PATCH'

      const response = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          description: formData.description,
          permissions: formData.permissions,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || `Failed to ${roleModal.mode === 'role-create' ? 'create' : 'update'} role`)
      }

      toast.success(
        roleModal.mode === 'role-create'
          ? 'Role created successfully'
          : 'Role updated successfully'
      )
      closeRoleModal()
      loadRoles()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to save role')
      throw err
    }
  }, [roleModal.mode, closeRoleModal, loadRoles])

  return (
    <div className="space-y-4 sm:space-y-6 p-4 sm:p-6">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 mb-6">
          <TabsTrigger value="roles" className="text-xs sm:text-sm">Roles</TabsTrigger>
          <TabsTrigger value="hierarchy" className="text-xs sm:text-sm">Hierarchy</TabsTrigger>
          <TabsTrigger value="testing" className="text-xs sm:text-sm">Test Access</TabsTrigger>
          <TabsTrigger value="conflicts" className="text-xs sm:text-sm">Conflicts</TabsTrigger>
        </TabsList>

        {/* Roles Tab - Role Management */}
        <TabsContent value="roles" className="space-y-4 sm:space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            {/* Left Column: Role Management */}
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="text-base sm:text-lg font-semibold text-gray-900">Roles</h3>
                  <p className="text-xs sm:text-sm text-gray-500 mt-1">Create and manage roles</p>
                </div>
                <Button onClick={() => openRoleModal()} className="gap-2 flex-shrink-0 w-full sm:w-auto text-sm">
                  <Plus className="w-4 h-4" />
                  <span className="sm:inline">New Role</span>
                </Button>
              </div>

              {loadingRoles ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
                </div>
              ) : roles.length === 0 ? (
                <div className="text-center py-8 border-2 border-dashed rounded-lg">
                  <p className="text-gray-500">No roles created yet</p>
                  <Button onClick={() => openRoleModal()} variant="ghost" className="mt-2">
                    Create your first role
                  </Button>
                </div>
              ) : (
                <div className="space-y-2 max-h-[400px] sm:max-h-[600px] overflow-y-auto">
                  {roles.map((role) => (
                    <div key={role.id} className="border rounded-lg p-3 sm:p-4 hover:bg-gray-50 transition-colors">
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-sm sm:text-base text-gray-900 truncate">{role.name}</h4>
                          <p className="text-xs sm:text-sm text-gray-500 mt-1 line-clamp-2">{role.description}</p>
                          <div className="mt-2 flex items-center gap-2">
                            <span className="inline-block px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded whitespace-nowrap">
                              {role.permissions?.length || 0} permissions
                            </span>
                          </div>
                        </div>
                        <div className="flex gap-1 flex-shrink-0">
                          <Button variant="ghost" size="sm" onClick={() => openRoleModal(role)} title="Edit role">
                            <Edit3 className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => handleDeleteRole(role.id)} title="Delete role">
                            <Trash2 className="w-4 h-4 text-red-500" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Right Column: Permission Viewers - Hidden on mobile, shown on tablet+ */}
            <div className="hidden md:block space-y-4">
              <RolePermissionsViewer />
            </div>
          </div>

          {/* Bottom: User Permissions Inspector */}
          <div className="border-t pt-4 sm:pt-6">
            <UserPermissionsInspector />
          </div>
        </TabsContent>

        {/* Hierarchy Tab */}
        <TabsContent value="hierarchy" className="space-y-4">
          <PermissionHierarchy />
        </TabsContent>

        {/* Test Access Tab */}
        <TabsContent value="testing" className="space-y-4">
          <PermissionSimulator />
        </TabsContent>

        {/* Conflicts Tab */}
        <TabsContent value="conflicts" className="space-y-4">
          <ConflictResolver />
        </TabsContent>
      </Tabs>

      {/* Role Management Modal */}
      {roleModal.isOpen && (
        <UnifiedPermissionModal
          mode={roleModal.mode}
          targetId={roleModal.data?.id || 'new-role'}
          onSave={handleRoleModalSave}
          onClose={closeRoleModal}
          roleData={roleModal.data as RoleFormData}
          showTemplates={true}
          showHistory={false}
          allowCustomPermissions={true}
        />
      )}
    </div>
  )
}
