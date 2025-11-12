"use client"

import React, { useCallback, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { UserForm } from '@/components/admin/shared/UserForm'
import { UserCreate, UserEdit } from '@/schemas/users'
import { toast } from 'sonner'

interface InlineCreateUserProps {
  onBack: () => void
  onSuccess?: (userId: string) => void
}

export default function InlineCreateUser({ onBack, onSuccess }: InlineCreateUserProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = useCallback(async (data: UserCreate | UserEdit) => {
    setIsSubmitting(true)
    try {
      const endpoint = '/api/admin/users'
      const method = 'POST'

      const response = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const error = await response.json().catch(() => ({}))
        throw new Error(error.message || 'Failed to create user')
      }

      const result = await response.json()
      onSuccess?.(result.id)
      toast.success('User created successfully')
      onBack()
    } catch (error) {
      const message = error instanceof Error ? error.message : 'An error occurred'
      toast.error(message)
      throw error
    } finally {
      setIsSubmitting(false)
    }
  }, [onBack, onSuccess])

  return (
    <div className="space-y-4">
      <Card className="p-6">
        <div className="mb-6">
          <h2 className="text-2xl font-bold">Create New User</h2>
          <p className="text-gray-600 text-sm mt-1">Add a new user to your organization</p>
        </div>

        <UserForm
          mode="create"
          onSubmit={handleSubmit}
          onCancel={onBack}
          isLoading={isSubmitting}
          showPasswordGeneration={true}
        />
      </Card>
    </div>
  )
}
