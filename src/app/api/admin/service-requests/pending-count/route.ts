import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { hasPermission, PERMISSIONS, hasRole } from '@/lib/permissions'
import { withTenantContext } from '@/lib/api-wrapper'
import { requireTenantContext, getTenantFilter } from '@/lib/tenant-utils'

export const GET = withTenantContext(async () => {
  try {
    const ctx = requireTenantContext()
    const role = ctx.role as string | undefined

    if (!ctx.userId || !hasRole(role || '', ['ADMIN', 'TEAM_LEAD'])) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const where = {
      ...getTenantFilter(),
      OR: [
        { status: 'SUBMITTED' },
        { status: 'APPROVED' }
      ] as any,
    }

    const count = await prisma.serviceRequest.count({ where })

    return NextResponse.json({ success: true, count })
  } catch (error) {
    console.error('Error fetching pending service requests count:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
})
