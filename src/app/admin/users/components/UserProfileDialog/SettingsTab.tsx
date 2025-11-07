'use client'

import React, { memo, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Shield, LogOut, Lock } from 'lucide-react'
import { UserItem } from '../../contexts/UsersContextProvider'
import { useUsersContext } from '../../contexts/UsersContextProvider'

interface SettingsTabProps {
  user: UserItem
}

export const SettingsTab = memo(function SettingsTab({ user }: SettingsTabProps) {
  const { setPermissionModalOpen } = useUsersContext()

  const handleManagePermissions = useCallback(() => {
    setPermissionModalOpen(true)
  }, [setPermissionModalOpen])

  return (
    <div className="space-y-6">
      {/* Permissions Section */}
      <div className="border rounded-lg p-4 space-y-3">
        <div className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-blue-600" />
          <h3 className="font-semibold text-gray-900">Permissions</h3>
        </div>
        <p className="text-sm text-gray-600">
          Manage this user&apos;s permissions and access control.
        </p>
        {user.permissions && user.permissions.length > 0 && (
          <div className="space-y-2">
            <div className="text-xs font-medium text-gray-600">Current Permissions: {user.permissions.length}</div>
            <div className="flex flex-wrap gap-1">
              {user.permissions.slice(0, 5).map((perm, idx) => (
                <Badge key={idx} variant="secondary" className="text-xs">
                  {perm}
                </Badge>
              ))}
              {user.permissions.length > 5 && (
                <Badge variant="secondary" className="text-xs">
                  +{user.permissions.length - 5} more
                </Badge>
              )}
            </div>
          </div>
        )}
        <Button
          onClick={handleManagePermissions}
          className="flex items-center gap-2"
        >
          <Shield className="h-4 w-4" />
          Manage Permissions
        </Button>
      </div>

      {/* Two-Factor Authentication Section */}
      <div className="border rounded-lg p-4 space-y-3">
        <div className="flex items-center gap-2">
          <Lock className="h-5 w-5 text-purple-600" />
          <h3 className="font-semibold text-gray-900">Two-Factor Authentication</h3>
        </div>
        <p className="text-sm text-gray-600">
          Require two-factor authentication for this user&apos;s account.
        </p>
        <Button variant="outline" disabled className="w-full">
          Configure 2FA
        </Button>
      </div>

      {/* Session Management Section */}
      <div className="border rounded-lg p-4 space-y-3">
        <div className="flex items-center gap-2">
          <LogOut className="h-5 w-5 text-orange-600" />
          <h3 className="font-semibold text-gray-900">Session Management</h3>
        </div>
        <p className="text-sm text-gray-600">
          Manage this user&apos;s active sessions and login history.
        </p>
        <Button variant="outline" disabled className="w-full">
          View Sessions
        </Button>
      </div>

      {/* Notification Preferences Section */}
      <div className="border rounded-lg p-4 space-y-3">
        <h3 className="font-semibold text-gray-900">Notification Preferences</h3>
        <p className="text-sm text-gray-600">
          Configure how this user receives notifications.
        </p>
        <Button variant="outline" disabled className="w-full">
          Edit Preferences
        </Button>
      </div>

      {/* Danger Zone */}
      <div className="border border-red-200 rounded-lg p-4 space-y-3 bg-red-50">
        <h3 className="font-semibold text-red-900">Danger Zone</h3>
        <p className="text-sm text-red-700">
          These actions cannot be undone. Please be careful.
        </p>
        <div className="flex gap-2">
          <Button variant="destructive" disabled>
            Suspend User
          </Button>
          <Button variant="destructive" disabled>
            Delete User
          </Button>
        </div>
      </div>
    </div>
  )
})

SettingsTab.displayName = 'SettingsTab'
