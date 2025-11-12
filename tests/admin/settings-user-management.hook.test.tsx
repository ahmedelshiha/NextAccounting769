import { describe, it, expect, vi, beforeEach } from 'vitest'
import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'

// A minimal valid settings payload factory (keep types broad to avoid brittleness in tests)
function makeSettings(overrides: any = {}) {
  const now = new Date().toISOString()
  return {
    roles: { systemRoles: { ADMIN: { name: 'ADMIN', displayName: 'Admin', description: '', permissions: [], canDelegate: true, maxInstances: null, isEditable: false }, SUPER_ADMIN: { name: 'SUPER_ADMIN', displayName: 'Super Admin', description: '', permissions: [], canDelegate: true, maxInstances: null, isEditable: false }, TEAM_LEAD: { name: 'TEAM_LEAD', displayName: 'Team Lead', description: '', permissions: [], canDelegate: true, maxInstances: null, isEditable: true }, TEAM_MEMBER: { name: 'TEAM_MEMBER', displayName: 'Team Member', description: '', permissions: [], canDelegate: false, maxInstances: null, isEditable: true }, STAFF: { name: 'STAFF', displayName: 'Staff', description: '', permissions: [], canDelegate: false, maxInstances: null, isEditable: true }, CLIENT: { name: 'CLIENT', displayName: 'Client', description: '', permissions: [], canDelegate: false, maxInstances: null, isEditable: false } }, customRoles: [], hierarchy: { canDelegate: { ADMIN: ['TEAM_LEAD'], SUPER_ADMIN: ['ADMIN','TEAM_LEAD'], TEAM_LEAD: [], TEAM_MEMBER: [], STAFF: [], CLIENT: [] }, inheritPermissions: { ADMIN: true, SUPER_ADMIN: true, TEAM_LEAD: true, TEAM_MEMBER: false, STAFF: false, CLIENT: false } }, defaultRoleOnSignup: 'CLIENT', defaultRoleOnInvite: 'TEAM_MEMBER' },
    permissions: [],
    onboarding: { workflows: [], defaultWorkflow: null, welcomeEmail: { enabled: false, subject: '', templateId: '' }, autoAssignment: { enabled: false, assignToManager: false, permissionTemplate: '', departmentFromInviter: false }, firstLogin: { forcePasswordChange: false, passwordExpiryDays: 90, requireProfileCompletion: false, requiredProfileFields: [], showTutorial: false, tutorialModules: [] }, checklist: { enabled: false, items: [] }, notificationOnInvite: { toAdmin: false, toManager: false, toNewUser: true } },
    policies: { dataRetention: { inactiveUserDays: 30, archiveInactiveAfterDays: null, deleteArchivedAfterDays: null, archiveNotificationDays: 7, keepAuditLogs: true, auditLogRetentionYears: 1 }, activityMonitoring: { trackLoginAttempts: true, trackDataAccess: false, trackPermissionChanges: true, trackBulkActions: true, retentionDays: 30, alertOnSuspiciousActivity: true }, accessControl: { requireMFAForRole: { ADMIN: true, SUPER_ADMIN: true, TEAM_LEAD: false, TEAM_MEMBER: false, STAFF: false, CLIENT: false }, minPasswordAgeDays: 0, maxPasswordAgeDays: 365, preventPreviousPasswords: 5, lockoutAfterFailedAttempts: 5, lockoutDurationMinutes: 15 }, ipLocation: { restrictByIP: false, allowedIPRanges: [], warnOnNewLocation: true, requireMFAOnNewLocation: false, geofenceCountries: null }, deviceManagement: { trackDevices: true, requireDeviceApproval: false, maxDevicesPerUser: 5, warnBeforeNewDevice: true } },
    rateLimits: { roles: { ADMIN: { apiCallsPerMinute: 100, apiCallsPerDay: 5000, bulkOperationLimit: 1000, reportGenerationPerDay: 10, exportSizeGB: 1, concurrentSessions: 5, fileUploadSizeMB: 50 }, SUPER_ADMIN: { apiCallsPerMinute: 200, apiCallsPerDay: 10000, bulkOperationLimit: 2000, reportGenerationPerDay: 20, exportSizeGB: 2, concurrentSessions: 10, fileUploadSizeMB: 200 }, TEAM_LEAD: { apiCallsPerMinute: 60, apiCallsPerDay: 3000, bulkOperationLimit: 600, reportGenerationPerDay: 6, exportSizeGB: 0.5, concurrentSessions: 3, fileUploadSizeMB: 25 }, TEAM_MEMBER: { apiCallsPerMinute: 40, apiCallsPerDay: 2000, bulkOperationLimit: 400, reportGenerationPerDay: 4, exportSizeGB: 0.25, concurrentSessions: 2, fileUploadSizeMB: 20 }, STAFF: { apiCallsPerMinute: 40, apiCallsPerDay: 2000, bulkOperationLimit: 400, reportGenerationPerDay: 4, exportSizeGB: 0.25, concurrentSessions: 2, fileUploadSizeMB: 20 }, CLIENT: { apiCallsPerMinute: 20, apiCallsPerDay: 1000, bulkOperationLimit: 200, reportGenerationPerDay: 2, exportSizeGB: 0.1, concurrentSessions: 1, fileUploadSizeMB: 10 } }, global: { tenantApiCallsPerMinute: 1000, tenantApiCallsPerDay: 50000, tenantConcurrentUsers: 100 }, throttling: { enableAdaptiveThrottling: false, gracefulDegradation: true } },
    sessions: { sessionTimeout: { byRole: { ADMIN: { absoluteMaxMinutes: 480, inactivityMinutes: 30, warningBeforeLogoutMinutes: 5, allowExtend: true, maxExtensions: 2 }, SUPER_ADMIN: { absoluteMaxMinutes: 480, inactivityMinutes: 15, warningBeforeLogoutMinutes: 3, allowExtend: true, maxExtensions: 3 }, TEAM_LEAD: { absoluteMaxMinutes: 480, inactivityMinutes: 30, warningBeforeLogoutMinutes: 5, allowExtend: true, maxExtensions: 2 }, TEAM_MEMBER: { absoluteMaxMinutes: 480, inactivityMinutes: 60, warningBeforeLogoutMinutes: 10, allowExtend: true, maxExtensions: 1 }, STAFF: { absoluteMaxMinutes: 480, inactivityMinutes: 60, warningBeforeLogoutMinutes: 10, allowExtend: true, maxExtensions: 1 }, CLIENT: { absoluteMaxMinutes: 480, inactivityMinutes: 120, warningBeforeLogoutMinutes: 15, allowExtend: false, maxExtensions: 0 } }, global: { absoluteMaxDays: 7, forceLogoutTime: null } }, concurrentSessions: { byRole: { ADMIN: 5, SUPER_ADMIN: 10, TEAM_LEAD: 3, TEAM_MEMBER: 2, STAFF: 2, CLIENT: 1 }, allowMultipleDevices: true, requireMFAForMultipleSessions: false, kickOldestSession: true }, security: { requireSSL: true, httpOnlyTokens: true, sameSiteCookies: 'Lax', resetTokensOnPasswordChange: true, invalidateOnPermissionChange: true, regenerateSessionIdOnLogin: true }, devices: { requireDeviceId: false, trackUserAgent: true, warnOnBrowserChange: true, warnOnIPChange: true } },
    invitations: { invitations: { defaultRole: 'TEAM_MEMBER', expiryDays: 7, resendLimit: 3, requireEmail: true, allowMultipleInvites: false, notificationEmail: true }, signUp: { enabled: false, defaultRole: 'CLIENT', requireApproval: false, approvalNotification: { toAdmins: true, toManager: false }, requiredFields: [], prohibitedDomains: [], allowedDomains: null }, verification: { required: true, expiryHours: 24, resendLimit: 3 }, domainAutoAssign: { enabled: false, rules: [] } },
    entities: { clients: {}, teams: {} },
    lastUpdatedAt: now,
    lastUpdatedBy: 'system',
    ...overrides,
  }
}

