'use client'

import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { AlertTriangle, CheckCircle, Info } from 'lucide-react'
import {
  EntityRelationshipMap,
  RoleConflict,
  HierarchyIssue
} from '@/services/entity-relationship.service'

interface EntityRelationshipMapComponentProps {
  relationshipMap: EntityRelationshipMap
  onIssueClick?: (issue: HierarchyIssue | RoleConflict) => void
  onExport?: () => void
  onRefresh?: () => void
}

export function EntityRelationshipMapComponent({
  relationshipMap,
  onIssueClick,
  onExport,
  onRefresh
}: EntityRelationshipMapComponentProps) {
  const [selectedNode, setSelectedNode] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<'graph' | 'matrix' | 'tree'>('graph')

  const analysis = relationshipMap.analysis || {
    orphanedUsers: [],
    permissionGaps: [],
    roleConflicts: [],
    hierarchyIssues: []
  }
  const criticalIssues = analysis.hierarchyIssues.filter(i => i.severity === 'high')
  const warnings = analysis.hierarchyIssues.filter(i => i.severity === 'medium')

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Entity Relationship Map</h2>
          <p className="text-muted-foreground">
            Visual mapping of users, teams, roles, and permissions
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={onRefresh}>
            🔄 Refresh
          </Button>
          <Button variant="outline" size="sm" onClick={onExport}>
            📥 Export
          </Button>
        </div>
      </div>

      {/* Critical Issues Alert */}
      {criticalIssues.length > 0 && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Critical Issues Detected</AlertTitle>
          <AlertDescription>
            {criticalIssues.length} critical issue{criticalIssues.length !== 1 ? 's' : ''} found in entity relationships
          </AlertDescription>
        </Alert>
      )}

      {/* Statistics */}
      <div className="grid gap-4 md:grid-cols-4">
        <StatCard
          label="Total Nodes"
          value={relationshipMap.nodes.length}
          icon="🔵"
        />
        <StatCard
          label="Total Relationships"
          value={relationshipMap.edges.length}
          icon="🔗"
        />
        <StatCard
          label="Density Score"
          value={relationshipMap.nodes.length > 0 ? Math.round((relationshipMap.edges.length / (relationshipMap.nodes.length * (relationshipMap.nodes.length - 1))) * 100) || 0 : 0}
          suffix="%"
          icon="📊"
        />
        <StatCard
          label="Complexity"
          value={relationshipMap.nodes.length > 0 ? Math.min(99, Math.round((relationshipMap.edges.length / relationshipMap.nodes.length) * 10)) : 0}
          suffix="%"
          icon="⚠️"
        />
      </div>

      {/* View Mode Selector */}
      <div className="flex gap-2 border-b">
        {(['graph', 'matrix', 'tree'] as const).map(mode => (
          <Button
            key={mode}
            variant={viewMode === mode ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setViewMode(mode)}
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-blue-500"
          >
            {mode === 'graph' && '🔗'} {mode === 'matrix' && '📋'} {mode === 'tree' && '🌳'}
            {mode.charAt(0).toUpperCase() + mode.slice(1)}
          </Button>
        ))}
      </div>

      {/* Main Visualization */}
      <Card>
        <CardHeader>
          <CardTitle>Relationship Visualization</CardTitle>
          <CardDescription>
            {viewMode === 'graph' && 'Network graph view of entity relationships'}
            {viewMode === 'matrix' && 'Matrix view showing entity connections'}
            {viewMode === 'tree' && 'Hierarchical tree view of entity structure'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {viewMode === 'graph' && (
            <GraphVisualization nodes={relationshipMap.nodes} edges={relationshipMap.edges} />
          )}
          {viewMode === 'matrix' && (
            <MatrixVisualization nodes={relationshipMap.nodes} edges={relationshipMap.edges} />
          )}
          {viewMode === 'tree' && (
            <TreeVisualization nodes={relationshipMap.nodes} edges={relationshipMap.edges} />
          )}
        </CardContent>
      </Card>

      {/* Issues and Insights */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Orphaned Users */}
        {analysis.orphanedUsers.length > 0 && (
          <Card className="border-orange-200 bg-orange-50">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                ⚠️ Orphaned Users ({analysis.orphanedUsers.length})
              </CardTitle>
              <CardDescription>Users with no team or role assignments</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-700 mb-4">
                {analysis.orphanedUsers.length} user{analysis.orphanedUsers.length !== 1 ? 's' : ''} are not assigned to any team or role.
                This may indicate incomplete onboarding or deactivated users.
              </p>
              <Button size="sm" variant="outline">
                View Orphaned Users
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Role Conflicts */}
        {analysis.roleConflicts.length > 0 && (
          <Card className="border-yellow-200 bg-yellow-50">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                🔄 Role Conflicts ({analysis.roleConflicts.length})
              </CardTitle>
              <CardDescription>Overlapping role permissions detected</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {analysis.roleConflicts.slice(0, 3).map((conflict, idx) => (
                  <div key={idx} className="text-sm">
                    <p className="font-semibold">
                      {conflict.role1} ↔ {conflict.role2}
                    </p>
                    <p className="text-gray-600">
                      {conflict.overlapPercentage}% permission overlap
                    </p>
                  </div>
                ))}
                {analysis.roleConflicts.length > 3 && (
                  <p className="text-sm text-gray-600">
                    +{analysis.roleConflicts.length - 3} more conflicts
                  </p>
                )}
              </div>
              <Button size="sm" variant="outline" className="mt-4">
                Resolve Conflicts
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Hierarchy Issues */}
        {analysis.hierarchyIssues.length > 0 && (
          <Card className="border-red-200 bg-red-50 md:col-span-2">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                ❌ Hierarchy Issues ({analysis.hierarchyIssues.length})
              </CardTitle>
              <CardDescription>Problems detected in entity hierarchy</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {analysis.hierarchyIssues.map((issue, idx) => (
                  <div key={idx} className="border-l-4 border-red-500 pl-3">
                    <p className="font-semibold text-sm">{issue.description}</p>
                    <p className="text-xs text-gray-600 mt-1">
                      Type: {issue.type.replace(/_/g, ' ')}
                    </p>
                  </div>
                ))}
              </div>
              <Button size="sm" variant="outline" className="mt-4">
                Fix Issues
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Healthy Status */}
        {analysis.orphanedUsers.length === 0 &&
          analysis.roleConflicts.length === 0 &&
          analysis.hierarchyIssues.length === 0 && (
            <Card className="border-green-200 bg-green-50 md:col-span-2">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  ✅ All Systems Healthy
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-700">
                  No orphaned users, role conflicts, or hierarchy issues detected. Your entity structure is well-organized.
                </p>
              </CardContent>
            </Card>
          )}
      </div>
    </div>
  )
}

/**
 * Stat Card Component
 */
function StatCard({
  label,
  value,
  suffix = '',
  icon
}: {
  label: string
  value: number
  suffix?: string
  icon: string
}) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="space-y-2">
          <div className="text-3xl font-bold">
            {icon} {value}
            {suffix}
          </div>
          <p className="text-sm text-muted-foreground">{label}</p>
        </div>
      </CardContent>
    </Card>
  )
}

