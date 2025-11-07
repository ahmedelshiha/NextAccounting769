import { NextRequest, NextResponse } from 'next/server'
import { withTenantContext } from '@/lib/api-wrapper'
import { requireTenantContext } from '@/lib/tenant-utils'
import { AdminSettingsService } from '@/services/admin-settings.service'

export const GET = withTenantContext(async (request: NextRequest) => {
  try {
    const ctx = requireTenantContext()
    
    if (!ctx.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const tenantId = ctx.tenantId

    if (!tenantId) {
      return NextResponse.json({ error: 'Tenant ID not found' }, { status: 400 })
    }

    const searchParams = request.nextUrl.searchParams
    const type = searchParams.get('type')

    if (type === 'audit') {
      const config = await AdminSettingsService.getAuditConfig(tenantId)
      return NextResponse.json(config)
    } else if (type === 'workflow') {
      const config = await AdminSettingsService.getWorkflowConfig(tenantId)
      return NextResponse.json(config)
    } else if (type === 'features') {
      const flags = await AdminSettingsService.getFeatureFlags(tenantId)
      return NextResponse.json({ featureFlags: flags })
    }

    // Get all settings
    const settings = await AdminSettingsService.getSettings(tenantId)
    return NextResponse.json(settings)
  } catch (error) {
    console.error('Error fetching settings:', error)
    return NextResponse.json(
      { error: 'Failed to fetch settings' },
      { status: 500 }
    )
  }
})

export const POST = withTenantContext(async (request: NextRequest) => {
  try {
    const ctx = requireTenantContext()
    
    if (!ctx.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const tenantId = ctx.tenantId

    if (!tenantId) {
      return NextResponse.json({ error: 'Tenant ID not found' }, { status: 400 })
    }

    const body = await request.json()
    const settings = await AdminSettingsService.updateSettings(tenantId, body)

    return NextResponse.json(settings)
  } catch (error) {
    console.error('Error saving settings:', error)
    return NextResponse.json(
      { error: 'Failed to save settings' },
      { status: 500 }
    )
  }
})
