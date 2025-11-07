'use client'

import React from 'react'
import { useAdminWorkBenchFeature } from '@/hooks/useAdminWorkBenchFeature'
import { ExecutiveDashboardTab } from './tabs/ExecutiveDashboardTab'
import AdminWorkBench from './workbench/AdminWorkBench'
import { useUsersContext } from '../contexts/UsersContextProvider'

/**
 * Feature-flag wrapper for gradual dashboard replacement
 *
 * Enables staged rollout of new AdminWorkBench UI:
 * - When feature flag is enabled: renders new AdminWorkBench
 * - When feature flag is disabled: renders legacy ExecutiveDashboardTab
 * - Removes routing complexity from page.tsx
 *
 * Environment variables:
 * - NEXT_PUBLIC_ADMIN_WORKBENCH_ENABLED: Global feature flag (true/false)
 * - NEXT_PUBLIC_ADMIN_WORKBENCH_ROLLOUT_PERCENTAGE: Canary rollout (0-100)
 * - NEXT_PUBLIC_ADMIN_WORKBENCH_TARGET_USERS: Target user roles
 * - NEXT_PUBLIC_ADMIN_WORKBENCH_BETA_TESTERS: Beta tester user IDs
 */
export default function ExecutiveDashboardTabWrapper() {
  const { enabled } = useAdminWorkBenchFeature()
  const context = useUsersContext()

  return enabled ? (
    <AdminWorkBench />
  ) : (
    <ExecutiveDashboardTab users={context.users} stats={context.stats} />
  )
}
