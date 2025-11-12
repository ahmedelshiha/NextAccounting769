'use client'

import { getBuilderConfig } from '@/lib/builder-io/config'

/**
 * Hook to check if Builder.io is configured and enabled
 *
 * @returns boolean indicating if Builder.io CMS is enabled
 */
export function useIsBuilderEnabled(): boolean {
  try {
    const config = getBuilderConfig()
    return config.isEnabled
  } catch {
    return false
  }
}
