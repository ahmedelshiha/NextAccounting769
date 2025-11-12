'use client'

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Progress } from '@/components/ui/progress'

interface ExecuteStepProps {
  tenantId: string
  operationId?: string
  progress?: any
  onExecute: (id: string, progress: any) => void
}

export const ExecuteStep: React.FC<ExecuteStepProps> = ({
  tenantId,
  operationId,
  progress,
  onExecute
}) => {
  const [executing, setExecuting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [currentProgress, setCurrentProgress] = useState(progress)
  const [completed, setCompleted] = useState(false)

  // Poll for progress if executing
  useEffect(() => {
    if (!executing || !operationId) return

    const pollInterval = setInterval(async () => {
      try {
        const response = await fetch(
          `/api/admin/bulk-operations/${operationId}?action=progress`,
          { method: 'GET' }
        )

        if (!response.ok) throw new Error('Failed to fetch progress')

        const prog = await response.json()
        setCurrentProgress(prog)

        if (prog.status === 'COMPLETED' || prog.status === 'FAILED') {
          setExecuting(false)
          setCompleted(true)
        }
      } catch (err) {
        console.error('Progress poll error:', err)
      }
    }, 1000)

    return () => clearInterval(pollInterval)
  }, [executing, operationId])

  const handleExecute = async () => {
    try {
      setExecuting(true)
      setError(null)

      const response = await fetch(`/api/admin/bulk-operations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenantId,
          action: 'execute'
        })
      })

      if (!response.ok) {
        throw new Error('Failed to start execution')
      }

      const data = await response.json()
      onExecute(data.id, data)
    } catch (err) {
      setError((err as Error).message)
      setExecuting(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return 'bg-green-50 border-green-200'
      case 'FAILED':
        return 'bg-red-50 border-red-200'
      case 'IN_PROGRESS':
        return 'bg-blue-50 border-blue-200'
      default:
        return 'bg-gray-50 border-gray-200'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return '✓ Completed'
      case 'FAILED':
        return '✗ Failed'
      case 'IN_PROGRESS':
        return '⏳ In Progress...'
      default:
        return 'Ready'
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-2">Execute Operation</h3>
        <p className="text-gray-600 mb-4">
          Click the button below to start executing the bulk operation
        </p>
      </div>

      {/* Execute button */}
      {!executing && !completed && (
        <Button
          onClick={handleExecute}
          disabled={executing}
          className="w-full bg-green-600 hover:bg-green-700 h-12 text-lg"
        >
          ▶ Start Execution
        </Button>
      )}

      {/* Progress card */}
      {(executing || currentProgress) && (
        <Card className={`p-6 border-2 ${getStatusColor(currentProgress?.status)}`}>
          <div className="space-y-4">
            {/* Status */}
            <div className="flex justify-between items-center">
              <h4 className="font-semibold">Operation Status</h4>
              <Badge
                variant={
                  currentProgress?.status === 'COMPLETED'
                    ? 'default'
                    : currentProgress?.status === 'FAILED'
                    ? 'destructive'
                    : 'secondary'
                }
              >
                {getStatusText(currentProgress?.status)}
              </Badge>
            </div>

            {/* Progress bar */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Progress</span>
                <span className="text-sm text-gray-600">
                  {currentProgress?.progressPercent || 0}%
                </span>
              </div>
              <Progress
                value={currentProgress?.progressPercent || 0}
                className="h-2"
              />
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4 p-3 bg-white rounded border">
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">
                  {currentProgress?.totalUsers || 0}
                </div>
                <div className="text-xs text-gray-600">Total Users</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {currentProgress?.successCount || 0}
                </div>
                <div className="text-xs text-gray-600">Successful</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">
                  {currentProgress?.failureCount || 0}
                </div>
                <div className="text-xs text-gray-600">Failed</div>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Error message */}
      {error && (
        <Alert className="border-red-200 bg-red-50">
          <AlertDescription className="text-red-800">
            <strong>Error:</strong> {error}
          </AlertDescription>
        </Alert>
      )}

      {/* Success message */}
      {completed && currentProgress?.status === 'COMPLETED' && (
        <Alert className="border-green-200 bg-green-50">
          <AlertDescription className="text-green-800">
            <strong>✓ Success!</strong> The bulk operation has been completed successfully.
            {currentProgress?.failureCount > 0 && (
              <span> {currentProgress.failureCount} user(s) encountered errors.</span>
            )}
          </AlertDescription>
        </Alert>
      )}

      {/* Failed message */}
      {completed && currentProgress?.status === 'FAILED' && (
        <Alert className="border-red-200 bg-red-50">
          <AlertDescription className="text-red-800">
            <strong>✗ Operation Failed</strong> - {currentProgress?.failureCount || 0} user(s) failed
          </AlertDescription>
        </Alert>
      )}

      {/* Info message */}
      <Alert className="bg-blue-50 border-blue-200">
        <AlertDescription className="text-blue-800 text-sm">
          <strong>ℹ️ Note:</strong> You can rollback this operation within 30 days from the operations history if needed.
        </AlertDescription>
      </Alert>

      {/* Close button */}
      {completed && (
        <div className="flex justify-end gap-2 pt-4">
          <Button
            variant="outline"
            onClick={() => window.location.reload()}
          >
            Done
          </Button>
        </div>
      )}
    </div>
  )
}
