import { ComponentType, ReactNode } from 'react'
import dynamic from 'next/dynamic'

/**
 * Configuration for dynamic component loading
 */
export interface DynamicComponentConfig {
  loading?: () => ReactNode
  ssr?: boolean
}

/**
 * Default loading fallback
 */
function DefaultLoadingFallback() {
  return <div className="animate-pulse bg-gray-200 rounded h-12 w-12"></div>
}

/**
 * Get configuration for dynamic component loading
 */
export function getDynamicComponentConfig(
  type: 'admin' | 'modal' | 'modal-heavy' | 'page' | 'feature'
): DynamicComponentConfig {
  const configs: Record<string, DynamicComponentConfig> = {
    admin: {
      loading: DefaultLoadingFallback,
      ssr: false,
    },
    modal: {
      loading: DefaultLoadingFallback,
      ssr: false,
    },
    'modal-heavy': {
      loading: DefaultLoadingFallback,
      ssr: false,
    },
    page: {
      loading: DefaultLoadingFallback,
      ssr: true,
    },
    feature: {
      loading: DefaultLoadingFallback,
      ssr: false,
    },
  }

  return configs[type] || configs.feature
}

/**
 * Create a dynamically imported component
 */
export function createDynamicComponent<T extends ComponentType<any>>(
  importFunc: () => Promise<{ default: T }>,
  type: 'admin' | 'modal' | 'modal-heavy' | 'page' | 'feature' = 'feature'
): T {
  const config = getDynamicComponentConfig(type)

  return dynamic(importFunc, {
    loading: config.loading,
    ssr: config.ssr,
  }) as T
}

/**
 * Heavy components that should be code-split
 */
export const HEAVY_COMPONENTS_TO_SPLIT = {
  AdminDashboard: () =>
    import('@/components/admin/AdminDashboard').then((m) => ({ default: m.default })),
  AdminUsers: () =>
    import('@/app/admin/users/page').then((m) => ({ default: m.default })),
  AdminServices: () =>
    import('@/app/admin/services/page').then((m) => ({ default: m.default })),
  AdminBookings: () =>
    import('@/app/admin/bookings/page').then((m) => ({ default: m.default })),
  AdminTasks: () =>
    import('@/app/admin/tasks/page').then((m) => ({ default: m.default })),
  AdminDocuments: () =>
    import('@/app/admin/documents/page').then((m) => ({ default: m.default })),
  AdminAnalytics: () =>
    import('@/app/admin/analytics/page').then((m) => ({ default: m.default })),
}

/**
 * Type for accessing heavy components dynamically
 */
export type HeavyComponentKey = keyof typeof HEAVY_COMPONENTS_TO_SPLIT

/**
 * Get dynamically imported component
 */
export function getDynamicComponent(key: HeavyComponentKey) {
  const componentImport = HEAVY_COMPONENTS_TO_SPLIT[key]
  if (!componentImport) {
    throw new Error(`Unknown component: ${key}`)
  }

  return createDynamicComponent(componentImport, 'admin')
}
