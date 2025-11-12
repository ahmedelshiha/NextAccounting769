import { NextRequest, NextResponse } from 'next/server'
import { withTenantContext } from '@/lib/api-wrapper'
import { requireTenantContext } from '@/lib/tenant-utils'
import { AdminSettingsService } from '@/services/admin-settings.service'
import { AuditLoggingService, AuditActionType, AuditSeverity } from '@/services/audit-logging.service'

const _api_GET = async (request: NextRequest) => {
  try {
    const ctx = requireTenantContext()

    if (!ctx.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const tenantId = ctx.tenantId
    if (!tenantId) {
      return NextResponse.json({ error: 'Tenant ID not found' }, { status: 400 })
    }

    // Get actual settings from the service
    const settings = await AdminSettingsService.getSettings(tenantId)

    const payload = {
      exportedAt: new Date().toISOString(),
      tenantId: tenantId,
      auditRetentionDays: settings.auditRetentionDays,
      emailNotificationsEnabled: settings.emailNotificationsEnabled,
      detailedLoggingEnabled: settings.detailedLoggingEnabled,
      batchSize: settings.batchSize,
      cacheDurationMinutes: settings.cacheDurationMinutes,
      webhookUrl: settings.webhookUrl,
      webhookEnabled: settings.webhookEnabled,
      featureFlags: settings.featureFlags,
    }

    const body = JSON.stringify(payload, null, 2)
    const timestamp = new Date().toISOString().split('T')[0]

    // Log the export action
    await AuditLoggingService.logAuditEvent({
      action: AuditActionType.SETTINGS_EXPORTED,
      severity: AuditSeverity.INFO,
      userId: ctx.userId,
      tenantId,
      targetResourceId: 'admin-settings',
      targetResourceType: 'SETTINGS',
      description: `Exported admin settings (${Object.keys(settings).length} field(s))`,
      metadata: {
        exportedAt: new Date().toISOString(),
        fieldsExported: Object.keys(settings).filter(k =>
          settings[k as keyof typeof settings] !== undefined &&
          settings[k as keyof typeof settings] !== null
        ),
      },
    }).catch(err => {
      console.warn('Failed to log settings export:', err)
      // Don't fail the request if audit logging fails
    })

    return new NextResponse(body, {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="settings-${timestamp}.json"`,
      },
    })
  } catch (error) {
    console.error('Settings export error:', error)
    return NextResponse.json(
      { error: 'Failed to export settings' },
      { status: 500 }
    )
  }
}

export const GET = withTenantContext(_api_GET, { requireAuth: true })
