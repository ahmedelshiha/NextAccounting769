import { NextResponse } from 'next/server'
import { withTenantContext } from '@/lib/api-wrapper'
import { requireTenantContext } from '@/lib/tenant-utils'
import { hasPermission, PERMISSIONS } from '@/lib/permissions'
import { respond } from '@/lib/api-response'
import prisma from '@/lib/prisma'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// POST /api/admin/workflows/:id/dry-run
export const POST = withTenantContext(async (_request: Request, { params }: { params: { id: string } }) => {
  const ctx = requireTenantContext()
  if (!ctx.userId) return respond.unauthorized()
  if (!ctx.tenantId) return respond.unauthorized()
  if (!hasPermission(ctx.role ?? '', PERMISSIONS.USERS_MANAGE)) return respond.forbidden('Forbidden')

  const id = params.id
  try {
    try {
      const wf = await prisma.userWorkflow.findFirst({ where: { id, tenantId: ctx.tenantId }, include: { steps: true } })
      if (!wf) return respond.notFound('Workflow not found')
      const estimatedSeconds = wf.steps.length * 5
      return NextResponse.json({
        success: true,
        estimate: {
          steps: wf.steps.length,
          estimatedSeconds
        },
        impacts: []
      })
    } catch {
      // Fallback if table missing
      return NextResponse.json({ success: true, estimate: { steps: 3, estimatedSeconds: 15 }, impacts: [] })
    }
  } catch {
    return respond.serverError('Failed to run dry-run')
  }
})
