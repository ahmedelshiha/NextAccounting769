import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { withAdminAuth, AuthenticatedRequest } from '@/lib/auth-middleware'
import { UserManagementSettings } from '@/app/admin/settings/user-management/types'
import { AuditLoggingService, AuditActionType, AuditSeverity } from '@/services/audit-logging.service'

/**
 * GET /api/admin/settings/user-management
 * Fetch user management settings for the current tenant
 */
async function handleGET(request: AuthenticatedRequest) {
  try {
    const { tenantId } = request

    // Check tenant context
    if (!tenantId) {
      return NextResponse.json(
        { error: 'Tenant ID not found' },
        { status: 400 }
      )
    }

    // Fetch or create default settings
    let settings = await prisma.userManagementSettings.findUnique({
      where: { tenantId },
    })

    if (!settings) {
      // Create default settings if they don't exist
      settings = await prisma.userManagementSettings.create({
        data: {
          tenantId,
          roles: getDefaultRoles(),
          permissions: getDefaultPermissions(),
          onboarding: getDefaultOnboarding(),
          policies: getDefaultPolicies(),
          rateLimits: getDefaultRateLimits(),
          sessions: getDefaultSessions(),
          invitations: getDefaultInvitations(),
        },
      })
    }

    // Convert JSON strings to objects
    const responseData: UserManagementSettings = {
      roles: typeof settings.roles === 'string' ? JSON.parse(settings.roles) : settings.roles,
      permissions: typeof settings.permissions === 'string' ? JSON.parse(settings.permissions) : settings.permissions,
      onboarding: typeof settings.onboarding === 'string' ? JSON.parse(settings.onboarding) : settings.onboarding,
      policies: typeof settings.policies === 'string' ? JSON.parse(settings.policies) : settings.policies,
      rateLimits: typeof settings.rateLimits === 'string' ? JSON.parse(settings.rateLimits) : settings.rateLimits,
      sessions: typeof settings.sessions === 'string' ? JSON.parse(settings.sessions) : settings.sessions,
      invitations: typeof settings.invitations === 'string' ? JSON.parse(settings.invitations) : settings.invitations,
      entities: {
        clients: settings.clientSettings ? (typeof settings.clientSettings === 'string' ? JSON.parse(settings.clientSettings) : settings.clientSettings) : undefined,
        teams: settings.teamSettings ? (typeof settings.teamSettings === 'string' ? JSON.parse(settings.teamSettings) : settings.teamSettings) : undefined,
      },
      lastUpdatedAt: settings.updatedAt,
      lastUpdatedBy: settings.lastUpdatedBy || 'system',
    }

    return NextResponse.json(responseData)
  } catch (error) {
    console.error('Error fetching user management settings:', error)
    return NextResponse.json(
      { error: 'Failed to fetch settings' },
      { status: 500 }
    )
  }
}

export const GET = withAdminAuth(handleGET)

/**
 * PUT /api/admin/settings/user-management
 * Update user management settings for the current tenant
 */
