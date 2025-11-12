import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { withAdminAuth, AuthenticatedRequest } from '@/lib/auth-middleware'
import { workflowDesignerService, type Workflow } from '@/services/workflow-designer.service'

export const dynamic = 'force-dynamic'

export const POST = withAdminAuth(async (req: AuthenticatedRequest, context: any) => {
  try {
    const { id } = context?.params || {}
    const body = await req.json()
    const { testData = {} } = body

    const workflow = await prisma.workflow.findUnique({
      where: { id }
    })

    if (!workflow) {
      return NextResponse.json(
        { error: 'Workflow not found' },
        { status: 404 }
      )
    }

    // Validate workflow first to get proper validation result
    const dummyWorkflow: Workflow = {
      id: workflow.id,
      name: workflow.name,
      description: workflow.description || '',
      version: workflow.version,
      status: workflow.status as 'DRAFT' | 'ACTIVE' | 'ARCHIVED',
      nodes: (workflow.nodes as any[]) || [],
      edges: (workflow.edges as any[]) || [],
      validation: {
        isValid: true,
        syntaxErrors: [],
        cyclicDependencies: [],
        unreachableNodes: [],
        missingConfiguration: []
      },
      performance: {
        estimatedDuration: 0,
        parallelPaths: 0,
        bottlenecks: [],
        throughput: 0
      },
      createdAt: workflow.createdAt,
      updatedAt: workflow.updatedAt,
      createdBy: workflow.createdBy || 'system'
    }

    const validation = workflowDesignerService.validateWorkflow(dummyWorkflow)

    // Create final workflow with validated data
    const workflowData: Workflow = {
      ...dummyWorkflow,
      validation
    }

    // Analyze performance
    const performance = workflowDesignerService.analyzePerformance(workflowData)
    workflowData.performance = performance

    // Run simulation
    const simulation = workflowDesignerService.simulateWorkflow(workflowData, testData)

    // Store simulation result
    await prisma.workflowSimulation.create({
      data: {
        workflowId: id,
        testData,
        executionPath: simulation.executionPath as any,
        totalDuration: simulation.totalDuration,
        success: simulation.success,
        errors: simulation.errors
      }
    })

    return NextResponse.json(simulation)
  } catch (error) {
    console.error('Failed to simulate workflow:', error)
    return NextResponse.json(
      { error: 'Failed to simulate workflow' },
      { status: 500 }
    )
  }
})

export const revalidate = 0
