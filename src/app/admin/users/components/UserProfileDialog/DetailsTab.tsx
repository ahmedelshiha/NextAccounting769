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
import { AlertCircle, CheckCircle2 } from 'lucide-react'

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
    if (!editForm.name?.trim()) {
      toast.error('Full name is required')
      return
    }
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
      <div className="max-w-2xl space-y-8">
        {/* Edit Form Sections */}
        <section>
          <div className="flex items-center gap-2 mb-6 pb-4 border-b border-slate-200">
            <AlertCircle className="w-5 h-5 text-blue-600" />
            <h3 className="text-base font-semibold text-slate-900">Edit User Information</h3>
          </div>

          {/* Personal Information */}
          <div className="space-y-6 mb-8">
            <div>
              <Label htmlFor="name" className="text-sm font-semibold text-slate-900 block mb-2">
                Full Name <span className="text-red-600">*</span>
              </Label>
              <Input
                id="name"
                value={editForm.name || ''}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="Enter full name"
                className="h-10 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={updating}
              />
            </div>

            <div>
              <Label htmlFor="email" className="text-sm font-semibold text-slate-900 block mb-2">
                Email Address
              </Label>
              <Input
                id="email"
                type="email"
                value={editForm.email || ''}
                placeholder="Enter email address"
                className="h-10 border border-slate-300 rounded-lg bg-slate-50 cursor-not-allowed"
                disabled={true}
              />
              <p className="text-xs text-slate-600 mt-1">Email cannot be changed</p>
            </div>

            <div>
              <Label htmlFor="phone" className="text-sm font-semibold text-slate-900 block mb-2">
                Phone Number
              </Label>
              <Input
                id="phone"
                type="tel"
                value={editForm.phone || ''}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                placeholder="Enter phone number (e.g., +1 (555) 123-4567)"
                className="h-10 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={updating}
              />
            </div>

            <div>
              <Label htmlFor="company" className="text-sm font-semibold text-slate-900 block mb-2">
                Company
              </Label>
              <Input
                id="company"
                value={editForm.company || ''}
                onChange={(e) => handleInputChange('company', e.target.value)}
                placeholder="Enter company name"
                className="h-10 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={updating}
              />
            </div>

            <div>
              <Label htmlFor="location" className="text-sm font-semibold text-slate-900 block mb-2">
                Location
              </Label>
              <Input
                id="location"
                value={editForm.location || ''}
                onChange={(e) => handleInputChange('location', e.target.value)}
                placeholder="Enter location (e.g., New York, NY)"
                className="h-10 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={updating}
              />
            </div>

            <div>
              <Label htmlFor="notes" className="text-sm font-semibold text-slate-900 block mb-2">
                Additional Notes
              </Label>
              <Textarea
                id="notes"
                value={editForm.notes || ''}
                onChange={(e) => handleInputChange('notes', e.target.value)}
                placeholder="Add any additional notes or information about this user..."
                className="min-h-24 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={updating}
              />
              <p className="text-xs text-slate-600 mt-1">Internal notes visible to admins only</p>
            </div>
          </div>
        </section>

        {/* Action Buttons */}
        <section className="border-t border-slate-200 pt-6 flex items-center gap-3">
          <Button
            onClick={handleSave}
            disabled={updating}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            {updating ? 'Saving...' : 'Save Changes'}
          </Button>
          <Button
            onClick={() => setEditMode(false)}
            disabled={updating}
            variant="outline"
            className="border-slate-300 text-slate-700 hover:bg-slate-50"
          >
            Cancel
          </Button>
        </section>
      </div>
    )
  }

  return (
    <div className="max-w-2xl space-y-8">
      {/* View Mode */}
      <section className="space-y-6">
        <div className="flex items-center gap-2 mb-6 pb-4 border-b border-slate-200">
          <CheckCircle2 className="w-5 h-5 text-green-600" />
          <h3 className="text-base font-semibold text-slate-900">User Information</h3>
        </div>

        {/* Personal Information Display */}
        <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
          <div className="divide-y divide-slate-200">
            {/* Name */}
            <div className="px-6 py-4 hover:bg-slate-50 transition-colors">
              <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-2">Full Name</p>
              <p className="text-base font-medium text-slate-900">{user.name || 'Not provided'}</p>
            </div>

            {/* Email */}
            <div className="px-6 py-4 hover:bg-slate-50 transition-colors">
              <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-2">Email Address</p>
              <p className="text-base font-medium text-slate-900">{user.email}</p>
            </div>

            {/* Phone */}
            {user.phone && (
              <div className="px-6 py-4 hover:bg-slate-50 transition-colors">
                <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-2">Phone Number</p>
                <p className="text-base font-medium text-slate-900">{user.phone}</p>
              </div>
            )}

            {/* Company */}
            {user.company && (
              <div className="px-6 py-4 hover:bg-slate-50 transition-colors">
                <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-2">Company</p>
                <p className="text-base font-medium text-slate-900">{user.company}</p>
              </div>
            )}

            {/* Location */}
            {user.location && (
              <div className="px-6 py-4 hover:bg-slate-50 transition-colors">
                <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-2">Location</p>
                <p className="text-base font-medium text-slate-900">{user.location}</p>
              </div>
            )}

            {/* Notes */}
            {user.notes && (
              <div className="px-6 py-4 hover:bg-slate-50 transition-colors">
                <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-2">Notes</p>
                <p className="text-base text-slate-900 whitespace-pre-wrap">{user.notes}</p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Edit Button */}
      <section className="border-t border-slate-200 pt-6">
        <Button
          onClick={() => setEditMode(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white"
        >
          Edit Information
        </Button>
      </section>
    </div>
  )
})

DetailsTab.displayName = 'DetailsTab'
