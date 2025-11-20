'use client'

import { useSession } from 'next-auth/react'
import { useMemo } from 'react'

export interface CurrentUser {
  id: string
  email: string
  name?: string
  image?: string
  role: string
  tenantId?: string
}

/**
 * Get current authenticated user data
 * 
 * @returns Current user data or null if not authenticated
 * 
 * @example
 * ```tsx
 * const user = useCurrentUser()
 * return <div>Welcome, {user?.name}!</div>
 * ```
 */
export function useCurrentUser(): CurrentUser | null {
  const { data: session } = useSession()

  return useMemo(() => {
    if (!session?.user) return null

    const user = session.user as any

    return {
      id: user?.id || '',
      email: user?.email || '',
      name: user?.name,
      image: user?.image,
      role: user?.role ? (user.role === 'STAFF' ? 'TEAM_MEMBER' : user.role) : 'CLIENT',
      tenantId: user?.tenantId,
    }
  }, [session?.user])
}

export default useCurrentUser
