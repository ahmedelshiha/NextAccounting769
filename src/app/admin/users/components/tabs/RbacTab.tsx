'use client'
import React, { useState, useCallback, useEffect } from 'react'
import RolePermissionsViewer from '@/components/admin/permissions/RolePermissionsViewer'
import UserPermissionsInspector from '@/components/admin/permissions/UserPermissionsInspector'
import UnifiedPermissionModal, { RoleFormData } from '@/components/admin/permissions/UnifiedPermissionModal'
import { Button } from '@/components/ui/button'
import { Plus, Edit3, Trash2, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { globalEventEmitter } from '@/lib/event-emitter'

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
          permissions: role.permissions,
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

  const handleRoleModalSave = useCallback(async (formData: RoleFormData) => {
    try {
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
    <div className="space-y-6 p-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column: Role Management */}
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Roles</h3>
              <p className="text-sm text-gray-500 mt-1">Create and manage roles</p>
            </div>
            <Button onClick={() => openRoleForm()} className="gap-2">
              <Plus className="w-4 h-4" />
              New Role
            </Button>
          </div>

          {loadingRoles ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
            </div>
          ) : roles.length === 0 ? (
            <div className="text-center py-8 border-2 border-dashed rounded-lg">
              <p className="text-gray-500">No roles created yet</p>
              <Button onClick={() => openRoleForm()} variant="ghost" className="mt-2">
                Create your first role
              </Button>
            </div>
          ) : (
            <div className="space-y-2 max-h-[600px] overflow-y-auto">
              {roles.map((role) => (
                <div key={role.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900">{role.name}</h4>
                      <p className="text-sm text-gray-500 mt-1">{role.description}</p>
                      <div className="mt-2 flex items-center gap-2">
                        <span className="inline-block px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded">
                          {role.permissions?.length || 0} permissions
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="sm" onClick={() => openRoleForm(role)}>
                        <Edit3 className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleDeleteRole(role.id)}>
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Column: Permission Viewers */}
        <div className="space-y-4">
          <RolePermissionsViewer />
        </div>
      </div>

      {/* Bottom: User Permissions Inspector */}
      <div className="border-t pt-6">
        <UserPermissionsInspector />
      </div>

      {/* Role Form Modal */}
      <RoleFormModal
        isOpen={roleFormModal.isOpen}
        onClose={closeRoleForm}
        mode={roleFormModal.mode}
        initialData={roleFormModal.data}
        onSuccess={() => {
          closeRoleForm()
          loadRoles()
          window.dispatchEvent(new Event('refresh-roles'))
        }}
      />
    </div>
  )
}
