export const PERMISSIONS = {
  SERVICE_REQUESTS_CREATE: 'service_requests.create',
  SERVICE_REQUESTS_READ_ALL: 'service_requests.read.all',
  SERVICE_REQUESTS_READ_OWN: 'service_requests.read.own',
  SERVICE_REQUESTS_UPDATE: 'service_requests.update',
  SERVICE_REQUESTS_DELETE: 'service_requests.delete',
  SERVICE_REQUESTS_ASSIGN: 'service_requests.assign',

  TASKS_CREATE: 'tasks.create',
  TASKS_READ_ALL: 'tasks.read.all',
  TASKS_READ_ASSIGNED: 'tasks.read.assigned',
  TASKS_UPDATE: 'tasks.update',
  TASKS_DELETE: 'tasks.delete',
  TASKS_ASSIGN: 'tasks.assign',

  TEAM_MANAGE: 'team.manage',
  TEAM_VIEW: 'team.view',

  USERS_MANAGE: 'users.manage',
  USERS_VIEW: 'users.view',

  ANALYTICS_VIEW: 'analytics.view',
  ANALYTICS_EXPORT: 'analytics.export',

  // Services management
  SERVICES_VIEW: 'services.view',
  SERVICES_CREATE: 'services.create',
  SERVICES_EDIT: 'services.edit',
  SERVICES_DELETE: 'services.delete',
  SERVICES_BULK_EDIT: 'services.bulk.edit',
  SERVICES_EXPORT: 'services.export',
  SERVICES_ANALYTICS: 'services.analytics',
  SERVICES_MANAGE_FEATURED: 'services.manage.featured',

  // Booking settings management
  BOOKING_SETTINGS_VIEW: 'booking.settings.view',
  BOOKING_SETTINGS_EDIT: 'booking.settings.edit',
  BOOKING_SETTINGS_EXPORT: 'booking.settings.export',
  BOOKING_SETTINGS_IMPORT: 'booking.settings.import',
  BOOKING_SETTINGS_RESET: 'booking.settings.reset',

  // Organization settings
  ORG_SETTINGS_VIEW: 'org.settings.view',
  ORG_SETTINGS_EDIT: 'org.settings.edit',
  ORG_SETTINGS_EXPORT: 'org.settings.export',
  ORG_SETTINGS_IMPORT: 'org.settings.import',
  ORG_SETTINGS_RESET: 'org.settings.reset',

  // Financial settings
  FINANCIAL_SETTINGS_VIEW: 'financial.settings.view',
  FINANCIAL_SETTINGS_EDIT: 'financial.settings.edit',
  FINANCIAL_SETTINGS_EXPORT: 'financial.settings.export',

  // Integration Hub
  INTEGRATION_HUB_VIEW: 'integration.settings.view',
  INTEGRATION_HUB_EDIT: 'integration.settings.edit',
  INTEGRATION_HUB_TEST: 'integration.settings.test',
  INTEGRATION_HUB_SECRETS_WRITE: 'integration.settings.secrets.write',
  INTEGRATIONS_MANAGE: 'integrations.manage',

  // Client Management settings
  CLIENT_SETTINGS_VIEW: 'client.settings.view',
  CLIENT_SETTINGS_EDIT: 'client.settings.edit',
  CLIENT_SETTINGS_EXPORT: 'client.settings.export',
  CLIENT_SETTINGS_IMPORT: 'client.settings.import',

  // Team Management settings
  TEAM_SETTINGS_VIEW: 'team.settings.view',
  TEAM_SETTINGS_EDIT: 'team.settings.edit',
  TEAM_SETTINGS_EXPORT: 'team.settings.export',
  TEAM_SETTINGS_IMPORT: 'team.settings.import',

  // Task & Workflow settings
  TASK_WORKFLOW_SETTINGS_VIEW: 'task.settings.view',
  TASK_WORKFLOW_SETTINGS_EDIT: 'task.settings.edit',
  TASK_WORKFLOW_SETTINGS_EXPORT: 'task.settings.export',
  TASK_WORKFLOW_SETTINGS_IMPORT: 'task.settings.import',

  // Analytics & Reporting settings
  ANALYTICS_REPORTING_SETTINGS_VIEW: 'analytics-reporting.settings.view',
  ANALYTICS_REPORTING_SETTINGS_EDIT: 'analytics-reporting.settings.edit',
  ANALYTICS_REPORTING_SETTINGS_EXPORT: 'analytics-reporting.settings.export',
  ANALYTICS_REPORTING_SETTINGS_IMPORT: 'analytics-reporting.settings.import',

  // Communication settings
  COMMUNICATION_SETTINGS_VIEW: 'communication.settings.view',
  COMMUNICATION_SETTINGS_EDIT: 'communication.settings.edit',
  COMMUNICATION_SETTINGS_EXPORT: 'communication.settings.export',
  COMMUNICATION_SETTINGS_IMPORT: 'communication.settings.import',

  // Security & Compliance settings
  SECURITY_COMPLIANCE_SETTINGS_VIEW: 'security-compliance.settings.view',
  SECURITY_COMPLIANCE_SETTINGS_EDIT: 'security-compliance.settings.edit',

  // System Administration settings
  SYSTEM_ADMIN_SETTINGS_VIEW: 'system-admin.settings.view',
  SYSTEM_ADMIN_SETTINGS_EDIT: 'system-admin.settings.edit',

  // Language management
  LANGUAGES_VIEW: 'languages.view',
  LANGUAGES_MANAGE: 'languages.manage',

  // Reports management
  REPORTS_CREATE: 'reports.create',
  REPORTS_READ: 'reports.read',
  REPORTS_WRITE: 'reports.write',
  REPORTS_DELETE: 'reports.delete',
  REPORTS_GENERATE: 'reports.generate',

  // Advanced exports
  USERS_EXPORT: 'users.export',

  // Entity Management (Portal)
  ENTITIES_CREATE: 'entities.create',
  ENTITIES_READ: 'entities.read',
  ENTITIES_UPDATE: 'entities.update',
  ENTITIES_DELETE: 'entities.delete',
} as const

export type Permission = (typeof PERMISSIONS)[keyof typeof PERMISSIONS]

