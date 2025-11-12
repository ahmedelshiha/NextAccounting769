/**
 * User Management Settings Types
 * Comprehensive type definitions for all user management settings
 */

export type UserRole = 'SUPER_ADMIN' | 'ADMIN' | 'TEAM_LEAD' | 'TEAM_MEMBER' | 'STAFF' | 'CLIENT'

export interface Permission {
  id: string
  name: string
  description: string
  category: string
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
}

// ============== Role Management Types ==============

export interface SystemRole {
  name: UserRole
  displayName: string
  description: string
  permissions: Permission[]
  canDelegate: boolean
  maxInstances: number | null
  isEditable: boolean
}

export interface CustomRole {
  id: string
  name: string
  description: string
  baseRole: UserRole
  customPermissions: Permission[]
  isActive: boolean
  createdAt: Date
  updatedAt: Date
  usageCount: number
}

export interface RoleConfig {
  systemRoles: Record<UserRole, SystemRole>
  customRoles: CustomRole[]
  hierarchy: {
    canDelegate: Record<UserRole, UserRole[]>
    inheritPermissions: Record<UserRole, boolean>
  }
  defaultRoleOnSignup: UserRole
  defaultRoleOnInvite: UserRole
}

// ============== Permission Templates Types ==============

export interface PermissionTemplate {
  id: string
  name: string
  description: string
  category: 'role-based' | 'department' | 'skill-based'
  permissions: Permission[]
  usageCount: number
  lastUsedAt: Date | null
  createdBy: string
  isActive: boolean
  isSystem: boolean
  suggestedRoles: UserRole[]
  suggestedDepartments: string[]
}

// ============== Onboarding Workflow Types ==============

export interface OnboardingStep {
  id: string
  type: 'email' | 'profile' | 'setup' | 'assignment' | 'notification' | 'checklist'
  title: string
  description?: string
  condition?: {
    field: string
    operator: 'equals' | 'contains' | 'startsWith'
    value: string
  }
  dueInDays?: number
  required: boolean
  order: number
}

export interface OnboardingWorkflow {
  id: string
  name: string
  description: string
  trigger: 'employee' | 'client' | 'contractor' | 'custom'
  steps: OnboardingStep[]
  enabled: boolean
  createdAt: Date
}

export interface OnboardingConfig {
  workflows: OnboardingWorkflow[]
  defaultWorkflow: string | null
  welcomeEmail: {
    enabled: boolean
    subject: string
    templateId: string
  }
  autoAssignment: {
    enabled: boolean
    assignToManager: boolean
    permissionTemplate: string
    departmentFromInviter: boolean
  }
  firstLogin: {
    forcePasswordChange: boolean
    passwordExpiryDays: number
    requireProfileCompletion: boolean
    requiredProfileFields: string[]
    showTutorial: boolean
    tutorialModules: string[]
  }
  checklist: {
    enabled: boolean
    items: {
      title: string
      description: string
      required: boolean
      dueInDays: number
    }[]
  }
  notificationOnInvite: {
    toAdmin: boolean
    toManager: boolean
    toNewUser: boolean
  }
}

// ============== User Policies Types ==============

export interface UserPolicies {
  dataRetention: {
    inactiveUserDays: number
    archiveInactiveAfterDays: number | null
    deleteArchivedAfterDays: number | null
    archiveNotificationDays: number
    keepAuditLogs: boolean
    auditLogRetentionYears: number
  }
  activityMonitoring: {
    trackLoginAttempts: boolean
    trackDataAccess: boolean
    trackPermissionChanges: boolean
    trackBulkActions: boolean
    retentionDays: number
    alertOnSuspiciousActivity: boolean
  }
  accessControl: {
    requireMFAForRole: Record<UserRole, boolean>
    minPasswordAgeDays: number
    maxPasswordAgeDays: number
    preventPreviousPasswords: number
    lockoutAfterFailedAttempts: number
    lockoutDurationMinutes: number
  }
  ipLocation: {
    restrictByIP: boolean
    allowedIPRanges: string[]
    warnOnNewLocation: boolean
    requireMFAOnNewLocation: boolean
    geofenceCountries: string[] | null
  }
  deviceManagement: {
    trackDevices: boolean
    requireDeviceApproval: boolean
    maxDevicesPerUser: number
    warnBeforeNewDevice: boolean
  }
}

// ============== Rate Limiting Types ==============

export interface RateLimitPerRole {
  apiCallsPerMinute: number
  apiCallsPerDay: number
  bulkOperationLimit: number
  reportGenerationPerDay: number
  exportSizeGB: number
  concurrentSessions: number
  fileUploadSizeMB: number
}

