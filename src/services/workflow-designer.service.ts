import prisma from '@/lib/prisma'
import { cache } from 'react'

export type NodeType = 'trigger' | 'action' | 'decision' | 'approval' | 'integration' | 'notification' | 'delay' | 'parallel'

export interface WorkflowNode {
  id: string
  type: NodeType
  label: string
  x: number
  y: number
  config: Record<string, any>
  metadata?: Record<string, any>
}

export interface WorkflowEdge {
  id: string
  from: string
  to: string
  label?: string
  condition?: string
}

export interface Workflow {
  id: string
  name: string
  description: string
  version: number
  status: 'DRAFT' | 'ACTIVE' | 'ARCHIVED'
  nodes: WorkflowNode[]
  edges: WorkflowEdge[]
  validation: ValidationResult
  performance: PerformanceMetrics
  createdAt: Date
  updatedAt: Date
  createdBy: string
}

export interface ValidationResult {
  isValid: boolean
  syntaxErrors: ValidationError[]
  cyclicDependencies: CyclicDependency[]
  unreachableNodes: string[]
  missingConfiguration: ConfigError[]
}

export interface ValidationError {
  nodeId: string
  message: string
  severity: 'error' | 'warning'
}

export interface CyclicDependency {
  nodes: string[]
  path: string
}

export interface ConfigError {
  nodeId: string
  field: string
  message: string
}

export interface PerformanceMetrics {
  estimatedDuration: number // seconds
  parallelPaths: number
  bottlenecks: BottleneckAnalysis[]
  throughput: number // operations per minute
}

export interface BottleneckAnalysis {
  nodeId: string
  estimatedTime: number
  reason: string
}

export interface WorkflowSimulation {
  workflowId: string
  testDataId: string
  executionPath: ExecutionStep[]
  totalDuration: number
  success: boolean
  errors: string[]
}

export interface ExecutionStep {
  nodeId: string
  timestamp: Date
  status: 'SUCCESS' | 'FAILED' | 'SKIPPED'
  output?: any
  error?: string
}

export interface WorkflowTemplate {
  id: string
  name: string
  description: string
  category: string
  preview: Workflow
  popularity: number
  tags: string[]
}

