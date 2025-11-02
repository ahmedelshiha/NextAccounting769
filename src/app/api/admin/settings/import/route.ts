import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { withTenantContext } from '@/lib/api-wrapper'
import { requireTenantContext } from '@/lib/tenant-utils'
import { AdminSettingsService } from '@/services/admin-settings.service'
import { AuditLoggingService, AuditActionType, AuditSeverity } from '@/services/audit-logging.service'

const ImportSchema = z.object({
  exportedAt: z.string().datetime().optional(),
  env: z.record(z.string(), z.any()).optional(),
  auditRetentionDays: z.number().int().min(1).max(730).optional(),
  emailNotificationsEnabled: z.boolean().optional(),
  detailedLoggingEnabled: z.boolean().optional(),
  batchSize: z.number().int().min(1).max(10000).optional(),
  cacheDurationMinutes: z.number().int().min(1).max(1440).optional(),
  webhookUrl: z.string().url().optional().or(z.literal('')),
  webhookEnabled: z.boolean().optional(),
  featureFlags: z.record(z.string(), z.boolean()).optional(),
})

const _api_POST = async (req: NextRequest) => {
  try {
    const ctx = requireTenantContext()

    if (!ctx.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const tenantId = ctx.tenantId
    if (!tenantId) {
      return NextResponse.json({ error: 'Tenant ID not found' }, { status: 400 })
    }

    const payload = await req.json()
    const parsed = ImportSchema.safeParse(payload)

    if (!parsed.success) {
      return NextResponse.json(
        {
          ok: false,
          error: 'Invalid payload',
          details: parsed.error.issues.map(issue => `${issue.path.join('.')}: ${issue.message}`)
        },
        { status: 400 }
      )
    }

    // Extract settings and validate
    const settingsToImport = {
      auditRetentionDays: parsed.data.auditRetentionDays,
      emailNotificationsEnabled: parsed.data.emailNotificationsEnabled,
      detailedLoggingEnabled: parsed.data.detailedLoggingEnabled,
      batchSize: parsed.data.batchSize,
      cacheDurationMinutes: parsed.data.cacheDurationMinutes,
      webhookUrl: parsed.data.webhookUrl,
      webhookEnabled: parsed.data.webhookEnabled,
      featureFlags: parsed.data.featureFlags,
    }

    // Filter out undefined values
    const cleanSettings = Object.fromEntries(
      Object.entries(settingsToImport).filter(([_, v]) => v !== undefined)
    )

    // Persist settings using the service
    const importedSettings = await AdminSettingsService.updateSettings(tenantId, cleanSettings)

    // Log the import action
    await AuditLoggingService.logAuditEvent({
      action: AuditActionType.SETTINGS_IMPORTED,
      severity: AuditSeverity.INFO,
      userId: ctx.userId,
      tenantId,
      targetResourceId: 'admin-settings',
      targetResourceType: 'SETTINGS',
      description: `Imported admin settings (${Object.keys(cleanSettings).length} field(s))`,
      changes: cleanSettings,
      metadata: {
        importedAt: new Date().toISOString(),
        fieldsCount: Object.keys(cleanSettings).length,
        exportedAt: parsed.data.exportedAt,
      },
    }).catch(err => {
      console.warn('Failed to log settings import:', err)
      // Don't fail the request if audit logging fails
    })

    return NextResponse.json({
      ok: true,
      importedAt: new Date().toISOString(),
      settings: importedSettings
    }, { status: 200 })
  } catch (e) {
    if (e instanceof SyntaxError) {
      return NextResponse.json({ ok: false, error: 'Invalid JSON' }, { status: 400 })
    }
    console.error('Settings import error:', e)
    return NextResponse.json(
      { ok: false, error: 'Failed to import settings' },
      { status: 500 }
    )
  }
}

export const POST = withTenantContext(_api_POST, { requireAuth: true })
