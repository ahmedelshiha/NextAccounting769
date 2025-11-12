'use client'

import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Search } from 'lucide-react'
import { NodeType } from '@/services/workflow-designer.service'

interface NodeDefinition {
  type: NodeType
  icon: string
  label: string
  description: string
  category: string
  config: Record<string, any>
  tags: string[]
}

interface NodeLibraryProps {
  onNodeSelect: (nodeType: NodeType) => void
  selectedCategory?: string
  onCategoryChange?: (category: string) => void
}

const NODE_DEFINITIONS: NodeDefinition[] = [
  {
    type: 'trigger',
    icon: '🎯',
    label: 'Trigger',
    description: 'Start event that initiates the workflow',
    category: 'Events',
    config: { trigger: '' },
    tags: ['start', 'event', 'entry-point']
  },
  {
    type: 'action',
    icon: '⚡',
    label: 'Action',
    description: 'Execute an operation or task',
    category: 'Operations',
    config: { action: '' },
    tags: ['task', 'operation', 'execute']
  },
  {
    type: 'decision',
    icon: '❓',
    label: 'Decision',
    description: 'Branch workflow based on conditions',
    category: 'Logic',
    config: { condition: '' },
    tags: ['if', 'condition', 'branch', 'logic']
  },
  {
    type: 'approval',
    icon: '✅',
    label: 'Approval',
    description: 'Wait for approval from specified role',
    category: 'Approvals',
    config: { approverRole: '', timeout: 3600 },
    tags: ['approve', 'review', 'authorization']
  },
  {
    type: 'integration',
    icon: '🔗',
    label: 'Integration',
    description: 'Call external API or service',
    category: 'Integrations',
    config: { endpoint: '', method: 'POST', timeout: 30 },
    tags: ['api', 'external', 'webhook']
  },
  {
    type: 'notification',
    icon: '📧',
    label: 'Notification',
    description: 'Send email, SMS, or chat notification',
    category: 'Communications',
    config: { type: 'email', recipients: [], template: '' },
    tags: ['email', 'notification', 'message']
  },
  {
    type: 'delay',
    icon: '⏱️',
    label: 'Delay',
    description: 'Wait for specified duration',
    category: 'Flow Control',
    config: { duration: 60 },
    tags: ['wait', 'pause', 'schedule']
  },
  {
    type: 'parallel',
    icon: '⚡',
    label: 'Parallel',
    description: 'Execute multiple paths simultaneously',
    category: 'Flow Control',
    config: { paths: [] },
    tags: ['concurrent', 'parallel', 'async']
  }
]

const CATEGORIES = ['All', 'Events', 'Operations', 'Logic', 'Approvals', 'Integrations', 'Communications', 'Flow Control']

export function NodeLibrary({
  onNodeSelect,
  selectedCategory = 'All',
  onCategoryChange
}: NodeLibraryProps) {
  const [searchQuery, setSearchQuery] = React.useState('')

  const filteredNodes = NODE_DEFINITIONS.filter(node => {
    const matchesCategory = selectedCategory === 'All' || node.category === selectedCategory
    const matchesSearch = 
      node.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
      node.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      node.tags.some(tag => tag.includes(searchQuery.toLowerCase()))
    return matchesCategory && matchesSearch
  })

  return (
    <Card className="h-full flex flex-col">
      <CardHeader>
        <CardTitle>Node Library</CardTitle>
        <CardDescription>Drag or click nodes to add to canvas</CardDescription>
      </CardHeader>

      <CardContent className="flex-1 space-y-4 overflow-hidden flex flex-col">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search nodes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8"
          />
        </div>

        {/* Categories */}
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map(category => (
            <Badge
              key={category}
              variant={selectedCategory === category ? 'default' : 'outline'}
              className="cursor-pointer"
              onClick={() => onCategoryChange?.(category)}
            >
              {category}
            </Badge>
          ))}
        </div>

        {/* Nodes List */}
        <div className="space-y-2 overflow-y-auto flex-1">
          {filteredNodes.length === 0 ? (
            <div className="text-center text-sm text-muted-foreground py-8">
              No nodes found matching your search
            </div>
          ) : (
            filteredNodes.map(node => (
              <NodeItem
                key={node.type}
                node={node}
                onSelect={() => onNodeSelect(node.type)}
              />
            ))
          )}
        </div>

        {/* Statistics */}
        <div className="text-xs text-muted-foreground border-t pt-2">
          {filteredNodes.length} of {NODE_DEFINITIONS.length} nodes
        </div>
      </CardContent>
    </Card>
  )
}

/**
 * Node Item Component
 */
function NodeItem({
  node,
  onSelect
}: {
  node: NodeDefinition
  onSelect: () => void
}) {
  return (
    <div
      draggable
      onDragStart={(e) => {
        e.dataTransfer.effectAllowed = 'copy'
        e.dataTransfer.setData('nodeType', node.type)
      }}
      onClick={onSelect}
      className="p-3 border rounded-lg hover:bg-accent hover:border-primary cursor-move transition-colors group"
    >
      <div className="flex items-start gap-3">
        <div className="text-2xl flex-shrink-0">{node.icon}</div>
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-sm">{node.label}</h4>
          <p className="text-xs text-muted-foreground line-clamp-2">{node.description}</p>
          <div className="flex flex-wrap gap-1 mt-2">
            {node.tags.slice(0, 2).map(tag => (
              <Badge key={tag} variant="secondary" className="text-xs">
                {tag}
              </Badge>
            ))}
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={onSelect}
          className="opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
        >
          +
        </Button>
      </div>
    </div>
  )
}
