'use client'

import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Workflow, WorkflowSimulation } from '@/services/workflow-designer.service'
import { Play, RotateCw, CheckCircle, AlertTriangle, Clock } from 'lucide-react'

interface ExecutionStep {
  nodeId: string
  status: 'SUCCESS' | 'FAILED' | 'SKIPPED'
  timestamp: Date | string
  output?: any
  error?: string
}

interface WorkflowSimulatorProps {
  workflow: Workflow
  onSimulate: (workflow: Workflow, testData?: Record<string, any>) => Promise<WorkflowSimulation>
}

export function WorkflowSimulator({ workflow, onSimulate }: WorkflowSimulatorProps) {
  const [isRunning, setIsRunning] = useState(false)
  const [result, setResult] = useState<WorkflowSimulation | null>(null)
  const [testData, setTestData] = useState<Record<string, any>>({})
  const [expandedStep, setExpandedStep] = useState<string | null>(null)

  const handleRunTest = async () => {
    setIsRunning(true)
    try {
      const simulation = await onSimulate(workflow, testData)
      setResult(simulation)
    } finally {
      setIsRunning(false)
    }
  }

  const handleReset = () => {
    setResult(null)
    setTestData({})
    setExpandedStep(null)
  }

  const successRate = result
    ? (result.executionPath.filter(s => s.status === 'SUCCESS').length / result.executionPath.length) * 100
    : 0

  return (
    <div className="space-y-6">
      {/* Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Test Configuration
          </CardTitle>
          <CardDescription>Set up test data for simulation</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Test User Email</label>
              <input
                type="email"
                placeholder="user@example.com"
                value={testData.userEmail || ''}
                onChange={(e) => setTestData({ ...testData, userEmail: e.target.value })}
                className="mt-1 w-full px-3 py-2 border rounded-md text-sm"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Test Role</label>
              <input
                type="text"
                placeholder="TEAM_MEMBER"
                value={testData.role || ''}
                onChange={(e) => setTestData({ ...testData, role: e.target.value })}
                className="mt-1 w-full px-3 py-2 border rounded-md text-sm"
              />
            </div>
          </div>

          <div className="flex gap-2">
            <Button onClick={handleRunTest} disabled={isRunning} className="gap-2">
              <Play className="w-4 h-4" />
              {isRunning ? 'Running Test...' : 'Run Test'}
            </Button>
            <Button variant="outline" onClick={handleReset} disabled={isRunning}>
              <RotateCw className="w-4 h-4 mr-2" />
              Reset
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      {result && (
        <>
          {/* Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Simulation Results</span>
                <Badge variant={result.success ? 'default' : 'destructive'}>
                  {result.success ? 'SUCCESS' : 'FAILED'}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Stats Grid */}
              <div className="grid grid-cols-4 gap-4">
                <StatBox
                  icon="✅"
                  label="Success Rate"
                  value={`${Math.round(successRate)}%`}
                  color="bg-green-50"
                />
                <StatBox
                  icon="⏱️"
                  label="Total Duration"
                  value={`${result.totalDuration}s`}
                  color="bg-blue-50"
                />
                <StatBox
                  icon="📊"
                  label="Steps Executed"
                  value={result.executionPath.length}
                  color="bg-purple-50"
                />
                <StatBox
                  icon="🚨"
                  label="Errors"
                  value={result.errors.length}
                  color="bg-red-50"
                />
              </div>

              {/* Success Rate Progress */}
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="font-medium">Success Rate</span>
                  <span className="text-muted-foreground">{Math.round(successRate)}%</span>
                </div>
                <Progress value={successRate} className="h-2" />
              </div>
            </CardContent>
          </Card>

          {/* Execution Path */}
          <Card>
            <CardHeader>
              <CardTitle>Execution Path</CardTitle>
              <CardDescription>Step-by-step workflow execution trace</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {result.executionPath.map((step, index) => (
                <ExecutionStepItem
                  key={`${step.nodeId}-${index}`}
                  step={step}
                  index={index}
                  isExpanded={expandedStep === `${step.nodeId}-${index}`}
                  onToggle={() => setExpandedStep(
                    expandedStep === `${step.nodeId}-${index}` ? null : `${step.nodeId}-${index}`
                  )}
                />
              ))}
            </CardContent>
          </Card>

          {/* Errors */}
          {result.errors.length > 0 && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <div className="space-y-2">
                  <p className="font-semibold">{result.errors.length} error(s) occurred:</p>
                  <ul className="list-disc list-inside space-y-1">
                    {result.errors.map((error, idx) => (
                      <li key={idx} className="text-sm">{error}</li>
                    ))}
                  </ul>
                </div>
              </AlertDescription>
            </Alert>
          )}
        </>
      )}
    </div>
  )
}

/**
 * Stat Box Component
 */
function StatBox({
  icon,
  label,
  value,
  color
}: {
  icon: string
  label: string
  value: string | number
  color: string
}) {
  return (
    <div className={`${color} p-3 rounded-lg border`}>
      <div className="text-2xl mb-1">{icon}</div>
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="text-lg font-bold">{value}</div>
    </div>
  )
}

/**
 * Execution Step Item Component
 */
function ExecutionStepItem({
  step,
  index,
  isExpanded,
  onToggle
}: {
  step: ExecutionStep
  index: number
  isExpanded: boolean
  onToggle: () => void
}) {
  const statusColor = {
    SUCCESS: 'bg-green-50 border-green-200',
    FAILED: 'bg-red-50 border-red-200',
    SKIPPED: 'bg-gray-50 border-gray-200'
  }[step.status] || ''

  const statusIcon = {
    SUCCESS: '✅',
    FAILED: '❌',
    SKIPPED: '⊘'
  }[step.status] || ''

  return (
    <div
      className={`border rounded p-3 cursor-pointer transition-colors ${statusColor} hover:opacity-80`}
      onClick={onToggle}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 flex-1">
          <span className="text-xl">{statusIcon}</span>
          <div>
            <p className="font-semibold text-sm">Step {index + 1}: {step.nodeId}</p>
            <p className="text-xs text-muted-foreground">
              {new Date(step.timestamp).toLocaleTimeString()}
            </p>
          </div>
        </div>
        <span className={`text-xs font-medium px-2 py-1 rounded ${
          step.status === 'SUCCESS' ? 'bg-green-100 text-green-800' :
          step.status === 'FAILED' ? 'bg-red-100 text-red-800' :
          'bg-gray-100 text-gray-800'
        }`}>
          {step.status}
        </span>
      </div>

      {/* Expanded Details */}
      {isExpanded && (
        <div className="mt-3 pt-3 border-t space-y-2">
          {step.error && (
            <div className="bg-red-100 p-2 rounded text-xs text-red-800">
              <p className="font-semibold">Error:</p>
              <p>{step.error}</p>
            </div>
          )}
          {step.output && (
            <div className="bg-gray-100 p-2 rounded text-xs font-mono overflow-auto max-h-40">
              <p className="font-semibold text-gray-800 mb-1">Output:</p>
              <pre>{JSON.stringify(step.output, null, 2)}</pre>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
