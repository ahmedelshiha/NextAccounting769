/**
 * Admin Feature Flags
 *
 * Centralized feature flag management for admin dashboard features.
 * Enables gradual rollout and safe experimentation.
 */

/**
 * Check if AdminWorkBench (new dashboard UI) is enabled
 *
 * Checks in order:
 * 1. Environment variable: NEXT_PUBLIC_ADMIN_WORKBENCH_ENABLED
 * 2. Default: false (disabled by default for safe rollout)
 */
export const isAdminWorkBenchEnabled = (): boolean => {
  // Check environment variable first
  if (typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_ADMIN_WORKBENCH_ENABLED) {
    return process.env.NEXT_PUBLIC_ADMIN_WORKBENCH_ENABLED === 'true'
  }

  // Client-side check
  if (typeof window !== 'undefined') {
    const envEnabled = (window as any).__ENV__?.NEXT_PUBLIC_ADMIN_WORKBENCH_ENABLED
    if (envEnabled !== undefined) {
      return envEnabled === 'true'
    }
  }

  // Default: disabled for safe rollout
  return false
}

/**
 * Check if AdminWorkBench is enabled for a specific user
 *
 * Implements:
 * - User role-based enablement (admins only by default)
 * - Gradual rollout based on user ID hash
 * - Beta tester lists
 *
 * @param userId - The user ID to check
 * @param userRole - The user's role (optional, for role-based targeting)
 * @returns true if enabled for this user
 */
export const isAdminWorkBenchEnabledForUser = (userId: string, userRole?: string): boolean => {
  // Base check: is the feature enabled globally?
  if (!isAdminWorkBenchEnabled()) {
    return false
  }

  // Get the feature flag configuration
  const config = getAdminWorkBenchFeatureFlagConfig()

  // Role-based targeting: only enable for specific roles if configured
  if (config.targetUsers !== 'all' && userRole) {
    const targetRoles = Array.isArray(config.targetUsers) ? config.targetUsers : [config.targetUsers]
    if (!targetRoles.includes(userRole)) {
      return false
    }
  }

  // Gradual rollout: hash the user ID to determine if they should get the feature
  // This ensures consistent rollout (same user always gets same result) while distributing load
  if (config.rolloutPercentage < 100) {
    const hash = hashUserId(userId)
    const percentageThreshold = (config.rolloutPercentage / 100) * 100
    if (hash % 100 >= percentageThreshold) {
      return false
    }
  }

  // Beta tester list: check if user is in the beta list
  if (config.betaTesters && config.betaTesters.length > 0) {
    return config.betaTesters.includes(userId)
  }

  return true
}

/**
 * Simple hash function for consistent user ID distribution
 * @param userId - The user ID to hash
 * @returns A number between 0 and 99
 */
function hashUserId(userId: string): number {
  let hash = 0
  for (let i = 0; i < userId.length; i++) {
    const char = userId.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash // Convert to 32bit integer
  }
  return Math.abs(hash) % 100
}

/**
 * Get AdminWorkBench feature flag configuration
 *
 * Returns metadata about the feature flag status with configurable rollout
 */
export const getAdminWorkBenchFeatureFlagConfig = () => {
  // Get rollout percentage from environment, default to 100%
  const rolloutPercentage = getEnvironmentVariable(
    'NEXT_PUBLIC_ADMIN_WORKBENCH_ROLLOUT_PERCENTAGE',
    '100'
  )
  const targetUsersEnv = getEnvironmentVariable(
    'NEXT_PUBLIC_ADMIN_WORKBENCH_TARGET_USERS',
    'all'
  )
  const betaTesters = getBetaTesterList()

  return {
    enabled: isAdminWorkBenchEnabled(),
    rolloutPercentage: parseInt(rolloutPercentage, 10),
    targetUsers: parseTargetUsers(targetUsersEnv),
    betaTesters,
    description: 'New AdminWorkBench UI for user management dashboard',
  }
}

/**
 * Get environment variable with fallback
 */
function getEnvironmentVariable(key: string, defaultValue: string): string {
  if (typeof process !== 'undefined' && process.env?.[key]) {
    return process.env[key] as string
  }

  if (typeof window !== 'undefined') {
    const envValue = (window as any).__ENV__?.[key]
    if (envValue !== undefined) {
      return envValue
    }
  }

  return defaultValue
}

/**
 * Parse target users configuration
 * Supports: 'all', 'admins', 'beta', or comma-separated role list
 */
function parseTargetUsers(targetUsersStr: string): string | string[] {
  if (targetUsersStr === 'all' || targetUsersStr === 'beta') {
    return targetUsersStr
  }

  if (targetUsersStr === 'admins') {
    return ['ADMIN']
  }

  // Support comma-separated list of roles
  if (targetUsersStr.includes(',')) {
    return targetUsersStr.split(',').map((role) => role.trim().toUpperCase())
  }

  // Single role
  if (targetUsersStr && targetUsersStr !== 'all') {
    return [targetUsersStr.toUpperCase()]
  }

  return 'all'
}

/**
 * Get list of beta tester user IDs from environment
 */
function getBetaTesterList(): string[] {
  const betaListEnv = getEnvironmentVariable('NEXT_PUBLIC_ADMIN_WORKBENCH_BETA_TESTERS', '')
  if (!betaListEnv) {
    return []
  }

  return betaListEnv.split(',').map((id) => id.trim()).filter(Boolean)
}
