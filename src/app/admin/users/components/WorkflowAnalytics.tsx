'use client'

import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Workflow } from '@/services/workflow-designer.service'
import { TrendingUp, AlertTriangle, Zap } from 'lucide-react'

interface WorkflowAnalyticsProps {
  workflow: Workflow
}

export function WorkflowAnalytics({ workflow }: WorkflowAnalyticsProps) {
  const { performance, validation } = workflow

  // Calculate statistics
  const totalNodes = workflow.nodes.length
  const triggerNodes = workflow.nodes.filter(n => n.type === 'trigger').length
  const actionNodes = workflow.nodes.filter(n => n.type === 'action').length
  const decisionNodes = workflow.nodes.filter(n => n.type === 'decision').length
  const approvalNodes = workflow.nodes.filter(n => n.type === 'approval').length
  const integrationNodes = workflow.nodes.filter(n => n.type === 'integration').length
  const notificationNodes = workflow.nodes.filter(n => n.type === 'notification').length

  // Calculate critical path
  const criticalPathLength = performance.estimatedDuration

  // Bottleneck severity
  const bottleneckCount = performance.bottlenecks.length

  return (
    <div className="space-y-6">
      {/* Performance Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard
          title="Est. Duration"
          value={`${criticalPathLength}s`}
          icon="⏱️"
          trend={undefined}
          description="Critical path"
        />
        <MetricCard
          title="Parallel Paths"
          value={performance.parallelPaths}
          icon="⚡"
          trend={performance.parallelPaths > 2 ? 'up' : undefined}
          description="Concurrent executions"
        />
        <MetricCard
          title="Throughput"
          value={`${performance.throughput}/min`}
          icon="📊"
          trend="up"
          description="Operations per minute"
        />
        <MetricCard
          title="Bottlenecks"
          value={bottleneckCount}
          icon="🚨"
          trend={bottleneckCount > 2 ? 'warning' : undefined}
          description="Slow steps detected"
        />
      </div>

      {/* Node Distribution */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="w-5 h-5" />
            Node Distribution
          </CardTitle>
          <CardDescription>Breakdown of node types in workflow</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            {totalNodes === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">No nodes in workflow</p>
            ) : (
              <>
                <NodeTypeBar label="Triggers" count={triggerNodes} total={totalNodes} color="bg-blue-500" />
                <NodeTypeBar label="Actions" count={actionNodes} total={totalNodes} color="bg-green-500" />
                <NodeTypeBar label="Decisions" count={decisionNodes} total={totalNodes} color="bg-yellow-500" />
                <NodeTypeBar label="Approvals" count={approvalNodes} total={totalNodes} color="bg-purple-500" />
                <NodeTypeBar label="Integrations" count={integrationNodes} total={totalNodes} color="bg-pink-500" />
                <NodeTypeBar label="Notifications" count={notificationNodes} total={totalNodes} color="bg-orange-500" />
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Bottleneck Analysis */}
      {bottleneckCount > 0 && (
        <Card className="border-amber-200 bg-amber-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-amber-900">
              <AlertTriangle className="w-5 h-5" />
              Bottleneck Analysis
            </CardTitle>
            <CardDescription className="text-amber-800">
              {bottleneckCount} slow step{bottleneckCount !== 1 ? 's' : ''} identified
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {performance.bottlenecks.map((bottleneck, index) => (
              <BottleneckItem key={index} bottleneck={bottleneck} />
            ))}
          </CardContent>
        </Card>
      )}

      {/* Validation Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Validation Status</span>
            {validation.isValid ? (
              <Badge className="bg-green-100 text-green-800">Valid</Badge>
            ) : (
              <Badge className="bg-red-100 text-red-800">Invalid</Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {validation.isValid ? (
            <Alert className="border-green-200 bg-green-50">
              <AlertDescription className="text-green-800">
                ✅ Workflow is valid and ready for execution
              </AlertDescription>
            </Alert>
          ) : (
            <>
              {validation.syntaxErrors.length > 0 && (
                <IssueSection title="Syntax Errors" count={validation.syntaxErrors.length}>
                  {validation.syntaxErrors.map((error, idx) => (
                    <IssueItem key={idx} item={error} />
                  ))}
                </IssueSection>
              )}

              {validation.cyclicDependencies.length > 0 && (
                <IssueSection title="Cyclic Dependencies" count={validation.cyclicDependencies.length}>
                  {validation.cyclicDependencies.map((dep, idx) => (
                    <div key={idx} className="text-sm p-2 bg-red-50 rounded border border-red-200">
                      <code className="text-red-900 font-mono break-all">{dep.path}</code>
                    </div>
                  ))}
                </IssueSection>
              )}

              {validation.unreachableNodes.length > 0 && (
                <IssueSection title="Unreachable Nodes" count={validation.unreachableNodes.length}>
                  {validation.unreachableNodes.map((nodeId, idx) => (
                    <div key={idx} className="text-sm p-2 bg-amber-50 rounded border border-amber-200">
                      <p className="text-amber-900">Node: <code className="font-mono">{nodeId}</code></p>
                    </div>
                  ))}
                </IssueSection>
              )}

              {validation.missingConfiguration.length > 0 && (
                <IssueSection title="Missing Configuration" count={validation.missingConfiguration.length}>
                  {validation.missingConfiguration.map((error, idx) => (
                    <div key={idx} className="text-sm p-2 bg-orange-50 rounded border border-orange-200">
                      <p className="text-orange-900 font-medium">{error.message}</p>
                      <p className="text-orange-800 text-xs mt-1">Node: {error.nodeId}</p>
                    </div>
                  ))}
                </IssueSection>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Optimization Suggestions */}
      <Card>
        <CardHeader>
          <CardTitle>Optimization Suggestions</CardTitle>
          <CardDescription>Recommendations to improve workflow efficiency</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {totalNodes === 0 && (
            <p className="text-sm text-muted-foreground">Add nodes to get optimization suggestions</p>
          )}

          {totalNodes > 0 && performance.parallelPaths === 0 && (
            <SuggestionItem
              title="Add Parallel Paths"
              description="Consider using parallel execution for independent operations to reduce total duration"
              priority="medium"
            />
          )}

          {bottleneckCount > 0 && (
            <SuggestionItem
              title="Reduce Bottlenecks"
              description={`${bottleneckCount} bottleneck${bottleneckCount !== 1 ? 's' : ''} found. Optimize or parallelize slow steps`}
              priority="high"
            />
          )}

          {decisionNodes > 3 && (
            <SuggestionItem
              title="Simplify Logic"
              description="Consider refactoring complex decision trees into lookup tables or rule engines"
              priority="low"
            />
          )}

          {approvalNodes > 2 && (
            <SuggestionItem
              title="Parallel Approvals"
              description="Use parallel approval paths to reduce approval time"
              priority="medium"
            />
          )}

          {criticalPathLength > 300 && (
            <SuggestionItem
              title="Break Down Workflow"
              description="Long-running workflow (>5 minutes). Consider splitting into sub-workflows"
              priority="medium"
            />
          )}

          {totalNodes > 20 && (
            <SuggestionItem
              title="Modularize"
              description="Large workflow (>20 nodes). Consider breaking into reusable sub-workflows"
              priority="low"
            />
          )}
        </CardContent>
      </Card>
    </div>
  )
}

/**
 * Metric Card Component
 */
function MetricCard({
  title,
  value,
  icon,
  trend,
  description
}: {
  title: string
  value: string | number
  icon: string
  trend?: 'up' | 'down' | 'warning'
  description: string
}) {
  return (
    <div className="border rounded-lg p-4 space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-3xl">{icon}</span>
        {trend === 'up' && <TrendingUp className="w-4 h-4 text-green-600" />}
        {trend === 'warning' && <AlertTriangle className="w-4 h-4 text-amber-600" />}
      </div>
      <div className="text-xs text-muted-foreground">{title}</div>
      <div className="text-2xl font-bold">{value}</div>
      <div className="text-xs text-muted-foreground">{description}</div>
    </div>
  )
}

/**
 * Node Type Bar Component
 */
function NodeTypeBar({
  label,
  count,
  total,
  color
}: {
  label: string
  count: number
  total: number
  color: string
}) {
  const percentage = total > 0 ? (count / total) * 100 : 0

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium">{label}</span>
        <Badge variant="secondary">{count}</Badge>
      </div>
      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
        <div
          className={`h-full ${color} transition-all`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  )
}

/**
 * Bottleneck Item Component
 */
function BottleneckItem({
  bottleneck
}: {
  bottleneck: any
}) {
  const node = { id: bottleneck.nodeId }

  return (
    <div className="p-3 bg-white rounded border border-amber-200">
      <div className="flex items-start justify-between">
        <div>
          <p className="font-semibold text-sm text-amber-900">Node: {node.id}</p>
          <p className="text-sm text-amber-800 mt-1">{bottleneck.reason}</p>
        </div>
        <Badge className="bg-amber-200 text-amber-900">{bottleneck.estimatedTime}s</Badge>
      </div>
    </div>
  )
}

/**
 * Issue Section Component
 */
function IssueSection({
  title,
  count,
  children
}: {
  title: string
  count: number
  children: React.ReactNode
}) {
  return (
    <div className="space-y-2">
      <h4 className="font-semibold text-sm flex items-center gap-2">
        {title}
        <Badge variant="destructive">{count}</Badge>
      </h4>
      <div className="space-y-2">
        {children}
      </div>
    </div>
  )
}

/**
 * Issue Item Component
 */
function IssueItem({
  item
}: {
  item: any
}) {
  return (
    <div className="text-sm p-2 bg-red-50 rounded border border-red-200">
      <p className="text-red-900 font-medium">{item.message}</p>
      <p className="text-red-800 text-xs mt-1">Node: {item.nodeId}</p>
    </div>
  )
}

/**
 * Suggestion Item Component
 */
function SuggestionItem({
  title,
  description,
  priority
}: {
  title: string
  description: string
  priority: 'high' | 'medium' | 'low'
}) {
  const priorityColor = {
    high: 'bg-red-50 border-red-200',
    medium: 'bg-amber-50 border-amber-200',
    low: 'bg-blue-50 border-blue-200'
  }[priority]

  const priorityBadge = {
    high: 'bg-red-100 text-red-800',
    medium: 'bg-amber-100 text-amber-800',
    low: 'bg-blue-100 text-blue-800'
  }[priority]

  return (
    <div className={`p-3 rounded border ${priorityColor}`}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="font-semibold text-sm">{title}</p>
          <p className="text-sm text-muted-foreground mt-1">{description}</p>
        </div>
        <Badge className={priorityBadge}>{priority}</Badge>
      </div>
    </div>
  )
}
