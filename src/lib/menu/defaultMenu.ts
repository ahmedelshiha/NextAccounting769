/**
 * Default Menu Structure
 *
 * This file defines the complete default menu structure for the admin dashboard.
 * It serves as the baseline from which users can customize their menu through
 * reordering, hiding items, and managing bookmarks.
 *
 * The structure is organized into 5 main sections:
 * - Dashboard: Overview, analytics, and reporting
 * - Business: Bookings, clients, services, service requests
 * - Financial: Invoices, payments, expenses, taxes
 * - Operations: Tasks, team, chat, reminders
 * - System: Administrative settings, users, roles, security, integrations
 */

import { MenuSection, MenuItem } from '@/types/admin/menuCustomization'

/**
 * All valid menu item paths in the admin dashboard
 */
export const ALL_MENU_ITEMS: { [key: string]: MenuItem } = {
  // Dashboard section
  'admin/': {
    id: 'admin/',
    name: 'Overview',
    href: '/admin',
    icon: 'LayoutDashboard',
  },
  'admin/analytics': {
    id: 'admin/analytics',
    name: 'Analytics',
    href: '/admin/analytics',
    icon: 'BarChart3',
  },
  'admin/reports': {
    id: 'admin/reports',
    name: 'Reports',
    href: '/admin/reports',
    icon: 'TrendingUp',
  },

  // Business section
  'admin/bookings': {
    id: 'admin/bookings',
    name: 'Bookings',
    href: '/admin/bookings',
    icon: 'Calendar',
  },
  'admin/calendar': {
    id: 'admin/calendar',
    name: 'Calendar View',
    href: '/admin/calendar',
    icon: 'Calendar',
  },
  'admin/availability': {
    id: 'admin/availability',
    name: 'Availability',
    href: '/admin/availability',
    icon: 'Clock',
  },
  'admin/services': {
    id: 'admin/services',
    name: 'Services',
    href: '/admin/services',
    icon: 'Briefcase',
  },
  'admin/service-requests': {
    id: 'admin/service-requests',
    name: 'Service Requests',
    href: '/admin/service-requests',
    icon: 'FileText',
  },

  // Financial section
  'admin/invoices': {
    id: 'admin/invoices',
    name: 'Invoices',
    href: '/admin/invoices',
    icon: 'FileText',
  },
  'admin/invoices/sequences': {
    id: 'admin/invoices/sequences',
    name: 'Invoice Sequences',
    href: '/admin/invoices/sequences',
    icon: 'FileText',
  },
  'admin/payments': {
    id: 'admin/payments',
    name: 'Payments',
    href: '/admin/payments',
    icon: 'CreditCard',
  },
  'admin/expenses': {
    id: 'admin/expenses',
    name: 'Expenses',
    href: '/admin/expenses',
    icon: 'Receipt',
  },
  'admin/taxes': {
    id: 'admin/taxes',
    name: 'Taxes',
    href: '/admin/taxes',
    icon: 'DollarSign',
  },

  // Operations section
  'admin/tasks': {
    id: 'admin/tasks',
    name: 'Tasks',
    href: '/admin/tasks',
    icon: 'CheckSquare',
  },
  'admin/chat': {
    id: 'admin/chat',
    name: 'Chat',
    href: '/admin/chat',
    icon: 'Mail',
  },
  'admin/reminders': {
    id: 'admin/reminders',
    name: 'Reminders',
    href: '/admin/reminders',
    icon: 'Bell',
  },

  // System section
  'admin/settings': {
    id: 'admin/settings',
    name: 'Settings',
    href: '/admin/settings',
    icon: 'Settings',
  },
  'admin/users': {
    id: 'admin/users',
    name: 'Users',
    href: '/admin/users',
    icon: 'Users',
  },
  'admin/security': {
    id: 'admin/security',
    name: 'Security',
    href: '/admin/security',
    icon: 'Shield',
  },
  'admin/integrations': {
    id: 'admin/integrations',
    name: 'Integrations',
    href: '/admin/integrations',
    icon: 'Zap',
  },
  'admin/uploads': {
    id: 'admin/uploads',
    name: 'Uploads',
    href: '/admin/uploads',
    icon: 'Upload',
  },
  'admin/audits': {
    id: 'admin/audits',
    name: 'Audit Logs',
    href: '/admin/audits',
    icon: 'FileText',
  },
  'admin/posts': {
    id: 'admin/posts',
    name: 'Posts',
    href: '/admin/posts',
    icon: 'FileText',
  },
  'admin/translations': {
    id: 'admin/translations',
    name: 'Translations',
    href: '/admin/translations',
    icon: 'Globe',
  },
  'admin/compliance': {
    id: 'admin/compliance',
    name: 'Compliance',
    href: '/admin/compliance',
    icon: 'CheckCircle',
  },
}

