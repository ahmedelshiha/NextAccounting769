/**
 * Builder.io Configuration Module
 *
 * This module handles all Builder.io API interactions and configuration.
 * Supports both development and production environments with fallback mechanisms.
 *
 * Environment Variables:
 * - NEXT_PUBLIC_BUILDER_API_KEY: Public API key from Builder.io dashboard
 * - NEXT_PUBLIC_BUILDER_SPACE: Space ID from Builder.io account
 * - NEXT_PUBLIC_BUILDER_ENABLED: Enable/disable Builder.io integration (default: true if keys provided)
 * - BUILDER_PRIVATE_API_KEY: Private API key for server-side operations (optional)
 * - NEXT_PUBLIC_BUILDER_CACHE_TIME: Cache duration in milliseconds (default: 300000 = 5 minutes)
 *
 * Setup Instructions:
 * 1. Create Builder.io account at https://builder.io
 * 2. Get API key from Settings > API Keys
 * 3. Get Space ID from Settings > Space
 * 4. Set environment variables in .env.local or deployment platform
 * 5. Models will be auto-created on first fetch if not present
 */

export interface BuilderConfig {
  apiKey: string
  space: string
  isEnabled: boolean
  cacheTime: number
  privateApiKey?: string
}

/**
 * Get Builder.io configuration from environment variables
 * Gracefully falls back to disabled state if keys are missing
 */
export function getBuilderConfig(): BuilderConfig {
  const apiKey = process.env.NEXT_PUBLIC_BUILDER_API_KEY || ''
  const space = process.env.NEXT_PUBLIC_BUILDER_SPACE || ''
  const privateApiKey = process.env.BUILDER_PRIVATE_API_KEY || ''
  const cacheTime = parseInt(process.env.NEXT_PUBLIC_BUILDER_CACHE_TIME || '300000', 10)

  // Check if explicitly disabled
  const explicitlyDisabled = process.env.NEXT_PUBLIC_BUILDER_ENABLED === 'false'

  return {
    apiKey,
    space,
    privateApiKey,
    cacheTime,
    isEnabled: !explicitlyDisabled && !!(apiKey && space)
  }
}

/**
 * Model identifiers for AdminWorkBench CMS integration
 * Used to route content requests to the correct Builder.io model
 */
export const BUILDER_MODELS = {
  ADMIN_WORKBENCH: 'admin-workbench-main',
  ADMIN_WORKBENCH_HEADER: 'admin-workbench-header',
  ADMIN_WORKBENCH_METRICS: 'admin-workbench-metrics',
  ADMIN_WORKBENCH_SIDEBAR: 'admin-workbench-sidebar',
  ADMIN_WORKBENCH_FOOTER: 'admin-workbench-footer',
  ADMIN_WORKBENCH_MAIN: 'admin-workbench-main-content'
} as const

/**
 * Model schema definitions for Builder.io
 * These define the structure and allowed inputs for each editable section
 * Used both for documentation and to auto-create models if needed
 */
