import { NextRequest, NextResponse } from 'next/server'
import { workflowDesignerService, Workflow, WorkflowSimulation } from '@/services/workflow-designer.service'
import { withAdminAuth } from '@/lib/auth-middleware'

export const dynamic = 'force-dynamic'

export const POST = withAdminAuth(async (req: NextRequest) => {
  try {
    const { action, workflow, testData } = await req.json()

    let result

    switch (action) {
      case 'validate':
        result = workflowDesignerService.validateWorkflow(workflow)
        break

      case 'analyze':
        result = workflowDesignerService.analyzePerformance(workflow)
        break

      case 'simulate':
        result = workflowDesignerService.simulateWorkflow(workflow, testData)
        break

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }

    return NextResponse.json({
      result,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Failed to process workflow operation:', error)
    return NextResponse.json(
      { error: 'Failed to process workflow operation' },
      { status: 500 }
    )
  }
})
