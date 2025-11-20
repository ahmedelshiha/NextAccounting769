'use client'

import { useSession } from 'next-auth/react'
import { useMemo } from 'react'

/**
 * Get current user's role
 * 
 * @returns User role (ADMIN, CLIENT, TEAM_MEMBER, etc.) or null if not authenticated
 * 
 * @example
 * ```tsx
 * const role = useUserRole()
 * if (role === 'ADMIN') {
 *   return <AdminMenu />
 * }
 * ```
 */
export function useUserRole(): string | null {
  const { data: session } = useSession()

  return useMemo(() => {
    if (!session?.user) return null
    const role = (session.user as any)?.role as string | undefined
    return role ? (role === 'STAFF' ? 'TEAM_MEMBER' : role) : null
  }, [session?.user])
}

export default useUserRole
