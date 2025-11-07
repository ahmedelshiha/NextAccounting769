import { useState, useCallback } from 'react'
import { toast } from 'sonner'

export type FormMode = 'create' | 'edit'

export interface ValidationRule {
  validate: (value: any, formData: any) => boolean
  message: string
}

export interface FieldValidation {
  [key: string]: ValidationRule | ValidationRule[]
}

export interface EntityFormConfig {
  endpoint: (mode: FormMode, id?: string) => string
  method: (mode: FormMode) => 'POST' | 'PATCH' | 'PUT'
  successMessage: (mode: FormMode) => string
  onSuccess?: (id: string) => void
  onError?: (error: string) => void
}

/**
 * Unified Entity Form Hook
 *
 * Consolidates form handling logic used across:
 * - ClientFormModal
 * - TeamMemberFormModal
 * - CreateUserModal
 * - And any other entity form modals
 *
 * Features:
 * - Generic form state management
 * - Field-level validation rules
 * - Error handling and display
 * - Loading states
 * - API submission with error handling
 * - Toast notifications
 *
 * @example
 * const form = useEntityForm<ClientFormData>({
 *   initialData: {
 *     name: '',
 *     email: '',
 *     tier: 'INDIVIDUAL'
 *   },
 *   validation: {
 *     name: { validate: (v) => !!v.trim(), message: 'Name is required' },
 *     email: [
 *       { validate: (v) => !!v.trim(), message: 'Email is required' },
 *       { validate: (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v), message: 'Invalid email' }
 *     ]
 *   },
 *   endpoint: (mode, id) => mode === 'create'
 *     ? '/api/clients'
 *     : `/api/clients/${id}`,
 *   method: (mode) => mode === 'create' ? 'POST' : 'PATCH',
 *   successMessage: (mode) => mode === 'create'
 *     ? 'Client created successfully'
 *     : 'Client updated successfully'
 * })
 */
export function useEntityForm<T extends Record<string, any>>(config: {
  initialData: T
  validation?: FieldValidation
  config: EntityFormConfig
  entityId?: string
  mode?: FormMode
}) {
  const {
    initialData,
    validation = {},
    config: apiConfig,
    entityId,
    mode = 'create'
  } = config

  const [formData, setFormData] = useState<T>(initialData)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<keyof T, string>>>({})

  const handleChange = useCallback((field: keyof T, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    setError(null)
    setFieldErrors((prev) => ({ ...prev, [field]: undefined }))
  }, [])

  const validateForm = useCallback((): boolean => {
    const newFieldErrors: Partial<Record<keyof T, string>> = {}
    let hasErrors = false

    // Validate each field with configured rules
    for (const [field, rules] of Object.entries(validation)) {
      const value = formData[field as keyof T]
      const ruleList = Array.isArray(rules) ? rules : [rules]

      for (const rule of ruleList) {
        if (!rule.validate(value, formData)) {
          newFieldErrors[field as keyof T] = rule.message
          hasErrors = true
          break // Stop at first error for this field
        }
      }
    }

    if (hasErrors) {
      setFieldErrors(newFieldErrors)
      const firstErrorMessage = Object.values(newFieldErrors)[0]
      setError(firstErrorMessage || 'Please fix the validation errors')
      return false
    }

    return true
  }, [formData, validation])

  const submit = useCallback(
    async (customData?: Partial<T>): Promise<boolean> => {
      if (!validateForm()) {
        return false
      }

      setIsSubmitting(true)
      setError(null)

      try {
        const submitData = customData ? { ...formData, ...customData } : formData
        const endpoint = apiConfig.endpoint(mode, entityId)
        const method = apiConfig.method(mode)

        const response = await fetch(endpoint, {
          method,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(submitData)
        })

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}))
          throw new Error(
            errorData.message || `Failed to ${mode === 'create' ? 'create' : 'update'} entity`
          )
        }

        const result = await response.json()
        const successMsg = apiConfig.successMessage(mode)
        toast.success(successMsg)

        apiConfig.onSuccess?.(result.id || entityId || '')

        return true
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'An error occurred'
        setError(errorMessage)
        toast.error(errorMessage)
        apiConfig.onError?.(errorMessage)
        return false
      } finally {
        setIsSubmitting(false)
      }
    },
    [formData, mode, entityId, apiConfig, validateForm]
  )

  const reset = useCallback(() => {
    setFormData(initialData)
    setError(null)
    setFieldErrors({})
  }, [initialData])

  return {
    // State
    formData,
    isSubmitting,
    error,
    fieldErrors,
    mode,

    // Actions
    handleChange,
    submit,
    reset,
    validateForm,

    // Direct setters for advanced use
    setFormData,
    setError,
    setFieldErrors
  }
}
