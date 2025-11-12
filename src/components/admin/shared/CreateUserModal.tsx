'use client'

import React, { useState, useCallback } from 'react'
import {
  Dialog,
  DialogContent,
} from '@/components/ui/dialog'
import { UserForm } from './UserForm'
import { UserCreate, UserEdit } from '@/schemas/users'
import { toast } from 'sonner'
import { X } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface CreateUserModalProps {
  /**
   * Whether the modal is open
   */
  isOpen: boolean

  /**
   * Callback to close the modal
   */
  onClose: () => void

  /**
   * Callback when user is created
   */
  onSuccess?: (userId: string) => void

  /**
   * Mode: 'create' for new user, 'edit' for existing
   */
  mode?: 'create' | 'edit'

  /**
   * Initial user data (for edit mode)
   */
  initialData?: Partial<UserEdit>

  /**
   * Custom title for modal
   */
  title?: string

  /**
   * Custom description
   */
  description?: string

  /**
   * Show password generation
   */
  showPasswordGeneration?: boolean
}

export const CreateUserModal = React.forwardRef<HTMLDivElement, CreateUserModalProps>(
  function CreateUserModal({
    isOpen,
    onClose,
    onSuccess,
    mode = 'create',
    initialData,
    title,
    description,
    showPasswordGeneration = true,
  }, ref) {
    const [isSubmitting, setIsSubmitting] = useState(false)

    const defaultTitle = mode === 'create' ? 'Create New User' : 'Edit User'
    const defaultDescription = mode === 'create'
      ? 'Add a new user to your organization'
      : 'Update user information and settings'

    const handleSubmit = useCallback(
      async (data: UserCreate | UserEdit) => {
        setIsSubmitting(true)
        try {
          const endpoint = mode === 'create' ? '/api/admin/users' : `/api/admin/users/${initialData?.id}`
          const method = mode === 'create' ? 'POST' : 'PATCH'

          const response = await fetch(endpoint, {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
          })

          if (!response.ok) {
            const error = await response.json()
            throw new Error(error.message || `Failed to ${mode === 'create' ? 'create' : 'update'} user`)
          }

          const result = await response.json()
          onSuccess?.(result.id)
          onClose()
          toast.success(
            mode === 'create'
              ? 'User created successfully'
              : 'User updated successfully'
          )
        } catch (error) {
          const message = error instanceof Error ? error.message : 'An error occurred'
          toast.error(message)
          throw error
        } finally {
          setIsSubmitting(false)
        }
      },
      [mode, initialData?.id, onSuccess, onClose]
    )

    const handleOpenChange = (open: boolean) => {
      if (!open) {
        onClose()
      }
    }

    return (
      <Dialog open={isOpen} onOpenChange={handleOpenChange}>
        <DialogContent
          className="fixed inset-0 w-screen h-screen max-w-none max-h-none p-0 border-0 bg-white rounded-none flex flex-col"
          showCloseButton={false}
          ref={ref}
        >
          {/* Enterprise Header */}
          <div className="bg-gradient-to-r from-slate-50 to-slate-100 border-b border-slate-200">
            <div className="h-20 flex items-center justify-between px-6 md:px-8">
              <div className="flex items-center gap-4">
                <div className="flex-shrink-0 w-14 h-14 bg-gradient-to-br from-green-500 to-green-700 rounded-lg flex items-center justify-center text-white font-bold text-lg shadow-sm">
                  +
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-slate-900">{title || defaultTitle}</h1>
                  <p className="text-sm text-slate-600 mt-1">{description || defaultDescription}</p>
                </div>
              </div>

              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleOpenChange(false)}
                className="text-slate-600 hover:text-slate-900 hover:bg-slate-200 flex-shrink-0"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>
          </div>

          {/* Main Content Area */}
          <div className="flex-1 overflow-y-auto bg-white">
            <div className="max-w-3xl mx-auto px-6 md:px-8 py-8">
              <UserForm
                mode={mode}
                initialData={initialData}
                onSubmit={handleSubmit}
                onCancel={onClose}
                isLoading={isSubmitting}
                showPasswordGeneration={showPasswordGeneration && mode === 'create'}
              />
            </div>
          </div>
        </DialogContent>
      </Dialog>
    )
  }
)

CreateUserModal.displayName = 'CreateUserModal'
