'use client'

import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Play, RotateCw, CheckCircle, AlertTriangle } from 'lucide-react'

interface TestCase {
  id: string
  user: string
  roles: string[]
  targetResource: string
  action: string
  expectedResult: 'ALLOW' | 'DENY'
}

interface TestResult {
  passed: boolean
  actualResult: 'ALLOW' | 'DENY'
  reasoning: string
  checkedPermissions: string[]
}

interface PermissionSimulatorProps {
  onTest?: (testCase: TestCase) => Promise<TestResult>
}

export function PermissionSimulator({ onTest }: PermissionSimulatorProps) {
  const [testCases, setTestCases] = useState<TestCase[]>([
    {
      id: '1',
      user: 'admin@company.com',
      roles: ['ADMIN'],
      targetResource: 'users',
      action: 'DELETE',
      expectedResult: 'ALLOW'
    },
    {
      id: '2',
      user: 'viewer@company.com',
      roles: ['VIEWER'],
      targetResource: 'reports',
      action: 'EDIT',
      expectedResult: 'DENY'
    }
  ])
  const [results, setResults] = useState<Map<string, TestResult>>(new Map())
  const [isRunning, setIsRunning] = useState(false)
  const [newTestCase, setNewTestCase] = useState<Partial<TestCase>>({})

  const handleRunTests = async () => {
    setIsRunning(true)
    const newResults = new Map(results)

    for (const testCase of testCases) {
      if (onTest) {
        const result = await onTest(testCase)
        newResults.set(testCase.id, result)
      } else {
        // Simulate test result
        const result = simulateTest(testCase)
        newResults.set(testCase.id, result)
      }
    }

    setResults(newResults)
    setIsRunning(false)
  }

  const handleAddTestCase = () => {
    if (!newTestCase.user || !newTestCase.action) return
    const testCase: TestCase = {
      id: Math.random().toString(36).substr(2, 9),
      user: newTestCase.user!,
      roles: newTestCase.roles || [],
      targetResource: newTestCase.targetResource || 'resource',
      action: newTestCase.action!,
      expectedResult: newTestCase.expectedResult || 'ALLOW'
    }
    setTestCases([...testCases, testCase])
    setNewTestCase({})
  }

  const handleDeleteTestCase = (id: string) => {
    setTestCases(testCases.filter(tc => tc.id !== id))
    results.delete(id)
    setResults(new Map(results))
  }

  const passedCount = Array.from(results.values()).filter(r => r.passed).length
  const totalCount = testCases.length

  return (
    <div className="space-y-6">
      {/* Summary */}
      {results.size > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Test Results Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="text-2xl font-bold">
                {passedCount}/{totalCount} Passed
              </div>
              <div className="flex gap-4">
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-600">{passedCount}</div>
                  <div className="text-sm text-muted-foreground">Passed</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-red-600">{totalCount - passedCount}</div>
                  <div className="text-sm text-muted-foreground">Failed</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Test Cases */}
      <Card>
        <CardHeader>
          <CardTitle>Test Cases</CardTitle>
          <CardDescription>Define access scenarios to test</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Test Case List */}
          <div className="space-y-3">
            {testCases.map((testCase, idx) => {
              const result = results.get(testCase.id)
              const isPass = result?.passed

              return (
                <div
                  key={testCase.id}
                  className={`p-3 border rounded ${
                    result
                      ? isPass
                        ? 'bg-green-50 border-green-200'
                        : 'bg-red-50 border-red-200'
                      : ''
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="font-medium">
                        {testCase.user} ({testCase.roles.join(', ')})
                      </div>
                      <div className="text-sm text-muted-foreground mt-1">
                        Action: <code className="bg-gray-100 px-1 rounded">{testCase.action}</code> on{' '}
                        <code className="bg-gray-100 px-1 rounded">{testCase.targetResource}</code>
                      </div>
                      <div className="text-sm mt-1">
                        Expected: <Badge>{testCase.expectedResult}</Badge>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {result && (
                        <div className="text-right">
                          <Badge variant={isPass ? 'default' : 'destructive'}>
                            {isPass ? 'PASS' : 'FAIL'}
                          </Badge>
                          <p className="text-xs text-muted-foreground mt-1">
                            Result: {result.actualResult}
                          </p>
                        </div>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteTestCase(testCase.id)}
                      >
                        ×
                      </Button>
                    </div>
                  </div>

                  {/* Result Details */}
                  {result && (
                    <div className="mt-3 pt-3 border-t text-sm">
                      <p className="text-muted-foreground mb-2">{result.reasoning}</p>
                      <div className="space-y-1">
                        {result.checkedPermissions.map((perm, idx) => (
                          <div key={idx} className="text-xs font-mono text-gray-600">
                            ✓ {perm}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          {/* New Test Case Input */}
          <div className="border-t pt-4">
            <h4 className="font-medium mb-3">Add New Test Case</h4>
            <div className="grid grid-cols-2 gap-3">
              <Input
                placeholder="User email"
                value={newTestCase.user || ''}
                onChange={(e) => setNewTestCase({ ...newTestCase, user: e.target.value })}
              />
              <Input
                placeholder="Roles (comma-separated)"
                value={newTestCase.roles?.join(',') || ''}
                onChange={(e) =>
                  setNewTestCase({
                    ...newTestCase,
                    roles: e.target.value.split(',').filter(Boolean)
                  })
                }
              />
              <Input
                placeholder="Resource"
                value={newTestCase.targetResource || ''}
                onChange={(e) =>
                  setNewTestCase({ ...newTestCase, targetResource: e.target.value })
                }
              />
              <Input
                placeholder="Action (e.g., READ, WRITE, DELETE)"
                value={newTestCase.action || ''}
                onChange={(e) => setNewTestCase({ ...newTestCase, action: e.target.value })}
              />
              <select
                value={newTestCase.expectedResult || 'ALLOW'}
                onChange={(e) =>
                  setNewTestCase({
                    ...newTestCase,
                    expectedResult: e.target.value as 'ALLOW' | 'DENY'
                  })
                }
                className="border rounded px-3 py-2 text-sm"
              >
                <option value="ALLOW">Expected: ALLOW</option>
                <option value="DENY">Expected: DENY</option>
              </select>
              <Button onClick={handleAddTestCase}>Add Test</Button>
            </div>
          </div>

          {/* Run Tests Button */}
          <div className="pt-4 border-t flex gap-2">
            <Button onClick={handleRunTests} disabled={isRunning || testCases.length === 0}>
              <Play className="w-4 h-4 mr-2" />
              {isRunning ? 'Running Tests...' : 'Run All Tests'}
            </Button>
            {results.size > 0 && (
              <Button variant="outline" onClick={() => setResults(new Map())}>
                <RotateCw className="w-4 h-4 mr-2" />
                Clear Results
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

/**
 * Simulate permission test result
 */
function simulateTest(testCase: TestCase): TestResult {
  const adminActions = ['CREATE', 'READ', 'UPDATE', 'DELETE', 'MANAGE']
  const managerActions = ['CREATE', 'READ', 'UPDATE']
  const userActions = ['READ', 'COMMENT']
  const viewerActions = ['READ']

  const allowedActions: string[] = []
  for (const role of testCase.roles) {
    if (role === 'ADMIN') allowedActions.push(...adminActions)
    if (role === 'MANAGER') allowedActions.push(...managerActions)
    if (role === 'USER') allowedActions.push(...userActions)
    if (role === 'VIEWER') allowedActions.push(...viewerActions)
  }

  const allowed = allowedActions.includes(testCase.action)
  const passed = allowed === (testCase.expectedResult === 'ALLOW')

  return {
    passed,
    actualResult: allowed ? 'ALLOW' : 'DENY',
    reasoning: `User with roles [${testCase.roles.join(', ')}] ${
      allowed ? 'has' : 'does not have'
    } permission to perform ${testCase.action} on ${testCase.targetResource}`,
    checkedPermissions: [
      `${testCase.roles.join('+')}:${testCase.targetResource}:${testCase.action}`
    ]
  }
}
