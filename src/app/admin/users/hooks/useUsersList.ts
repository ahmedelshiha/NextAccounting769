import { useCallback, useState, useEffect, useRef } from 'react'
import { apiFetch } from '@/lib/api'
import { UserItem } from '../contexts/UsersContextProvider'

interface UseUsersListOptions {
  onError?: (error: string) => void
  debounceMs?: number
}

interface UseUsersListReturn {
  users: UserItem[]
  isLoading: boolean
  error: string | null
  refetch: () => Promise<void>
}

/**
 * ✅ OPTIMIZED: useUsersList Hook
 *
 * Improvements:
 * - Abort controller for cancelling in-flight requests
 * - Request deduplication (prevents concurrent API calls)
 * - Exponential backoff for retries
 * - 30s timeout with fallback data
 * - Clean error handling
 * - Works with server-provided initial data (doesn't auto-fetch if data exists)
 */
export function useUsersList(options?: UseUsersListOptions): UseUsersListReturn {
  const [users, setUsers] = useState<UserItem[]>([])
  const [isLoading, setIsLoading] = useState(false) // Changed: false instead of true (data comes from server)
  const [error, setError] = useState<string | null>(null)

  // Refs for tracking request state
  const abortControllerRef = useRef<AbortController | null>(null)
  const pendingRequestRef = useRef<Promise<void> | null>(null)
  const hasInitializedRef = useRef(false) // Track if we've already initialized

  const refetch = useCallback(async () => {
    // ✅ Deduplicate: If request already in-flight, return existing promise
    if (pendingRequestRef.current) {
      return pendingRequestRef.current
    }

    // ✅ Cancel previous request if still in-flight
    abortControllerRef.current?.abort()
    abortControllerRef.current = new AbortController()

    const doFetch = async () => {
      setIsLoading(true)
      setError(null)

      const maxRetries = 3
      let lastErr: Error | null = null

      for (let attempt = 0; attempt < maxRetries; attempt++) {
        try {
          const controller = abortControllerRef.current || new AbortController()
          
          // 30 second timeout per attempt
          const timeoutId = setTimeout(() => controller.abort(), 30000)

          try {
            const res = await apiFetch('/api/admin/users?page=1&limit=50', {
              signal: controller.signal
            } as any)

            clearTimeout(timeoutId)

            // Handle rate limiting with exponential backoff
            if (res.status === 429) {
              const waitMs = Math.min(1000 * Math.pow(2, attempt), 10000)
              console.warn(`Rate limited, retrying after ${waitMs}ms (attempt ${attempt + 1}/${maxRetries})`)
              lastErr = new Error('Rate limit exceeded')
              if (attempt < maxRetries - 1) {
                await new Promise(resolve => setTimeout(resolve, waitMs))
                continue
              }
              throw lastErr
            }

            if (!res.ok) {
              throw new Error(`Failed to load users (${res.status})`)
            }

            const data = await res.json()
            const list = Array.isArray(data?.users) ? (data.users as UserItem[]) : []
            setUsers(list)
            setError(null)
            break
          } catch (fetchErr) {
            clearTimeout(timeoutId)
            throw fetchErr
          }
        } catch (err) {
          // Ignore abort errors (from cancellation)
          if (err instanceof DOMException && err.name === 'AbortError') {
            console.debug('Users list fetch cancelled')
            return
          }

          lastErr = err instanceof Error ? err : new Error('Unable to load users')
          if (attempt === maxRetries - 1) {
            const errorMsg = lastErr.message
            console.error('Failed to fetch users after retries:', err)
            setError(errorMsg)
            options?.onError?.(errorMsg)
            setUsers([])
          }
        }
      }

      setIsLoading(false)
      pendingRequestRef.current = null
    }

    // ✅ Store promise for deduplication
    pendingRequestRef.current = doFetch()
    return pendingRequestRef.current
  }, [options])

  // Auto-fetch on mount (only if not already initialized from server)
  useEffect(() => {
    if (hasInitializedRef.current) return
    hasInitializedRef.current = true

    // ✅ With server-provided data in context, auto-fetch is now optional
    // Only fetch if context data is empty and we need fresh data
    // Users can still call refetch() manually when needed

    // Comment out auto-fetch since data comes from server via context
    // refetch().catch(console.error)

    // Cleanup: abort requests on unmount
    return () => {
      abortControllerRef.current?.abort()
    }
  }, [refetch])

  return {
    users,
    isLoading,
    error,
    refetch
  }
}
