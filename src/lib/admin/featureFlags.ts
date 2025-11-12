/**
 * Admin Feature Flags
 *
 * Centralized feature flag management for admin dashboard features.
 * NOTE: AdminWorkBench is now permanently enabled in production.
 * Legacy feature flag code retained for backward compatibility.
 */

/**
 * Check if AdminWorkBench (new dashboard UI) is enabled
 *
 * ✅ ALWAYS RETURNS TRUE - AdminWorkBench is the default UI
 * No environment variables are needed.
 *
 * @returns true - AdminWorkBench is always enabled
 */
export const isAdminWorkBenchEnabled = (): boolean => {
  // AdminWorkBench is now the default and only dashboard UI
  return true
}

/**
 * Check if AdminWorkBench is enabled for a specific user
 *
 * ✅ ALWAYS RETURNS TRUE - AdminWorkBench is enabled for all users
 * No environment variables or rollout checks are needed.
 *
 * @param userId - The user ID (unused, kept for backward compatibility)
 * @param userRole - The user's role (unused, kept for backward compatibility)
 * @returns true - AdminWorkBench is enabled for all users
 */
export const isAdminWorkBenchEnabledForUser = (userId: string, userRole?: string): boolean => {
  // AdminWorkBench is now enabled for all users
  return true
}

/**
 * Get AdminWorkBench feature flag configuration
 *
 * ✅ RETURNS PRODUCTION DEFAULTS - No environment variables needed
 * AdminWorkBench is now the default UI for all users in all environments
 */
export const getAdminWorkBenchFeatureFlagConfig = () => {
  return {
    enabled: true,
    rolloutPercentage: 100,
    targetUsers: 'all',
    betaTesters: [],
    description: 'AdminWorkBench UI for user management dashboard (production-ready)',
  }
}
