'use client'

import React, { useState, useCallback } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { UserForm } from './UserForm'
import { UserCreate, UserEdit } from '@/schemas/users'
import { toast } from 'sonner'

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
      : 'Update user information'

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
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" ref={ref}>
          <DialogHeader>
            <DialogTitle>{title || defaultTitle}</DialogTitle>
            <DialogDescription>{description || defaultDescription}</DialogDescription>
          </DialogHeader>

          <UserForm
            mode={mode}
            initialData={initialData}
            onSubmit={handleSubmit}
            onCancel={onClose}
            isLoading={isSubmitting}
            showPasswordGeneration={showPasswordGeneration && mode === 'create'}
          />
        </DialogContent>
      </Dialog>
    )
  }
)

CreateUserModal.displayName = 'CreateUserModal'
