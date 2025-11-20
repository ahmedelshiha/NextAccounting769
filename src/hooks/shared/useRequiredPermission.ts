'use client'

import { useSession } from 'next-auth/react'
import { hasPermission, type Permission } from '@/lib/permissions'
import { useEffect } from 'react'

/**
 * Require permission or throw error
 * Useful in components that must have specific permissions to render
 * 
 * @throws Error if user doesn't have the required permission
 * 
 * @example
 * ```tsx
 * export function AdminOnly() {
 *   useRequiredPermission('admin', 'access')
 *   return <AdminPanel />
 * }
 * ```
 */
export function useRequiredPermission(
  resource: string,
  action: string
): void {
  const { data: session } = useSession()

  useEffect(() => {
    if (!session?.user) {
      throw new Error('Not authenticated')
    }

    const role = (session.user as any)?.role as string | undefined
    const permission = `${resource}:${action}` as Permission

    if (!hasPermission(role, permission)) {
      throw new Error(
        `Missing permission: ${resource}:${action}`
      )
    }
  }, [session?.user, resource, action])
}

export default useRequiredPermission
