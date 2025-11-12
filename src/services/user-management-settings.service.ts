import prisma from '@/lib/prisma'
import { UserManagementSettings } from '@/app/admin/settings/user-management/types'
import { AuditLog } from '@prisma/client'

/**
 * UserManagementSettingsService
 * Handles persistence and retrieval of user management settings
 * Settings are stored in Tenant metadata as JSON
 */
export class UserManagementSettingsService {
  private static readonly SETTINGS_KEY = 'userManagementSettings'

  /**
   * Default User Management Settings
   * Used as fallback when no custom settings exist
   */
  private static readonly DEFAULT_SETTINGS: UserManagementSettings = {
    roles: {
      systemRoles: {
        SUPER_ADMIN: {
          name: 'SUPER_ADMIN',
          displayName: 'Super Administrator',
          description: 'Full system access',
          permissions: [],
          canDelegate: true,
          maxInstances: 1,
          isEditable: false
        },
        ADMIN: {
          name: 'ADMIN',
          displayName: 'Administrator',
          description: 'Administrative access',
          permissions: [],
          canDelegate: true,
          maxInstances: null,
          isEditable: false
        },
        TEAM_LEAD: {
          name: 'TEAM_LEAD',
          displayName: 'Team Lead',
          description: 'Team management and oversight',
          permissions: [],
          canDelegate: false,
          maxInstances: null,
          isEditable: false
        },
        TEAM_MEMBER: {
          name: 'TEAM_MEMBER',
          displayName: 'Team Member',
          description: 'Regular team member access',
          permissions: [],
          canDelegate: false,
          maxInstances: null,
          isEditable: false
        },
        STAFF: {
          name: 'STAFF',
          displayName: 'Staff',
          description: 'Limited staff access',
          permissions: [],
          canDelegate: false,
          maxInstances: null,
          isEditable: false
        },
        CLIENT: {
          name: 'CLIENT',
          displayName: 'Client',
          description: 'Client portal access',
          permissions: [],
          canDelegate: false,
          maxInstances: null,
          isEditable: false
        }
      },
      customRoles: [],
      hierarchy: {
        canDelegate: {
          SUPER_ADMIN: ['ADMIN', 'TEAM_LEAD', 'TEAM_MEMBER', 'STAFF', 'CLIENT'],
          ADMIN: ['TEAM_LEAD', 'TEAM_MEMBER', 'STAFF', 'CLIENT'],
          TEAM_LEAD: ['TEAM_MEMBER', 'STAFF'],
          TEAM_MEMBER: [],
          STAFF: [],
          CLIENT: []
        },
        inheritPermissions: {
          SUPER_ADMIN: true,
          ADMIN: true,
          TEAM_LEAD: true,
          TEAM_MEMBER: true,
          STAFF: true,
          CLIENT: true
        }
      },
      defaultRoleOnSignup: 'CLIENT',
      defaultRoleOnInvite: 'TEAM_MEMBER'
    },
    permissions: [],
    onboarding: {
      workflows: [],
      defaultWorkflow: null,
      welcomeEmail: {
        enabled: true,
        subject: 'Welcome to {{company_name}}!',
        templateId: 'default-welcome'
      },
      autoAssignment: {
        enabled: false,
        assignToManager: false,
        permissionTemplate: '',
        departmentFromInviter: false
      },
      firstLogin: {
        forcePasswordChange: false,
        passwordExpiryDays: 90,
        requireProfileCompletion: false,
        requiredProfileFields: [],
        showTutorial: false,
        tutorialModules: []
      },
      checklist: {
        enabled: false,
        items: []
      },
      notificationOnInvite: {
        toAdmin: true,
        toManager: false,
        toNewUser: true
      }
    },
    policies: {
      dataRetention: {
        inactiveUserDays: 60,
        archiveInactiveAfterDays: 180,
        deleteArchivedAfterDays: 365,
        archiveNotificationDays: 30,
        keepAuditLogs: true,
        auditLogRetentionYears: 3
      },
      activityMonitoring: {
        trackLoginAttempts: true,
        trackDataAccess: true,
        trackPermissionChanges: true,
        trackBulkActions: true,
        retentionDays: 90,
        alertOnSuspiciousActivity: true
      },
      accessControl: {
        requireMFAForRole: {
          SUPER_ADMIN: true,
          ADMIN: true,
          TEAM_LEAD: false,
          TEAM_MEMBER: false,
          STAFF: false,
          CLIENT: false
        },
        minPasswordAgeDays: 0,
        maxPasswordAgeDays: 90,
        preventPreviousPasswords: 5,
        lockoutAfterFailedAttempts: 5,
        lockoutDurationMinutes: 15
      },
      ipLocation: {
        restrictByIP: false,
        allowedIPRanges: [],
        warnOnNewLocation: false,
        requireMFAOnNewLocation: false,
        geofenceCountries: null
      },
      deviceManagement: {
        trackDevices: false,
        requireDeviceApproval: false,
        maxDevicesPerUser: 5,
        warnBeforeNewDevice: false
      }
    },
    rateLimits: {
      roles: {
        SUPER_ADMIN: {
          apiCallsPerMinute: 10000,
          apiCallsPerDay: 1000000,
          bulkOperationLimit: 100000,
          reportGenerationPerDay: 50,
          exportSizeGB: 100,
          concurrentSessions: 10,
          fileUploadSizeMB: 1000
        },
        ADMIN: {
          apiCallsPerMinute: 5000,
          apiCallsPerDay: 1000000,
          bulkOperationLimit: 50000,
          reportGenerationPerDay: 20,
          exportSizeGB: 50,
          concurrentSessions: 10,
          fileUploadSizeMB: 500
        },
        TEAM_LEAD: {
          apiCallsPerMinute: 1000,
          apiCallsPerDay: 100000,
          bulkOperationLimit: 10000,
          reportGenerationPerDay: 10,
          exportSizeGB: 20,
          concurrentSessions: 5,
          fileUploadSizeMB: 250
        },
        TEAM_MEMBER: {
          apiCallsPerMinute: 500,
          apiCallsPerDay: 50000,
          bulkOperationLimit: 5000,
          reportGenerationPerDay: 5,
          exportSizeGB: 10,
          concurrentSessions: 3,
          fileUploadSizeMB: 100
        },
        STAFF: {
          apiCallsPerMinute: 300,
          apiCallsPerDay: 25000,
          bulkOperationLimit: 1000,
          reportGenerationPerDay: 3,
          exportSizeGB: 5,
          concurrentSessions: 2,
          fileUploadSizeMB: 50
        },
        CLIENT: {
          apiCallsPerMinute: 100,
          apiCallsPerDay: 10000,
          bulkOperationLimit: 500,
          reportGenerationPerDay: 1,
          exportSizeGB: 1,
          concurrentSessions: 2,
          fileUploadSizeMB: 25
        }
      },
      global: {
        tenantApiCallsPerMinute: 50000,
        tenantApiCallsPerDay: 10000000,
        tenantConcurrentUsers: 1000
      },
      throttling: {
        enableAdaptiveThrottling: false,
        gracefulDegradation: true
      }
    },
    sessions: {
      sessionTimeout: {
        byRole: {
          SUPER_ADMIN: {
            absoluteMaxMinutes: 720,
            inactivityMinutes: 60,
            warningBeforeLogoutMinutes: 15,
            allowExtend: true,
            maxExtensions: 10
          },
          ADMIN: {
            absoluteMaxMinutes: 480,
            inactivityMinutes: 60,
            warningBeforeLogoutMinutes: 15,
            allowExtend: true,
            maxExtensions: 5
          },
          TEAM_LEAD: {
            absoluteMaxMinutes: 480,
            inactivityMinutes: 30,
            warningBeforeLogoutMinutes: 10,
            allowExtend: true,
            maxExtensions: 3
          },
          TEAM_MEMBER: {
            absoluteMaxMinutes: 480,
            inactivityMinutes: 30,
            warningBeforeLogoutMinutes: 10,
            allowExtend: true,
            maxExtensions: 3
          },
          STAFF: {
            absoluteMaxMinutes: 240,
            inactivityMinutes: 20,
            warningBeforeLogoutMinutes: 5,
            allowExtend: false,
            maxExtensions: 0
          },
          CLIENT: {
            absoluteMaxMinutes: 1440,
            inactivityMinutes: 60,
            warningBeforeLogoutMinutes: 10,
            allowExtend: false,
            maxExtensions: 0
          }
        },
        global: {
          absoluteMaxDays: 7,
          forceLogoutTime: null
        }
      },
      concurrentSessions: {
        byRole: {
          SUPER_ADMIN: 10,
          ADMIN: 10,
          TEAM_LEAD: 5,
          TEAM_MEMBER: 3,
          STAFF: 2,
          CLIENT: 2
        },
        allowMultipleDevices: true,
        requireMFAForMultipleSessions: false,
        kickOldestSession: false
      },
      security: {
        requireSSL: true,
        httpOnlyTokens: true,
        sameSiteCookies: 'Lax' as const,
        resetTokensOnPasswordChange: true,
        invalidateOnPermissionChange: true,
        regenerateSessionIdOnLogin: true
      },
      devices: {
        requireDeviceId: false,
        trackUserAgent: true,
        warnOnBrowserChange: false,
        warnOnIPChange: false
      }
    },
    invitations: {
      invitations: {
        defaultRole: 'TEAM_MEMBER',
        expiryDays: 7,
        resendLimit: 3,
        requireEmail: true,
        allowMultipleInvites: false,
        notificationEmail: true
      },
      signUp: {
        enabled: false,
        defaultRole: 'CLIENT',
        requireApproval: false,
        approvalNotification: {
          toAdmins: true,
          toManager: false
        },
        requiredFields: ['email', 'name'],
        prohibitedDomains: [],
        allowedDomains: null
      },
      verification: {
        required: true,
        expiryHours: 24,
        resendLimit: 3
      },
      domainAutoAssign: {
        enabled: false,
        rules: []
      }
    },
    lastUpdatedAt: new Date(),
    lastUpdatedBy: 'system'
  }

