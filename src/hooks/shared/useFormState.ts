'use client'

import { useState, useCallback, useEffect } from 'react'

export interface FormState {
  isDirty: boolean
  isSubmitting: boolean
  errors: Record<string, string>
}

interface UseFormStateOptions<T> {
  onSubmit?: (data: T) => Promise<void>
  onSuccess?: () => void
  onError?: (error: Error) => void
}

/**
 * Manage form state with dirty tracking, submission, and error handling
 * 
 * @example
 * ```tsx
 * const { data, isDirty, errors, updateField, reset, submit } = useFormState(
 *   { name: '', email: '' },
 *   { onSubmit: async (data) => { await api.save(data) } }
 * )
 * ```
 */
export function useFormState<T extends Record<string, any>>(
  initialData: T,
  options: UseFormStateOptions<T> = {}
) {
  const { onSubmit, onSuccess, onError } = options

  const [data, setData] = useState<T>(initialData)
  const [originalData, setOriginalData] = useState<T>(initialData)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const isDirty = JSON.stringify(data) !== JSON.stringify(originalData)

  const updateField = useCallback((key: keyof T, value: any) => {
    setData((prev) => ({ ...prev, [key]: value }))
    // Clear error for this field on change
    if (errors[key as string]) {
      setErrors((prev) => {
        const { [key]: _, ...rest } = prev
        return rest
      })
    }
  }, [errors])

  const updateFields = useCallback((fields: Partial<T>) => {
    setData((prev) => ({ ...prev, ...fields }))
  }, [])

  const setFieldError = useCallback((field: string, error: string) => {
    setErrors((prev) => ({ ...prev, [field]: error }))
  }, [])

  const clearFieldError = useCallback((field: string) => {
    setErrors((prev) => {
      const { [field]: _, ...rest } = prev
      return rest
    })
  }, [])

  const clearErrors = useCallback(() => {
    setErrors({})
  }, [])

  const reset = useCallback((newData?: Partial<T>) => {
    const resetData = newData ? { ...initialData, ...newData } : initialData
    setData(resetData)
    setOriginalData(resetData)
    setErrors({})
  }, [initialData])

  const submit = useCallback(
    async (e?: React.FormEvent) => {
      if (e) {
        e.preventDefault()
      }

      if (!onSubmit) {
        console.warn('No onSubmit handler provided to useFormState')
        return
      }

      setIsSubmitting(true)
      setErrors({})

      try {
        await onSubmit(data)
        setOriginalData(data)
        onSuccess?.()
      } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error))
        if (err.message.includes('validation')) {
          // Handle validation errors
          setErrors({ _form: err.message })
        } else {
          setErrors({ _form: err.message })
        }
        onError?.(err)
      } finally {
        setIsSubmitting(false)
      }
    },
    [data, onSubmit, onSuccess, onError]
  )

  return {
    // Data
    data,
    originalData,

    // State
    isDirty,
    isSubmitting,
    errors,
    hasErrors: Object.keys(errors).length > 0,

    // Field updates
    updateField,
    updateFields,

    // Error handling
    setFieldError,
    clearFieldError,
    clearErrors,

    // Form actions
    reset,
    submit,
  }
}

export default useFormState
