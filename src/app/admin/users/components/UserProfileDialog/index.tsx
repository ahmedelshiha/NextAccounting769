'use client'

import React, { memo, useCallback, useState } from 'react'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { useUsersContext } from '../../contexts/UsersContextProvider'
import { OverviewTab } from './OverviewTab'
import { DetailsTab } from './DetailsTab'
import { ActivityTab } from './ActivityTab'
import { SettingsTab } from './SettingsTab'
import { PermissionsTab } from './PermissionsTab'
import { X, User, FileText, Clock, Lock, Shield, MoreVertical } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from '@/components/ui/dropdown-menu'

interface UserProfileDialogProps {
  onTabChange?: (tab: string) => void
}

type TabType = 'overview' | 'details' | 'permissions' | 'activity' | 'settings'

const navItems: Array<{ id: TabType; label: string; icon: React.ReactNode }> = [
  { id: 'overview', label: 'Overview', icon: <User className="w-5 h-5" /> },
  { id: 'details', label: 'Details', icon: <FileText className="w-5 h-5" /> },
  { id: 'permissions', label: 'Permissions', icon: <Shield className="w-5 h-5" /> },
  { id: 'activity', label: 'Activity', icon: <Clock className="w-5 h-5" /> },
  { id: 'settings', label: 'Settings', icon: <Lock className="w-5 h-5" /> }
]

export const UserProfileDialog = memo(function UserProfileDialog({
  onTabChange
}: UserProfileDialogProps) {
  const {
    selectedUser,
    profileOpen,
    setProfileOpen,
    activeTab,
    setActiveTab,
    editMode,
    setEditMode
  } = useUsersContext()

  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)

  const handleOpenChange = useCallback(
    (open: boolean) => {
      setProfileOpen(open)
      if (!open) {
        setEditMode(false)
        setActiveTab('overview')
      }
    },
    [setProfileOpen, setEditMode, setActiveTab]
  )

  const handleTabChange = useCallback(
    (tab: TabType) => {
      setActiveTab(tab)
      onTabChange?.(tab)
    },
    [setActiveTab, onTabChange]
  )

  if (!selectedUser) {
    return null
  }

  return (
    <Dialog open={profileOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="fixed inset-0 w-screen h-screen max-w-none max-h-none p-0 border-0 bg-white rounded-none flex flex-col" showCloseButton={false}>
        {/* Enterprise Header */}
        <div className="bg-gradient-to-r from-slate-50 to-slate-100 border-b border-slate-200">
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

            {/* Header Actions */}
            <div className="flex items-center gap-2 flex-shrink-0 ml-4">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="text-slate-600 hover:text-slate-900 hover:bg-slate-200">
                    <MoreVertical className="w-5 h-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuItem onClick={() => {
                    setActiveTab('details')
                    setEditMode(true)
                  }}>
                    Edit Profile
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => alert('Reset password functionality coming soon')}>
                    Reset Password
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setActiveTab('permissions')}>
                    Manage Permissions
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => alert('Export user data functionality coming soon')}>
                    Export User Data
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="text-red-600 focus:bg-red-50 focus:text-red-700"
                    onClick={() => setIsDeleteDialogOpen(true)}
                  >
                    Deactivate User
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleOpenChange(false)}
                className="text-slate-600 hover:text-slate-900 hover:bg-slate-200"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>

        {/* Main Content: Sidebar + Content Area */}
        <div className="flex-1 overflow-hidden flex">
          {/* Left Sidebar Navigation - Enterprise Style */}
          <nav className="w-64 bg-slate-900 text-white border-r border-slate-800 overflow-y-auto hidden sm:block">
            <div className="p-4 space-y-2">
              {navItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => handleTabChange(item.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-all ${
                    activeTab === item.id
                      ? 'bg-blue-600 text-white shadow-lg'
                      : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  {item.icon}
                  <span>{item.label}</span>
                </button>
              ))}
            </div>
          </nav>

          {/* Mobile Tab Navigation */}
          <div className="sm:hidden absolute top-32 left-0 right-0 bg-white border-b border-slate-200 flex overflow-x-auto">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => handleTabChange(item.id)}
                className={`flex-1 px-4 py-3 text-sm font-medium border-b-2 transition-all whitespace-nowrap ${
                  activeTab === item.id
                    ? 'border-blue-600 text-blue-600 bg-blue-50'
                    : 'border-transparent text-slate-600 hover:text-slate-900'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>

          {/* Main Content Area */}
          <div className="flex-1 overflow-y-auto bg-white pt-24 sm:pt-0">
            <div className="max-w-5xl mx-auto px-6 md:px-8 py-8">
              {/* Content Sections */}
              {activeTab === 'overview' && <OverviewTab user={selectedUser} />}
              {activeTab === 'details' && <DetailsTab user={selectedUser} isEditing={editMode} />}
              {activeTab === 'permissions' && <PermissionsTab user={selectedUser} />}
              {activeTab === 'activity' && <ActivityTab userId={selectedUser.id} />}
              {activeTab === 'settings' && <SettingsTab user={selectedUser} />}
            </div>
          </div>
        </div>

        {/* Bottom Action Bar */}
        {activeTab === 'details' && editMode && (
          <div className="border-t border-slate-200 bg-slate-50 px-6 md:px-8 py-4 flex justify-between items-center">
            <p className="text-sm text-slate-600">Changes will be saved to user profile</p>
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => setEditMode(false)}
              >
                Cancel
              </Button>
              <Button
                className="bg-blue-600 hover:bg-blue-700"
                onClick={() => {
                  alert('Save functionality integrated with DetailsTab')
                }}
              >
                Save Changes
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
})

UserProfileDialog.displayName = 'UserProfileDialog'
