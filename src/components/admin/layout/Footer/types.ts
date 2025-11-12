/**
 * Admin Footer Type Definitions
 * 
 * Comprehensive TypeScript interfaces for the admin footer system,
 * including system health monitoring, links, and component props.
 * 
 * @module @/components/admin/layout/Footer/types
 */

/**
 * Represents the health status of a single system component (database, Redis, API)
 */
export interface HealthCheck {
  /** Status of the check: 'healthy' | 'degraded' | 'unavailable' | 'unknown' */
  status: 'healthy' | 'degraded' | 'unavailable' | 'unknown'

  /** Response latency in milliseconds */
  latency: number

  /** Error message if check failed (optional) */
  error?: string

  /** ISO timestamp of last successful check */
  lastChecked: string
}

/**
 * Represents the overall system health with individual component checks
 */
export interface SystemHealth {
  /** Overall system status */
  status: 'healthy' | 'degraded' | 'unavailable' | 'unknown'

  /** Human-readable status message */
  message: string

  /** Individual health checks for different system components */
  checks: {
    database: HealthCheck
    redis?: HealthCheck
    api: HealthCheck
    email?: HealthCheck
    auth?: HealthCheck
  }

  /** ISO timestamp of when status was checked */
  timestamp: string

  /** System uptime in seconds (if available) */
  uptime?: number
}

/**
 * Represents a single footer link (quick links, support links, etc.)
 */
export interface FooterLink {
  /** Unique identifier for the link */
  id: string
  
  /** Display text/label */
  label: string
  
  /** URL path or full URL */
  href: string
  
  /** Lucide icon name (e.g., 'BarChart3', 'Settings') */
  icon: string
  
  /** Whether link opens in new tab */
  external?: boolean
}

/**
 * Props for the AdminFooter component
 */
export interface AdminFooterProps {
  /** Additional CSS classes to apply to footer element */
  className?: string

  /** Hide system health status display */
  hideHealth?: boolean

  /** Hide environment badge (Production/Staging/Dev) */
  hideEnvironment?: boolean

  /** Custom quick links to override defaults */
  customLinks?: FooterLink[]

  /** Current sidebar collapsed state (optional) */
  sidebarCollapsed?: boolean
}

/**
 * Props for the SystemStatus component
 */
export interface SystemStatusProps {
  /** System health data */
  health?: SystemHealth

  /** Loading state indicator */
  loading?: boolean

  /** Error object if health check failed */
  error?: Error | null

  /** Compact display mode (icon + abbreviated text only) */
  compact?: boolean

  /** Click handler to open health details modal */
  onClick?: () => void
}

/**
 * Props for ProductInfo component
 */
export interface ProductInfoProps {
  /** Compact display mode */
  compact?: boolean
}

/**
 * Props for QuickLinks component
 */
export interface QuickLinksProps {
  /** Custom quick links to display */
  links?: FooterLink[]
  
  /** Compact display mode */
  compact?: boolean
}

/**
 * Props for SupportLinks component
 */
export interface SupportLinksProps {
  /** Custom support links to display */
  links?: FooterLink[]
  
  /** Compact display mode */
  compact?: boolean
}

/**
 * Props for EnvironmentBadge component
 */
export interface EnvironmentBadgeProps {
  /** Compact display mode */
  compact?: boolean
  
  /** Hide badge when in production environment */
  hideProduction?: boolean
}

/**
 * Options for useSystemHealth hook
 */
export interface UseSystemHealthOptions {
  /** Polling interval in milliseconds (default: 30000) */
  interval?: number
  
  /** Enable/disable polling (default: true) */
  enabled?: boolean
  
  /** Callback fired when status changes */
  onStatusChange?: (newStatus: string, oldStatus: string) => void
}

/**
 * Return type for useSystemHealth hook
 */
export interface UseSystemHealthReturn {
  /** Current system health data */
  health: SystemHealth

  /** Error from health check request */
  error: Error | null

  /** Loading state */
  isLoading: boolean

  /** Manual refetch function */
  mutate: () => void

  /** Current status string */
  status: 'healthy' | 'degraded' | 'unavailable' | 'unknown'
  
  /** Human-readable status message */
  message: string
  
  /** ISO timestamp of last check */
  timestamp: string | undefined
}

/**
 * API response format for health check endpoint
 */
export interface SystemHealthResponse {
  status: 'healthy' | 'degraded' | 'unavailable'
  message: string
  checks: {
    database: {
      status: string
      latency: number
      error?: string
    }
    redis?: {
      status: string
      latency: number
      error?: string
    }
    api: {
      status: string
      latency: number
      error?: string
    }
    email?: {
      status: string
      latency: number
      error?: string
    }
    auth?: {
      status: string
      latency: number
      error?: string
    }
  }
  timestamp: string
  uptime?: number
}