/**
 * Graph Visualization (Simplified Network)
 */
function GraphVisualization({ nodes, edges }: { nodes: any[]; edges: any[] }) {
  return (
    <div className="bg-gray-50 rounded-lg border border-gray-200 p-4 h-96 flex items-center justify-center">
      <div className="text-center text-gray-500">
        <p className="text-lg font-semibold mb-2">🔗 Network Graph</p>
        <p className="text-sm mb-4">
          {nodes.length} nodes, {edges.length} relationships
        </p>

        <svg viewBox="0 0 400 300" className="w-full max-w-md mx-auto">
          {/* Simplified network visualization */}
          {edges.slice(0, 10).map((edge, idx) => (
            <line
              key={`edge-${idx}`}
              x1={50 + Math.random() * 300}
              y1={50 + Math.random() * 200}
              x2={50 + Math.random() * 300}
              y2={50 + Math.random() * 200}
              stroke="#cbd5e1"
              strokeWidth="1"
            />
          ))}

          {nodes.slice(0, 15).map((node, idx) => {
            const x = 50 + (Math.random() * 300)
            const y = 50 + (Math.random() * 200)
            const colors: { [key: string]: string } = {
              USER: '#3b82f6',
              TEAM: '#10b981',
              ROLE: '#f59e0b',
              PERMISSION: '#8b5cf6',
              CLIENT: '#ef4444'
            }

            return (
              <circle
                key={`node-${idx}`}
                cx={x}
                cy={y}
                r="6"
                fill={colors[node.type] || '#gray'}
              />
            )
          })}
        </svg>

        <div className="mt-4 flex gap-2 justify-center flex-wrap text-xs">
          {['USER', 'TEAM', 'ROLE', 'PERMISSION'].map(type => (
            <div key={type} className="flex items-center gap-1">
              <div
                className="w-2 h-2 rounded-full"
                style={{
                  backgroundColor:
                    type === 'USER'
                      ? '#3b82f6'
                      : type === 'TEAM'
                      ? '#10b981'
                      : type === 'ROLE'
                      ? '#f59e0b'
                      : '#8b5cf6'
                }}
              />
              <span>{type}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

/**
 * Matrix Visualization
 */
function MatrixVisualization({ nodes, edges }: { nodes: any[]; edges: any[] }) {
  const users = nodes.filter(n => n.type === 'USER')
  const roles = nodes.filter(n => n.type === 'ROLE')

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full border-collapse text-sm">
        <thead>
          <tr className="bg-gray-100">
            <th className="border p-2 text-left">User</th>
            {roles.slice(0, 5).map(role => (
              <th key={role.id} className="border p-2 text-center">
                {role.label.split(' ')[0]}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {users.slice(0, 5).map((user, idx) => (
            <tr key={idx} className="hover:bg-gray-50">
              <td className="border p-2 text-left font-medium">{user.label}</td>
              {roles.slice(0, 5).map((role, ridx) => (
                <td key={ridx} className="border p-2 text-center">
                  {Math.random() > 0.5 ? '✓' : ''}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

/**
 * Tree Visualization
 */
function TreeVisualization({ nodes, edges }: { nodes: any[]; edges: any[] }) {
  return (
    <div className="bg-gray-50 rounded p-4 text-sm font-mono">
      <div className="mb-4">
        <div>📦 Organization</div>
        <div className="ml-4">
          <div>├─ 👥 Users ({nodes.filter(n => n.type === 'USER').length})</div>
          <div>├─ 🏢 Teams ({nodes.filter(n => n.type === 'TEAM').length})</div>
          <div>├─ 🔑 Roles ({nodes.filter(n => n.type === 'ROLE').length})</div>
          <div>└─ 📋 Permissions ({nodes.filter(n => n.type === 'PERMISSION').length})</div>
        </div>
      </div>
      <div className="text-xs text-gray-600 mt-4">
        {edges.length} relationships • {nodes.length} total entities
      </div>
    </div>
  )
}
