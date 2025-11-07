'use client'

import React from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { CheckCircle, AlertTriangle, RotateCcw, RefreshCw } from 'lucide-react'
import { BulkOperationResult } from './BulkOperationsWizard'

interface CompletionStepProps {
  result: BulkOperationResult
  hasRollback: boolean
  isRollingBack: boolean
  onRollback: () => Promise<void>
  onNewOperation: () => void
}

export const CompletionStep: React.FC<CompletionStepProps> = ({
  result,
  hasRollback,
  isRollingBack,
  onRollback,
  onNewOperation
}) => {
  const successRate = result.succeeded / (result.succeeded + result.failed) * 100

  return (
    <div className="space-y-6">
      {/* Status header */}
      <div className="flex items-center gap-3">
        {result.failed === 0 ? (
          <div className="flex items-center gap-2 text-green-600">
            <CheckCircle className="w-6 h-6" />
            <span className="font-semibold text-lg">Operation Completed Successfully</span>
          </div>
        ) : (
          <div className="flex items-center gap-2 text-yellow-600">
            <AlertTriangle className="w-6 h-6" />
            <span className="font-semibold text-lg">Operation Completed with Issues</span>
          </div>
        )}
      </div>

      {/* Results summary */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6 text-center">
            <div className="text-3xl font-bold text-green-600">{result.succeeded}</div>
            <div className="text-sm text-gray-600 mt-2">Succeeded</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6 text-center">
            <div className="text-3xl font-bold text-red-600">{result.failed}</div>
            <div className="text-sm text-gray-600 mt-2">Failed</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6 text-center">
            <div className="text-3xl font-bold text-yellow-600">{result.warnings}</div>
            <div className="text-sm text-gray-600 mt-2">Warnings</div>
          </CardContent>
        </Card>
      </div>

      {/* Success rate */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Success Rate</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">{successRate.toFixed(1)}%</span>
            <Badge variant={result.failed === 0 ? 'default' : 'secondary'}>
              {result.succeeded} of {result.succeeded + result.failed} users
            </Badge>
          </div>
          <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-green-500 transition-all duration-300"
              style={{ width: `${successRate}%` }}
            />
          </div>
        </CardContent>
      </Card>

      {/* Details */}
      {result.details.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Operation Details</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {result.details.map((detail, idx) => (
                <li key={idx} className="text-sm text-gray-700">
                  {detail}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Rollback alert */}
      {hasRollback && result.failed === 0 && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Rollback Available</AlertTitle>
          <AlertDescription>
            You can rollback this operation to restore users to their previous state. This action cannot be undone.
          </AlertDescription>
        </Alert>
      )}

      {/* Action buttons */}
      <div className="flex justify-end gap-3">
        {hasRollback && result.failed === 0 && (
          <Button
            variant="outline"
            className="text-red-600 border-red-200 hover:bg-red-50"
            onClick={onRollback}
            disabled={isRollingBack}
          >
            {isRollingBack ? (
              <>
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                Rolling Back...
              </>
            ) : (
              <>
                <RotateCcw className="w-4 h-4 mr-2" />
                Rollback Operation
              </>
            )}
          </Button>
        )}

        <Button
          onClick={onNewOperation}
          className="bg-blue-600 hover:bg-blue-700"
        >
          New Operation
        </Button>
      </div>

      {/* Operation ID */}
      <div className="text-xs text-gray-500">
        Operation ID: {result.id}
      </div>
    </div>
  )
}
