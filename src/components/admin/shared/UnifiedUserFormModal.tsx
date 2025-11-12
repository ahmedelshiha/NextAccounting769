'use client'

import React, { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { AlertCircle, Loader2 } from 'lucide-react'
import { useEntityForm, type EntityFormConfig, type FieldValidation } from '@/app/admin/users/hooks'
import { trackEvent } from '@/lib/analytics'

type UserRole = 'CLIENT' | 'TEAM_MEMBER' | 'TEAM_LEAD' | 'STAFF' | 'ADMIN'

interface UnifiedUserFormData {
  name: string
  email: string
  role: UserRole
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED'
  phone?: string
  company?: string
  tier?: 'INDIVIDUAL' | 'SMB' | 'ENTERPRISE'
  department?: string
  title?: string
  specialties?: string[]
  certifications?: string[]
  workingHours?: string
  bookingBuffer?: number
  autoAssign?: boolean
  experienceYears?: number
  notes?: string
}

interface UnifiedUserFormModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess?: (userId: string) => void
  mode?: 'create' | 'edit'
  initialData?: Partial<UnifiedUserFormData & { id?: string }>
  preselectedRole?: UserRole
}

export const UnifiedUserFormModal = React.forwardRef<HTMLDivElement, UnifiedUserFormModalProps>(
  function UnifiedUserFormModal({
    isOpen,
    onClose,
    onSuccess,
    mode = 'create',
    initialData,
    preselectedRole,
  }, ref) {
    const [selectedRole, setSelectedRole] = useState<UserRole>(preselectedRole || initialData?.role || 'CLIENT')

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

    const getValidationRules = (): FieldValidation => {
      const baseValidation: FieldValidation = {
        name: { validate: (v) => !!v?.trim(), message: 'Name is required' },
        email: [
          { validate: (v) => !!v?.trim(), message: 'Email is required' },
          { validate: (v) => emailRegex.test(v), message: 'Invalid email format' },
        ],
      }

      if (selectedRole === 'CLIENT') {
        return baseValidation
      }

      if (selectedRole === 'TEAM_MEMBER' || selectedRole === 'TEAM_LEAD') {
        return {
          ...baseValidation,
          department: { validate: (v) => !!v?.trim(), message: 'Department is required' },
          title: { validate: (v) => !!v?.trim(), message: 'Job title is required' },
        }
      }

      return baseValidation
    }

    const getInitialData = (): UnifiedUserFormData => {
      const defaults = {
        name: '',
        email: '',
        role: selectedRole,
        status: 'ACTIVE' as const,
        phone: '',
        company: '',
        tier: 'INDIVIDUAL' as const,
        department: '',
        title: '',
        specialties: [],
        certifications: [],
        workingHours: '9am-5pm',
        bookingBuffer: 0,
        autoAssign: false,
        experienceYears: 0,
        notes: '',
      }

      return {
        ...defaults,
        ...initialData,
        role: selectedRole,
      }
    }

    const formConfig: EntityFormConfig = {
      endpoint: (mode, id) =>
        mode === 'create' ? '/api/admin/users' : `/api/admin/users/${id}`,
      method: (mode) => (mode === 'create' ? 'POST' : 'PATCH'),
      successMessage: (mode) =>
        mode === 'create'
          ? `${selectedRole.replace(/_/g, ' ')} created successfully`
          : 'User updated successfully',
      onSuccess: (id) => {
        trackEvent('users.create_user', { role: selectedRole })
        onSuccess?.(id)
        onClose()
      },
    }

    const form = useEntityForm<UnifiedUserFormData>({
      initialData: getInitialData(),
      validation: getValidationRules(),
      config: formConfig,
      entityId: initialData?.id,
      mode,
    })

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault()
      form.submit()
    }

    const handleRoleChange = (role: UserRole) => {
      setSelectedRole(role)
      form.handleChange('role' as keyof UnifiedUserFormData, role)
    }

    const renderRoleSpecificFields = () => {
      if (selectedRole === 'CLIENT') {
        return (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="phone" className="text-xs sm:text-sm">Phone</Label>
                <Input
                  id="phone"
                  placeholder="Phone number"
                  value={form.formData.phone || ''}
                  onChange={(e) => form.handleChange('phone' as keyof UnifiedUserFormData, e.target.value)}
                  disabled={form.isSubmitting}
                  className="text-sm"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="company" className="text-xs sm:text-sm">Company</Label>
                <Input
                  id="company"
                  placeholder="Company name"
                  value={form.formData.company || ''}
                  onChange={(e) => form.handleChange('company' as keyof UnifiedUserFormData, e.target.value)}
                  disabled={form.isSubmitting}
                  className="text-sm"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="tier" className="text-xs sm:text-sm">Tier</Label>
              <Select value={form.formData.tier || 'INDIVIDUAL'} onValueChange={(value) => form.handleChange('tier' as keyof UnifiedUserFormData, value)}>
                <SelectTrigger id="tier" className="text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="INDIVIDUAL">Individual</SelectItem>
                  <SelectItem value="SMB">SMB</SelectItem>
                  <SelectItem value="ENTERPRISE">Enterprise</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </>
        )
      }

      if (selectedRole === 'TEAM_MEMBER' || selectedRole === 'TEAM_LEAD') {
        return (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="title" className="text-xs sm:text-sm">Job Title *</Label>
                <Input
                  id="title"
                  placeholder="e.g., Senior Accountant"
                  value={form.formData.title || ''}
                  onChange={(e) => form.handleChange('title' as keyof UnifiedUserFormData, e.target.value)}
                  disabled={form.isSubmitting}
                  className="text-sm"
                />
                {form.fieldErrors.title && <p className="text-xs sm:text-sm text-red-600">{form.fieldErrors.title}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="department" className="text-xs sm:text-sm">Department *</Label>
                <Input
                  id="department"
                  placeholder="e.g., Tax"
                  value={form.formData.department || ''}
                  onChange={(e) => form.handleChange('department' as keyof UnifiedUserFormData, e.target.value)}
                  disabled={form.isSubmitting}
                  className="text-sm"
                />
                {form.fieldErrors.department && <p className="text-xs sm:text-sm text-red-600">{form.fieldErrors.department}</p>}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="phone" className="text-xs sm:text-sm">Phone</Label>
                <Input
                  id="phone"
                  placeholder="Phone number"
                  value={form.formData.phone || ''}
                  onChange={(e) => form.handleChange('phone' as keyof UnifiedUserFormData, e.target.value)}
                  disabled={form.isSubmitting}
                  className="text-sm"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="experienceYears" className="text-xs sm:text-sm">Years of Experience</Label>
                <Input
                  id="experienceYears"
                  type="number"
                  placeholder="0"
                  value={form.formData.experienceYears || 0}
                  onChange={(e) => form.handleChange('experienceYears' as keyof UnifiedUserFormData, parseInt(e.target.value) || 0)}
                  disabled={form.isSubmitting}
                  className="text-sm"
                />
              </div>
            </div>

            {selectedRole === 'TEAM_LEAD' && (
              <div className="space-y-2">
                <Label htmlFor="workingHours" className="text-xs sm:text-sm">Working Hours</Label>
                <Input
                  id="workingHours"
                  placeholder="e.g., 9am-5pm"
                  value={form.formData.workingHours || ''}
                  onChange={(e) => form.handleChange('workingHours' as keyof UnifiedUserFormData, e.target.value)}
                  disabled={form.isSubmitting}
                  className="text-sm"
                />
              </div>
            )}
          </>
        )
      }

      return null
    }

    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent ref={ref} className="w-[95vw] max-w-lg max-h-[90vh] overflow-y-auto p-4 sm:p-6">
          <DialogHeader className="mb-4">
            <DialogTitle className="text-lg sm:text-xl">
              {mode === 'create' ? 'Create New User' : 'Edit User'}
            </DialogTitle>
            <DialogDescription className="text-xs sm:text-sm">
              {mode === 'create' ? 'Add a new user to your system' : 'Update user information'}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            {form.error && (
              <div className="p-3 rounded-lg bg-red-50 border border-red-200 flex gap-2">
                <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-700">{form.error}</p>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="role" className="text-xs sm:text-sm">User Role *</Label>
              <Select value={selectedRole} onValueChange={handleRoleChange} disabled={mode === 'edit'}>
                <SelectTrigger id="role" className="text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="CLIENT">Client</SelectItem>
                  <SelectItem value="TEAM_MEMBER">Team Member</SelectItem>
                  <SelectItem value="TEAM_LEAD">Team Lead</SelectItem>
                  <SelectItem value="STAFF">Staff</SelectItem>
                  <SelectItem value="ADMIN">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="name" className="text-xs sm:text-sm">Name *</Label>
              <Input
                id="name"
                placeholder="User name"
                value={form.formData.name}
                onChange={(e) => form.handleChange('name' as keyof UnifiedUserFormData, e.target.value)}
                disabled={form.isSubmitting}
                className="text-sm"
              />
              {form.fieldErrors.name && <p className="text-xs sm:text-sm text-red-600">{form.fieldErrors.name}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="text-xs sm:text-sm">Email *</Label>
              <Input
                id="email"
                type="email"
                placeholder="user@example.com"
                value={form.formData.email}
                onChange={(e) => form.handleChange('email' as keyof UnifiedUserFormData, e.target.value)}
                disabled={form.isSubmitting}
                className="text-sm"
              />
              {form.fieldErrors.email && <p className="text-xs sm:text-sm text-red-600">{form.fieldErrors.email}</p>}
            </div>

            {renderRoleSpecificFields()}

            <div className="space-y-2">
              <Label htmlFor="status" className="text-xs sm:text-sm">Status</Label>
              <Select value={form.formData.status} onValueChange={(value) => form.handleChange('status' as keyof UnifiedUserFormData, value)}>
                <SelectTrigger id="status" className="text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ACTIVE">Active</SelectItem>
                  <SelectItem value="INACTIVE">Inactive</SelectItem>
                  <SelectItem value="SUSPENDED">Suspended</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes" className="text-xs sm:text-sm">Notes</Label>
              <Textarea
                id="notes"
                placeholder="Additional notes"
                value={form.formData.notes || ''}
                onChange={(e) => form.handleChange('notes' as keyof UnifiedUserFormData, e.target.value)}
                disabled={form.isSubmitting}
                rows={3}
                className="text-sm"
              />
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={form.isSubmitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={form.isSubmitting}
              >
                {form.isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    {mode === 'create' ? 'Creating...' : 'Updating...'}
                  </>
                ) : (
                  mode === 'create' ? 'Create User' : 'Update User'
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    )
  }
)

UnifiedUserFormModal.displayName = 'UnifiedUserFormModal'