export const workflowDesignerService = {
  /**
   * Create a new workflow
   */
  createWorkflow: async (
    name: string,
    description: string,
    createdBy: string
  ): Promise<Workflow> => {
    // In a real implementation, this would save to the database
    return {
      id: Math.random().toString(),
      name,
      description,
      version: 1,
      status: 'DRAFT',
      nodes: [],
      edges: [],
      validation: { isValid: true, syntaxErrors: [], cyclicDependencies: [], unreachableNodes: [], missingConfiguration: [] },
      performance: { estimatedDuration: 0, parallelPaths: 0, bottlenecks: [], throughput: 0 },
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy
    }
  },

  /**
   * Validate workflow configuration
   */
  validateWorkflow: (workflow: Workflow): ValidationResult => {
    const errors: ValidationError[] = []
    const cyclicDeps: CyclicDependency[] = []
    const unreachable: string[] = []
    const configErrors: ConfigError[] = []

    // Check for cyclic dependencies
    const visited = new Set<string>()
    const recursionStack = new Set<string>()

    function hasCycle(nodeId: string, path: string[] = []): boolean {
      visited.add(nodeId)
      recursionStack.add(nodeId)
      path.push(nodeId)

      const nextEdges = workflow.edges.filter(e => e.from === nodeId)
      
      for (const edge of nextEdges) {
        if (recursionStack.has(edge.to)) {
          cyclicDeps.push({
            nodes: [...path, edge.to],
            path: [...path, edge.to].join(' -> ')
          })
          return true
        }

        if (!visited.has(edge.to) && hasCycle(edge.to, [...path])) {
          return true
        }
      }

      recursionStack.delete(nodeId)
      return false
    }

    // Find start nodes
    const startNodes = workflow.nodes.filter(n => n.type === 'trigger')
    startNodes.forEach(node => {
      if (!visited.has(node.id)) {
        hasCycle(node.id)
      }
    })

    // Check for unreachable nodes
    const reachable = new Set<string>()
    startNodes.forEach(node => {
      const queue = [node.id]
      while (queue.length > 0) {
        const current = queue.shift()!
        if (reachable.has(current)) continue
        reachable.add(current)

        const nextNodes = workflow.edges
          .filter(e => e.from === current)
          .map(e => e.to)
        queue.push(...nextNodes)
      }
    })

    workflow.nodes.forEach(node => {
      if (!reachable.has(node.id) && node.type !== 'trigger') {
        unreachable.push(node.id)
      }
    })

    // Check for missing configuration
    workflow.nodes.forEach(node => {
      if (node.type === 'approval' && !node.config.approverRole) {
        configErrors.push({
          nodeId: node.id,
          field: 'approverRole',
          message: 'Approval node must have an approver role specified'
        })
      }

      if (node.type === 'integration' && !node.config.endpoint) {
        configErrors.push({
          nodeId: node.id,
          field: 'endpoint',
          message: 'Integration node must have an endpoint URL'
        })
      }

      if (node.type === 'delay' && !node.config.duration) {
        configErrors.push({
          nodeId: node.id,
          field: 'duration',
          message: 'Delay node must specify a duration'
        })
      }
    })

    return {
      isValid: cyclicDeps.length === 0 && unreachable.length === 0 && configErrors.length === 0,
      syntaxErrors: errors,
      cyclicDependencies: cyclicDeps,
      unreachableNodes: unreachable,
      missingConfiguration: configErrors
    }
  },

  /**
   * Analyze workflow performance
   */
  analyzePerformance: (workflow: Workflow): PerformanceMetrics => {
    const pathLengths: number[] = []
    const parallelPaths: Set<string> = new Set()
    const bottlenecks: BottleneckAnalysis[] = []

    // Find all paths from start to end
    function findPaths(nodeId: string, duration: number = 0): void {
      const node = workflow.nodes.find(n => n.id === nodeId)
      if (!node) return

      const nextEdges = workflow.edges.filter(e => e.from === nodeId)

      if (nextEdges.length === 0) {
        pathLengths.push(duration + (node.config.estimatedDuration || 0))
        return
      }

      if (nextEdges.length > 1) {
        parallelPaths.add(nodeId)
      }

      nextEdges.forEach(edge => {
        findPaths(edge.to, duration + (node.config.estimatedDuration || 0))
      })
    }

    const startNodes = workflow.nodes.filter(n => n.type === 'trigger')
    startNodes.forEach(node => findPaths(node.id))

    // Find bottlenecks (slow nodes in critical path)
    const maxDuration = Math.max(...pathLengths, 0)
    const criticalNodes = workflow.nodes
      .filter(n => (n.config.estimatedDuration || 0) > 10)
      .map(n => ({
        nodeId: n.id,
        estimatedTime: n.config.estimatedDuration || 0,
        reason: `This ${n.type} node takes ${n.config.estimatedDuration || 0}s`
      }))

    return {
      estimatedDuration: maxDuration,
      parallelPaths: parallelPaths.size,
      bottlenecks: criticalNodes,
      throughput: maxDuration > 0 ? Math.round(3600 / maxDuration) : 0
    }
  },

  /**
   * Simulate workflow execution
   */
  simulateWorkflow: (workflow: Workflow, testData: Record<string, any> = {}): WorkflowSimulation => {
    const executionPath: ExecutionStep[] = []
    let success = true
    const errors: string[] = []

    // Find start node
    const startNode = workflow.nodes.find(n => n.type === 'trigger')
    if (!startNode) {
      return {
        workflowId: workflow.id,
        testDataId: 'test-1',
        executionPath: [],
        totalDuration: 0,
        success: false,
        errors: ['No trigger node found']
      }
    }

    // Simulate execution
    const visited = new Set<string>()
    let currentNodeId = startNode.id
    let totalDuration = 0

    while (currentNodeId && !visited.has(currentNodeId)) {
      visited.add(currentNodeId)
      const node = workflow.nodes.find(n => n.id === currentNodeId)

      if (!node) break

      const duration = node.config.estimatedDuration || 0
      totalDuration += duration

      // Simulate node execution
      let status: 'SUCCESS' | 'FAILED' | 'SKIPPED' = 'SUCCESS'
      const output = testData
      let error: string | undefined

      // Simulate failures for demo
      if (node.type === 'integration' && Math.random() < 0.1) {
        status = 'FAILED'
        error = 'API timeout'
        success = false
        errors.push(`Node ${node.id}: API timeout`)
      }

      executionPath.push({
        nodeId: currentNodeId,
        timestamp: new Date(Date.now() + totalDuration * 1000),
        status,
        output,
        error
      })

      // Move to next node
      const nextEdge = workflow.edges.find(e => e.from === currentNodeId)
      currentNodeId = nextEdge?.to || ''
    }

    return {
      workflowId: workflow.id,
      testDataId: 'test-1',
      executionPath,
      totalDuration,
      success,
      errors
    }
  },

  /**
   * Get workflow templates
   */
  getTemplates: cache(async (): Promise<WorkflowTemplate[]> => {
    return [
      {
        id: 'template-onboarding',
        name: 'Employee Onboarding',
        description: 'Complete onboarding workflow for new employees',
        category: 'HR',
        preview: {
          id: '',
          name: 'Employee Onboarding',
          description: '',
          version: 1,
          status: 'ACTIVE',
          nodes: [
            { id: '1', type: 'trigger', label: 'New Employee', x: 50, y: 50, config: { trigger: 'employee.created' } },
            { id: '2', type: 'action', label: 'Create Account', x: 150, y: 50, config: {} },
            { id: '3', type: 'approval', label: 'Manager Approval', x: 250, y: 50, config: { approverRole: 'MANAGER' } },
            { id: '4', type: 'action', label: 'Grant Access', x: 350, y: 50, config: {} },
            { id: '5', type: 'notification', label: 'Send Welcome Email', x: 450, y: 50, config: { template: 'welcome' } }
          ],
          edges: [
            { id: 'e1', from: '1', to: '2' },
            { id: 'e2', from: '2', to: '3' },
            { id: 'e3', from: '3', to: '4' },
            { id: 'e4', from: '4', to: '5' }
          ],
          validation: { isValid: true, syntaxErrors: [], cyclicDependencies: [], unreachableNodes: [], missingConfiguration: [] },
          performance: { estimatedDuration: 120, parallelPaths: 0, bottlenecks: [], throughput: 30 },
          createdAt: new Date(),
          updatedAt: new Date(),
          createdBy: 'system'
        },
        popularity: 98,
        tags: ['HR', 'Onboarding', 'New Employee']
      },
      {
        id: 'template-approval',
        name: 'Multi-Level Approval',
        description: 'Request approval through multiple levels',
        category: 'Approval',
        preview: {
          id: '',
          name: 'Multi-Level Approval',
          description: '',
          version: 1,
          status: 'ACTIVE',
          nodes: [
            { id: '1', type: 'trigger', label: 'Request Submitted', x: 50, y: 50, config: {} },
            { id: '2', type: 'approval', label: 'Manager Approval', x: 150, y: 50, config: { approverRole: 'MANAGER' } },
            { id: '3', type: 'approval', label: 'Director Approval', x: 250, y: 50, config: { approverRole: 'DIRECTOR' } },
            { id: '4', type: 'action', label: 'Process Request', x: 350, y: 50, config: {} }
          ],
          edges: [
            { id: 'e1', from: '1', to: '2' },
            { id: 'e2', from: '2', to: '3' },
            { id: 'e3', from: '3', to: '4' }
          ],
          validation: { isValid: true, syntaxErrors: [], cyclicDependencies: [], unreachableNodes: [], missingConfiguration: [] },
          performance: { estimatedDuration: 240, parallelPaths: 0, bottlenecks: [], throughput: 15 },
          createdAt: new Date(),
          updatedAt: new Date(),
          createdBy: 'system'
        },
        popularity: 85,
        tags: ['Approval', 'Request', 'Multi-Level']
      }
    ]
  })
}
