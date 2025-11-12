'use client'

import React, { useRef, useEffect, useState } from 'react'
import { WorkflowNode, WorkflowEdge, Workflow } from '@/services/workflow-designer.service'
import { Button } from '@/components/ui/button'
import { Trash2, Copy, Edit2, ZoomIn, ZoomOut, Download } from 'lucide-react'

interface WorkflowCanvasProps {
  workflow: Workflow
  selectedNodeId?: string | null
  onNodeSelect?: (nodeId: string) => void
  onNodeDelete?: (nodeId: string) => void
  onNodeUpdate?: (node: WorkflowNode) => void
  onEdgeCreate?: (from: string, to: string) => void
  onEdgeDelete?: (edgeId: string) => void
  readOnly?: boolean
}

export function WorkflowCanvas({
  workflow,
  selectedNodeId,
  onNodeSelect,
  onNodeDelete,
  onNodeUpdate,
  onEdgeCreate,
  onEdgeDelete,
  readOnly = false
}: WorkflowCanvasProps) {
  const svgRef = useRef<SVGSVGElement>(null)
  const [zoom, setZoom] = useState(1)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [draggedNodeId, setDraggedNodeId] = useState<string | null>(null)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
  const [connectionFrom, setConnectionFrom] = useState<string | null>(null)

  const NODE_WIDTH = 120
  const NODE_HEIGHT = 60

  // Handle node drag
  const handleNodeMouseDown = (e: React.MouseEvent, nodeId: string) => {
    if (readOnly) return
    const rect = svgRef.current?.getBoundingClientRect()
    if (!rect) return

    setIsDragging(true)
    setDraggedNodeId(nodeId)
    setDragOffset({
      x: e.clientX - rect.left - pan.x,
      y: e.clientY - rect.top - pan.y
    })
  }

  // Handle canvas drag
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging || !draggedNodeId) return

      const rect = svgRef.current?.getBoundingClientRect()
      if (!rect) return

      const newX = e.clientX - rect.left - pan.x - dragOffset.x
      const newY = e.clientY - rect.top - pan.y - dragOffset.y

      const node = workflow.nodes.find(n => n.id === draggedNodeId)
      if (node) {
        onNodeUpdate?.({
          ...node,
          x: Math.max(0, newX),
          y: Math.max(0, newY)
        })
      }
    }

    const handleMouseUp = () => {
      setIsDragging(false)
      setDraggedNodeId(null)
    }

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)

      return () => {
        document.removeEventListener('mousemove', handleMouseMove)
        document.removeEventListener('mouseup', handleMouseUp)
      }
    }
  }, [isDragging, draggedNodeId, dragOffset, pan, workflow, onNodeUpdate])

  // Handle canvas drop
  const handleCanvasDrop = (e: React.DragEvent) => {
    if (readOnly) return
    e.preventDefault()

    const nodeType = e.dataTransfer.getData('nodeType')
    if (!nodeType) return

    const rect = svgRef.current?.getBoundingClientRect()
    if (!rect) return

    const x = (e.clientX - rect.left - pan.x) / zoom
    const y = (e.clientY - rect.top - pan.y) / zoom

    onNodeSelect?.(`new-${Date.now()}`)
  }

  // Handle canvas zoom
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault()
    const delta = e.deltaY > 0 ? 0.9 : 1.1
    const newZoom = Math.max(0.5, Math.min(2, zoom * delta))
    setZoom(newZoom)
  }

  const nodeIcons: Record<string, string> = {
    trigger: '🎯',
    action: '⚡',
    decision: '❓',
    approval: '✅',
    integration: '🔗',
    notification: '📧',
    delay: '⏱️',
    parallel: '⚡'
  }

  return (
    <div className="border rounded-lg bg-white overflow-hidden flex flex-col h-full">
      {/* Toolbar */}
      <div className="flex items-center justify-between p-3 border-b gap-2">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setZoom(z => Math.min(2, z * 1.2))}
            title="Zoom in"
          >
            <ZoomIn className="w-4 h-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setZoom(z => Math.max(0.5, z / 1.2))}
            title="Zoom out"
          >
            <ZoomOut className="w-4 h-4" />
          </Button>
          <span className="text-sm text-muted-foreground ml-2">
            {Math.round(zoom * 100)}%
          </span>
        </div>
        <div className="text-sm text-muted-foreground">
          {workflow.nodes.length} nodes • {workflow.edges.length} connections
        </div>
        <Button variant="outline" size="sm" title="Export workflow">
          <Download className="w-4 h-4" />
        </Button>
      </div>

      {/* Canvas */}
      <div className="flex-1 overflow-auto relative bg-gray-50">
        <svg
          ref={svgRef}
          width="100%"
          height="100%"
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleCanvasDrop}
          onWheel={handleWheel}
          className="cursor-grab active:cursor-grabbing"
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
            transformOrigin: '0 0'
          }}
        >
          {/* Grid background */}
          <defs>
            <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
              <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#e5e7eb" strokeWidth="0.5" />
            </pattern>
            <marker
              id="arrowhead"
              markerWidth="10"
              markerHeight="10"
              refX="9"
              refY="3"
              orient="auto"
            >
              <polygon points="0 0, 10 3, 0 6" fill="#3b82f6" />
            </marker>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />

          {/* Edges */}
          {workflow.edges.map(edge => {
            const fromNode = workflow.nodes.find(n => n.id === edge.from)
            const toNode = workflow.nodes.find(n => n.id === edge.to)
            if (!fromNode || !toNode) return null

            return (
              <g key={edge.id}>
                <line
                  x1={fromNode.x + NODE_WIDTH / 2}
                  y1={fromNode.y + NODE_HEIGHT}
                  x2={toNode.x + NODE_WIDTH / 2}
                  y2={toNode.y}
                  stroke="#3b82f6"
                  strokeWidth="2"
                  markerEnd="url(#arrowhead)"
                />
                {edge.label && (
                  <text
                    x={(fromNode.x + toNode.x) / 2 + NODE_WIDTH / 2}
                    y={(fromNode.y + toNode.y) / 2 + NODE_HEIGHT / 2}
                    fontSize="12"
                    fill="#666"
                    textAnchor="middle"
                    className="pointer-events-none"
                  >
                    {edge.label}
                  </text>
                )}
              </g>
            )
          })}

          {/* Nodes */}
          {workflow.nodes.map(node => (
            <NodeElement
              key={node.id}
              node={node}
              icon={nodeIcons[node.type]}
              isSelected={selectedNodeId === node.id}
              readOnly={readOnly}
              onSelect={() => onNodeSelect?.(node.id)}
              onMouseDown={(e) => handleNodeMouseDown(e, node.id)}
              onDelete={() => onNodeDelete?.(node.id)}
            />
          ))}
        </svg>
      </div>
    </div>
  )
}

