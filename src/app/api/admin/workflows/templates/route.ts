import { NextRequest, NextResponse } from 'next/server'
import { withAdminAuth } from '@/lib/auth-middleware'
import { workflowDesignerService } from '@/services/workflow-designer.service'

export const dynamic = 'force-dynamic'

export const GET = withAdminAuth(async (req: NextRequest) => {
  try {
    const templates = await workflowDesignerService.getTemplates()

    return NextResponse.json({
      data: templates,
      total: templates.length
    })
  } catch (error) {
    console.error('Failed to fetch workflow templates:', error)
    return NextResponse.json(
      { error: 'Failed to fetch workflow templates' },
      { status: 500 }
    )
  }
})

export const revalidate = 3600