export interface RateLimitConfig {
  roles: Record<UserRole, RateLimitPerRole>
  global: {
    tenantApiCallsPerMinute: number
    tenantApiCallsPerDay: number
    tenantConcurrentUsers: number
  }
  throttling: {
    enableAdaptiveThrottling: boolean
    gracefulDegradation: boolean
  }
}

// ============== Session Management Types ==============

export interface SessionTimeoutConfig {
  absoluteMaxMinutes: number
  inactivityMinutes: number
  warningBeforeLogoutMinutes: number
  allowExtend: boolean
  maxExtensions: number
}

export interface SessionConfig {
  sessionTimeout: {
    byRole: Record<UserRole, SessionTimeoutConfig>
    global: {
      absoluteMaxDays: number
      forceLogoutTime: string | null
    }
  }
  concurrentSessions: {
    byRole: Record<UserRole, number>
    allowMultipleDevices: boolean
    requireMFAForMultipleSessions: boolean
    kickOldestSession: boolean
  }
  security: {
    requireSSL: boolean
    httpOnlyTokens: boolean
    sameSiteCookies: 'Strict' | 'Lax' | 'None'
    resetTokensOnPasswordChange: boolean
    invalidateOnPermissionChange: boolean
    regenerateSessionIdOnLogin: boolean
  }
  devices: {
    requireDeviceId: boolean
    trackUserAgent: boolean
    warnOnBrowserChange: boolean
    warnOnIPChange: boolean
  }
}

// ============== Invitation Settings Types ==============

export interface InvitationConfig {
  invitations: {
    defaultRole: UserRole
    expiryDays: number
    resendLimit: number
    requireEmail: boolean
    allowMultipleInvites: boolean
    notificationEmail: boolean
  }
  signUp: {
    enabled: boolean
    defaultRole: UserRole
    requireApproval: boolean
    approvalNotification: {
      toAdmins: boolean
      toManager: boolean
    }
    requiredFields: string[]
    prohibitedDomains: string[]
    allowedDomains: string[] | null
  }
  verification: {
    required: boolean
    expiryHours: number
    resendLimit: number
  }
  domainAutoAssign: {
    enabled: boolean
    rules: {
      emailDomain: string
      assignRole: UserRole
      assignDepartment: string
      assignManager: string | null
    }[]
  }
}

// ============== Client Entity Settings ==============

export interface ClientEntitySettings {
  registration: {
    requireAccount?: boolean
    emailVerification?: boolean
    duplicateCheck?: 'none' | 'email' | 'email+phone'
    collectAddress?: boolean
  }
  profiles: {
    fields?: Array<{
      key: string
      label: string
      type: 'text' | 'email' | 'phone' | 'date' | 'number'
      required?: boolean
      visibleInPortal?: boolean
      editableByClient?: boolean
    }>
  }
  communication: {
    emailOptInDefault?: boolean
    smsOptInDefault?: boolean
    preferredChannel?: 'email' | 'sms' | 'none'
    marketingOptInDefault?: boolean
  }
  segmentation: {
    tags?: string[]
    autoSegments?: Array<{
      name: string
      rule: string
      active?: boolean
    }>
  }
  loyalty: {
    enabled?: boolean
    pointsPerDollar?: number
    tiers?: Array<{
      tier: string
      minPoints: number
    }>
  }
  portal: {
    allowDocumentUpload?: boolean
    allowInvoiceView?: boolean
    allowPaymentHistory?: boolean
    language?: string
    timezone?: string
  }
}

// ============== Team Entity Settings ==============

export interface TeamEntitySettings {
  structure: {
    orgUnits?: Array<{
      id?: string
      name: string
      parentId?: string | null
      leadUserId?: string | null
    }>
  }
  availability: {
    allowFlexibleHours?: boolean
    minimumHoursNotice?: number
    defaultWorkingHours?: {
      timezone?: string
    }
  }
  skills: {
    skills?: Array<{
      key: string
      name: string
      weight?: number
    }>
  }
  workload: {
    autoAssignStrategy?: 'ROUND_ROBIN' | 'LEAST_WORKLOAD' | 'SKILL_MATCH' | 'MANUAL'
    maxConcurrentAssignments?: number
    considerAvailability?: boolean
  }
  performance: {
    enableMetrics?: boolean
    metricsWindowDays?: number
  }
}

// ============== Complete Settings Type ==============

export interface UserManagementSettings {
  roles: RoleConfig
  permissions: PermissionTemplate[]
  onboarding: OnboardingConfig
  policies: UserPolicies
  rateLimits: RateLimitConfig
  sessions: SessionConfig
  invitations: InvitationConfig
  entities?: {
    clients?: ClientEntitySettings
    teams?: TeamEntitySettings
  }
  lastUpdatedAt: Date
  lastUpdatedBy: string
}

// ============== API Response Types ==============

export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

export interface SettingChange {
  field: string
  oldValue: unknown
  newValue: unknown
  changedAt: Date
  changedBy: string
}
