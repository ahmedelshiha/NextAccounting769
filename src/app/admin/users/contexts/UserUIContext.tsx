'use client'

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react'
import { UserItem } from './UserDataContext'

type TabType = 'overview' | 'details' | 'permissions' | 'activity' | 'settings'
type StatusAction = 'activate' | 'deactivate' | 'suspend'

/**
 * UserUIContext - Manages all UI state including dialogs, modals, and view modes
 * Responsibilities:
 * - User profile modal state
 * - Edit form state
 * - Status change dialog
 * - Permission modal state
 * - Active tabs and navigation
 * - UI-only loading states (permissionsSaving)
 */
interface UserUIContextType {
  // Dialog/Modal State
  profileOpen: boolean
  activeTab: TabType
  editMode: boolean
  editForm: Partial<UserItem>
  statusDialogOpen: boolean
  statusAction: { action: StatusAction; user: UserItem } | null
  permissionModalOpen: boolean

  // Loading State (UI-specific)
  permissionsSaving: boolean

  // Dialog/Modal Actions
  setProfileOpen: (open: boolean) => void
  setActiveTab: (tab: TabType) => void
  setEditMode: (mode: boolean) => void
  setEditForm: (form: Partial<UserItem>) => void
  setStatusDialogOpen: (open: boolean) => void
  setStatusAction: (action: { action: StatusAction; user: UserItem } | null) => void
  setPermissionModalOpen: (open: boolean) => void

  // Loading Actions (UI-specific)
  setPermissionsSaving: (value: boolean) => void

  // UI Helpers
  openUserProfile: (user: UserItem) => void
  closeUserProfile: () => void
}

// Create Context
const UserUIContext = createContext<UserUIContextType | undefined>(undefined)

// Provider Component
interface UserUIContextProviderProps {
  children: ReactNode
}

export function UserUIContextProvider({ children }: UserUIContextProviderProps) {
  // Dialog state
  const [profileOpen, setProfileOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<TabType>('overview')
  const [editMode, setEditMode] = useState(false)
  const [editForm, setEditForm] = useState<Partial<UserItem>>({})
  const [statusDialogOpen, setStatusDialogOpen] = useState(false)
  const [statusAction, setStatusAction] = useState<{ action: StatusAction; user: UserItem } | null>(null)
  const [permissionModalOpen, setPermissionModalOpen] = useState(false)

  // UI-specific loading
  const [permissionsSaving, setPermissionsSaving] = useState(false)

  // UI Helpers
  const openUserProfile = useCallback((user: UserItem) => {
    setEditForm({
      name: user.name || '',
      email: user.email,
      phone: user.phone || '',
      company: user.company || '',
      location: user.location || '',
      notes: user.notes || ''
    })
    setEditMode(false)
    setActiveTab('overview')
    setProfileOpen(true)
  }, [])

  const closeUserProfile = useCallback(() => {
    setProfileOpen(false)
    setEditMode(false)
    setActiveTab('overview')
  }, [])

  const value: UserUIContextType = {
    // Dialog/Modal State
    profileOpen,
    activeTab,
    editMode,
    editForm,
    statusDialogOpen,
    statusAction,
    permissionModalOpen,

    // Loading State
    permissionsSaving,

    // Dialog/Modal Actions
    setProfileOpen,
    setActiveTab,
    setEditMode,
    setEditForm,
    setStatusDialogOpen,
    setStatusAction,
    setPermissionModalOpen,

    // Loading Actions
    setPermissionsSaving,

    // UI Helpers
    openUserProfile,
    closeUserProfile
  }

  return <UserUIContext.Provider value={value}>{children}</UserUIContext.Provider>
}

// Hook to use UserUIContext
export function useUserUIContext() {
  const context = useContext(UserUIContext)
  if (!context) {
    throw new Error('useUserUIContext must be used within UserUIContextProvider')
  }
  return context
}