/**
 * Permission Categories for organization and filtering
 */
export enum PermissionCategory {
  CONTENT = 'Content Management',
  ANALYTICS = 'Analytics & Reports',
  USERS = 'User Management',
  SYSTEM = 'System Settings',
  BOOKINGS = 'Booking Management',
  FINANCIAL = 'Financial Operations',
  TEAM = 'Team Collaboration',
  SECURITY = 'Security & Access',
}

/**
 * Risk levels for permissions
 */
export enum RiskLevel {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

/**
 * Metadata for each permission
 */
export interface PermissionMetadata {
  key: Permission
  label: string
  description: string
  category: PermissionCategory
  risk: RiskLevel
  dependencies?: Permission[]
  conflicts?: Permission[]
  icon?: string
  tags?: string[]
}

/**
 * Comprehensive metadata for all permissions
 */
export const PERMISSION_METADATA: Record<Permission, PermissionMetadata> = {
  // Service Requests
  [PERMISSIONS.SERVICE_REQUESTS_CREATE]: {
    key: PERMISSIONS.SERVICE_REQUESTS_CREATE,
    label: 'Create Service Requests',
    description: 'Create new service request entries',
    category: PermissionCategory.CONTENT,
    risk: RiskLevel.LOW,
    icon: 'Plus',
    tags: ['service-requests', 'create', 'content'],
  },
  [PERMISSIONS.SERVICE_REQUESTS_READ_ALL]: {
    key: PERMISSIONS.SERVICE_REQUESTS_READ_ALL,
    label: 'View All Service Requests',
    description: 'View all service requests across the organization',
    category: PermissionCategory.CONTENT,
    risk: RiskLevel.LOW,
    icon: 'Eye',
    tags: ['service-requests', 'view', 'all', 'content'],
  },
  [PERMISSIONS.SERVICE_REQUESTS_READ_OWN]: {
    key: PERMISSIONS.SERVICE_REQUESTS_READ_OWN,
    label: 'View Own Service Requests',
    description: 'View only service requests created by the user',
    category: PermissionCategory.CONTENT,
    risk: RiskLevel.LOW,
    icon: 'Eye',
    tags: ['service-requests', 'view', 'own', 'content'],
  },
  [PERMISSIONS.SERVICE_REQUESTS_UPDATE]: {
    key: PERMISSIONS.SERVICE_REQUESTS_UPDATE,
    label: 'Update Service Requests',
    description: 'Edit existing service request entries',
    category: PermissionCategory.CONTENT,
    risk: RiskLevel.MEDIUM,
    dependencies: [PERMISSIONS.SERVICE_REQUESTS_READ_ALL],
    icon: 'Edit',
    tags: ['service-requests', 'edit', 'update', 'content'],
  },
  [PERMISSIONS.SERVICE_REQUESTS_DELETE]: {
    key: PERMISSIONS.SERVICE_REQUESTS_DELETE,
    label: 'Delete Service Requests',
    description: 'Delete service request entries',
    category: PermissionCategory.CONTENT,
    risk: RiskLevel.HIGH,
    dependencies: [PERMISSIONS.SERVICE_REQUESTS_READ_ALL],
    icon: 'Trash',
    tags: ['service-requests', 'delete', 'content'],
  },
  [PERMISSIONS.SERVICE_REQUESTS_ASSIGN]: {
    key: PERMISSIONS.SERVICE_REQUESTS_ASSIGN,
    label: 'Assign Service Requests',
    description: 'Assign service requests to team members',
    category: PermissionCategory.CONTENT,
    risk: RiskLevel.MEDIUM,
    dependencies: [PERMISSIONS.SERVICE_REQUESTS_READ_ALL, PERMISSIONS.TEAM_VIEW],
    icon: 'Share',
    tags: ['service-requests', 'assign', 'team', 'content'],
  },

  // Tasks
  [PERMISSIONS.TASKS_CREATE]: {
    key: PERMISSIONS.TASKS_CREATE,
    label: 'Create Tasks',
    description: 'Create new task entries',
    category: PermissionCategory.CONTENT,
    risk: RiskLevel.LOW,
    icon: 'CheckSquare',
    tags: ['tasks', 'create', 'content'],
  },
  [PERMISSIONS.TASKS_READ_ALL]: {
    key: PERMISSIONS.TASKS_READ_ALL,
    label: 'View All Tasks',
    description: 'View all tasks across the organization',
    category: PermissionCategory.CONTENT,
    risk: RiskLevel.LOW,
    icon: 'Eye',
    tags: ['tasks', 'view', 'all', 'content'],
  },
  [PERMISSIONS.TASKS_READ_ASSIGNED]: {
    key: PERMISSIONS.TASKS_READ_ASSIGNED,
    label: 'View Assigned Tasks',
    description: 'View only tasks assigned to the user',
    category: PermissionCategory.CONTENT,
    risk: RiskLevel.LOW,
    icon: 'Eye',
    tags: ['tasks', 'view', 'assigned', 'content'],
  },
  [PERMISSIONS.TASKS_UPDATE]: {
    key: PERMISSIONS.TASKS_UPDATE,
    label: 'Update Tasks',
    description: 'Edit existing task entries',
    category: PermissionCategory.CONTENT,
    risk: RiskLevel.MEDIUM,
    dependencies: [PERMISSIONS.TASKS_CREATE],
    icon: 'Edit',
    tags: ['tasks', 'edit', 'update', 'content'],
  },
  [PERMISSIONS.TASKS_DELETE]: {
    key: PERMISSIONS.TASKS_DELETE,
    label: 'Delete Tasks',
    description: 'Delete task entries',
    category: PermissionCategory.CONTENT,
    risk: RiskLevel.HIGH,
    dependencies: [PERMISSIONS.TASKS_READ_ALL],
    icon: 'Trash',
    tags: ['tasks', 'delete', 'content'],
  },
  [PERMISSIONS.TASKS_ASSIGN]: {
    key: PERMISSIONS.TASKS_ASSIGN,
    label: 'Assign Tasks',
    description: 'Assign tasks to team members',
    category: PermissionCategory.CONTENT,
    risk: RiskLevel.MEDIUM,
    dependencies: [PERMISSIONS.TASKS_READ_ALL, PERMISSIONS.TEAM_VIEW],
    icon: 'Share',
    tags: ['tasks', 'assign', 'team', 'content'],
  },

  // Team Management
  [PERMISSIONS.TEAM_MANAGE]: {
    key: PERMISSIONS.TEAM_MANAGE,
    label: 'Manage Team Members',
    description: 'Add, remove, and manage team member information',
    category: PermissionCategory.TEAM,
    risk: RiskLevel.HIGH,
    dependencies: [PERMISSIONS.TEAM_VIEW],
    icon: 'Users',
    tags: ['team', 'manage', 'collaboration'],
  },
  [PERMISSIONS.TEAM_VIEW]: {
    key: PERMISSIONS.TEAM_VIEW,
    label: 'View Team Members',
    description: 'View team member information and organization',
    category: PermissionCategory.TEAM,
    risk: RiskLevel.LOW,
    icon: 'Users',
    tags: ['team', 'view', 'collaboration'],
  },

  // User Management
  [PERMISSIONS.USERS_MANAGE]: {
    key: PERMISSIONS.USERS_MANAGE,
    label: 'Manage Users',
    description: 'Manage user accounts, roles, and access',
    category: PermissionCategory.USERS,
    risk: RiskLevel.CRITICAL,
    dependencies: [PERMISSIONS.USERS_VIEW],
    icon: 'User',
    tags: ['users', 'manage', 'rbac'],
  },
  [PERMISSIONS.USERS_VIEW]: {
    key: PERMISSIONS.USERS_VIEW,
    label: 'View Users',
    description: 'View user information and account details',
    category: PermissionCategory.USERS,
    risk: RiskLevel.LOW,
    icon: 'User',
    tags: ['users', 'view', 'rbac'],
  },
  [PERMISSIONS.USERS_EXPORT]: {
    key: PERMISSIONS.USERS_EXPORT,
    label: 'Export Users',
    description: 'Export user data to CSV, Excel, PDF, and other formats',
    category: PermissionCategory.CONTENT,
    risk: RiskLevel.LOW,
    icon: 'Download',
    tags: ['users', 'export', 'reports', 'data'],
  },

  // Analytics & Reporting
  [PERMISSIONS.ANALYTICS_VIEW]: {
    key: PERMISSIONS.ANALYTICS_VIEW,
    label: 'View Analytics',
    description: 'Access analytics dashboards and view reports',
    category: PermissionCategory.ANALYTICS,
    risk: RiskLevel.LOW,
    icon: 'BarChart3',
    tags: ['analytics', 'reports', 'dashboard', 'view'],
  },
  [PERMISSIONS.ANALYTICS_EXPORT]: {
    key: PERMISSIONS.ANALYTICS_EXPORT,
    label: 'Export Analytics',
    description: 'Export analytics data and generate reports',
    category: PermissionCategory.ANALYTICS,
    risk: RiskLevel.MEDIUM,
    dependencies: [PERMISSIONS.ANALYTICS_VIEW],
    icon: 'Download',
    tags: ['analytics', 'export', 'reports'],
  },

  // Services Management
  [PERMISSIONS.SERVICES_VIEW]: {
    key: PERMISSIONS.SERVICES_VIEW,
    label: 'View Services',
    description: 'View service catalog and details',
    category: PermissionCategory.CONTENT,
    risk: RiskLevel.LOW,
    icon: 'Package',
    tags: ['services', 'view', 'catalog'],
  },
  [PERMISSIONS.SERVICES_CREATE]: {
    key: PERMISSIONS.SERVICES_CREATE,
    label: 'Create Services',
    description: 'Create new service entries',
    category: PermissionCategory.CONTENT,
    risk: RiskLevel.MEDIUM,
    dependencies: [PERMISSIONS.SERVICES_VIEW],
    icon: 'Plus',
    tags: ['services', 'create', 'catalog'],
  },
  [PERMISSIONS.SERVICES_EDIT]: {
    key: PERMISSIONS.SERVICES_EDIT,
    label: 'Edit Services',
    description: 'Edit existing service information',
    category: PermissionCategory.CONTENT,
    risk: RiskLevel.MEDIUM,
    dependencies: [PERMISSIONS.SERVICES_VIEW],
    icon: 'Edit',
    tags: ['services', 'edit', 'catalog'],
  },
  [PERMISSIONS.SERVICES_DELETE]: {
    key: PERMISSIONS.SERVICES_DELETE,
    label: 'Delete Services',
    description: 'Delete services from the catalog',
    category: PermissionCategory.CONTENT,
    risk: RiskLevel.HIGH,
    dependencies: [PERMISSIONS.SERVICES_VIEW],
    icon: 'Trash',
    tags: ['services', 'delete', 'catalog'],
  },
  [PERMISSIONS.SERVICES_BULK_EDIT]: {
    key: PERMISSIONS.SERVICES_BULK_EDIT,
    label: 'Bulk Edit Services',
    description: 'Edit multiple services at once',
    category: PermissionCategory.CONTENT,
    risk: RiskLevel.HIGH,
    dependencies: [PERMISSIONS.SERVICES_EDIT],
    icon: 'Zap',
    tags: ['services', 'bulk', 'edit'],
  },
  [PERMISSIONS.SERVICES_EXPORT]: {
    key: PERMISSIONS.SERVICES_EXPORT,
    label: 'Export Services',
    description: 'Export service data in various formats',
    category: PermissionCategory.CONTENT,
    risk: RiskLevel.LOW,
    dependencies: [PERMISSIONS.SERVICES_VIEW],
    icon: 'Download',
    tags: ['services', 'export', 'data'],
  },
  [PERMISSIONS.SERVICES_ANALYTICS]: {
    key: PERMISSIONS.SERVICES_ANALYTICS,
    label: 'View Service Analytics',
    description: 'View analytics for individual services',
    category: PermissionCategory.ANALYTICS,
    risk: RiskLevel.LOW,
    dependencies: [PERMISSIONS.SERVICES_VIEW, PERMISSIONS.ANALYTICS_VIEW],
    icon: 'BarChart3',
    tags: ['services', 'analytics', 'reports'],
  },
  [PERMISSIONS.SERVICES_MANAGE_FEATURED]: {
    key: PERMISSIONS.SERVICES_MANAGE_FEATURED,
    label: 'Manage Featured Services',
    description: 'Manage which services are featured in the catalog',
    category: PermissionCategory.CONTENT,
    risk: RiskLevel.MEDIUM,
    dependencies: [PERMISSIONS.SERVICES_VIEW, PERMISSIONS.SERVICES_EDIT],
    icon: 'Star',
    tags: ['services', 'featured', 'catalog'],
  },

  // Booking Settings
  [PERMISSIONS.BOOKING_SETTINGS_VIEW]: {
    key: PERMISSIONS.BOOKING_SETTINGS_VIEW,
    label: 'View Booking Settings',
    description: 'View booking configuration and availability',
    category: PermissionCategory.BOOKINGS,
    risk: RiskLevel.LOW,
    icon: 'Settings',
    tags: ['bookings', 'settings', 'view'],
  },
  [PERMISSIONS.BOOKING_SETTINGS_EDIT]: {
    key: PERMISSIONS.BOOKING_SETTINGS_EDIT,
    label: 'Edit Booking Settings',
    description: 'Modify booking configurations and availability',
    category: PermissionCategory.BOOKINGS,
    risk: RiskLevel.MEDIUM,
    dependencies: [PERMISSIONS.BOOKING_SETTINGS_VIEW],
    icon: 'Settings',
    tags: ['bookings', 'settings', 'edit'],
  },
  [PERMISSIONS.BOOKING_SETTINGS_EXPORT]: {
    key: PERMISSIONS.BOOKING_SETTINGS_EXPORT,
    label: 'Export Booking Settings',
    description: 'Export booking configuration data',
    category: PermissionCategory.BOOKINGS,
    risk: RiskLevel.LOW,
    dependencies: [PERMISSIONS.BOOKING_SETTINGS_VIEW],
    icon: 'Download',
    tags: ['bookings', 'settings', 'export'],
  },
  [PERMISSIONS.BOOKING_SETTINGS_IMPORT]: {
    key: PERMISSIONS.BOOKING_SETTINGS_IMPORT,
    label: 'Import Booking Settings',
    description: 'Import booking configuration from file',
    category: PermissionCategory.BOOKINGS,
    risk: RiskLevel.HIGH,
    dependencies: [PERMISSIONS.BOOKING_SETTINGS_EDIT],
    icon: 'Upload',
    tags: ['bookings', 'settings', 'import'],
  },
  [PERMISSIONS.BOOKING_SETTINGS_RESET]: {
    key: PERMISSIONS.BOOKING_SETTINGS_RESET,
    label: 'Reset Booking Settings',
    description: 'Reset booking settings to defaults',
    category: PermissionCategory.BOOKINGS,
    risk: RiskLevel.CRITICAL,
    dependencies: [PERMISSIONS.BOOKING_SETTINGS_EDIT],
    icon: 'RotateCcw',
    tags: ['bookings', 'settings', 'reset'],
  },

  // Organization Settings
  [PERMISSIONS.ORG_SETTINGS_VIEW]: {
    key: PERMISSIONS.ORG_SETTINGS_VIEW,
    label: 'View Organization Settings',
    description: 'View general organization configuration',
    category: PermissionCategory.SYSTEM,
    risk: RiskLevel.LOW,
    icon: 'Settings',
    tags: ['org', 'settings', 'view'],
  },
  [PERMISSIONS.ORG_SETTINGS_EDIT]: {
    key: PERMISSIONS.ORG_SETTINGS_EDIT,
    label: 'Edit Organization Settings',
    description: 'Modify organization configuration and branding',
    category: PermissionCategory.SYSTEM,
    risk: RiskLevel.HIGH,
    dependencies: [PERMISSIONS.ORG_SETTINGS_VIEW],
    icon: 'Settings',
    tags: ['org', 'settings', 'edit'],
  },
  [PERMISSIONS.ORG_SETTINGS_EXPORT]: {
    key: PERMISSIONS.ORG_SETTINGS_EXPORT,
    label: 'Export Organization Settings',
    description: 'Export organization configuration data',
    category: PermissionCategory.SYSTEM,
    risk: RiskLevel.LOW,
    dependencies: [PERMISSIONS.ORG_SETTINGS_VIEW],
    icon: 'Download',
    tags: ['org', 'settings', 'export'],
  },
  [PERMISSIONS.ORG_SETTINGS_IMPORT]: {
    key: PERMISSIONS.ORG_SETTINGS_IMPORT,
    label: 'Import Organization Settings',
    description: 'Import organization configuration from file',
    category: PermissionCategory.SYSTEM,
    risk: RiskLevel.HIGH,
    dependencies: [PERMISSIONS.ORG_SETTINGS_EDIT],
    icon: 'Upload',
    tags: ['org', 'settings', 'import'],
  },
  [PERMISSIONS.ORG_SETTINGS_RESET]: {
    key: PERMISSIONS.ORG_SETTINGS_RESET,
    label: 'Reset Organization Settings',
    description: 'Reset organization settings to defaults',
    category: PermissionCategory.SYSTEM,
    risk: RiskLevel.CRITICAL,
    dependencies: [PERMISSIONS.ORG_SETTINGS_EDIT],
    icon: 'RotateCcw',
    tags: ['org', 'settings', 'reset'],
  },

  // Financial Settings
  [PERMISSIONS.FINANCIAL_SETTINGS_VIEW]: {
    key: PERMISSIONS.FINANCIAL_SETTINGS_VIEW,
    label: 'View Financial Settings',
    description: 'View financial configuration and payment settings',
    category: PermissionCategory.FINANCIAL,
    risk: RiskLevel.MEDIUM,
    icon: 'DollarSign',
    tags: ['financial', 'settings', 'view'],
  },
  [PERMISSIONS.FINANCIAL_SETTINGS_EDIT]: {
    key: PERMISSIONS.FINANCIAL_SETTINGS_EDIT,
    label: 'Edit Financial Settings',
    description: 'Modify financial configuration and payment methods',
    category: PermissionCategory.FINANCIAL,
    risk: RiskLevel.CRITICAL,
    dependencies: [PERMISSIONS.FINANCIAL_SETTINGS_VIEW],
    icon: 'DollarSign',
    tags: ['financial', 'settings', 'edit'],
  },
  [PERMISSIONS.FINANCIAL_SETTINGS_EXPORT]: {
    key: PERMISSIONS.FINANCIAL_SETTINGS_EXPORT,
    label: 'Export Financial Settings',
    description: 'Export financial configuration and data',
    category: PermissionCategory.FINANCIAL,
    risk: RiskLevel.MEDIUM,
    dependencies: [PERMISSIONS.FINANCIAL_SETTINGS_VIEW],
    icon: 'Download',
    tags: ['financial', 'settings', 'export'],
  },

  // Integration Hub
  [PERMISSIONS.INTEGRATION_HUB_VIEW]: {
    key: PERMISSIONS.INTEGRATION_HUB_VIEW,
    label: 'View Integration Settings',
    description: 'View available integrations and status',
    category: PermissionCategory.SYSTEM,
    risk: RiskLevel.LOW,
    icon: 'Link',
    tags: ['integration', 'settings', 'view'],
  },
  [PERMISSIONS.INTEGRATION_HUB_EDIT]: {
    key: PERMISSIONS.INTEGRATION_HUB_EDIT,
    label: 'Edit Integration Settings',
    description: 'Configure and manage integrations',
    category: PermissionCategory.SYSTEM,
    risk: RiskLevel.HIGH,
    dependencies: [PERMISSIONS.INTEGRATION_HUB_VIEW],
    icon: 'Link',
    tags: ['integration', 'settings', 'edit'],
  },
  [PERMISSIONS.INTEGRATION_HUB_TEST]: {
    key: PERMISSIONS.INTEGRATION_HUB_TEST,
    label: 'Test Integrations',
    description: 'Test integration connections and functionality',
    category: PermissionCategory.SYSTEM,
    risk: RiskLevel.LOW,
    dependencies: [PERMISSIONS.INTEGRATION_HUB_VIEW],
    icon: 'Zap',
    tags: ['integration', 'test'],
  },
  [PERMISSIONS.INTEGRATION_HUB_SECRETS_WRITE]: {
    key: PERMISSIONS.INTEGRATION_HUB_SECRETS_WRITE,
    label: 'Manage Integration Secrets',
    description: 'Write and manage integration API keys and secrets',
    category: PermissionCategory.SECURITY,
    risk: RiskLevel.CRITICAL,
    dependencies: [PERMISSIONS.INTEGRATION_HUB_EDIT],
    icon: 'Lock',
    tags: ['integration', 'secrets', 'security'],
  },
  [PERMISSIONS.INTEGRATIONS_MANAGE]: {
    key: PERMISSIONS.INTEGRATIONS_MANAGE,
    label: 'Manage Integrations',
    description: 'Full management of filter bar integrations (Slack, Teams, Zapier, Webhooks)',
    category: PermissionCategory.SYSTEM,
    risk: RiskLevel.HIGH,
    dependencies: [PERMISSIONS.INTEGRATION_HUB_VIEW],
    icon: 'Plug',
    tags: ['integration', 'manage', 'slack', 'teams', 'zapier', 'webhook'],
  },

  // Client Settings
  [PERMISSIONS.CLIENT_SETTINGS_VIEW]: {
    key: PERMISSIONS.CLIENT_SETTINGS_VIEW,
    label: 'View Client Settings',
    description: 'View client management configuration',
    category: PermissionCategory.SYSTEM,
    risk: RiskLevel.LOW,
    icon: 'Settings',
    tags: ['client', 'settings', 'view'],
  },
  [PERMISSIONS.CLIENT_SETTINGS_EDIT]: {
    key: PERMISSIONS.CLIENT_SETTINGS_EDIT,
    label: 'Edit Client Settings',
    description: 'Modify client management configuration',
    category: PermissionCategory.SYSTEM,
    risk: RiskLevel.MEDIUM,
    dependencies: [PERMISSIONS.CLIENT_SETTINGS_VIEW],
    icon: 'Settings',
    tags: ['client', 'settings', 'edit'],
  },
  [PERMISSIONS.CLIENT_SETTINGS_EXPORT]: {
    key: PERMISSIONS.CLIENT_SETTINGS_EXPORT,
    label: 'Export Client Settings',
    description: 'Export client configuration data',
    category: PermissionCategory.SYSTEM,
    risk: RiskLevel.LOW,
    dependencies: [PERMISSIONS.CLIENT_SETTINGS_VIEW],
    icon: 'Download',
    tags: ['client', 'settings', 'export'],
  },
  [PERMISSIONS.CLIENT_SETTINGS_IMPORT]: {
    key: PERMISSIONS.CLIENT_SETTINGS_IMPORT,
    label: 'Import Client Settings',
    description: 'Import client configuration from file',
    category: PermissionCategory.SYSTEM,
    risk: RiskLevel.MEDIUM,
    dependencies: [PERMISSIONS.CLIENT_SETTINGS_EDIT],
    icon: 'Upload',
    tags: ['client', 'settings', 'import'],
  },

  // Team Settings
  [PERMISSIONS.TEAM_SETTINGS_VIEW]: {
    key: PERMISSIONS.TEAM_SETTINGS_VIEW,
    label: 'View Team Settings',
    description: 'View team management configuration',
    category: PermissionCategory.SYSTEM,
    risk: RiskLevel.LOW,
    icon: 'Settings',
    tags: ['team', 'settings', 'view'],
  },
  [PERMISSIONS.TEAM_SETTINGS_EDIT]: {
    key: PERMISSIONS.TEAM_SETTINGS_EDIT,
    label: 'Edit Team Settings',
    description: 'Modify team management configuration',
    category: PermissionCategory.SYSTEM,
    risk: RiskLevel.MEDIUM,
    dependencies: [PERMISSIONS.TEAM_SETTINGS_VIEW],
    icon: 'Settings',
    tags: ['team', 'settings', 'edit'],
  },
  [PERMISSIONS.TEAM_SETTINGS_EXPORT]: {
    key: PERMISSIONS.TEAM_SETTINGS_EXPORT,
    label: 'Export Team Settings',
    description: 'Export team configuration data',
    category: PermissionCategory.SYSTEM,
    risk: RiskLevel.LOW,
    dependencies: [PERMISSIONS.TEAM_SETTINGS_VIEW],
    icon: 'Download',
    tags: ['team', 'settings', 'export'],
  },
  [PERMISSIONS.TEAM_SETTINGS_IMPORT]: {
    key: PERMISSIONS.TEAM_SETTINGS_IMPORT,
    label: 'Import Team Settings',
    description: 'Import team configuration from file',
    category: PermissionCategory.SYSTEM,
    risk: RiskLevel.MEDIUM,
    dependencies: [PERMISSIONS.TEAM_SETTINGS_EDIT],
    icon: 'Upload',
    tags: ['team', 'settings', 'import'],
  },

  // Task & Workflow Settings
  [PERMISSIONS.TASK_WORKFLOW_SETTINGS_VIEW]: {
    key: PERMISSIONS.TASK_WORKFLOW_SETTINGS_VIEW,
    label: 'View Task & Workflow Settings',
    description: 'View task and workflow configuration',
    category: PermissionCategory.SYSTEM,
    risk: RiskLevel.LOW,
    icon: 'Settings',
    tags: ['task', 'workflow', 'settings', 'view'],
  },
  [PERMISSIONS.TASK_WORKFLOW_SETTINGS_EDIT]: {
    key: PERMISSIONS.TASK_WORKFLOW_SETTINGS_EDIT,
    label: 'Edit Task & Workflow Settings',
    description: 'Modify task and workflow configuration',
    category: PermissionCategory.SYSTEM,
    risk: RiskLevel.MEDIUM,
    dependencies: [PERMISSIONS.TASK_WORKFLOW_SETTINGS_VIEW],
    icon: 'Settings',
    tags: ['task', 'workflow', 'settings', 'edit'],
  },
  [PERMISSIONS.TASK_WORKFLOW_SETTINGS_EXPORT]: {
    key: PERMISSIONS.TASK_WORKFLOW_SETTINGS_EXPORT,
    label: 'Export Task & Workflow Settings',
    description: 'Export task and workflow configuration data',
    category: PermissionCategory.SYSTEM,
    risk: RiskLevel.LOW,
    dependencies: [PERMISSIONS.TASK_WORKFLOW_SETTINGS_VIEW],
    icon: 'Download',
    tags: ['task', 'workflow', 'settings', 'export'],
  },
  [PERMISSIONS.TASK_WORKFLOW_SETTINGS_IMPORT]: {
    key: PERMISSIONS.TASK_WORKFLOW_SETTINGS_IMPORT,
    label: 'Import Task & Workflow Settings',
    description: 'Import task and workflow configuration from file',
    category: PermissionCategory.SYSTEM,
    risk: RiskLevel.MEDIUM,
    dependencies: [PERMISSIONS.TASK_WORKFLOW_SETTINGS_EDIT],
    icon: 'Upload',
    tags: ['task', 'workflow', 'settings', 'import'],
  },

  // Analytics & Reporting Settings
  [PERMISSIONS.ANALYTICS_REPORTING_SETTINGS_VIEW]: {
    key: PERMISSIONS.ANALYTICS_REPORTING_SETTINGS_VIEW,
    label: 'View Analytics & Reporting Settings',
    description: 'View analytics and reporting configuration',
    category: PermissionCategory.SYSTEM,
    risk: RiskLevel.LOW,
    icon: 'Settings',
    tags: ['analytics', 'reporting', 'settings', 'view'],
  },
  [PERMISSIONS.ANALYTICS_REPORTING_SETTINGS_EDIT]: {
    key: PERMISSIONS.ANALYTICS_REPORTING_SETTINGS_EDIT,
    label: 'Edit Analytics & Reporting Settings',
    description: 'Modify analytics and reporting configuration',
    category: PermissionCategory.SYSTEM,
    risk: RiskLevel.MEDIUM,
    dependencies: [PERMISSIONS.ANALYTICS_REPORTING_SETTINGS_VIEW],
    icon: 'Settings',
    tags: ['analytics', 'reporting', 'settings', 'edit'],
  },
  [PERMISSIONS.ANALYTICS_REPORTING_SETTINGS_EXPORT]: {
    key: PERMISSIONS.ANALYTICS_REPORTING_SETTINGS_EXPORT,
    label: 'Export Analytics & Reporting Settings',
    description: 'Export analytics and reporting configuration data',
    category: PermissionCategory.SYSTEM,
    risk: RiskLevel.LOW,
    dependencies: [PERMISSIONS.ANALYTICS_REPORTING_SETTINGS_VIEW],
    icon: 'Download',
    tags: ['analytics', 'reporting', 'settings', 'export'],
  },
  [PERMISSIONS.ANALYTICS_REPORTING_SETTINGS_IMPORT]: {
    key: PERMISSIONS.ANALYTICS_REPORTING_SETTINGS_IMPORT,
    label: 'Import Analytics & Reporting Settings',
    description: 'Import analytics and reporting configuration from file',
    category: PermissionCategory.SYSTEM,
    risk: RiskLevel.MEDIUM,
    dependencies: [PERMISSIONS.ANALYTICS_REPORTING_SETTINGS_EDIT],
    icon: 'Upload',
    tags: ['analytics', 'reporting', 'settings', 'import'],
  },

  // Communication Settings
  [PERMISSIONS.COMMUNICATION_SETTINGS_VIEW]: {
    key: PERMISSIONS.COMMUNICATION_SETTINGS_VIEW,
    label: 'View Communication Settings',
    description: 'View communication and notification configuration',
    category: PermissionCategory.SYSTEM,
    risk: RiskLevel.LOW,
    icon: 'Settings',
    tags: ['communication', 'settings', 'view'],
  },
  [PERMISSIONS.COMMUNICATION_SETTINGS_EDIT]: {
    key: PERMISSIONS.COMMUNICATION_SETTINGS_EDIT,
    label: 'Edit Communication Settings',
    description: 'Modify communication and notification configuration',
    category: PermissionCategory.SYSTEM,
    risk: RiskLevel.MEDIUM,
    dependencies: [PERMISSIONS.COMMUNICATION_SETTINGS_VIEW],
    icon: 'Settings',
    tags: ['communication', 'settings', 'edit'],
  },
  [PERMISSIONS.COMMUNICATION_SETTINGS_EXPORT]: {
    key: PERMISSIONS.COMMUNICATION_SETTINGS_EXPORT,
    label: 'Export Communication Settings',
    description: 'Export communication configuration data',
    category: PermissionCategory.SYSTEM,
    risk: RiskLevel.LOW,
    dependencies: [PERMISSIONS.COMMUNICATION_SETTINGS_VIEW],
    icon: 'Download',
    tags: ['communication', 'settings', 'export'],
  },
  [PERMISSIONS.COMMUNICATION_SETTINGS_IMPORT]: {
    key: PERMISSIONS.COMMUNICATION_SETTINGS_IMPORT,
    label: 'Import Communication Settings',
    description: 'Import communication configuration from file',
    category: PermissionCategory.SYSTEM,
    risk: RiskLevel.MEDIUM,
    dependencies: [PERMISSIONS.COMMUNICATION_SETTINGS_EDIT],
    icon: 'Upload',
    tags: ['communication', 'settings', 'import'],
  },

  // Security & Compliance Settings
  [PERMISSIONS.SECURITY_COMPLIANCE_SETTINGS_VIEW]: {
    key: PERMISSIONS.SECURITY_COMPLIANCE_SETTINGS_VIEW,
    label: 'View Security & Compliance Settings',
    description: 'View security and compliance configuration',
    category: PermissionCategory.SECURITY,
    risk: RiskLevel.LOW,
    icon: 'Shield',
    tags: ['security', 'compliance', 'settings', 'view'],
  },
  [PERMISSIONS.SECURITY_COMPLIANCE_SETTINGS_EDIT]: {
    key: PERMISSIONS.SECURITY_COMPLIANCE_SETTINGS_EDIT,
    label: 'Edit Security & Compliance Settings',
    description: 'Modify security and compliance configuration',
    category: PermissionCategory.SECURITY,
    risk: RiskLevel.CRITICAL,
    dependencies: [PERMISSIONS.SECURITY_COMPLIANCE_SETTINGS_VIEW],
    icon: 'Shield',
    tags: ['security', 'compliance', 'settings', 'edit'],
  },

  // System Administration Settings
  [PERMISSIONS.SYSTEM_ADMIN_SETTINGS_VIEW]: {
    key: PERMISSIONS.SYSTEM_ADMIN_SETTINGS_VIEW,
    label: 'View System Administration Settings',
    description: 'View system administration configuration',
    category: PermissionCategory.SYSTEM,
    risk: RiskLevel.LOW,
    icon: 'Settings',
    tags: ['system', 'admin', 'settings', 'view'],
  },
  [PERMISSIONS.SYSTEM_ADMIN_SETTINGS_EDIT]: {
    key: PERMISSIONS.SYSTEM_ADMIN_SETTINGS_EDIT,
    label: 'Edit System Administration Settings',
    description: 'Modify system administration configuration',
    category: PermissionCategory.SYSTEM,
    risk: RiskLevel.CRITICAL,
    dependencies: [PERMISSIONS.SYSTEM_ADMIN_SETTINGS_VIEW],
    icon: 'Settings',
    tags: ['system', 'admin', 'settings', 'edit'],
  },

  // Language Management
  [PERMISSIONS.LANGUAGES_VIEW]: {
    key: PERMISSIONS.LANGUAGES_VIEW,
    label: 'View Languages',
    description: 'View available languages and localization settings',
    category: PermissionCategory.SYSTEM,
    risk: RiskLevel.LOW,
    icon: 'Globe',
    tags: ['languages', 'localization', 'view'],
  },
  [PERMISSIONS.LANGUAGES_MANAGE]: {
    key: PERMISSIONS.LANGUAGES_MANAGE,
    label: 'Manage Languages',
    description: 'Add, remove, and manage languages and localization',
    category: PermissionCategory.SYSTEM,
    risk: RiskLevel.MEDIUM,
    dependencies: [PERMISSIONS.LANGUAGES_VIEW],
    icon: 'Globe',
    tags: ['languages', 'localization', 'manage'],
  },

  // Reports Management
  [PERMISSIONS.REPORTS_CREATE]: {
    key: PERMISSIONS.REPORTS_CREATE,
    label: 'Create Reports',
    description: 'Create new custom reports',
    category: PermissionCategory.ANALYTICS,
    risk: RiskLevel.LOW,
    icon: 'PlusSquare',
    tags: ['reports', 'create', 'analytics'],
  },
  [PERMISSIONS.REPORTS_READ]: {
    key: PERMISSIONS.REPORTS_READ,
    label: 'View Reports',
    description: 'View existing reports and report templates',
    category: PermissionCategory.ANALYTICS,
    risk: RiskLevel.LOW,
    icon: 'Eye',
    tags: ['reports', 'view', 'analytics'],
  },
  [PERMISSIONS.REPORTS_WRITE]: {
    key: PERMISSIONS.REPORTS_WRITE,
    label: 'Edit Reports',
    description: 'Edit and modify existing reports',
    category: PermissionCategory.ANALYTICS,
    risk: RiskLevel.MEDIUM,
    dependencies: [PERMISSIONS.REPORTS_READ],
    icon: 'Edit',
    tags: ['reports', 'edit', 'analytics'],
  },
  [PERMISSIONS.REPORTS_DELETE]: {
    key: PERMISSIONS.REPORTS_DELETE,
    label: 'Delete Reports',
    description: 'Delete reports and report templates',
    category: PermissionCategory.ANALYTICS,
    risk: RiskLevel.HIGH,
    dependencies: [PERMISSIONS.REPORTS_READ],
    icon: 'Trash',
    tags: ['reports', 'delete', 'analytics'],
  },
  [PERMISSIONS.REPORTS_GENERATE]: {
    key: PERMISSIONS.REPORTS_GENERATE,
    label: 'Generate Reports',
    description: 'Generate and export reports in various formats',
    category: PermissionCategory.ANALYTICS,
    risk: RiskLevel.LOW,
    dependencies: [PERMISSIONS.REPORTS_READ],
    icon: 'Download',
    tags: ['reports', 'generate', 'export', 'analytics'],
  },

  // Entity Management (Portal)
  [PERMISSIONS.ENTITIES_CREATE]: {
    key: PERMISSIONS.ENTITIES_CREATE,
    label: 'Create Entities',
    description: 'Create new business entities and tax registrations',
    category: PermissionCategory.CONTENT,
    risk: RiskLevel.MEDIUM,
    icon: 'Plus',
    tags: ['entities', 'create', 'business'],
  },
  [PERMISSIONS.ENTITIES_READ]: {
    key: PERMISSIONS.ENTITIES_READ,
    label: 'View Entities',
    description: 'View entity information and registration details',
    category: PermissionCategory.CONTENT,
    risk: RiskLevel.LOW,
    icon: 'Eye',
    tags: ['entities', 'view', 'business'],
  },
  [PERMISSIONS.ENTITIES_UPDATE]: {
    key: PERMISSIONS.ENTITIES_UPDATE,
    label: 'Edit Entities',
    description: 'Update entity information and settings',
    category: PermissionCategory.CONTENT,
    risk: RiskLevel.MEDIUM,
    dependencies: [PERMISSIONS.ENTITIES_READ],
    icon: 'Edit',
    tags: ['entities', 'update', 'business'],
  },
  [PERMISSIONS.ENTITIES_DELETE]: {
    key: PERMISSIONS.ENTITIES_DELETE,
    label: 'Delete Entities',
    description: 'Archive or delete business entities',
    category: PermissionCategory.CONTENT,
    risk: RiskLevel.HIGH,
    dependencies: [PERMISSIONS.ENTITIES_READ],
    icon: 'Trash',
    tags: ['entities', 'delete', 'business'],
  },
}

export const ROLE_PERMISSIONS: Record<string, Permission[]> = {
  CLIENT: [
    PERMISSIONS.SERVICE_REQUESTS_CREATE,
    PERMISSIONS.SERVICE_REQUESTS_READ_OWN,
    PERMISSIONS.TASKS_READ_ASSIGNED,
  ],
  TEAM_MEMBER: [
    PERMISSIONS.SERVICE_REQUESTS_READ_ALL,
    PERMISSIONS.SERVICE_REQUESTS_UPDATE,
    PERMISSIONS.TASKS_CREATE,
    PERMISSIONS.TASKS_READ_ASSIGNED,
    PERMISSIONS.TASKS_UPDATE,
    PERMISSIONS.TEAM_VIEW,
    PERMISSIONS.ANALYTICS_VIEW,
    PERMISSIONS.SERVICES_VIEW,
    PERMISSIONS.SERVICES_ANALYTICS,
    PERMISSIONS.SERVICES_EXPORT,
    // Settings visibility (read-only)
    PERMISSIONS.BOOKING_SETTINGS_VIEW,
    PERMISSIONS.ORG_SETTINGS_VIEW,
  ],
  TEAM_LEAD: [
    PERMISSIONS.SERVICE_REQUESTS_READ_ALL,
    PERMISSIONS.SERVICE_REQUESTS_UPDATE,
    PERMISSIONS.SERVICE_REQUESTS_ASSIGN,
    PERMISSIONS.TASKS_CREATE,
    PERMISSIONS.TASKS_READ_ALL,
    PERMISSIONS.TASKS_UPDATE,
    PERMISSIONS.TASKS_ASSIGN,
    PERMISSIONS.TEAM_VIEW,
    PERMISSIONS.TEAM_MANAGE,
    PERMISSIONS.ANALYTICS_VIEW,
    PERMISSIONS.ANALYTICS_EXPORT,
    PERMISSIONS.SERVICES_VIEW,
    PERMISSIONS.SERVICES_ANALYTICS,
    PERMISSIONS.SERVICES_EXPORT,
    // Booking settings (no import/reset for TEAM_LEAD)
    PERMISSIONS.BOOKING_SETTINGS_VIEW,
    PERMISSIONS.BOOKING_SETTINGS_EDIT,
    PERMISSIONS.BOOKING_SETTINGS_EXPORT,
    // Organization settings
    PERMISSIONS.ORG_SETTINGS_VIEW,
    PERMISSIONS.ORG_SETTINGS_EDIT,
    PERMISSIONS.ORG_SETTINGS_EXPORT,
    // Financial
    PERMISSIONS.FINANCIAL_SETTINGS_VIEW,
    // Integration Hub (view + test)
    PERMISSIONS.INTEGRATION_HUB_VIEW,
    PERMISSIONS.INTEGRATION_HUB_TEST,
  ],
  ADMIN: [
    ...Object.values(PERMISSIONS),
  ],
  SUPER_ADMIN: [
    ...Object.values(PERMISSIONS),
  ],
}

export function hasPermission(userRole: string | undefined | null, permission: Permission): boolean {
  if (!userRole) return false
  try {
    const roleNormalized = String(userRole).toUpperCase()
    if (roleNormalized === 'SUPER_ADMIN') return true
  } catch {}
  const allowed = ROLE_PERMISSIONS[userRole]
  return Array.isArray(allowed) ? allowed.includes(permission) : false
}

export function checkPermissions(userRole: string | undefined | null, required: Permission[]): boolean {
  return required.every((p) => hasPermission(userRole, p))
}

export function getRolePermissions(userRole: string | undefined | null): Permission[] {
  if (!userRole) return []
  try {
    const roleNormalized = String(userRole).toUpperCase()
    if (roleNormalized === 'SUPER_ADMIN') return ROLE_PERMISSIONS['SUPER_ADMIN'] ?? []
  } catch {}
  return ROLE_PERMISSIONS[userRole] ?? []
}

/**
 * Check if a user role is included in a list of allowed roles
 * @param userRole The current user's role
 * @param allowedRoles Array of roles that should have access
 * @returns true if the user's role is in the allowed roles list
 */
export function hasRole(userRole: string | undefined | null, allowedRoles: readonly string[]): boolean {
  if (!userRole || !allowedRoles) return false
  try {
    const roleNormalized = String(userRole).toUpperCase()
    if (roleNormalized === 'SUPER_ADMIN') return true
  } catch {}
  return allowedRoles.includes(userRole)
}