  /**
   * Get user management settings for a tenant
   * Returns custom settings if they exist, otherwise returns defaults
   */
  static async getSettings(tenantId: string): Promise<UserManagementSettings> {
    try {
      const tenant = await prisma.tenant.findUnique({
        where: { id: tenantId }
      })

      if (!tenant) {
        throw new Error(`Tenant not found: ${tenantId}`)
      }

      // Check if custom settings exist in metadata
      const metadata = tenant.metadata as Record<string, any> | null
      if (metadata && metadata[this.SETTINGS_KEY]) {
        return {
          ...this.DEFAULT_SETTINGS,
          ...metadata[this.SETTINGS_KEY],
          lastUpdatedAt: new Date(metadata[this.SETTINGS_KEY].lastUpdatedAt || new Date())
        }
      }

      // Return defaults
      return this.DEFAULT_SETTINGS
    } catch (error) {
      console.error(`Error fetching user management settings for tenant ${tenantId}:`, error)
      return this.DEFAULT_SETTINGS
    }
  }

  /**
   * Update user management settings for a tenant
   * Persists changes to Tenant metadata and creates audit log
   */
  static async updateSettings(
    tenantId: string,
    updates: Partial<UserManagementSettings>,
    userId?: string
  ): Promise<UserManagementSettings> {
    try {
      // Get current settings
      const currentSettings = await this.getSettings(tenantId)

      // Merge updates with current settings (deep merge for nested objects)
      const updatedSettings: UserManagementSettings = this.deepMerge(currentSettings, {
        ...updates,
        lastUpdatedAt: new Date(),
        lastUpdatedBy: userId || 'system'
      })

      // Persist to database
      const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } })
      const existingMetadata = typeof tenant?.metadata === 'object' && tenant?.metadata !== null ? tenant.metadata : {}

      await prisma.tenant.update({
        where: { id: tenantId },
        data: {
          metadata: {
            ...existingMetadata,
            [this.SETTINGS_KEY]: updatedSettings as any
          }
        }
      })

      // Create audit log entry
      await this.createAuditLog(tenantId, userId, currentSettings, updatedSettings)

      return updatedSettings
    } catch (error) {
      console.error(`Error updating user management settings for tenant ${tenantId}:`, error)
      throw error
    }
  }

  /**
   * Reset settings to defaults for a tenant
   */
  static async resetSettings(tenantId: string, userId?: string): Promise<UserManagementSettings> {
    return this.updateSettings(tenantId, this.DEFAULT_SETTINGS, userId)
  }

  /**
   * Deep merge two objects recursively
   * Used to properly merge nested settings
   */
  private static deepMerge(target: any, source: any): any {
    if (!source) return target
    if (!target) return source

    const result = { ...target }

    for (const key in source) {
      if (Object.prototype.hasOwnProperty.call(source, key)) {
        const sourceValue = source[key]
        const targetValue = result[key]

        if (
          sourceValue &&
          typeof sourceValue === 'object' &&
          !Array.isArray(sourceValue) &&
          targetValue &&
          typeof targetValue === 'object' &&
          !Array.isArray(targetValue)
        ) {
          result[key] = this.deepMerge(targetValue, sourceValue)
        } else {
          result[key] = sourceValue
        }
      }
    }

    return result
  }

  /**
   * Create audit log entry for settings changes
   */
  private static async createAuditLog(
    tenantId: string,
    userId: string | undefined,
    oldSettings: UserManagementSettings,
    newSettings: UserManagementSettings
  ): Promise<void> {
    try {
      const changes = this.getSettingsDiff(oldSettings, newSettings)

      if (changes.length === 0) {
        return // No changes to log
      }

      await prisma.auditLog.create({
        data: {
          tenantId,
          userId: userId || null,
          action: 'UPDATE_USER_MANAGEMENT_SETTINGS',
          resource: 'UserManagementSettings',
          metadata: {
            changes
          }
        }
      })
    } catch (error) {
      console.error('Error creating audit log for settings changes:', error)
      // Don't throw - audit log failure shouldn't block settings update
    }
  }

  /**
   * Calculate differences between two settings objects
   */
  private static getSettingsDiff(
    oldSettings: UserManagementSettings,
    newSettings: UserManagementSettings
  ): Array<{ path: string; oldValue: any; newValue: any }> {
    const changes: Array<{ path: string; oldValue: any; newValue: any }> = []

    const compareObjects = (obj1: any, obj2: any, path = ''): void => {
      for (const key in obj2) {
        if (Object.prototype.hasOwnProperty.call(obj2, key)) {
          const newPath = path ? `${path}.${key}` : key
          const val1 = obj1?.[key]
          const val2 = obj2[key]

          if (val2 && typeof val2 === 'object' && !Array.isArray(val2)) {
            compareObjects(val1 || {}, val2, newPath)
          } else if (JSON.stringify(val1) !== JSON.stringify(val2)) {
            changes.push({
              path: newPath,
              oldValue: val1,
              newValue: val2
            })
          }
        }
      }
    }

    compareObjects(oldSettings, newSettings)
    return changes
  }
}
