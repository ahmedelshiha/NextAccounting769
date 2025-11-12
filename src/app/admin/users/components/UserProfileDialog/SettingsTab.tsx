'use client'

import React, { memo, useCallback, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Lock, LogOut, Bell, Trash2, Pause, Eye } from 'lucide-react'
import { UserItem } from '../../contexts/UsersContextProvider'
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogAction,
  AlertDialogCancel
} from '@/components/ui/alert-dialog'
import { toast } from 'sonner'
import { apiFetch } from '@/lib/api'

interface SettingsTabProps {
  user: UserItem
}

export const SettingsTab = memo(function SettingsTab({ user }: SettingsTabProps) {
  const [showDeactivateDialog, setShowDeactivateDialog] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)

  const [isDeactivating, setIsDeactivating] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const handleDeactivate = useCallback(async () => {
    setIsDeactivating(true)
    const toastId = toast.loading('Deactivating user...')
    try {
      const res = await apiFetch(`/api/admin/users/${user.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ status: 'INACTIVE' })
      })

      if (!res.ok) {
        const error = await res.json().catch(() => ({}))
        throw new Error(error.message || 'Failed to deactivate user')
      }

      toast.dismiss(toastId)
      toast.success('User deactivated successfully')
      setShowDeactivateDialog(false)
    } catch (error) {
      toast.dismiss(toastId)
      const message = error instanceof Error ? error.message : 'Failed to deactivate user'
      toast.error(message)
    } finally {
      setIsDeactivating(false)
    }
  }, [user.id])

  const handleDelete = useCallback(async () => {
    setIsDeleting(true)
    const toastId = toast.loading('Deleting user...')
    try {
      const res = await apiFetch(`/api/admin/users/${user.id}`, {
        method: 'DELETE'
      })

      if (!res.ok) {
        const error = await res.json().catch(() => ({}))
        throw new Error(error.message || 'Failed to delete user')
      }

      toast.dismiss(toastId)
      toast.success('User deleted successfully')
      setShowDeleteDialog(false)
    } catch (error) {
      toast.dismiss(toastId)
      const message = error instanceof Error ? error.message : 'Failed to delete user'
      toast.error(message)
    } finally {
      setIsDeleting(false)
    }
  }, [user.id])

  return (
    <div className="max-w-2xl space-y-8">

      {/* Security Settings */}
      <section>
        <div className="flex items-center gap-2 mb-4 pb-4 border-b border-slate-200">
          <Lock className="w-5 h-5 text-purple-600" />
          <h3 className="text-base font-semibold text-slate-900">Security Settings</h3>
        </div>

        <div className="space-y-4">
          {/* Two-Factor Authentication */}
          <div className="bg-white border border-slate-200 rounded-lg p-6">
            <div className="flex items-start justify-between mb-3">
              <div>
                <p className="text-sm font-semibold text-slate-900">Two-Factor Authentication</p>
                <p className="text-sm text-slate-600 mt-1">
                  Require 2FA for this user&apos;s account access.
                </p>
              </div>
              <Badge className="bg-yellow-100 text-yellow-800 border border-yellow-200">
                Not Enabled
              </Badge>
            </div>
            <Button variant="outline" className="w-full">
              Configure 2FA
            </Button>
          </div>

          {/* Password Reset */}
          <div className="bg-white border border-slate-200 rounded-lg p-6">
            <div className="flex items-start justify-between mb-3">
              <div>
                <p className="text-sm font-semibold text-slate-900">Password Management</p>
                <p className="text-sm text-slate-600 mt-1">
                  Reset or enforce password change for this user.
                </p>
              </div>
            </div>
            <Button variant="outline" className="w-full">
              Send Password Reset Email
            </Button>
          </div>

          {/* Session Management */}
          <div className="bg-white border border-slate-200 rounded-lg p-6">
            <div className="flex items-start justify-between mb-3">
              <div>
                <p className="text-sm font-semibold text-slate-900">Session Management</p>
                <p className="text-sm text-slate-600 mt-1">
                  View and manage active sessions for this user.
                </p>
              </div>
            </div>
            <Button variant="outline" className="w-full flex items-center gap-2">
              <Eye className="h-4 w-4" />
              View Active Sessions
            </Button>
          </div>
        </div>
      </section>

      {/* Notification Preferences */}
      <section>
        <div className="flex items-center gap-2 mb-4 pb-4 border-b border-slate-200">
          <Bell className="w-5 h-5 text-green-600" />
          <h3 className="text-base font-semibold text-slate-900">Notification Preferences</h3>
        </div>

        <div className="bg-white border border-slate-200 rounded-lg p-6">
          <p className="text-sm text-slate-600 mb-4">
            Configure email and notification preferences for this user.
          </p>
          <Button variant="outline" className="w-full">
            Edit Notification Preferences
          </Button>
        </div>
      </section>

      {/* Account Status Management */}
      <section>
        <div className="flex items-center gap-2 mb-4 pb-4 border-b border-slate-200">
          <LogOut className="w-5 h-5 text-orange-600" />
          <h3 className="text-base font-semibold text-slate-900">Account Status</h3>
        </div>

        <div className="space-y-4">
          {/* Deactivate */}
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-6">
            <div className="flex items-start justify-between mb-3">
              <div>
                <p className="text-sm font-semibold text-orange-900">Deactivate Account</p>
                <p className="text-sm text-orange-800 mt-1">
                  Temporarily deactivate this user. They can be reactivated later.
                </p>
              </div>
              <Badge className="bg-orange-100 text-orange-800 border border-orange-200">
                {user.status === 'ACTIVE' ? 'ACTIVE' : 'INACTIVE'}
              </Badge>
            </div>
            <Button
              variant="outline"
              disabled={isDeactivating}
              className="w-full text-orange-700 border-orange-300 hover:bg-orange-100 flex items-center gap-2"
              onClick={() => setShowDeactivateDialog(true)}
            >
              <Pause className="h-4 w-4" />
              {isDeactivating ? 'Deactivating...' : 'Deactivate User'}
            </Button>
          </div>
        </div>
      </section>

      {/* Danger Zone */}
      <section>
        <div className="flex items-center gap-2 mb-4 pb-4 border-b border-red-300">
          <Trash2 className="w-5 h-5 text-red-600" />
          <h3 className="text-base font-semibold text-red-900">Danger Zone</h3>
        </div>

        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <p className="text-sm text-red-800 mb-4">
            <strong>Warning:</strong> These actions are permanent and cannot be undone. Please be extremely careful.
          </p>
          <Button
            variant="destructive"
            disabled={isDeleting}
            className="w-full flex items-center gap-2"
            onClick={() => setShowDeleteDialog(true)}
          >
            <Trash2 className="h-4 w-4" />
            {isDeleting ? 'Deleting...' : 'Permanently Delete User'}
          </Button>
          <p className="text-xs text-red-700 mt-3">
            This will permanently remove the user and all associated data from the system.
          </p>
        </div>
      </section>

      {/* Deactivate Confirmation Dialog */}
      <AlertDialog open={showDeactivateDialog} onOpenChange={setShowDeactivateDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Deactivate User</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to deactivate <strong>{user.name || user.email}</strong>? They will no longer be able to access the system.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeactivating}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={isDeactivating}
              onClick={handleDeactivate}
              className="bg-orange-600 hover:bg-orange-700"
            >
              {isDeactivating ? 'Deactivating...' : 'Deactivate'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Permanently Delete User</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to permanently delete <strong>{user.name || user.email}</strong>? This action cannot be undone and will remove all associated data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={isDeleting}
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              {isDeleting ? 'Deleting...' : 'Delete Permanently'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
})

SettingsTab.displayName = 'SettingsTab'
