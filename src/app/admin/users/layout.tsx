import React, { ReactNode } from 'react'
import { fetchUsersServerSide, fetchStatsServerSide } from './server'
import { UsersContextProvider } from './contexts/UsersContextProvider'
import { getSessionOrBypass } from '@/lib/auth'
import { redirect } from 'next/navigation'

/**
 * ✅ Server-Side Layout for Admin Users Page
 *
 * This layout:
 * 1. Extracts tenant ID from session
 * 2. Fetches data on server (instant availability)
 * 3. Passes initial data to context provider
 * 4. Prevents loading skeletons for initial data
 * 5. Reduces client JavaScript needed
 *
 * Performance benefits:
 * - No API calls from browser
 * - Data in HTML from first request
 * - Faster Time to First Byte (TTFB)
 * - Better SEO
 * - Smaller initial JavaScript bundle
 *
 * Tenant Context Fix:
 * - Extracts tenantId from session instead of relying on AsyncLocalStorage
 * - Passes tenantId to server functions for proper data fetching
 * - Ensures users display correctly
 */

interface UsersLayoutProps {
  children: ReactNode
}

export default async function UsersLayout({ children }: UsersLayoutProps) {
  // ✅ FIX: Extract tenant from session
  const session = await getSessionOrBypass()

  if (!session?.user) {
    redirect('/login')
  }

  const tenantId = (session.user as any)?.tenantId as string | undefined

  // ✅ FIXED: Pass tenantId explicitly to server functions
  // This runs once per page request, not in the browser
  // Server functions will handle missing tenantId gracefully
  const [usersData, statsData] = await Promise.all([
    fetchUsersServerSide(1, 50, tenantId || ''),
    fetchStatsServerSide(tenantId || '')
  ])

  return (
    <UsersContextProvider
      initialUsers={usersData.users}
      initialStats={statsData}
    >
      {children}
    </UsersContextProvider>
  )
}
