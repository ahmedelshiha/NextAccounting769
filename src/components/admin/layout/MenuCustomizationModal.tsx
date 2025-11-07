/**
 * Menu Customization Modal
 *
 * Main modal component for managing user menu customization.
 * Provides four tabs for different customization workflows:
 * - Sections: Reorder and toggle visibility of menu sections
 * - Your Practice: Manage practice-specific items
 * - Bookmarks: Search and bookmark pages
 * - Your Books: Financial/accounting items (hidden/future)
 */

'use client'

import React, { useState, useCallback } from 'react'
import { X, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { useMenuCustomizationStore } from '@/stores/admin/menuCustomization.store'
import { useMenuCustomizationModalStore } from '@/stores/admin/menuCustomizationModal.store'
import { MenuCustomizationTabs } from './MenuCustomizationTabs'
import { SectionsTab } from './tabs/SectionsTab'
import { YourPracticeTab } from './tabs/YourPracticeTab'
import { BookmarksTab } from './tabs/BookmarksTab'
import { useMenuCustomizationFeature } from '@/hooks/useMenuCustomizationFeature'
import { Button } from '@/components/ui/button'

export interface MenuCustomizationModalProps {
  isOpen: boolean
  onClose: () => void
}

/**
 * Main menu customization modal component
 */
export function MenuCustomizationModal({ isOpen, onClose }: MenuCustomizationModalProps) {
  // All hooks must be called unconditionally at the top level
  const { isEnabledForCurrentUser } = useMenuCustomizationFeature()

  const [selectedTab, setSelectedTab] = useState<'sections' | 'practice' | 'bookmarks' | 'books'>(
    'sections'
  )
  const [isSaving, setIsSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  // Global store (source of truth)
  const { customization, isLoading, applyCustomization, resetCustomization } = useMenuCustomizationStore()

  // Modal store (draft state)
  const {
    draftCustomization,
    isDirty,
    initializeDraft,
    clearDraft,
    reset: resetDraft,
  } = useMenuCustomizationModalStore()

  /**
   * Handle cancel - discard changes
   */
  const handleCancel = useCallback(() => {
    clearDraft()
    setSaveError(null)
    onClose()
  }, [clearDraft, onClose])

  /**
   * Handle save - persist changes to server and update global store
   */
  const handleSave = useCallback(async () => {
    if (!draftCustomization) return

    setIsSaving(true)
    setSaveError(null)

    try {
      await applyCustomization(draftCustomization)
      clearDraft()

      // Show success toast notification
      toast.success('Menu changes saved.')

      // Close modal after successful save
      onClose()
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Failed to save menu customization. Please try again.'
      setSaveError(message)
      toast.error(message)
      setIsSaving(false)
    }
  }, [draftCustomization, applyCustomization, clearDraft, onClose])

  /**
   * Handle reset to defaults
   */
  const handleReset = useCallback(async () => {
    if (!confirm('Are you sure you want to reset to default menu configuration? This cannot be undone.')) {
      return
    }

    setIsSaving(true)
    setSaveError(null)

    try {
      await resetCustomization()
      clearDraft()

      // Show success toast notification
      toast.success('Menu reset to defaults.')

      // Close modal after successful reset
      onClose()
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to reset customization'
      setSaveError(message)
      toast.error(message)
      setIsSaving(false)
    }
  }, [resetCustomization, clearDraft, onClose])

  // Initialize draft when modal opens
  React.useEffect(() => {
    if (isOpen && customization) {
      initializeDraft(customization)
      setSaveError(null)
    }
  }, [isOpen, customization, initializeDraft])

  // Handle backdrop click
  const handleBackdropClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      handleCancel()
    }
  }, [handleCancel])

  // Handle escape key
  React.useEffect(() => {
    if (!isOpen) return

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleCancel()
      }
    }

    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [isOpen, handleCancel])

  // Check feature flag and modal visibility - these are safe after all hooks
  // If the feature is not enabled for the current user, or the modal is not open, return null.
  // The isEnabledForCurrentUser check is crucial here.
  if (!isEnabledForCurrentUser || !isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" role="presentation" onClick={handleBackdropClick} aria-hidden="true">
      <div className="w-full max-w-2xl bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden flex flex-col max-h-[85vh]" role="dialog" aria-labelledby="menu-modal-title" aria-modal="true">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-white">
          <div className="flex-1">
            <h2 id="menu-modal-title" className="text-base font-semibold text-gray-900">
              Customize your menu
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              Choose what you want to see in your menu, and drag and reorder items to fit the way you work.
            </p>
          </div>
          <button onClick={handleCancel} className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors p-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 flex-shrink-0 ml-4" aria-label="Close menu customization">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Tabs */}
        <MenuCustomizationTabs selectedTab={selectedTab} onTabChange={setSelectedTab} />

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 bg-white">
          {isLoading ? (
            <div className="space-y-4 animate-pulse">
              <div className="h-32 bg-gray-200 rounded-lg" />
              <div className="h-48 bg-gray-200 rounded-lg" />
              <div className="h-32 bg-gray-200 rounded-lg" />
            </div>
          ) : draftCustomization ? (
            <div className="h-full">
              {selectedTab === 'sections' && <SectionsTab draftCustomization={draftCustomization} />}

              {selectedTab === 'practice' && <YourPracticeTab draftCustomization={draftCustomization} />}

              {selectedTab === 'bookmarks' && <BookmarksTab draftCustomization={draftCustomization} />}

              {selectedTab === 'books' && (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <p className="text-gray-500 text-sm">Your Books feature coming soon</p>
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <p className="text-red-600 text-sm font-medium">Failed to load customization</p>
              <p className="text-gray-500 text-sm mt-1">Please try refreshing the page</p>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-white gap-4">
          <button onClick={handleReset} disabled={isSaving} className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
            Reset to Defaults
          </button>

          <div className="flex gap-3 ml-auto">
            <button onClick={handleCancel} disabled={isSaving} className="px-4 py-2 text-sm font-medium border border-gray-300 text-gray-700 bg-white rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
              Cancel
            </button>

            <button onClick={handleSave} disabled={isSaving || !isDirty} className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-blue-600 rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2 shadow-sm">
              {isSaving && <Loader2 className="h-4 w-4 animate-spin" />}
              {isSaving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
