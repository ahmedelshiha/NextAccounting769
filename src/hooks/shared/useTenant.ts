'use client'

import { useSession } from 'next-auth/react'
import { useMemo } from 'react'

export interface TenantInfo {
  id: string
  name?: string
  slug?: string
  features?: string[]
}

/**
 * Get current tenant information from session
 * 
 * @returns Tenant info or null if not in a tenant context
 * 
 * @example
 * ```tsx
 * const tenant = useTenant()
 * if (tenant?.id) {
 *   return <TenantDashboard tenantId={tenant.id} />
 * }
 * ```
 */
export function useTenant(): TenantInfo | null {
  const { data: session } = useSession()

  return useMemo(() => {
    if (!session?.user) return null

    const user = session.user as any
    const tenantId = user?.tenantId

    if (!tenantId) return null

    return {
      id: tenantId,
      name: user?.tenantName,
      slug: user?.tenantSlug,
      features: user?.tenantFeatures ? JSON.parse(user.tenantFeatures) : undefined,
    }
  }, [session?.user])
}

export default useTenant