async function handlePUT(request: AuthenticatedRequest) {
  try {
    const { tenantId, userId } = request

    if (!tenantId) {
      return NextResponse.json(
        { error: 'Tenant ID not found' },
        { status: 400 }
      )
    }

    const body = await request.json()

    // Validate request body
    if (!body || typeof body !== 'object') {
      return NextResponse.json(
        { error: 'Invalid request body' },
        { status: 400 }
      )
    }

    // Get existing settings
    let settings = await prisma.userManagementSettings.findUnique({
      where: { tenantId },
    })

    if (!settings) {
      // Create if doesn't exist
      settings = await prisma.userManagementSettings.create({
        data: {
          tenantId,
          roles: body.roles || getDefaultRoles(),
          permissions: body.permissions || getDefaultPermissions(),
          onboarding: body.onboarding || getDefaultOnboarding(),
          policies: body.policies || getDefaultPolicies(),
          rateLimits: body.rateLimits || getDefaultRateLimits(),
          sessions: body.sessions || getDefaultSessions(),
          invitations: body.invitations || getDefaultInvitations(),
          clientSettings: body.entities?.clients || null,
          teamSettings: body.entities?.teams || null,
          lastUpdatedBy: userId,
        },
      })
    } else {
      // Update existing settings
      settings = await prisma.userManagementSettings.update({
        where: { tenantId },
        data: {
          roles: body.roles !== undefined ? body.roles : settings.roles,
          permissions: body.permissions !== undefined ? body.permissions : settings.permissions,
          onboarding: body.onboarding !== undefined ? body.onboarding : settings.onboarding,
          policies: body.policies !== undefined ? body.policies : settings.policies,
          rateLimits: body.rateLimits !== undefined ? body.rateLimits : settings.rateLimits,
          sessions: body.sessions !== undefined ? body.sessions : settings.sessions,
          invitations: body.invitations !== undefined ? body.invitations : settings.invitations,
          clientSettings: body.entities?.clients !== undefined ? body.entities.clients : settings.clientSettings,
          teamSettings: body.entities?.teams !== undefined ? body.entities.teams : settings.teamSettings,
          lastUpdatedBy: userId,
        },
      })
    }

    // Determine severity and prepare change details
    let severity = AuditSeverity.INFO
    const changedSections: string[] = []
    const changes: Record<string, any> = {}

    // Analyze what changed
    if (body.roles !== undefined) {
      changedSections.push('roles')
      changes.roles = body.roles
      // Role changes can be critical if admins are modified
      if (JSON.stringify(body.roles).includes('ADMIN') || JSON.stringify(body.roles).includes('SUPER_ADMIN')) {
        severity = AuditSeverity.CRITICAL
      }
    }
    if (body.permissions !== undefined) {
      changedSections.push('permissions')
      changes.permissions = body.permissions
    }
    if (body.onboarding !== undefined) {
      changedSections.push('onboarding')
      changes.onboarding = body.onboarding
    }
    if (body.policies !== undefined) {
      changedSections.push('policies')
      changes.policies = body.policies
      // Policy changes related to security can be critical
      if (JSON.stringify(body.policies).includes('MFA') || JSON.stringify(body.policies).includes('password')) {
        severity = AuditSeverity.CRITICAL
      }
    }
    if (body.rateLimits !== undefined) {
      changedSections.push('rate-limits')
      changes.rateLimits = body.rateLimits
    }
    if (body.sessions !== undefined) {
      changedSections.push('sessions')
      changes.sessions = body.sessions
    }
    if (body.invitations !== undefined) {
      changedSections.push('invitations')
      changes.invitations = body.invitations
    }
    if (body.entities?.clients !== undefined) {
      changedSections.push('client-settings')
      if (!changes.entities) changes.entities = {}
      changes.entities.clients = body.entities.clients
    }
    if (body.entities?.teams !== undefined) {
      changedSections.push('team-settings')
      if (!changes.entities) changes.entities = {}
      changes.entities.teams = body.entities.teams
    }

    // Log the change with comprehensive audit logging
    await AuditLoggingService.logAuditEvent({
      action: AuditActionType.SETTING_CHANGED,
      severity,
      userId,
      tenantId,
      targetResourceId: 'user-management-settings',
      targetResourceType: 'SETTINGS',
      description: `Updated user management settings (${changedSections.join(', ')})`,
      changes,
      metadata: {
        changedSections,
        sectionCount: changedSections.length,
        timestamp: new Date().toISOString(),
      },
    })

    // Also create the legacy settingChangeDiff record for backward compatibility
    await prisma.settingChangeDiff.create({
      data: {
        tenantId,
        userId,
        category: 'USER_MANAGEMENT',
        resource: 'user-management-settings',
        before: {},
        after: body,
      },
    }).catch(err => {
      console.warn('Failed to create settingChangeDiff record:', err)
      // Don't fail the request if legacy logging fails
    })

    // Convert JSON strings to objects for response
    const responseData: UserManagementSettings = {
      roles: typeof settings.roles === 'string' ? JSON.parse(settings.roles) : settings.roles,
      permissions: typeof settings.permissions === 'string' ? JSON.parse(settings.permissions) : settings.permissions,
      onboarding: typeof settings.onboarding === 'string' ? JSON.parse(settings.onboarding) : settings.onboarding,
      policies: typeof settings.policies === 'string' ? JSON.parse(settings.policies) : settings.policies,
      rateLimits: typeof settings.rateLimits === 'string' ? JSON.parse(settings.rateLimits) : settings.rateLimits,
      sessions: typeof settings.sessions === 'string' ? JSON.parse(settings.sessions) : settings.sessions,
      invitations: typeof settings.invitations === 'string' ? JSON.parse(settings.invitations) : settings.invitations,
      entities: {
        clients: settings.clientSettings ? (typeof settings.clientSettings === 'string' ? JSON.parse(settings.clientSettings) : settings.clientSettings) : undefined,
        teams: settings.teamSettings ? (typeof settings.teamSettings === 'string' ? JSON.parse(settings.teamSettings) : settings.teamSettings) : undefined,
      },
      lastUpdatedAt: settings.updatedAt,
      lastUpdatedBy: settings.lastUpdatedBy || 'system',
    }

    return NextResponse.json(responseData)
  } catch (error) {
    console.error('Error updating user management settings:', error)
    return NextResponse.json(
      { error: 'Failed to update settings' },
      { status: 500 }
    )
  }
}