beforeEach(() => {
  vi.resetModules()
})

describe('useUserManagementSettings', () => {
  it('loads settings on mount and exposes state', async () => {
    vi.doMock('@/lib/api', () => ({ apiFetch: vi.fn(async () => ({ ok: true, json: async () => makeSettings({ lastUpdatedBy: 'admin1' }) })) }))
    vi.doMock('@/services/audit-logging.service', () => ({
      AuditLoggingService: { logSettingsChange: vi.fn(async () => ({})) },
      AuditActionType: {},
      AuditSeverity: {},
    }))
    vi.doMock('@/lib/event-emitter', () => ({ globalEventEmitter: { emit: vi.fn() } }))

    const mod = await import('@/app/admin/settings/user-management/hooks/useUserManagementSettings')
    const HookUser: React.FC = () => {
      const { settings, isLoading } = mod.useUserManagementSettings()
      return (
        <div>
          <div data-loading={isLoading ? '1' : '0'} />
          <div data-user={settings?.lastUpdatedBy || ''} />
        </div>
      )
    }

    render(<HookUser />)
    await waitFor(() => expect(document.querySelector('[data-loading="0"]')).toBeTruthy())
    expect((document.querySelector('[data-user]') as HTMLElement).getAttribute('data-user')).toBe('admin1')
  })

  it('updates settings via PUT and emits events + audit log', async () => {
    const getSpy = vi.fn(async () => ({ ok: true, json: async () => makeSettings({ lastUpdatedBy: 'seed' }) }))
    const putSpy = vi.fn(async () => ({ ok: true, json: async () => makeSettings({ lastUpdatedBy: 'admin1', sessions: { idle: 5, absolute: 60 } }) }))
    vi.doMock('@/lib/api', () => ({ apiFetch: vi.fn(async (_p: string, init?: any) => (init && init.method === 'PUT') ? putSpy() : getSpy()) }))

    const auditSpy = vi.fn(async () => ({}))
    vi.doMock('@/services/audit-logging.service', () => ({
      AuditLoggingService: { logSettingsChange: auditSpy },
      AuditActionType: {},
      AuditSeverity: {},
    }))
    const emitSpy = vi.fn()
    vi.doMock('@/lib/event-emitter', () => ({ globalEventEmitter: { emit: emitSpy } }))

    const mod = await import('@/app/admin/settings/user-management/hooks/useUserManagementSettings')
    const Probe: React.FC = () => {
      const { settings, updateSettings, isSaving } = mod.useUserManagementSettings()
      React.useEffect(() => { updateSettings({ sessions: { idle: 5, absolute: 60 } } as any) }, [updateSettings])
      return <div data-saving={isSaving ? '1' : '0'} data-by={settings?.lastUpdatedBy || ''} />
    }

    render(<Probe />)

    await waitFor(() => expect(emitSpy).toHaveBeenCalled())
    expect(auditSpy).toHaveBeenCalled()
    await waitFor(() => expect((document.querySelector('[data-saving]') as HTMLElement).getAttribute('data-saving')).toBe('0'))
    expect((document.querySelector('[data-by]') as HTMLElement).getAttribute('data-by')).toBe('admin1')
  })

  it('surfaces errors on failed GET', async () => {
    vi.doMock('@/lib/api', () => ({ apiFetch: vi.fn(async () => ({ ok: false, status: 500, statusText: 'Server Error' })) }))
    vi.doMock('@/services/audit-logging.service', () => ({ AuditLoggingService: { logSettingsChange: vi.fn(async () => ({})) }, AuditActionType: {}, AuditSeverity: {} }))
    vi.doMock('@/lib/event-emitter', () => ({ globalEventEmitter: { emit: vi.fn() } }))

    const mod = await import('@/app/admin/settings/user-management/hooks/useUserManagementSettings')
    const Probe: React.FC = () => {
      const { error, isLoading } = mod.useUserManagementSettings()
      return <div data-err={error ? '1' : '0'} data-load={isLoading ? '1' : '0'} />
    }

    render(<Probe />)
    await waitFor(() => expect((document.querySelector('[data-load]') as HTMLElement).getAttribute('data-load')).toBe('0'))
    expect((document.querySelector('[data-err]') as HTMLElement).getAttribute('data-err')).toBe('1')
  })
})
