'use client'

import { useSession } from 'next-auth/react'
import { hasPermission, type Permission } from '@/lib/permissions'
import { useMemo } from 'react'

/**
 * Check if current user can perform a specific action
 * Returns false if not authenticated or lacks permission
 * 
 * @example
 * ```tsx
 * const canEditService = useCanAction('service', 'update')
 * if (canEditService) {
 *   return <EditButton />
 * }
 * ```
 */
export function useCanAction(resource: string, action: string): boolean {
  const { data: session } = useSession()

  return useMemo(() => {
    if (!session?.user) return false
    const role = (session.user as any)?.role as string | undefined
    const permission = `${resource}:${action}` as Permission
    return hasPermission(role, permission)
  }, [session?.user])
}

export default useCanAction