export const PUT = withAdminAuth(handlePUT)

// Default configuration generators
function getDefaultRoles() {
  return {
    systemRoles: {
      SUPER_ADMIN: {
        name: 'SUPER_ADMIN',
        displayName: 'Super Administrator',
        description: 'Full system access',
        permissions: [],
        canDelegate: true,
        maxInstances: null,
        isEditable: false,
      },
      ADMIN: {
        name: 'ADMIN',
        displayName: 'Administrator',
        description: 'Admin access to organization',
        permissions: [],
        canDelegate: true,
        maxInstances: null,
        isEditable: false,
      },
      TEAM_LEAD: {
        name: 'TEAM_LEAD',
        displayName: 'Team Lead',
        description: 'Manage team members',
        permissions: [],
        canDelegate: false,
        maxInstances: null,
        isEditable: true,
      },
      TEAM_MEMBER: {
        name: 'TEAM_MEMBER',
        displayName: 'Team Member',
        description: 'Regular team member',
        permissions: [],
        canDelegate: false,
        maxInstances: null,
        isEditable: true,
      },
      STAFF: {
        name: 'STAFF',
        displayName: 'Staff',
        description: 'Staff member',
        permissions: [],
        canDelegate: false,
        maxInstances: null,
        isEditable: true,
      },
      CLIENT: {
        name: 'CLIENT',
        displayName: 'Client',
        description: 'External client',
        permissions: [],
        canDelegate: false,
        maxInstances: null,
        isEditable: false,
      },
    },
    customRoles: [],
    hierarchy: {
      canDelegate: {},
      inheritPermissions: {},
    },
    defaultRoleOnSignup: 'CLIENT',
    defaultRoleOnInvite: 'TEAM_MEMBER',
  }
}

function getDefaultPermissions() {
  return []
}

function getDefaultOnboarding() {
  return {
    workflows: [],
    defaultWorkflow: null,
    welcomeEmail: {
      enabled: true,
      subject: 'Welcome to our platform',
      templateId: 'default-welcome',
    },
    autoAssignment: {
      enabled: false,
      assignToManager: false,
      permissionTemplate: null,
      departmentFromInviter: false,
    },
    firstLogin: {
      forcePasswordChange: false,
      passwordExpiryDays: 90,
      requireProfileCompletion: false,
      requiredProfileFields: [],
      showTutorial: false,
      tutorialModules: [],
    },
    checklist: {
      enabled: false,
      items: [],
    },
    notificationOnInvite: {
      toAdmin: true,
      toManager: false,
      toNewUser: true,
    },
  }
}

function getDefaultPolicies() {
  return {
    dataRetention: {
      inactiveUserDays: 90,
      archiveInactiveAfterDays: 365,
      deleteArchivedAfterDays: null,
      archiveNotificationDays: 30,
      keepAuditLogs: true,
      auditLogRetentionYears: 7,
    },
    activityMonitoring: {
      trackLoginAttempts: true,
      trackDataAccess: false,
      trackPermissionChanges: true,
      trackBulkActions: true,
      retentionDays: 90,
      alertOnSuspiciousActivity: true,
    },
    accessControl: {
      requireMFAForRole: {
        SUPER_ADMIN: true,
        ADMIN: true,
        TEAM_LEAD: false,
        TEAM_MEMBER: false,
        STAFF: false,
        CLIENT: false,
      },
      minPasswordAgeDays: 0,
      maxPasswordAgeDays: 90,
      preventPreviousPasswords: 3,
      lockoutAfterFailedAttempts: 5,
      lockoutDurationMinutes: 30,
    },
    ipLocation: {
      restrictByIP: false,
      allowedIPRanges: [],
      warnOnNewLocation: false,
      requireMFAOnNewLocation: false,
      geofenceCountries: null,
    },
    deviceManagement: {
      trackDevices: false,
      requireDeviceApproval: false,
      maxDevicesPerUser: 5,
      warnBeforeNewDevice: false,
    },
  }
}

