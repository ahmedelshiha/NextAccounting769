'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'

interface ReviewStepProps {
  tenantId: string
  selectedUserIds: string[]
  operationType: string
  operationConfig: Record<string, any>
  dryRunResults?: any
  onDryRun: (results: any) => void
  onNext: () => void
  onExecuteStart?: () => void | Promise<void>
}

export const ReviewStep: React.FC<ReviewStepProps> = ({
  tenantId,
  selectedUserIds,
  operationType,
  operationConfig,
  dryRunResults,
  onDryRun,
  onNext,
  onExecuteStart
}) => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const runDryRun = async () => {
    try {
      setLoading(true)
      setError(null)

      // Call dry-run API
      const response = await fetch(
        `/api/admin/bulk-operations/preview`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            tenantId,
            selectedUserIds,
            operationType,
            operationConfig
          })
        }
      )

      if (!response.ok) {
        throw new Error('Dry-run failed')
      }

      const results = await response.json()
      onDryRun(results)
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setLoading(false)
    }
  }

  const getOperationSummary = () => {
    switch (operationType) {
      case 'ROLE_CHANGE':
        return `Change role from ${operationConfig.fromRole} to ${operationConfig.toRole}`
      case 'STATUS_UPDATE':
        return `Update status to ${operationConfig.toStatus}`
      case 'PERMISSION_GRANT':
        return `Grant ${operationConfig.permissions?.length || 0} permissions`
      case 'PERMISSION_REVOKE':
        return `Revoke ${operationConfig.permissions?.length || 0} permissions`
      case 'SEND_EMAIL':
        return `Send email using template: ${operationConfig.emailTemplate}`
      default:
        return 'Unknown operation'
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-2">Review & Preview</h3>
        <p className="text-gray-600 mb-4">
          Review the operation details and run a dry-run preview to see the impact
        </p>
      </div>

      {/* Operation Summary */}
      <Card className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200">
        <h4 className="font-semibold text-sm mb-3">Operation Summary</h4>
        <div className="space-y-2">
          <div className="flex justify-between items-start">
            <span className="text-sm text-gray-700">Operation:</span>
            <span className="font-medium">{getOperationSummary()}</span>
          </div>
          <div className="flex justify-between items-start">
            <span className="text-sm text-gray-700">Users Affected:</span>
            <Badge variant="secondary">{selectedUserIds.length}</Badge>
          </div>
          <div className="flex justify-between items-start">
            <span className="text-sm text-gray-700">Estimated Duration:</span>
            <span className="text-sm">
              {Math.ceil((selectedUserIds.length * 50) / 1000)}s
            </span>
          </div>
        </div>
      </Card>

      {/* Warnings */}
      {operationType === 'ROLE_CHANGE' && (
        <Alert className="border-amber-200 bg-amber-50">
          <AlertDescription className="text-amber-800 text-sm">
            <strong>⚠️ Important:</strong> Changing user roles may affect their permissions and access to features. This action can be reviewed in the audit log.
          </AlertDescription>
        </Alert>
      )}

      {/* Dry-run button */}
      <div className="space-y-4">
        <div>
          <Button
            onClick={runDryRun}
            disabled={loading || !!dryRunResults}
            variant="outline"
            className="w-full"
          >
            {loading ? (
              <>
                <span className="inline-block animate-spin mr-2">⏳</span>
                Running Dry-Run Preview...
              </>
            ) : dryRunResults ? (
              '✓ Dry-Run Completed'
            ) : (
              'Run Dry-Run Preview'
            )}
          </Button>
        </div>

        {error && (
          <Alert className="border-red-200 bg-red-50">
            <AlertDescription className="text-red-800 text-sm">
              {error}
            </AlertDescription>
          </Alert>
        )}
      </div>

      {/* Dry-run results */}
      {dryRunResults && (
        <div className="space-y-4">
          <h4 className="font-semibold text-sm">Dry-Run Analysis & Impact</h4>

          {/* Risk Level */}
          <Card className={`p-4 border-2 ${
            dryRunResults.riskLevel === 'critical' ? 'border-red-200 bg-red-50' :
            dryRunResults.riskLevel === 'high' ? 'border-amber-200 bg-amber-50' :
            dryRunResults.riskLevel === 'medium' ? 'border-yellow-200 bg-yellow-50' :
            'border-green-200 bg-green-50'
          }`}>
            <div className="flex items-start gap-3">
              <div className="text-2xl">
                {dryRunResults.riskLevel === 'critical' ? '🚨' :
                 dryRunResults.riskLevel === 'high' ? '⚠️' :
                 dryRunResults.riskLevel === 'medium' ? 'ℹ️' :
                 '✓'}
              </div>
              <div className="flex-1">
                <div className="font-semibold text-sm mb-1">
                  Risk Level: <Badge>{dryRunResults.riskLevel?.toUpperCase()}</Badge>
                </div>
                <p className="text-sm text-gray-700">
                  {dryRunResults.overallRiskMessage}
                </p>
              </div>
            </div>
          </Card>

          {/* Can Proceed Status */}
          {!dryRunResults.canProceed && (
            <Alert className="border-red-200 bg-red-50">
              <AlertDescription className="text-red-800 text-sm">
                <strong>🚫 Cannot Proceed:</strong> This operation has critical issues that must be resolved before execution.
              </AlertDescription>
            </Alert>
          )}

          {/* Conflicts */}
          {dryRunResults.conflicts && dryRunResults.conflicts.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-medium">Detected Issues ({dryRunResults.conflictCount}):</p>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {dryRunResults.conflicts.map((conflict: any, idx: number) => (
                  <div
                    key={idx}
                    className={`p-3 rounded border text-xs ${
                      conflict.severity === 'critical' ? 'bg-red-50 border-red-200' :
                      conflict.severity === 'high' ? 'bg-amber-50 border-amber-200' :
                      conflict.severity === 'medium' ? 'bg-yellow-50 border-yellow-200' :
                      'bg-blue-50 border-blue-200'
                    }`}
                  >
                    <div className="font-semibold mb-1">
                      {conflict.type.replace(/-/g, ' ').toUpperCase()}
                    </div>
                    <div className="text-gray-700">{conflict.message}</div>
                    {conflict.requiresApproval && (
                      <Badge className="mt-2 bg-orange-100 text-orange-800">Approval Required</Badge>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Impact Analysis */}
          {dryRunResults.impactAnalysis && (
            <Card className="p-4 bg-gray-50 border-gray-200">
              <h5 className="font-semibold text-sm mb-3">Impact Analysis</h5>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xs text-gray-600">Directly Affected</p>
                  <p className="text-lg font-bold text-gray-900">
                    {dryRunResults.impactAnalysis.directlyAffectedCount}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-600">Potentially Affected</p>
                  <p className="text-lg font-bold text-gray-900">
                    {dryRunResults.impactAnalysis.potentiallyAffectedCount}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-600">Est. Duration</p>
                  <p className="text-lg font-bold text-gray-900">
                    {Math.ceil(dryRunResults.estimatedDuration / 1000)}s
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-600">API Calls</p>
                  <p className="text-lg font-bold text-gray-900">
                    {dryRunResults.impactAnalysis.estimatedNetworkCalls}
                  </p>
                </div>
              </div>
              {dryRunResults.impactAnalysis.rollbackImpact && (
                <div className="mt-3 pt-3 border-t border-gray-200">
                  <p className="text-xs font-medium mb-1">Rollback Capability:</p>
                  <p className="text-xs text-gray-700">
                    {dryRunResults.impactAnalysis.rollbackImpact.canRollback
                      ? `✓ Can rollback (${Math.ceil(dryRunResults.impactAnalysis.rollbackImpact.rollbackTime / 1000)}s)`
                      : '✗ Cannot rollback'}
                  </p>
                </div>
              )}
            </Card>
          )}

          {/* Sample changes */}
          {dryRunResults.preview && dryRunResults.preview.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-medium">Sample Impact (first {dryRunResults.preview.length} users):</p>
              <div className="max-h-48 overflow-y-auto space-y-2">
                {dryRunResults.preview.map((preview: any, idx: number) => (
                  <div
                    key={idx}
                    className={`p-3 rounded border text-xs ${
                      preview.conflicts?.length ? 'bg-red-50 border-red-200' :
                      preview.riskLevel === 'high' ? 'bg-amber-50 border-amber-200' :
                      'bg-gray-50 border-gray-200'
                    }`}
                  >
                    <div className="font-medium text-gray-900 flex justify-between items-start">
                      <span>{preview.userName}</span>
                      {preview.conflicts?.length > 0 && (
                        <Badge className="bg-red-100 text-red-800">⚠️ Issues</Badge>
                      )}
                    </div>
                    <div className="text-gray-600 mt-1">
                      {Object.entries(preview.changes).map(([key, value]: any) => (
                        <div key={key} className="ml-2">
                          <strong>{key}:</strong>{' '}
                          {typeof value === 'object'
                            ? JSON.stringify(value)
                            : String(value)}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Information */}
      <Alert className="bg-blue-50 border-blue-200">
        <AlertDescription className="text-blue-800 text-sm">
          <strong>ℹ️ Note:</strong> After reviewing the preview, you can proceed to execute this operation. You&apos;ll have the ability to rollback within 30 days if needed.
        </AlertDescription>
      </Alert>

      {/* Button */}
      <div className="flex justify-end gap-2">
        <Button
          onClick={async () => {
            if (onExecuteStart) {
              await onExecuteStart()
            }
            onNext()
          }}
          disabled={!dryRunResults}
          className="bg-blue-600 hover:bg-blue-700"
        >
          Next: Execute
        </Button>
      </div>
    </div>
  )
}