export const BUILDER_MODEL_DEFINITIONS = {
  [BUILDER_MODELS.ADMIN_WORKBENCH_HEADER]: {
    name: 'Admin Workbench Header',
    description: 'Header section with quick actions (Add User, Import, Export, Refresh, Audit Trail)',
    preview: '/admin/users?builder-preview=header',
    inputs: [
      {
        name: 'showAddUserButton',
        type: 'boolean',
        defaultValue: true,
        description: 'Show "Add User" button'
      },
      {
        name: 'showImportButton',
        type: 'boolean',
        defaultValue: true,
        description: 'Show "Import" button'
      },
      {
        name: 'showExportButton',
        type: 'boolean',
        defaultValue: true,
        description: 'Show "Export" button'
      },
      {
        name: 'showRefreshButton',
        type: 'boolean',
        defaultValue: true,
        description: 'Show "Refresh" button'
      },
      {
        name: 'showAuditTrailButton',
        type: 'boolean',
        defaultValue: true,
        description: 'Show "Audit Trail" button'
      },
      {
        name: 'customActions',
        type: 'list',
        subFields: [
          { name: 'label', type: 'string' },
          { name: 'icon', type: 'string' },
          { name: 'action', type: 'string' }
        ],
        description: 'Custom action buttons'
      }
    ]
  },

  [BUILDER_MODELS.ADMIN_WORKBENCH_METRICS]: {
    name: 'Admin Workbench Metrics',
    description: 'KPI metrics cards grid (5 columns: Active Users, Pending Approvals, In Progress Workflows, System Health, Cost Per User)',
    preview: '/admin/users?builder-preview=metrics',
    inputs: [
      {
        name: 'showActiveUsersCard',
        type: 'boolean',
        defaultValue: true
      },
      {
        name: 'showPendingApprovalsCard',
        type: 'boolean',
        defaultValue: true
      },
      {
        name: 'showWorkflowsCard',
        type: 'boolean',
        defaultValue: true
      },
      {
        name: 'showSystemHealthCard',
        type: 'boolean',
        defaultValue: true
      },
      {
        name: 'showCostPerUserCard',
        type: 'boolean',
        defaultValue: true
      },
      {
        name: 'cardLayout',
        type: 'enum',
        enum: ['grid', 'carousel', 'list'],
        defaultValue: 'grid',
        description: 'Layout style for metric cards'
      },
      {
        name: 'columnCount',
        type: 'number',
        defaultValue: 5,
        min: 1,
        max: 5,
        description: 'Number of columns in grid (1-5)'
      }
    ]
  },

  [BUILDER_MODELS.ADMIN_WORKBENCH_SIDEBAR]: {
    name: 'Admin Workbench Sidebar',
    description: 'Left sidebar with analytics charts (Role Distribution, User Growth), filters (Role, Status, Date Range), and Recent Activity',
    preview: '/admin/users?builder-preview=sidebar',
    inputs: [
      {
        name: 'showAnalyticsSection',
        type: 'boolean',
        defaultValue: true
      },
      {
        name: 'showRoleDistributionChart',
        type: 'boolean',
        defaultValue: true
      },
      {
        name: 'showUserGrowthChart',
        type: 'boolean',
        defaultValue: true
      },
      {
        name: 'showFiltersSection',
        type: 'boolean',
        defaultValue: true
      },
      {
        name: 'showRoleFilter',
        type: 'boolean',
        defaultValue: true
      },
      {
        name: 'showStatusFilter',
        type: 'boolean',
        defaultValue: true
      },
      {
        name: 'showDateRangeFilter',
        type: 'boolean',
        defaultValue: true
      },
      {
        name: 'showRecentActivitySection',
        type: 'boolean',
        defaultValue: true
      },
      {
        name: 'recentActivityItemCount',
        type: 'number',
        defaultValue: 10,
        min: 1,
        max: 50
      }
    ]
  },

  [BUILDER_MODELS.ADMIN_WORKBENCH_FOOTER]: {
    name: 'Admin Workbench Footer',
    description: 'Footer sticky panel with bulk operations (Select action type, set value, preview, apply, undo)',
    preview: '/admin/users?builder-preview=footer',
    inputs: [
      {
        name: 'showBulkActionsPanel',
        type: 'boolean',
        defaultValue: true
      },
      {
        name: 'bulkActions',
        type: 'list',
        subFields: [
          { name: 'id', type: 'string' },
          { name: 'label', type: 'string' },
          { name: 'description', type: 'string' },
          { name: 'icon', type: 'string' }
        ],
        description: 'Available bulk action options'
      },
      {
        name: 'showPreviewButton',
        type: 'boolean',
        defaultValue: true
      },
      {
        name: 'showApplyButton',
        type: 'boolean',
        defaultValue: true
      },
      {
        name: 'showUndoCapability',
        type: 'boolean',
        defaultValue: true
      }
    ]
  },

  [BUILDER_MODELS.ADMIN_WORKBENCH_MAIN]: {
    name: 'Admin Workbench Main Content',
    description: 'Main content area with user directory, table header, and virtualized table',
    preview: '/admin/users?builder-preview=main',
    inputs: [
      {
        name: 'showDirectoryHeader',
        type: 'boolean',
        defaultValue: true
      },
      {
        name: 'showUserTable',
        type: 'boolean',
        defaultValue: true
      },
      {
        name: 'tableColumnCount',
        type: 'number',
        defaultValue: 6,
        min: 2,
        max: 10,
        description: 'Number of columns in user table'
      },
      {
        name: 'enableInlineEdit',
        type: 'boolean',
        defaultValue: true,
        description: 'Allow double-click editing of user fields'
      },
      {
        name: 'rowsPerPage',
        type: 'number',
        defaultValue: 100,
        min: 10,
        max: 500
      }
    ]
  }
} as const

/**
 * Default section content when Builder.io is disabled or not configured
 * These are used as fallback content
 */
export const BUILDER_SECTION_DEFAULTS = {
  header: {
    title: 'Admin Users Dashboard',
    actionButtons: ['add-user', 'import', 'export', 'refresh', 'audit-trail']
  },
  metrics: {
    cards: ['active-users', 'pending-approvals', 'workflows', 'system-health', 'cost-per-user'],
    layout: 'grid',
    columns: 5
  },
  sidebar: {
    sections: ['analytics', 'filters', 'recent-activity'],
    analytics: ['role-distribution', 'user-growth'],
    filters: ['role', 'status', 'date-range']
  },
  footer: {
    showBulkActions: true,
    actions: ['set-status', 'set-role', 'send-email', 'export', 'delete']
  }
} as const