/**
 * Node Element Component
 */
function NodeElement({
  node,
  icon,
  isSelected,
  readOnly,
  onSelect,
  onMouseDown,
  onDelete
}: {
  node: WorkflowNode
  icon: string
  isSelected: boolean
  readOnly: boolean
  onSelect: () => void
  onMouseDown: (e: React.MouseEvent) => void
  onDelete: () => void
}) {
  const NODE_WIDTH = 120
  const NODE_HEIGHT = 60

  return (
    <g
      key={node.id}
      style={{
        cursor: readOnly ? 'default' : 'move'
      }}
    >
      {/* Node background */}
      <rect
        x={node.x}
        y={node.y}
        width={NODE_WIDTH}
        height={NODE_HEIGHT}
        rx="8"
        fill={isSelected ? '#dbeafe' : '#ffffff'}
        stroke={isSelected ? '#3b82f6' : '#d1d5db'}
        strokeWidth="2"
        className="hover:stroke-primary transition-colors"
        onMouseDown={onMouseDown}
        onClick={onSelect}
      />

      {/* Icon */}
      <text
        x={node.x + NODE_WIDTH / 2}
        y={node.y + 20}
        fontSize="20"
        textAnchor="middle"
        className="pointer-events-none select-none"
      >
        {icon}
      </text>

      {/* Label */}
      <text
        x={node.x + NODE_WIDTH / 2}
        y={node.y + 45}
        fontSize="12"
        fontWeight="500"
        textAnchor="middle"
        className="pointer-events-none select-none"
      >
        {node.label.length > 12 ? node.label.substring(0, 12) + '...' : node.label}
      </text>

      {/* Delete button */}
      {isSelected && !readOnly && (
        <g onClick={(e) => { e.stopPropagation(); onDelete() }} style={{ cursor: 'pointer' }}>
          <rect
            x={node.x + NODE_WIDTH - 22}
            y={node.y - 10}
            width="20"
            height="20"
            rx="4"
            fill="#ef4444"
            opacity="0.9"
          />
          <text
            x={node.x + NODE_WIDTH - 12}
            y={node.y}
            fontSize="12"
            fill="white"
            textAnchor="middle"
            className="pointer-events-none font-bold select-none"
          >
            ×
          </text>
        </g>
      )}
    </g>
  )
}
