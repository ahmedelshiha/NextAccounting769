"use client"

import React, { useCallback, useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { useUsersContext } from '../../contexts/UsersContextProvider'
import { OverviewTab } from '../UserProfileDialog/OverviewTab'
import { DetailsTab } from '../UserProfileDialog/DetailsTab'
import { ActivityTab } from '../UserProfileDialog/ActivityTab'
import { SettingsTab } from '../UserProfileDialog/SettingsTab'
import { PermissionsTab } from '../UserProfileDialog/PermissionsTab'
import { useUserActions } from '../../hooks/useUserActions'
import { toast } from 'sonner'
import { Save, RotateCcw, X } from 'lucide-react'

export default function InlineUserProfile({ onBack }: { onBack: () => void }) {
  const {
    selectedUser,
    activeTab,
    setActiveTab,
    editMode,
    setEditMode,
    setSelectedUser,
    editForm,
    setEditForm,
    setUpdating,
    updating
  } = useUsersContext()

  const [hasChanges, setHasChanges] = useState(false)

  const { updateUser } = useUserActions({
    onSuccess: (message) => {
      toast.success(message)
      setEditMode(false)
      setHasChanges(false)
    },
    onError: (error) => {
      toast.error(error)
    }
  })

  // Track if form has unsaved changes
  useEffect(() => {
    if (!editMode || !selectedUser) {
      setHasChanges(false)
      return
    }

    const hasEdits =
      editForm?.name !== selectedUser.name ||
      editForm?.email !== selectedUser.email ||
      editForm?.phone !== selectedUser.phone ||
      editForm?.company !== selectedUser.company ||
      editForm?.location !== selectedUser.location ||
      editForm?.notes !== selectedUser.notes

    setHasChanges(hasEdits)
  }, [editForm, editMode, selectedUser])

  const handleBack = useCallback(() => {
    if (editMode && hasChanges) {
      const confirm = window.confirm('You have unsaved changes. Are you sure you want to leave?')
      if (!confirm) return
    }
    setEditMode(false)
    setActiveTab('overview')
    setSelectedUser(null as any)
    onBack()
  }, [onBack, setActiveTab, setEditMode, setSelectedUser, editMode, hasChanges])

  const handleSaveProfile = useCallback(async () => {
    if (!editForm?.name?.trim()) {
      toast.error('Full name is required')
      return
    }
    if (selectedUser?.id) {
      setUpdating(true)
      try {
        await updateUser(selectedUser.id, editForm)
        setHasChanges(false)
      } catch (error) {
        console.error('Update failed:', error)
      } finally {
        setUpdating(false)
      }
    }
  }, [selectedUser?.id, editForm, updateUser, setUpdating])

  const handleResetForm = useCallback(() => {
    if (selectedUser) {
      setEditForm({
        name: selectedUser.name || '',
        email: selectedUser.email || '',
        phone: selectedUser.phone || '',
        company: selectedUser.company || '',
        location: selectedUser.location || '',
        notes: selectedUser.notes || ''
      })
      setHasChanges(false)
      toast.success('Form reset to original values')
    }
  }, [selectedUser, setEditForm])

  const handleCancelEdit = useCallback(() => {
    if (hasChanges) {
      const confirm = window.confirm('Discard unsaved changes?')
      if (!confirm) return
    }
    setEditMode(false)
    handleResetForm()
  }, [hasChanges, setEditMode, handleResetForm])

  if (!selectedUser) return null

  return (
    <div className="space-y-4">
      {editMode && (
        <div className="flex items-center justify-between gap-3 mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="text-sm font-medium text-blue-900">
            {hasChanges ? '⚠️ You have unsaved changes' : '✓ All changes saved'}
          </div>
          <div className="flex items-center gap-2">
            <Button
              onClick={handleResetForm}
              disabled={updating || !hasChanges}
              variant="outline"
              className="border-slate-300 text-slate-700 hover:bg-slate-50"
              title="Reset form to original values"
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              Reset
            </Button>
            <Button
              onClick={handleCancelEdit}
              disabled={updating}
              variant="outline"
              className="border-slate-300 text-slate-700 hover:bg-slate-50"
              title="Discard changes and close editor"
            >
              <X className="w-4 h-4 mr-2" />
              Cancel
            </Button>
            <Button
              onClick={handleSaveProfile}
              disabled={updating || !hasChanges}
              className="bg-blue-600 hover:bg-blue-700 text-white"
              title="Save all changes"
            >
              <Save className="w-4 h-4 mr-2" />
              {updating ? 'Saving...' : 'Save'}
            </Button>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="bg-gradient-to-r from-slate-50 to-slate-100 border border-slate-200 rounded-lg">
        <div className="h-24 flex items-center justify-between px-6 md:px-8">
          <div className="flex items-center gap-4 min-w-0 flex-1">
            <div className="flex-shrink-0 w-16 h-16 bg-gradient-to-br from-blue-600 to-blue-800 rounded-lg flex items-center justify-center text-white font-bold text-lg shadow-sm">
              {(selectedUser.name || selectedUser.email).charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="text-2xl font-bold text-slate-900">{selectedUser.name || 'Unnamed User'}</h1>
              <p className="text-sm text-slate-600 truncate">{selectedUser.email}</p>
              <div className="flex items-center gap-2 mt-2">
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 border border-blue-200">
                  {selectedUser.role || 'VIEWER'}
                </span>
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
                  selectedUser.status === 'ACTIVE'
                    ? 'bg-green-100 text-green-800 border border-green-200'
                    : 'bg-red-100 text-red-800 border border-red-200'
                }`}>
                  {selectedUser.status || 'ACTIVE'}
                </span>
              </div>
            </div>
          </div>
          {!editMode && (
            <div className="flex items-center gap-2">
              <Button
                onClick={() => setEditMode(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white whitespace-nowrap"
              >
                Edit Profile
              </Button>
            </div>
          )}
        </div>

        {/* Tabs (mobile secondary nav) */}
        <div className="sm:hidden border-t border-slate-200 flex overflow-x-auto">
          {(['overview', 'details', 'permissions', 'activity', 'settings'] as const).map((id) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`flex-1 px-4 py-3 text-sm font-medium border-b-2 transition-all whitespace-nowrap ${
                activeTab === id ? 'border-blue-600 text-blue-600 bg-blue-50' : 'border-transparent text-slate-600 hover:text-slate-900'
              }`}
            >
              {id.charAt(0).toUpperCase() + id.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
        <div className="flex">
          {/* Sidebar (desktop) */}
          <nav className="w-64 bg-white border-r border-gray-200 overflow-y-auto hidden sm:block">
            <div className="p-4 space-y-2">
              {([
                { id: 'overview', label: 'Overview' },
                { id: 'details', label: 'Details' },
                { id: 'permissions', label: 'Permissions' },
                { id: 'activity', label: 'Activity' },
                { id: 'settings', label: 'Settings' },
              ] as const).map((item) => (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id as any)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-all ${
                    activeTab === item.id
                      ? 'bg-blue-600 text-white shadow-lg'
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                  }`}
                >
                  <span>{item.label}</span>
                </button>
              ))}
            </div>
          </nav>

          {/* Main */}
          <div className="flex-1 overflow-y-auto">
            <div className="max-w-5xl mx-auto px-6 md:px-8 py-8">
              {activeTab === 'overview' && <OverviewTab user={selectedUser} />}
              {activeTab === 'details' && <DetailsTab user={selectedUser} isEditing={editMode} />}
              {activeTab === 'permissions' && <PermissionsTab user={selectedUser} />}
              {activeTab === 'activity' && <ActivityTab userId={selectedUser.id} />}
              {activeTab === 'settings' && <SettingsTab user={selectedUser} />}
            </div>
          </div>
        </div>
      </div>

    </div>
  )
}
