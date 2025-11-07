'use client'

import React, { useState, useCallback } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
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
import { toast } from 'sonner'
import { UserCreate, UserEdit, UserCreateSchema, UserEditSchema, generateTemporaryPassword } from '@/schemas/users'
import { Copy, RefreshCw } from 'lucide-react'

interface UserFormProps {
  /**
   * Mode: 'create' for new user, 'edit' for existing user
   */
  mode: 'create' | 'edit'

  /**
   * Initial user data (required for edit mode)
   */
  initialData?: Partial<UserEdit>

  /**
   * Callback when form is submitted
   */
  onSubmit: (data: UserCreate | UserEdit) => Promise<void>

  /**
   * Callback when form is cancelled
   */
  onCancel?: () => void

  /**
   * Loading state from parent
   */
  isLoading?: boolean

  /**
   * Show password generation button
   */
  showPasswordGeneration?: boolean
}

export const UserForm = React.forwardRef<HTMLDivElement, UserFormProps>(
  function UserForm({
    mode = 'create',
    initialData,
    onSubmit,
    onCancel,
    isLoading = false,
    showPasswordGeneration = true,
  }, ref) {
    const [tempPassword, setTempPassword] = useState<string | null>(
      initialData?.temporaryPassword || null
    )
    const [isSubmitting, setIsSubmitting] = useState(false)

    const schema = (mode === 'create' ? UserCreateSchema : UserEditSchema) as any
    const {
      register,
      handleSubmit,
      watch,
      setValue,
      formState: { errors },
    } = useForm({
      resolver: zodResolver(schema),
      defaultValues: initialData || {
        role: 'USER',
        isActive: true,
        requiresOnboarding: mode === 'create',
      },
    })

    const role = watch('role')
    const isActive = watch('isActive')

    const handleGeneratePassword = useCallback(() => {
      const newPassword = generateTemporaryPassword()
      setTempPassword(newPassword)
      setValue('temporaryPassword', newPassword)
      toast.success('Temporary password generated')
    }, [setValue])

    const handleCopyPassword = useCallback(() => {
      if (tempPassword) {
        navigator.clipboard.writeText(tempPassword)
        toast.success('Password copied to clipboard')
      }
    }, [tempPassword])

    const onFormSubmit = async (data: UserCreate | UserEdit) => {
      setIsSubmitting(true)
      try {
        await onSubmit(data)
        toast.success(`User ${mode === 'create' ? 'created' : 'updated'} successfully`)
      } catch (error) {
        const message = error instanceof Error ? error.message : 'An error occurred'
        toast.error(message)
      } finally {
        setIsSubmitting(false)
      }
    }

    return (
      <div ref={ref} className="space-y-6">
        {/* Basic Information Section */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-gray-900">Basic Information</h3>

          {/* Name Field */}
          <div className="space-y-2">
            <Label htmlFor="name">Full Name *</Label>
            <Input
              id="name"
              placeholder="John Doe"
              disabled={isSubmitting || isLoading}
              {...register('name')}
              aria-invalid={!!errors.name}
            />
            {errors.name && errors.name.message && (
              <p className="text-sm text-red-500">{String(errors.name.message)}</p>
            )}
          </div>

          {/* Email Field - Readonly in edit mode */}
          <div className="space-y-2">
            <Label htmlFor="email">Email Address *</Label>
            <Input
              id="email"
              type="email"
              placeholder="john@example.com"
              disabled={mode === 'edit' || isSubmitting || isLoading}
              {...register('email')}
              aria-invalid={!!errors.email}
              className={mode === 'edit' ? 'bg-gray-50 cursor-not-allowed' : ''}
            />
            {errors.email && errors.email.message && (
              <p className="text-sm text-red-500">{String(errors.email.message)}</p>
            )}
            {mode === 'edit' && (
              <p className="text-xs text-gray-500">Email cannot be changed</p>
            )}
          </div>

          {/* Phone Field */}
          <div className="space-y-2">
            <Label htmlFor="phone">Phone Number</Label>
            <Input
              id="phone"
              placeholder="+1 (555) 123-4567"
              disabled={isSubmitting || isLoading}
              {...register('phone')}
              aria-invalid={!!errors.phone}
            />
            {errors.phone && errors.phone.message && (
              <p className="text-sm text-red-500">{String(errors.phone.message)}</p>
            )}
          </div>

          {/* Company Field */}
          <div className="space-y-2">
            <Label htmlFor="company">Company</Label>
            <Input
              id="company"
              placeholder="ACME Corp"
              disabled={isSubmitting || isLoading}
              {...register('company')}
              aria-invalid={!!errors.company}
            />
            {errors.company && errors.company.message && (
              <p className="text-sm text-red-500">{String(errors.company.message)}</p>
            )}
          </div>

          {/* Location Field */}
          <div className="space-y-2">
            <Label htmlFor="location">Location</Label>
            <Input
              id="location"
              placeholder="New York, NY"
              disabled={isSubmitting || isLoading}
              {...register('location')}
              aria-invalid={!!errors.location}
            />
            {errors.location && errors.location.message && (
              <p className="text-sm text-red-500">{String(errors.location.message)}</p>
            )}
          </div>
        </div>

        {/* Role & Status Section */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-gray-900">Role & Status</h3>

          {/* Role Select */}
          <div className="space-y-2">
            <Label htmlFor="role">Role *</Label>
            <Select
              value={role}
              onValueChange={(value) => setValue('role', value as any)}
              disabled={isSubmitting || isLoading}
            >
              <SelectTrigger id="role" aria-invalid={!!errors.role}>
                <SelectValue placeholder="Select a role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="USER">User</SelectItem>
                <SelectItem value="TEAM_MEMBER">Team Member</SelectItem>
                <SelectItem value="TEAM_LEAD">Team Lead</SelectItem>
                <SelectItem value="ADMIN">Administrator</SelectItem>
              </SelectContent>
            </Select>
            {errors.role && errors.role.message && (
              <p className="text-sm text-red-500">{String(errors.role.message)}</p>
            )}
          </div>

          {/* Active Status Checkbox */}
          <div className="space-y-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                {...register('isActive')}
                disabled={isSubmitting || isLoading}
                className="h-4 w-4 rounded border-gray-300"
              />
              <span className="text-sm font-medium text-gray-700">Active</span>
            </label>
            <p className="text-xs text-gray-500">
              {isActive ? 'User can access the system' : 'User access is disabled'}
            </p>
          </div>

          {/* Onboarding Required */}
          {mode === 'create' && (
            <div className="space-y-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  {...register('requiresOnboarding')}
                  disabled={isSubmitting || isLoading}
                  className="h-4 w-4 rounded border-gray-300"
                  defaultChecked
                />
                <span className="text-sm font-medium text-gray-700">
                  Requires Onboarding
                </span>
              </label>
              <p className="text-xs text-gray-500">
                Send onboarding workflow to this user
              </p>
            </div>
          )}
        </div>

        {/* Password Section - Create Mode Only */}
        {mode === 'create' && showPasswordGeneration && (
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-gray-900">Temporary Password</h3>
            
            <div className="space-y-2">
              <Label htmlFor="tempPassword">Generated Password</Label>
              <div className="flex gap-2">
                <Input
                  id="tempPassword"
                  value={tempPassword || ''}
                  readOnly
                  disabled
                  placeholder="Click 'Generate' to create a password"
                  className="font-mono text-sm bg-gray-50"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleGeneratePassword}
                  disabled={isSubmitting || isLoading}
                  className="whitespace-nowrap"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Generate
                </Button>
                {tempPassword && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleCopyPassword}
                    className="whitespace-nowrap"
                  >
                    <Copy className="h-4 w-4 mr-2" />
                    Copy
                  </Button>
                )}
              </div>
              <p className="text-xs text-gray-500">
                User will be required to change this password on first login
              </p>
            </div>
          </div>
        )}

        {/* Notes Section */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-gray-900">Additional Information</h3>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              placeholder="Internal notes about this user..."
              disabled={isSubmitting || isLoading}
              {...register('notes')}
              aria-invalid={!!errors.notes}
              className="min-h-24"
            />
            {errors.notes && errors.notes.message && (
              <p className="text-sm text-red-500">{String(errors.notes.message)}</p>
            )}
          </div>
        </div>

        {/* Form Actions */}
        <div className="flex gap-2 pt-4 border-t">
          <Button
            type="submit"
            onClick={handleSubmit(onFormSubmit)}
            disabled={isSubmitting || isLoading}
            className="flex-1"
          >
            {isSubmitting || isLoading ? (
              <>
                <span className="inline-block w-4 h-4 mr-2 border-2 border-white border-t-transparent rounded-full animate-spin" />
                {mode === 'create' ? 'Creating...' : 'Saving...'}
              </>
            ) : (
              mode === 'create' ? 'Create User' : 'Save Changes'
            )}
          </Button>
          {onCancel && (
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isSubmitting || isLoading}
            >
              Cancel
            </Button>
          )}
        </div>
      </div>
    )
  }
)

UserForm.displayName = 'UserForm'
