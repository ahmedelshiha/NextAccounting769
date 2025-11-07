'use client'

import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertTriangle, CheckCircle, Play, Save, Send } from 'lucide-react'
import { Workflow, WorkflowNode, WorkflowSimulation, workflowDesignerService } from '@/services/workflow-designer.service'
import { NodeLibrary } from './NodeLibrary'
import { WorkflowCanvas } from './WorkflowCanvas'
import { WorkflowSimulator } from './WorkflowSimulator'
import { WorkflowAnalytics } from './WorkflowAnalytics'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

interface WorkflowDesignerProps {
  initialWorkflow?: Workflow
  onSave?: (workflow: Workflow) => Promise<void>
  onPublish?: (workflow: Workflow) => Promise<void>
  onTest?: (workflow: Workflow, testData?: Record<string, any>) => Promise<WorkflowSimulation>
  readOnly?: boolean
}

export function WorkflowDesigner({
  initialWorkflow,
  onSave,
  onPublish,
  onTest,
  readOnly = false
}: WorkflowDesignerProps) {
  const [workflow, setWorkflow] = useState<Workflow>(initialWorkflow || createBlankWorkflow())
  const [selectedNode, setSelectedNode] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [isPublishing, setIsPublishing] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState('All')

  // Validation
  const validationResult = workflowDesignerService.validateWorkflow(workflow)

  // Handle node operations
  const handleAddNode = (nodeType: any) => {
    const newNode: WorkflowNode = {
      id: `node-${Date.now()}`,
      type: nodeType,
      label: `${nodeType.charAt(0).toUpperCase() + nodeType.slice(1)}`,
      x: 100 + Math.random() * 200,
      y: 100 + Math.random() * 200,
      config: {}
    }
    setWorkflow({
      ...workflow,
      nodes: [...workflow.nodes, newNode]
    })
  }

  const handleNodeUpdate = (node: WorkflowNode) => {
    setWorkflow({
      ...workflow,
      nodes: workflow.nodes.map(n => n.id === node.id ? node : n)
    })
  }

  const handleNodeDelete = (nodeId: string) => {
    setWorkflow({
      ...workflow,
      nodes: workflow.nodes.filter(n => n.id !== nodeId),
      edges: workflow.edges.filter(e => e.from !== nodeId && e.to !== nodeId)
    })
    setSelectedNode(null)
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      await onSave?.(workflow)
    } finally {
      setIsSaving(false)
    }
  }

  const handlePublish = async () => {
    if (!validationResult.isValid) {
      return
    }
    setIsPublishing(true)
    try {
      await onPublish?.({ ...workflow, status: 'ACTIVE' })
    } finally {
      setIsPublishing(false)
    }
  }

  const handleSimulate = async (wf: Workflow, testData?: Record<string, any>) => {
    if (onTest) {
      return onTest(wf, testData)
    }
    return workflowDesignerService.simulateWorkflow(wf, testData)
  }

  return (
    <div className="space-y-6 h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{workflow.name}</h1>
          <p className="text-muted-foreground">{workflow.description}</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={handleSave}
            disabled={isSaving || readOnly}
          >
            <Save className="w-4 h-4 mr-2" />
            {isSaving ? 'Saving...' : 'Save Draft'}
          </Button>
          <Button
            onClick={handlePublish}
            disabled={!validationResult.isValid || isPublishing || readOnly}
          >
            <Send className="w-4 h-4 mr-2" />
            {isPublishing ? 'Publishing...' : 'Publish'}
          </Button>
        </div>
      </div>

      {/* Validation Alerts */}
      {!validationResult.isValid && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            {validationResult.missingConfiguration.length > 0 && `${validationResult.missingConfiguration.length} configuration error(s)`}
            {validationResult.cyclicDependencies.length > 0 && `${validationResult.cyclicDependencies.length} cyclic dependenc(y|ies)`}
            {validationResult.unreachableNodes.length > 0 && `${validationResult.unreachableNodes.length} unreachable node(s)`}
          </AlertDescription>
        </Alert>
      )}

      {validationResult.isValid && (
        <Alert className="bg-green-50 border-green-200">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            Workflow is valid and ready to publish
          </AlertDescription>
        </Alert>
      )}

      {/* Main Content */}
      <Tabs defaultValue="designer" value={workflow.status === 'DRAFT' ? 'designer' : 'view'} className="flex-1">
        <TabsList>
          <TabsTrigger value="designer">Designer</TabsTrigger>
          <TabsTrigger value="simulator">Test</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        {/* Designer Tab */}
        <TabsContent value="designer" className="space-y-4 flex-1">
          <div className="grid grid-cols-4 gap-4 h-[calc(100vh-300px)]">
            {/* Node Library */}
            <div className="col-span-1">
              <NodeLibrary
                onNodeSelect={handleAddNode}
                selectedCategory={selectedCategory}
                onCategoryChange={setSelectedCategory}
              />
            </div>

            {/* Canvas */}
            <div className="col-span-3">
              <WorkflowCanvas
                workflow={workflow}
                selectedNodeId={selectedNode}
                onNodeSelect={setSelectedNode}
                onNodeDelete={handleNodeDelete}
                onNodeUpdate={handleNodeUpdate}
                readOnly={readOnly}
              />
            </div>
          </div>
        </TabsContent>

        {/* Simulator Tab */}
        <TabsContent value="simulator" className="space-y-4">
          <WorkflowSimulator
            workflow={workflow}
            onSimulate={handleSimulate}
          />
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-4">
          <WorkflowAnalytics workflow={workflow} />
        </TabsContent>
      </Tabs>
    </div>
  )
}

/**
 * Create blank workflow
 */
function createBlankWorkflow(): Workflow {
  return {
    id: Math.random().toString(36).substr(2, 9),
    name: 'New Workflow',
    description: 'Build your workflow here',
    version: 1,
    status: 'DRAFT',
    nodes: [],
    edges: [],
    validation: {
      isValid: false,
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
    createdAt: new Date(),
    updatedAt: new Date(),
    createdBy: 'admin'
  }
}
