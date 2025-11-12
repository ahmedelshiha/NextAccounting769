import { NextRequest, NextResponse } from 'next/server'
import { withTenantContext } from '@/lib/api-wrapper'
import { requireTenantContext } from '@/lib/tenant-utils'
import { hasPermission, PERMISSIONS } from '@/lib/permissions'
import { respond } from '@/lib/api-response'

export const GET = withTenantContext(async (request: NextRequest) => {
  try {
    const ctx = requireTenantContext()
    const role = ctx.role ?? undefined
    if (!hasPermission(role, PERMISSIONS.TEAM_VIEW)) return respond.forbidden('Forbidden')

    const templates = [
      {
        id: 'default',
        name: 'Default Invoice',
        description: 'Standard invoice template',
        isDefault: true,
        createdAt: new Date().toISOString(),
      },
      {
        id: 'minimal',
        name: 'Minimal Invoice',
        description: 'Simple and clean invoice template',
        isDefault: false,
        createdAt: new Date().toISOString(),
      },
      {
        id: 'detailed',
        name: 'Detailed Invoice',
        description: 'Comprehensive invoice with all details',
        isDefault: false,
        createdAt: new Date().toISOString(),
      },
    ]

    return NextResponse.json({ templates }, {
      headers: { 'Cache-Control': 'private, max-age=300' }
    })
  } catch (error) {
    console.error('Error fetching invoice templates:', error)
    return NextResponse.json({ templates: [] }, { status: 500 })
  }
})
