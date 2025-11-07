import { useCallback, useState } from 'react'
import { useSession } from 'next-auth/react'
import { apiFetch } from '@/lib/api'
import { fetchExportBlob } from '@/lib/admin-export'
import { UserItem } from '../contexts/UsersContextProvider'

interface UseUserActionsOptions {
  onSuccess?: (message: string) => void
  onError?: (error: string) => void
  onRefetchUsers?: () => Promise<void>
}

interface UseUserActionsReturn {
  updateUser: (userId: string, data: Partial<UserItem>) => Promise<void>
  updateUserRole: (userId: string, role: UserItem['role']) => Promise<void>
  updateUserStatus: (userId: string, status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED') => Promise<void>
  exportUsers: () => Promise<void>
  isLoading: boolean
  error: string | null
}

export function useUserActions(options?: UseUserActionsOptions): UseUserActionsReturn {
  const { data: session, update: updateSession } = useSession()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const updateUser = useCallback(
    async (userId: string, data: Partial<UserItem>) => {
      setIsLoading(true)
      setError(null)

      try {
        const res = await apiFetch(`/api/admin/users/${encodeURIComponent(userId)}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data)
        })

        if (!res.ok) {
          throw new Error(`Failed to update user (${res.status})`)
        }

        await res.json()
        options?.onSuccess?.('User updated successfully')

        // Refetch users if callback provided
        if (options?.onRefetchUsers) {
          await options.onRefetchUsers()
        }
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Failed to update user'
        console.error('User update failed:', err)
        setError(errorMsg)
        options?.onError?.(errorMsg)
        throw err
      } finally {
        setIsLoading(false)
      }
    },
    [options]
  )

  const updateUserRole = useCallback(
    async (userId: string, role: UserItem['role']) => {
      setIsLoading(true)
      setError(null)

      try {
        const res = await apiFetch(`/api/admin/users/${encodeURIComponent(userId)}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ role })
        })

        if (!res.ok) {
          throw new Error(`Failed (${res.status})`)
        }

        // Update session if changing current user's role
        const me = (session?.user as any)?.id
        if (me && me === userId && typeof updateSession === 'function' && session?.user) {
          try {
            await updateSession({ user: { ...(session.user as any), role } } as any)
          } catch {}
        }

        options?.onSuccess?.('Role updated successfully')

        // Refetch users if callback provided
        if (options?.onRefetchUsers) {
          await options.onRefetchUsers()
        }
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Failed to update role'
        console.error('Role update failed:', err)
        setError(errorMsg)
        options?.onError?.(errorMsg)
        throw err
      } finally {
        setIsLoading(false)
      }
    },
    [session, updateSession, options]
  )

  const updateUserStatus = useCallback(
    async (userId: string, status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED') => {
      setIsLoading(true)
      setError(null)

      try {
        const res = await apiFetch(`/api/admin/users/${encodeURIComponent(userId)}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status })
        })

        if (!res.ok) {
          throw new Error(`Failed to update user status (${res.status})`)
        }

        await res.json()

        const statusLabel = {
          ACTIVE: 'activated',
          INACTIVE: 'deactivated',
          SUSPENDED: 'suspended'
        }[status]

        options?.onSuccess?.(`User ${statusLabel} successfully`)

        // Refetch users if callback provided
        if (options?.onRefetchUsers) {
          await options.onRefetchUsers()
        }
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Failed to update user status'
        console.error('Status update failed:', err)
        setError(errorMsg)
        options?.onError?.(errorMsg)
        throw err
      } finally {
        setIsLoading(false)
      }
    },
    [options]
  )

  const exportUsers = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      const blob = await fetchExportBlob({ entity: 'users', format: 'csv' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `users-${new Date().toISOString().slice(0, 10)}.csv`
      document.body.appendChild(a)
      a.click()
      URL.revokeObjectURL(url)
      document.body.removeChild(a)

      options?.onSuccess?.('Users exported successfully')
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Export failed'
      console.error('Export failed:', err)
      setError(errorMsg)
      options?.onError?.(errorMsg)
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [options])

  return {
    updateUser,
    updateUserRole,
    updateUserStatus,
    exportUsers,
    isLoading,
    error
  }
}
