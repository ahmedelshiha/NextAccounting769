/**
 * Builder.io Configuration Module
 *
 * This module handles all Builder.io API interactions and configuration.
 * Requires environment variables:
 * - NEXT_PUBLIC_BUILDER_API_KEY: Public API key from Builder.io dashboard
 * - NEXT_PUBLIC_BUILDER_SPACE: Space ID from Builder.io account
 * - BUILDER_PRIVATE_API_KEY: Private API key for server-side operations (optional)
 */

export interface BuilderConfig {
  apiKey: string
  space: string
  isEnabled: boolean
}

export function getBuilderConfig(): BuilderConfig {
  const apiKey = process.env.NEXT_PUBLIC_BUILDER_API_KEY || ''
  const space = process.env.NEXT_PUBLIC_BUILDER_SPACE || ''

  return {
    apiKey,
    space,
    isEnabled: !!(apiKey && space)
  }
}

export const BUILDER_MODELS = {
  ADMIN_WORKBENCH: 'admin-workbench-main',
  ADMIN_WORKBENCH_HEADER: 'admin-workbench-header',
  ADMIN_WORKBENCH_METRICS: 'admin-workbench-metrics',
  ADMIN_WORKBENCH_SIDEBAR: 'admin-workbench-sidebar',
  ADMIN_WORKBENCH_FOOTER: 'admin-workbench-footer'
}

export const BUILDER_MODEL_DEFINITIONS = {
  [BUILDER_MODELS.ADMIN_WORKBENCH]: {
    name: 'Admin Workbench Main',
    description: 'Main AdminWorkBench dashboard layout',
    inputs: [
      {
        name: 'headerContent',
        type: 'reference',
        model: 'section'
      },
      {
        name: 'metricsContent',
        type: 'reference',
        model: 'section'
      },
      {
        name: 'sidebarContent',
        type: 'reference',
        model: 'section'
      },
      {
        name: 'footerContent',
        type: 'reference',
        model: 'section'
      }
    ]
  },
  [BUILDER_MODELS.ADMIN_WORKBENCH_HEADER]: {
    name: 'Admin Workbench Header',
    description: 'Header section with quick actions',
    inputs: []
  },
  [BUILDER_MODELS.ADMIN_WORKBENCH_METRICS]: {
    name: 'Admin Workbench Metrics',
    description: 'KPI metrics cards grid',
    inputs: []
  },
  [BUILDER_MODELS.ADMIN_WORKBENCH_SIDEBAR]: {
    name: 'Admin Workbench Sidebar',
    description: 'Sidebar with filters and analytics widgets',
    inputs: []
  },
  [BUILDER_MODELS.ADMIN_WORKBENCH_FOOTER]: {
    name: 'Admin Workbench Footer',
    description: 'Footer with bulk actions controls',
    inputs: []
  }
}
