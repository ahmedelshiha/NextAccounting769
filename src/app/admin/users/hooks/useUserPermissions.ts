import { useCallback, useState } from 'react'
import { apiFetch } from '@/lib/api'
import { PermissionChangeSet } from '@/components/admin/permissions/UnifiedPermissionModal'

interface UseUserPermissionsOptions {
  onSuccess?: (message: string) => void
  onError?: (error: string) => void
  onRefetchUsers?: () => Promise<void>
}

interface UseUserPermissionsReturn {
  savePermissions: (changes: PermissionChangeSet) => Promise<void>
  isSaving: boolean
  error: string | null
}

export function useUserPermissions(options?: UseUserPermissionsOptions): UseUserPermissionsReturn {
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const savePermissions = useCallback(
    async (changes: PermissionChangeSet) => {
      setIsSaving(true)
      setError(null)

      try {
        const response = await apiFetch('/api/admin/permissions/batch', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(changes)
        })

        if (!response.ok) {
          const errorData = await response
            .json()
            .catch(() => ({ error: 'Unknown error' }))
          throw new Error(errorData.error || 'Failed to update permissions')
        }

        await response.json()

        // Refetch users if callback provided
        if (options?.onRefetchUsers) {
          await options.onRefetchUsers()
        }

        const successMessage = `Updated ${changes.targetIds.length} user(s) successfully`
        options?.onSuccess?.(successMessage)
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Failed to update permissions'
        console.error('Permission update failed:', err)
        setError(errorMsg)
        options?.onError?.(errorMsg)
        throw err
      } finally {
        setIsSaving(false)
      }
    },
    [options]
  )

  return {
    savePermissions,
    isSaving,
    error
  }
}
