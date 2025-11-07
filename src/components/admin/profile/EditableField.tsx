"use client"

import { useState, useCallback, useRef, useEffect, memo } from "react"
import VerificationBadge from "./VerificationBadge"
import { ChevronRight, X, Check, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"

export interface EditableFieldProps {
  label: string
  value?: string
  placeholder?: string
  verified?: boolean
  masked?: boolean
  disabled?: boolean
  fieldType?: 'text' | 'email' | 'password'
  onSave?: (newValue: string) => Promise<void>
  onVerify?: () => Promise<void>
  description?: string
}

/**
 * Validate email format
 */
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

/**
 * Get validation error message for field type
 */
function getValidationError(fieldType: string | undefined, value: string): string | null {
  if (!value) return null

  if (fieldType === 'email' && !isValidEmail(value)) {
    return 'Invalid email address'
  }

  if (fieldType === 'text' && value.length < 2) {
    return 'Must be at least 2 characters'
  }

  if (fieldType === 'text' && value.length > 200) {
    return 'Must be less than 200 characters'
  }

  return null
}

function EditableFieldComponent({
  label,
  value,
  placeholder,
  verified,
  masked,
  disabled = false,
  fieldType = 'text',
  onSave,
  onVerify,
  description,
}: EditableFieldProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editValue, setEditValue] = useState(value || "")
  const [saving, setSaving] = useState(false)
  const [verifying, setVerifying] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [isEditing])

  const handleSave = useCallback(async () => {
    if (!onSave) return

    // Validate before saving
    const validationError = getValidationError(fieldType, editValue)
    if (validationError) {
      setError(validationError)
      return
    }

    setSaving(true)
    setError(null)
    try {
      await onSave(editValue)
      setIsEditing(false)
    } catch (e: any) {
      setError(String(e?.message || e))
    } finally {
      setSaving(false)
    }
  }, [editValue, onSave, fieldType])

  const handleCancel = useCallback(() => {
    setEditValue(value || "")
    setIsEditing(false)
    setError(null)
  }, [value])

  const handleVerify = useCallback(async () => {
    if (!onVerify) return
    setVerifying(true)
    setError(null)
    try {
      await onVerify()
    } catch (e: any) {
      setError(String(e?.message || e))
    } finally {
      setVerifying(false)
    }
  }, [onVerify])

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter" && !saving) {
        handleSave()
      } else if (e.key === "Escape") {
        handleCancel()
      }
    },
    [handleSave, handleCancel, saving]
  )

  if (isEditing) {
    const charCount = editValue.length
    const maxChars = 200
    return (
      <div className="border-t border-gray-100 first:border-t-0">
        <div className="px-3 py-3 space-y-2">
          <div className="text-sm font-medium text-gray-900">{label}</div>
          {description && <p className="text-xs text-gray-500">{description}</p>}
          <input
            ref={inputRef}
            type={fieldType === 'password' ? 'password' : fieldType}
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={saving}
            maxLength={maxChars}
            className="w-full px-2 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50"
          />
          <div className="flex justify-between items-start">
            <div className="flex-1">
              {error && <div className="text-xs text-red-600">{error}</div>}
            </div>
            {fieldType !== 'password' && (
              <div className="text-xs text-gray-500 ml-2">
                {charCount}/{maxChars}
              </div>
            )}
          </div>
          <div className="flex gap-2">
            <Button
              size="sm"
              onClick={handleSave}
              disabled={saving || editValue === value || !!error}
              className="flex-1"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Check className="h-4 w-4 mr-1" />}
              Save
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={handleCancel}
              disabled={saving}
              className="flex-1"
            >
              <X className="h-4 w-4 mr-1" />
              Cancel
            </Button>
          </div>
        </div>
      </div>
    )
  }

  const display = value ? (masked ? '•'.repeat(value.length) : value) : placeholder || ""

  return (
    <button
      type="button"
      onClick={() => onSave && setIsEditing(true)}
      disabled={!onSave || disabled}
      className="w-full flex items-center justify-between px-3 py-2 hover:bg-gray-50 rounded disabled:opacity-50 disabled:cursor-not-allowed text-left border-t border-gray-100 first:border-t-0"
    >
      <div className="min-w-0 flex-1">
        <div className="text-sm text-gray-700">{label}</div>
        <div className="text-sm text-gray-900 truncate">{display}</div>
        {description && <p className="text-xs text-gray-500 mt-1">{description}</p>}
      </div>
      <div className="flex items-center gap-2 flex-shrink-0 ml-4">
        {verified ? <VerificationBadge /> : null}
        {onVerify && !verified && (
          <Button
            size="sm"
            variant="outline"
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              handleVerify()
            }}
            disabled={verifying}
            className="whitespace-nowrap"
          >
            {verifying ? <Loader2 className="h-4 w-4 animate-spin" /> : "Verify"}
          </Button>
        )}
        {onSave && <ChevronRight className="h-4 w-4 text-gray-400" />}
      </div>
    </button>
  )
}

export default memo(EditableFieldComponent)
