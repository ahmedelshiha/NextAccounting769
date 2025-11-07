'use client'

import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { ChevronDown, ChevronRight, AlertTriangle } from 'lucide-react'

interface Permission {
  id: string
  name: string
  description: string
}

interface Role {
  id: string
  name: string
  description: string
  parentRoleId?: string
  permissions: Permission[]
  inheritedPermissions: Permission[]
}

interface PermissionConflict {
  userId: string
  roleA: string
  roleB: string
  conflictingPermissions: Permission[]
}

interface PermissionHierarchyProps {
  roles?: Role[]
  permissions?: Permission[]
  conflicts?: PermissionConflict[]
}

export function PermissionHierarchy({
  roles = DEFAULT_ROLES,
  permissions = DEFAULT_PERMISSIONS,
  conflicts = []
}: PermissionHierarchyProps) {
  const [expandedRoles, setExpandedRoles] = useState<Set<string>>(new Set([roles[0]?.id]))
  const [selectedRole, setSelectedRole] = useState<string | null>(roles[0]?.id || null)

  const toggleRoleExpand = (roleId: string) => {
    const newExpanded = new Set(expandedRoles)
    if (newExpanded.has(roleId)) {
      newExpanded.delete(roleId)
    } else {
      newExpanded.add(roleId)
    }
    setExpandedRoles(newExpanded)
  }

  const selectedRoleData = roles.find(r => r.id === selectedRole)
  const roleConflicts = conflicts.filter(c => c.roleA === selectedRole || c.roleB === selectedRole)

  // Build role hierarchy
  const rootRoles = roles.filter(r => !r.parentRoleId)
  const childRoles = (parentId: string) => roles.filter(r => r.parentRoleId === parentId)

  return (
    <div className="space-y-6">
      <Tabs defaultValue="tree" className="w-full">
        <TabsList>
          <TabsTrigger value="tree">Role Hierarchy</TabsTrigger>
          <TabsTrigger value="matrix">Permission Matrix</TabsTrigger>
          <TabsTrigger value="conflicts">Conflicts</TabsTrigger>
        </TabsList>

        {/* Tree View */}
        <TabsContent value="tree" className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            {/* Tree Panel */}
            <div className="col-span-1">
              <Card>
                <CardHeader>
                  <CardTitle>Role Hierarchy</CardTitle>
                  <CardDescription>Organizational role structure</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  {rootRoles.map(role => (
                    <RoleTreeNode
                      key={role.id}
                      role={role}
                      isExpanded={expandedRoles.has(role.id)}
                      isSelected={selectedRole === role.id}
                      childRoles={childRoles(role.id)}
                      allRoles={roles}
                      onToggle={() => toggleRoleExpand(role.id)}
                      onSelect={() => setSelectedRole(role.id)}
                    />
                  ))}
                </CardContent>
              </Card>
            </div>

            {/* Details Panel */}
            {selectedRoleData && (
              <div className="col-span-2 space-y-4">
                {/* Role Info */}
                <Card>
                  <CardHeader>
                    <CardTitle>{selectedRoleData.name}</CardTitle>
                    <CardDescription>{selectedRoleData.description}</CardDescription>
                  </CardHeader>
                </Card>

                {/* Permissions */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Direct Permissions</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {selectedRoleData.permissions.length === 0 ? (
                      <p className="text-sm text-muted-foreground">No direct permissions</p>
                    ) : (
                      selectedRoleData.permissions.map(perm => (
                        <div key={perm.id} className="p-2 border rounded text-sm">
                          <p className="font-medium">{perm.name}</p>
                          <p className="text-xs text-muted-foreground">{perm.description}</p>
                        </div>
                      ))
                    )}
                  </CardContent>
                </Card>

                {/* Inherited Permissions */}
                {selectedRoleData.inheritedPermissions.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Inherited Permissions</CardTitle>
                      <CardDescription>From parent roles</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      {selectedRoleData.inheritedPermissions.map(perm => (
                        <div key={perm.id} className="p-2 border rounded text-sm bg-blue-50">
                          <p className="font-medium text-blue-900">{perm.name}</p>
                          <p className="text-xs text-blue-800">{perm.description}</p>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                )}
              </div>
            )}
          </div>
        </TabsContent>

        {/* Matrix View */}
        <TabsContent value="matrix" className="space-y-4">
          <PermissionMatrix roles={roles} permissions={permissions} />
        </TabsContent>

        {/* Conflicts */}
        <TabsContent value="conflicts" className="space-y-4">
          {conflicts.length === 0 ? (
            <Card>
              <CardContent className="pt-6 text-center text-muted-foreground">
                No permission conflicts detected
              </CardContent>
            </Card>
          ) : (
            conflicts.map((conflict, idx) => (
              <Alert key={idx} variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <p className="font-semibold mb-2">User: {conflict.userId}</p>
                  <p className="text-sm mb-2">
                    Conflict between <strong>{conflict.roleA}</strong> and <strong>{conflict.roleB}</strong>
                  </p>
                  <p className="text-sm">
                    Conflicting permissions: {conflict.conflictingPermissions.map(p => p.name).join(', ')}
                  </p>
                </AlertDescription>
              </Alert>
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}

/**
 * Role Tree Node Component
 */
function RoleTreeNode({
  role,
  isExpanded,
  isSelected,
  childRoles,
  allRoles,
  onToggle,
  onSelect
}: {
  role: Role
  isExpanded: boolean
  isSelected: boolean
  childRoles: Role[]
  allRoles: Role[]
  onToggle: () => void
  onSelect: () => void
}) {
  return (
    <div className="space-y-1">
      <div
        className={`p-2 rounded cursor-pointer transition-colors flex items-center gap-1 ${
          isSelected
            ? 'bg-primary text-primary-foreground'
            : 'hover:bg-gray-100'
        }`}
        onClick={onSelect}
      >
        {childRoles.length > 0 && (
          <button
            onClick={(e) => {
              e.stopPropagation()
              onToggle()
            }}
            className="p-0"
          >
            {isExpanded ? (
              <ChevronDown className="w-4 h-4" />
            ) : (
              <ChevronRight className="w-4 h-4" />
            )}
          </button>
        )}
        {childRoles.length === 0 && <div className="w-4" />}
        <span className="text-sm font-medium flex-1">{role.name}</span>
        <Badge variant="outline" className="text-xs">
          {role.permissions.length}
        </Badge>
      </div>

      {isExpanded && childRoles.length > 0 && (
        <div className="ml-4 space-y-1 border-l border-gray-200">
          {childRoles.map(child => (
            <RoleTreeNode
              key={child.id}
              role={child}
              isExpanded={isExpanded}
              isSelected={isSelected}
              childRoles={allRoles.filter(r => r.parentRoleId === child.id)}
              allRoles={allRoles}
              onToggle={() => {}}
              onSelect={onSelect}
            />
          ))}
        </div>
      )}
    </div>
  )
}

/**
 * Permission Matrix Component
 */
function PermissionMatrix({
  roles,
  permissions
}: {
  roles: Role[]
  permissions: Permission[]
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Permission Matrix</CardTitle>
        <CardDescription>Role × Permission grid view</CardDescription>
      </CardHeader>
      <CardContent className="overflow-x-auto">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="bg-gray-100">
              <th className="border p-2 text-left font-semibold">Role</th>
              {permissions.map(perm => (
                <th key={perm.id} className="border p-2 text-center text-xs font-semibold">
                  {perm.name.split('_')[0]}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {roles.map(role => (
              <tr key={role.id} className="hover:bg-gray-50">
                <td className="border p-2 font-medium">{role.name}</td>
                {permissions.map(perm => {
                  const hasPermission = role.permissions.some(p => p.id === perm.id)
                  const inherited = role.inheritedPermissions.some(p => p.id === perm.id)
                  return (
                    <td
                      key={perm.id}
                      className={`border p-2 text-center ${
                        hasPermission || inherited ? 'bg-green-100' : 'bg-gray-50'
                      }`}
                    >
                      {hasPermission && <span className="text-green-700 font-bold">✓</span>}
                      {inherited && !hasPermission && <span className="text-blue-700 text-xs">↓</span>}
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </CardContent>
    </Card>
  )
}

// Default data
const DEFAULT_PERMISSIONS: Permission[] = [
  { id: '1', name: 'users.create', description: 'Create new users' },
  { id: '2', name: 'users.read', description: 'Read user data' },
  { id: '3', name: 'users.update', description: 'Update user information' },
  { id: '4', name: 'users.delete', description: 'Delete users' },
  { id: '5', name: 'roles.manage', description: 'Manage roles' },
  { id: '6', name: 'permissions.manage', description: 'Manage permissions' },
  { id: '7', name: 'system.config', description: 'System configuration' },
  { id: '8', name: 'audit.view', description: 'View audit logs' }
]

const DEFAULT_ROLES: Role[] = [
  {
    id: 'admin',
    name: 'Admin',
    description: 'Full system access',
    permissions: DEFAULT_PERMISSIONS,
    inheritedPermissions: []
  },
  {
    id: 'manager',
    name: 'Manager',
    description: 'Team management',
    parentRoleId: 'admin',
    permissions: [DEFAULT_PERMISSIONS[1], DEFAULT_PERMISSIONS[2], DEFAULT_PERMISSIONS[7]],
    inheritedPermissions: []
  },
  {
    id: 'user',
    name: 'Team Member',
    description: 'Basic user access',
    parentRoleId: 'manager',
    permissions: [DEFAULT_PERMISSIONS[1]],
    inheritedPermissions: [DEFAULT_PERMISSIONS[2], DEFAULT_PERMISSIONS[7]]
  },
  {
    id: 'viewer',
    name: 'Viewer',
    description: 'Read-only access',
    parentRoleId: 'user',
    permissions: [],
    inheritedPermissions: [DEFAULT_PERMISSIONS[1], DEFAULT_PERMISSIONS[2], DEFAULT_PERMISSIONS[7]]
  }
]