function getDefaultRateLimits() {
  return {
    roles: {
      SUPER_ADMIN: {
        apiCallsPerMinute: 1000,
        apiCallsPerDay: 100000,
        bulkOperationLimit: 10000,
        reportGenerationPerDay: 100,
        exportSizeGB: 100,
        concurrentSessions: 10,
        fileUploadSizeMB: 1000,
      },
      ADMIN: {
        apiCallsPerMinute: 500,
        apiCallsPerDay: 50000,
        bulkOperationLimit: 5000,
        reportGenerationPerDay: 50,
        exportSizeGB: 50,
        concurrentSessions: 5,
        fileUploadSizeMB: 500,
      },
      TEAM_LEAD: {
        apiCallsPerMinute: 100,
        apiCallsPerDay: 10000,
        bulkOperationLimit: 1000,
        reportGenerationPerDay: 10,
        exportSizeGB: 10,
        concurrentSessions: 2,
        fileUploadSizeMB: 100,
      },
      TEAM_MEMBER: {
        apiCallsPerMinute: 50,
        apiCallsPerDay: 5000,
        bulkOperationLimit: 500,
        reportGenerationPerDay: 5,
        exportSizeGB: 5,
        concurrentSessions: 2,
        fileUploadSizeMB: 50,
      },
      STAFF: {
        apiCallsPerMinute: 30,
        apiCallsPerDay: 3000,
        bulkOperationLimit: 100,
        reportGenerationPerDay: 2,
        exportSizeGB: 2,
        concurrentSessions: 1,
        fileUploadSizeMB: 25,
      },
      CLIENT: {
        apiCallsPerMinute: 10,
        apiCallsPerDay: 1000,
        bulkOperationLimit: 0,
        reportGenerationPerDay: 0,
        exportSizeGB: 1,
        concurrentSessions: 1,
        fileUploadSizeMB: 10,
      },
    },
    global: {
      tenantApiCallsPerMinute: 5000,
      tenantApiCallsPerDay: 500000,
      tenantConcurrentUsers: 100,
    },
    throttling: {
      enableAdaptiveThrottling: true,
      gracefulDegradation: true,
    },
  }
}

function getDefaultSessions() {
  return {
    sessionTimeout: {
      byRole: {
        SUPER_ADMIN: {
          absoluteMaxMinutes: 1440,
          inactivityMinutes: 60,
          warningBeforeLogoutMinutes: 5,
          allowExtend: true,
          maxExtensions: 5,
        },
        ADMIN: {
          absoluteMaxMinutes: 1440,
          inactivityMinutes: 60,
          warningBeforeLogoutMinutes: 5,
          allowExtend: true,
          maxExtensions: 3,
        },
        TEAM_LEAD: {
          absoluteMaxMinutes: 720,
          inactivityMinutes: 30,
          warningBeforeLogoutMinutes: 5,
          allowExtend: true,
          maxExtensions: 3,
        },
        TEAM_MEMBER: {
          absoluteMaxMinutes: 480,
          inactivityMinutes: 30,
          warningBeforeLogoutMinutes: 5,
          allowExtend: false,
          maxExtensions: 0,
        },
        STAFF: {
          absoluteMaxMinutes: 480,
          inactivityMinutes: 20,
          warningBeforeLogoutMinutes: 5,
          allowExtend: false,
          maxExtensions: 0,
        },
        CLIENT: {
          absoluteMaxMinutes: 1440,
          inactivityMinutes: 120,
          warningBeforeLogoutMinutes: 5,
          allowExtend: false,
          maxExtensions: 0,
        },
      },
      global: {
        absoluteMaxDays: 90,
        forceLogoutTime: '02:00',
      },
    },
    concurrentSessions: {
      byRole: {
        SUPER_ADMIN: 10,
        ADMIN: 5,
        TEAM_LEAD: 2,
        TEAM_MEMBER: 2,
        STAFF: 1,
        CLIENT: 1,
      },
      allowMultipleDevices: true,
      requireMFAForMultipleSessions: false,
      kickOldestSession: false,
    },
    security: {
      requireSSL: true,
      httpOnlyTokens: true,
      sameSiteCookies: 'Strict',
      resetTokensOnPasswordChange: true,
      invalidateOnPermissionChange: true,
      regenerateSessionIdOnLogin: true,
    },
    devices: {
      requireDeviceId: false,
      trackUserAgent: true,
      warnOnBrowserChange: false,
      warnOnIPChange: false,
    },
  }
}

function getDefaultInvitations() {
  return {
    invitations: {
      defaultRole: 'TEAM_MEMBER',
      expiryDays: 7,
      resendLimit: 3,
      requireEmail: true,
      allowMultipleInvites: false,
      notificationEmail: true,
    },
    signUp: {
      enabled: true,
      defaultRole: 'CLIENT',
      requireApproval: false,
      approvalNotification: {
        toAdmins: true,
        toManager: false,
      },
      requiredFields: ['email', 'name'],
      prohibitedDomains: [],
      allowedDomains: null,
    },
    verification: {
      required: true,
      expiryHours: 24,
      resendLimit: 3,
    },
    domainAutoAssign: {
      enabled: false,
      rules: [],
    },
  }
}
