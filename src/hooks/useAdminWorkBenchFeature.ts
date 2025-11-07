import { useMemo } from 'react'
import { useSession } from 'next-auth/react'
import {
  isAdminWorkBenchEnabled,
  isAdminWorkBenchEnabledForUser,
  getAdminWorkBenchFeatureFlagConfig,
} from '@/lib/admin/featureFlags'

/**
 * Hook to check if AdminWorkBench feature is enabled
 *
 * Provides:
 * - Global feature flag status
 * - User-specific feature flag status
 * - Feature flag configuration
 */
export function useAdminWorkBenchFeature() {
  const { data: session } = useSession()

  return useMemo(() => {
    const globalEnabled = isAdminWorkBenchEnabled()
    const userEnabled = session?.user?.id
      ? isAdminWorkBenchEnabledForUser(session.user.id, session.user.role)
      : false
    const config = getAdminWorkBenchFeatureFlagConfig()

    return {
      // Global feature flag status
      globalEnabled,
      // User-specific status (checks role, rollout %, beta testers)
      userEnabled,
      // Should use new UI
      enabled: globalEnabled && userEnabled,
      // Feature flag configuration
      config,
    }
  }, [session?.user?.id, session?.user?.role])
}
