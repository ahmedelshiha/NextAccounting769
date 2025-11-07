// Central registry of settings categories used by the admin sidebar and settings pages.

import { Building2, Cog, Users, ClipboardList, ShieldCheck, CreditCard, LineChart, MessageSquare, PlugZap, ServerCog, Globe, BarChart3 } from 'lucide-react'
import type { SettingsCategory } from './types'
import { PERMISSIONS } from '@/lib/permissions'

// Keep tabs empty here — individual category modules will register their own tabs or the registry can be extended at runtime.
export const SETTINGS_REGISTRY: SettingsCategory[] = [
  {
    key: 'overview',
    label: 'Settings Overview',
    route: '/admin/settings',
    icon: Cog,
    tabs: [],
  },
  {
    key: 'organization',
    label: 'Organization Settings',
    route: '/admin/settings/company',
    icon: Building2,
    tabs: [],
    // permission optional — can be used by UI to hide entries
    permission: PERMISSIONS.ORG_SETTINGS_VIEW,
  },
  {
    key: 'serviceManagement',
    label: 'Service Management',
    route: '/admin/settings/services',
    icon: ClipboardList,
    tabs: [],
  },
  {
    key: 'booking',
    label: 'Booking Configuration',
    route: '/admin/settings/booking',
    icon: Cog,
    tabs: [],
    permission: PERMISSIONS.BOOKING_SETTINGS_VIEW,
  },
  {
    key: 'clientManagement',
    label: 'Client Management',
    route: '/admin/settings/clients',
    icon: Users,
    tabs: [],
    permission: PERMISSIONS.CLIENT_SETTINGS_VIEW,
  },
  {
    key: 'taskWorkflow',
    label: 'Task & Workflow',
    route: '/admin/settings/tasks',
    icon: ClipboardList,
    tabs: [],
    permission: PERMISSIONS.TASK_WORKFLOW_SETTINGS_VIEW,
  },
  {
    key: 'teamManagement',
    label: 'Team Management',
    route: '/admin/settings/team',
    icon: Users,
    tabs: [],
    permission: PERMISSIONS.TEAM_SETTINGS_VIEW,
  },
  {
    key: 'financial',
    label: 'Financial Settings',
    route: '/admin/settings/financial',
    icon: CreditCard,
    tabs: [],
    permission: PERMISSIONS.FINANCIAL_SETTINGS_VIEW,
  },
  // Currency management appears as its own top-level settings category so it's visible in the main settings navigation
  {
    key: 'analyticsReporting',
    label: 'Analytics & Reporting',
    route: '/admin/settings/analytics',
    icon: LineChart,
    tabs: [],
    permission: PERMISSIONS.ANALYTICS_REPORTING_SETTINGS_VIEW,
  },
  {
    key: 'communication',
    label: 'Communication',
    route: '/admin/settings/communication',
    icon: MessageSquare,
    tabs: [],
    permission: PERMISSIONS.COMMUNICATION_SETTINGS_VIEW,
  },
  {
    key: 'securityCompliance',
    label: 'Security & Compliance',
    route: '/admin/settings/security',
    icon: ShieldCheck,
    tabs: [],
    permission: PERMISSIONS.SECURITY_COMPLIANCE_SETTINGS_VIEW,
  },
  {
    key: 'integrationHub',
    label: 'Integration Hub',
    route: '/admin/settings/integrations',
    icon: PlugZap,
    tabs: [],
    permission: PERMISSIONS.INTEGRATION_HUB_VIEW,
  },
  {
    key: 'cronTelemetry',
    label: 'Cron Telemetry',
    route: '/admin/settings/cron-telemetry',
    icon: PlugZap,
    tabs: [],
    permission: PERMISSIONS.ANALYTICS_VIEW,
  },
  {
    key: 'systemAdministration',
    label: 'System Administration',
    route: '/admin/settings/system',
    icon: ServerCog,
    tabs: [],
    permission: PERMISSIONS.SYSTEM_ADMIN_SETTINGS_VIEW,
  },
  {
    key: 'localization',
    label: 'Localization & Languages',
    route: '/admin/settings/localization',
    icon: Globe,
    tabs: [],
    permission: PERMISSIONS.LANGUAGES_VIEW,
  },
  {
    key: 'userManagement',
    label: 'User Management Settings',
    route: '/admin/settings/user-management',
    icon: Users,
    tabs: [],
    permission: PERMISSIONS.USERS_MANAGE,
  }
]

export default SETTINGS_REGISTRY