/**
 * Default menu structure organized by sections
 * This is what users see before any customization
 */
export const DEFAULT_MENU_SECTIONS: MenuSection[] = [
  {
    id: 'dashboard',
    name: 'Dashboard',
    order: 0,
    items: [
      ALL_MENU_ITEMS['admin/'],
      ALL_MENU_ITEMS['admin/analytics'],
      ALL_MENU_ITEMS['admin/reports'],
    ],
  },
  {
    id: 'business',
    name: 'Business',
    order: 1,
    items: [
      ALL_MENU_ITEMS['admin/bookings'],
      ALL_MENU_ITEMS['admin/calendar'],
      ALL_MENU_ITEMS['admin/availability'],
      ALL_MENU_ITEMS['admin/services'],
      ALL_MENU_ITEMS['admin/service-requests'],
    ],
  },
  {
    id: 'financial',
    name: 'Financial',
    order: 2,
    items: [
      ALL_MENU_ITEMS['admin/invoices'],
      ALL_MENU_ITEMS['admin/invoices/sequences'],
      ALL_MENU_ITEMS['admin/payments'],
      ALL_MENU_ITEMS['admin/expenses'],
      ALL_MENU_ITEMS['admin/taxes'],
    ],
  },
  {
    id: 'operations',
    name: 'Operations',
    order: 3,
    items: [
      ALL_MENU_ITEMS['admin/tasks'],
      ALL_MENU_ITEMS['admin/chat'],
      ALL_MENU_ITEMS['admin/reminders'],
    ],
  },
  {
    id: 'system',
    name: 'System',
    order: 4,
    items: [
      ALL_MENU_ITEMS['admin/settings'],
      ALL_MENU_ITEMS['admin/users'],
      ALL_MENU_ITEMS['admin/security'],
      ALL_MENU_ITEMS['admin/integrations'],
      ALL_MENU_ITEMS['admin/uploads'],
      ALL_MENU_ITEMS['admin/audits'],
      ALL_MENU_ITEMS['admin/posts'],
      ALL_MENU_ITEMS['admin/translations'],
      ALL_MENU_ITEMS['admin/compliance'],
    ],
  },
]

/**
 * Get all menu items as a flat list
 */
export const getAllMenuItems = (): MenuItem[] => {
  return Object.values(ALL_MENU_ITEMS)
}

/**
 * Get a menu section by ID
 */
export const getMenuSection = (sectionId: string): MenuSection | undefined => {
  return DEFAULT_MENU_SECTIONS.find((section) => section.id === sectionId)
}

/**
 * Get all section IDs
 */
export const getAllSectionIds = (): string[] => {
  return DEFAULT_MENU_SECTIONS.map((section) => section.id)
}

/**
 * Get a menu item by its ID
 */
export const getMenuItem = (itemId: string): MenuItem | undefined => {
  return ALL_MENU_ITEMS[itemId]
}

/**
 * Validate if an item ID exists in the default menu
 */
export const isValidMenuItem = (itemId: string): boolean => {
  return itemId in ALL_MENU_ITEMS
}
