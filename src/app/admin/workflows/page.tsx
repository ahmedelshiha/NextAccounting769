'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Plus, Edit, Trash2 } from 'lucide-react'
import { WorkflowDesigner } from '@/app/admin/users/components/WorkflowDesigner'
import { Workflow } from '@/services/workflow-designer.service'

interface WorkflowsPageState {
  mode: 'list' | 'create' | 'edit'
  workflows: Workflow[]
  selectedWorkflow?: Workflow
}

export default function WorkflowsPage() {
  const [state, setState] = useState<WorkflowsPageState>({
    mode: 'list',
    workflows: []
  })
  const [searchQuery, setSearchQuery] = useState('')

  const filteredWorkflows = state.workflows.filter(w =>
    w.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleCreateWorkflow = () => {
    setState({ ...state, mode: 'create' })
  }

  const handleEditWorkflow = (workflow: Workflow) => {
    setState({ ...state, mode: 'edit', selectedWorkflow: workflow })
  }

  const handleDeleteWorkflow = (id: string) => {
    setState({
      ...state,
      workflows: state.workflows.filter(w => w.id !== id)
    })
  }

  const handleSaveWorkflow = async (workflow: Workflow) => {
    if (state.mode === 'create') {
      setState({
        ...state,
        workflows: [...state.workflows, { ...workflow, id: Math.random().toString(36).substr(2, 9) }],
        mode: 'list'
      })
    } else {
      setState({
        ...state,
        workflows: state.workflows.map(w => w.id === workflow.id ? workflow : w),
        mode: 'list'
      })
    }
  }

  const handlePublishWorkflow = async (workflow: Workflow) => {
    setState({
      ...state,
      workflows: state.workflows.map(w => w.id === workflow.id ? { ...workflow, status: 'ACTIVE' } : w),
      mode: 'list'
    })
  }

  if (state.mode === 'create' || state.mode === 'edit') {
    return (
      <div className="space-y-4">
        <Button
          variant="outline"
          onClick={() => setState({ ...state, mode: 'list' })}
        >
          ← Back to Workflows
        </Button>
        <WorkflowDesigner
          initialWorkflow={state.selectedWorkflow}
          onSave={handleSaveWorkflow}
          onPublish={handlePublishWorkflow}
        />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Workflow Management</h1>
          <p className="text-muted-foreground">Design and manage business workflows</p>
        </div>
        <Button onClick={handleCreateWorkflow}>
          <Plus className="w-4 h-4 mr-2" />
          Create Workflow
        </Button>
      </div>

      {/* Search */}
      <Input
        placeholder="Search workflows..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
      />

      {/* Workflows Grid */}
      {filteredWorkflows.length === 0 ? (
        <Card>
          <CardContent className="pt-6 text-center text-muted-foreground">
            {state.workflows.length === 0
              ? 'No workflows yet. Create one to get started.'
              : 'No workflows match your search.'}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredWorkflows.map(workflow => (
            <WorkflowCard
              key={workflow.id}
              workflow={workflow}
              onEdit={handleEditWorkflow}
              onDelete={handleDeleteWorkflow}
            />
          ))}
        </div>
      )}
    </div>
  )
}

/**
 * Workflow Card Component
 */
function WorkflowCard({
  workflow,
  onEdit,
  onDelete
}: {
  workflow: Workflow
  onEdit: (workflow: Workflow) => void
  onDelete: (id: string) => void
}) {
  const statusColor = {
    DRAFT: 'bg-gray-100 text-gray-800',
    ACTIVE: 'bg-green-100 text-green-800',
    ARCHIVED: 'bg-red-100 text-red-800'
  }[workflow.status] || ''

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle>{workflow.name}</CardTitle>
            <CardDescription className="line-clamp-2">
              {workflow.description}
            </CardDescription>
          </div>
          <span className={`text-xs font-semibold px-2 py-1 rounded ${statusColor}`}>
            {workflow.status}
          </span>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>{workflow.nodes.length} nodes</span>
          <span>v{workflow.version}</span>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            className="flex-1"
            onClick={() => onEdit(workflow)}
          >
            <Edit className="w-3 h-3 mr-1" />
            Edit
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="flex-1"
            onClick={() => onDelete(workflow.id)}
          >
            <Trash2 className="w-3 h-3 mr-1" />
            Delete
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
