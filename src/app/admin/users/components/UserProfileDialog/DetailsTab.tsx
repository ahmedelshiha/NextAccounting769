'use client'

import React, { memo, useCallback, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { UserItem } from '../../contexts/UsersContextProvider'
import { useUsersContext } from '../../contexts/UsersContextProvider'
import { useUserActions } from '../../hooks/useUserActions'
import { toast } from 'sonner'

interface DetailsTabProps {
  user: UserItem
  isEditing: boolean
}

export const DetailsTab = memo(function DetailsTab({ user, isEditing }: DetailsTabProps) {
  const { editForm, setEditForm, setEditMode, setUpdating, updating } = useUsersContext()
  const { updateUser } = useUserActions({
    onSuccess: (message) => {
      toast.success(message)
      setEditMode(false)
    },
    onError: (error) => {
      toast.error(error)
    }
  })

  // Initialize form when user changes
  useEffect(() => {
    setEditForm({
      name: user.name || '',
      email: user.email,
      phone: user.phone || '',
      company: user.company || '',
      location: user.location || '',
      notes: user.notes || ''
    })
  }, [user, setEditForm])

  const handleInputChange = useCallback(
    (field: keyof typeof editForm, value: string) => {
      setEditForm({
        ...editForm,
        [field]: value
      })
    },
    [editForm, setEditForm]
  )

  const handleSave = useCallback(async () => {
    setUpdating(true)
    try {
      await updateUser(user.id, editForm)
    } catch (error) {
      console.error('Update failed:', error)
    } finally {
      setUpdating(false)
    }
  }, [user.id, editForm, updateUser, setUpdating])

  if (isEditing) {
    return (
      <div className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="name">Full Name</Label>
          <Input
            id="name"
            value={editForm.name || ''}
            onChange={(e) => handleInputChange('name', e.target.value)}
            placeholder="Enter full name"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            value={editForm.email || ''}
            onChange={(e) => handleInputChange('email', e.target.value)}
            placeholder="Enter email address"
            disabled
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="phone">Phone Number</Label>
          <Input
            id="phone"
            value={editForm.phone || ''}
            onChange={(e) => handleInputChange('phone', e.target.value)}
            placeholder="Enter phone number"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="company">Company</Label>
          <Input
            id="company"
            value={editForm.company || ''}
            onChange={(e) => handleInputChange('company', e.target.value)}
            placeholder="Enter company name"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="location">Location</Label>
          <Input
            id="location"
            value={editForm.location || ''}
            onChange={(e) => handleInputChange('location', e.target.value)}
            placeholder="Enter location"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="notes">Notes</Label>
          <Textarea
            id="notes"
            value={editForm.notes || ''}
            onChange={(e) => handleInputChange('notes', e.target.value)}
            placeholder="Add any additional notes..."
            className="min-h-24"
          />
        </div>

        <div className="flex gap-2 pt-4 border-t">
          <Button
            variant="outline"
            onClick={() => setEditMode(false)}
            disabled={updating}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={updating}
            className="flex items-center gap-2"
          >
            {updating && <span className="inline-block animate-spin">⏳</span>}
            {updating ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <div className="bg-gray-50 rounded-md p-3">
          <div className="text-sm font-medium text-gray-600">Full Name</div>
          <div className="text-base text-gray-900 font-medium">{user.name || 'Not provided'}</div>
        </div>

        <div className="bg-gray-50 rounded-md p-3">
          <div className="text-sm font-medium text-gray-600">Email</div>
          <div className="text-base text-gray-900 font-medium">{user.email}</div>
        </div>

        {user.phone && (
          <div className="bg-gray-50 rounded-md p-3">
            <div className="text-sm font-medium text-gray-600">Phone Number</div>
            <div className="text-base text-gray-900 font-medium">{user.phone}</div>
          </div>
        )}

        {user.company && (
          <div className="bg-gray-50 rounded-md p-3">
            <div className="text-sm font-medium text-gray-600">Company</div>
            <div className="text-base text-gray-900 font-medium">{user.company}</div>
          </div>
        )}

        {user.location && (
          <div className="bg-gray-50 rounded-md p-3">
            <div className="text-sm font-medium text-gray-600">Location</div>
            <div className="text-base text-gray-900 font-medium">{user.location}</div>
          </div>
        )}

        {user.notes && (
          <div className="bg-gray-50 rounded-md p-3">
            <div className="text-sm font-medium text-gray-600">Notes</div>
            <div className="text-base text-gray-900">{user.notes}</div>
          </div>
        )}
      </div>

      <div className="pt-4 border-t">
        <Button
          variant="outline"
          onClick={() => setEditMode(true)}
        >
          Edit Details
        </Button>
      </div>
    </div>
  )
})

DetailsTab.displayName = 'DetailsTab'
