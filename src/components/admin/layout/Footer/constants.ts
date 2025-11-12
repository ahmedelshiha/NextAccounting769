/**
 * Admin Footer Constants
 * 
 * All static values, configurations, and strings used throughout
 * the footer system. Centralized for easy maintenance.
 * 
 * @module @/components/admin/layout/Footer/constants
 */

import type { FooterLink } from './types'

/**
 * Footer navigation links configuration
 * Organized by category (quickLinks, supportLinks)
 */
export const FOOTER_LINKS = {
  quickLinks: [
    {
      id: 'main-site',
      label: 'Main Site',
      href: '/',
      icon: 'ExternalLink',
      external: true,
    },
    {
      id: 'settings',
      label: 'Settings',
      href: '/admin/settings',
      icon: 'Settings',
      external: false,
    },
  ] as const satisfies readonly FooterLink[],

  supportLinks: [] as const satisfies readonly FooterLink[],
} as const

/**
 * Health check configuration and timing parameters
 * Controls polling interval, retries, and timeouts
 */
export const HEALTH_CHECK_CONFIG = {
  /** Polling interval in milliseconds */
  pollInterval: 30000,

  /** Number of retry attempts for failed requests */
  retryAttempts: 3,

  /** Delay between retry attempts in milliseconds */
  retryDelay: 10000,

  /** Individual check timeout in milliseconds */
  timeout: 5000,

  /** Health check API endpoint */
  endpoint: '/api/admin/system/health',

  /** Database check timeout in milliseconds */
  databaseTimeout: 1000,

  /** Redis check timeout in milliseconds */
  redisTimeout: 500,

  /** API check timeout in milliseconds */
  apiTimeout: 1000,
} as const

/**
 * Human-readable status messages for different system states
 * Used in SystemStatus component and health responses
 */
export const STATUS_MESSAGES = {
  healthy: {
    short: 'OK',
    full: 'All systems operational',
    description: 'System is running normally with all services healthy',
  },
  degraded: {
    short: 'Slow',
    full: 'Service degraded',
    description: 'Some services are experiencing high latency or reduced performance',
  },
  unavailable: {
    short: 'Down',
    full: 'Service unavailable',
    description: 'One or more critical services are offline or unreachable',
  },
  unknown: {
    short: 'Unknown',
    full: 'Checking status...',
    description: 'System status is being checked',
  },
} as const

/**
 * Environment color mapping for badges
 * Maps environment type to Tailwind color classes
 */
export const ENVIRONMENT_COLORS = {
  production: 'blue' as const,
  staging: 'purple' as const,
  development: 'orange' as const,
} as const

/**
 * Environment descriptions for tooltips
 */
export const ENVIRONMENT_DESCRIPTIONS = {
  production: 'Production environment - live user data',
  staging: 'Staging environment - testing and pre-production',
  development: 'Development environment - local testing',
} as const

/**
 * Component spacing and sizing constants
 * Used for consistent responsive behavior
 */
export const FOOTER_SIZES = {
  desktop: {
    height: '80px',
    padding: '16px 24px',
    columnGap: '32px',
  },
  tablet: {
    height: '60px',
    padding: '12px 16px',
    columnGap: '24px',
  },
  mobile: {
    height: '50px',
    padding: '16px',
    columnGap: '12px',
  },
} as const

/**
 * Animation timing constants
 */
export const ANIMATION_TIMINGS = {
  pulse: 2000, // milliseconds
  transition: 300, // milliseconds
} as const

/**
 * Version and copyright information
 */
export const FOOTER_BRANDING = {
  appName: 'NextAccounting',
  appNameFull: 'NextAccounting Admin',
  copyrightPrefix: '©',
  defaultYear: new Date().getFullYear(),
} as const
