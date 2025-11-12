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
import { Copy, RefreshCw, Mail, Phone, Building, MapPin, Shield, Lock, FileText } from 'lucide-react'

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

export const UserForm = React.forwardRef<HTMLFormElement, UserFormProps>(
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
        role: 'CLIENT',
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
      <form ref={ref} onSubmit={handleSubmit(onFormSubmit)} className="space-y-8">
        {/* Personal Information Section */}
        <section>
          <div className="flex items-center gap-2 mb-6 pb-4 border-b border-slate-200">
            <Mail className="w-5 h-5 text-blue-600" />
            <h2 className="text-lg font-semibold text-slate-900">Personal Information</h2>
          </div>

          <div className="bg-white border border-slate-200 rounded-lg p-6 space-y-6">
            {/* Name Field */}
            <div className="space-y-2">
              <Label htmlFor="name" className="text-sm font-semibold text-slate-900">
                Full Name <span className="text-red-600">*</span>
              </Label>
              <Input
                id="name"
                placeholder="John Doe"
                disabled={isSubmitting || isLoading}
                {...register('name')}
                aria-invalid={!!errors.name}
                className="h-10 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              {errors.name && errors.name.message && (
                <p className="text-sm text-red-600 font-medium">{String(errors.name.message)}</p>
              )}
            </div>

            {/* Email Field */}
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-semibold text-slate-900">
                Email Address <span className="text-red-600">*</span>
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="john.doe@example.com"
                disabled={mode === 'edit' || isSubmitting || isLoading}
                {...register('email')}
                aria-invalid={!!errors.email}
                className={`h-10 border border-slate-300 rounded-lg ${mode === 'edit' ? 'bg-slate-50 cursor-not-allowed' : 'focus:ring-2 focus:ring-blue-500 focus:border-transparent'}`}
              />
              {errors.email && errors.email.message && (
                <p className="text-sm text-red-600 font-medium">{String(errors.email.message)}</p>
              )}
              {mode === 'edit' && (
                <p className="text-xs text-slate-600">Email address cannot be changed</p>
              )}
            </div>

            {/* Phone Field */}
            <div className="space-y-2">
              <Label htmlFor="phone" className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                <Phone className="w-4 h-4 text-slate-500" />
                Phone Number
              </Label>
              <Input
                id="phone"
                placeholder="+1 (555) 123-4567"
                disabled={isSubmitting || isLoading}
                {...register('phone')}
                aria-invalid={!!errors.phone}
                className="h-10 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              {errors.phone && errors.phone.message && (
                <p className="text-sm text-red-600 font-medium">{String(errors.phone.message)}</p>
              )}
            </div>

            {/* Company Field */}
            <div className="space-y-2">
              <Label htmlFor="company" className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                <Building className="w-4 h-4 text-slate-500" />
                Company
              </Label>
              <Input
                id="company"
                placeholder="ACME Corporation"
                disabled={isSubmitting || isLoading}
                {...register('company')}
                aria-invalid={!!errors.company}
                className="h-10 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              {errors.company && errors.company.message && (
                <p className="text-sm text-red-600 font-medium">{String(errors.company.message)}</p>
              )}
            </div>

            {/* Location Field */}
            <div className="space-y-2">
              <Label htmlFor="location" className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-slate-500" />
                Location
              </Label>
              <Input
                id="location"
                placeholder="New York, NY"
                disabled={isSubmitting || isLoading}
                {...register('location')}
                aria-invalid={!!errors.location}
                className="h-10 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              {errors.location && errors.location.message && (
                <p className="text-sm text-red-600 font-medium">{String(errors.location.message)}</p>
              )}
            </div>
          </div>
        </section>

        {/* Role & Access Section */}
        <section>
          <div className="flex items-center gap-2 mb-6 pb-4 border-b border-slate-200">
            <Shield className="w-5 h-5 text-blue-600" />
            <h2 className="text-lg font-semibold text-slate-900">Role & Access</h2>
          </div>

          <div className="bg-white border border-slate-200 rounded-lg p-6 space-y-6">
            {/* Role Select */}
            <div className="space-y-2">
              <Label htmlFor="role" className="text-sm font-semibold text-slate-900">
                Role <span className="text-red-600">*</span>
              </Label>
              <Select
                value={role}
                onValueChange={(value) => setValue('role', value as any)}
                disabled={isSubmitting || isLoading}
              >
                <SelectTrigger id="role" aria-invalid={!!errors.role} className="h-10 border border-slate-300">
                  <SelectValue placeholder="Select a role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="CLIENT">Client</SelectItem>
                  <SelectItem value="TEAM_MEMBER">Team Member</SelectItem>
                  <SelectItem value="STAFF">Staff</SelectItem>
                  <SelectItem value="TEAM_LEAD">Team Lead</SelectItem>
                  <SelectItem value="ADMIN">Administrator</SelectItem>
                </SelectContent>
              </Select>
              {errors.role && errors.role.message && (
                <p className="text-sm text-red-600 font-medium">{String(errors.role.message)}</p>
              )}
              <p className="text-xs text-slate-600">Defines the user&apos;s access level and permissions</p>
            </div>

            {/* Active Status Checkbox */}
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  {...register('isActive')}
                  disabled={isSubmitting || isLoading}
                  className="h-4 w-4 rounded border-slate-300 mt-1"
                />
                <div>
                  <span className="text-sm font-semibold text-slate-900">Account Active</span>
                  <p className="text-xs text-slate-600 mt-1">
                    {isActive ? 'User can access the system' : 'User access is disabled'}
                  </p>
                </div>
              </label>
            </div>

            {/* Onboarding Required */}
            {mode === 'create' && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    {...register('requiresOnboarding')}
                    disabled={isSubmitting || isLoading}
                    className="h-4 w-4 rounded border-blue-300 mt-1"
                    defaultChecked
                  />
                  <div>
                    <span className="text-sm font-semibold text-slate-900">Requires Onboarding</span>
                    <p className="text-xs text-slate-600 mt-1">
                      Send onboarding workflow and instructions to this user
                    </p>
                  </div>
                </label>
              </div>
            )}
          </div>
        </section>

        {/* Password Section - Create Mode Only */}
        {mode === 'create' && showPasswordGeneration && (
          <section>
            <div className="flex items-center gap-2 mb-6 pb-4 border-b border-slate-200">
              <Lock className="w-5 h-5 text-blue-600" />
              <h2 className="text-lg font-semibold text-slate-900">Temporary Password</h2>
            </div>

            <div className="bg-white border border-slate-200 rounded-lg p-6 space-y-4">
              <p className="text-sm text-slate-600">
                Generate a temporary password for this user. They will be required to change it on first login.
              </p>
              <div className="space-y-2">
                <Label htmlFor="tempPassword" className="text-sm font-semibold text-slate-900">
                  Generated Password
                </Label>
                <div className="flex gap-2">
                  <Input
                    id="tempPassword"
                    value={tempPassword || ''}
                    readOnly
                    disabled
                    placeholder="Click 'Generate' to create a password"
                    className="font-mono text-sm bg-slate-50 border border-slate-300 flex-1"
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
              </div>
            </div>
          </section>
        )}

        {/* Additional Notes Section */}
        <section>
          <div className="flex items-center gap-2 mb-6 pb-4 border-b border-slate-200">
            <FileText className="w-5 h-5 text-blue-600" />
            <h2 className="text-lg font-semibold text-slate-900">Additional Information</h2>
          </div>

          <div className="bg-white border border-slate-200 rounded-lg p-6 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="notes" className="text-sm font-semibold text-slate-900">
                Notes
              </Label>
              <Textarea
                id="notes"
                placeholder="Add internal notes about this user. Visible to admins only."
                disabled={isSubmitting || isLoading}
                {...register('notes')}
                aria-invalid={!!errors.notes}
                className="min-h-24 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              {errors.notes && errors.notes.message && (
                <p className="text-sm text-red-600 font-medium">{String(errors.notes.message)}</p>
              )}
              <p className="text-xs text-slate-600">Internal notes are visible to administrators only</p>
            </div>
          </div>
        </section>

        {/* Form Actions */}
        <section className="border-t border-slate-200 pt-6 flex justify-between items-center">
          <div className="flex gap-3">
            <Button
              type="submit"
              disabled={isSubmitting || isLoading}
              className="bg-blue-600 hover:bg-blue-700 text-white"
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
        </section>
      </form>
    )
  }
)

UserForm.displayName = 'UserForm'
