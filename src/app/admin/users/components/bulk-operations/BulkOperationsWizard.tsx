'use client'

import React, { useState, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { AlertCircle, RotateCcw } from 'lucide-react'
import { SelectUsersStep } from './SelectUsersStep'
import { ChooseOperationStep } from './ChooseOperationStep'
import { ConfigureStep } from './ConfigureStep'
import { ReviewStep } from './ReviewStep'
import { ExecuteStep } from './ExecuteStep'
import { CompletionStep } from './CompletionStep'

export interface BulkOperationResult {
  id: string
  succeeded: number
  failed: number
  warnings: number
  details: string[]
  timestamp: Date
}

export interface WizardState {
  step: 1 | 2 | 3 | 4 | 5 | 6
  selectedUserIds: string[]
  operationType: string
  operationConfig: Record<string, any>
  userFilter: Record<string, any>
  operationId?: string
  dryRunResults?: any
  executionProgress?: any
  executionResult?: BulkOperationResult
}

interface BulkOperationsWizardProps {
  tenantId: string
  onClose: () => void
  onExecute?: (operationId: string, operationConfig: Record<string, any>, userIds: string[]) => Promise<BulkOperationResult>
  onRollback?: (operationId: string) => Promise<void>
  showAdvancedFeatures?: boolean
}

const basicSteps = [
  { number: 1, title: 'Select Users', description: 'Choose users to affect' },
  { number: 2, title: 'Operation Type', description: 'What action to perform' },
  { number: 3, title: 'Configure', description: 'Configure the operation' },
  { number: 4, title: 'Review', description: 'Preview and dry-run' },
  { number: 5, title: 'Execute', description: 'Run the operation' }
]

const advancedSteps = [
  { number: 1, title: 'Select Users', description: 'Choose users to affect' },
  { number: 2, title: 'Operation Type', description: 'What action to perform' },
  { number: 3, title: 'Configure', description: 'Configure the operation' },
  { number: 4, title: 'Review', description: 'Preview and dry-run' },
  { number: 5, title: 'Execute', description: 'Run the operation' },
  { number: 6, title: 'Complete', description: 'View results & rollback' }
]

export const BulkOperationsWizard: React.FC<BulkOperationsWizardProps> = ({
  tenantId,
  onClose,
  onExecute,
  onRollback,
  showAdvancedFeatures = false
}) => {
  const maxStep = showAdvancedFeatures ? 6 : 5
  const steps = showAdvancedFeatures ? advancedSteps : basicSteps

  const [state, setState] = useState<WizardState>({
    step: 1,
    selectedUserIds: [],
    operationType: '',
    operationConfig: {},
    userFilter: {}
  })

  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const goToStep = useCallback((step: number) => {
    if (step >= 1 && step <= maxStep) {
      setState(prev => ({ ...prev, step: step as any }))
      setError(null)
    }
  }, [maxStep])

  const nextStep = useCallback(() => {
    if (state.step < maxStep) {
      goToStep(state.step + 1)
    }
  }, [state.step, goToStep, maxStep])

  const prevStep = useCallback(() => {
    if (state.step > 1) {
      goToStep(state.step - 1)
    }
  }, [state.step, goToStep])

  const updateState = useCallback((updates: Partial<WizardState>) => {
    setState(prev => ({ ...prev, ...updates }))
  }, [])

  const handleExecute = useCallback(async () => {
    if (!onExecute || !state.operationId) {
      return
    }
    setLoading(true)
    try {
      const result = await onExecute(
        state.operationId,
        state.operationConfig,
        state.selectedUserIds
      )
      updateState({ executionResult: result })
      if (showAdvancedFeatures) {
        goToStep(6)
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Execution failed'
      setError(errorMsg)
    } finally {
      setLoading(false)
    }
  }, [onExecute, state.operationId, state.operationConfig, state.selectedUserIds, showAdvancedFeatures, goToStep, updateState])

  const handleRollback = useCallback(async () => {
    if (!onRollback || !state.operationId) {
      return
    }
    setLoading(true)
    try {
      await onRollback(state.operationId)
      setState({
        step: 1,
        selectedUserIds: [],
        operationType: '',
        operationConfig: {},
        userFilter: {}
      })
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Rollback failed'
      setError(errorMsg)
    } finally {
      setLoading(false)
    }
  }, [onRollback, state.operationId])

  const renderStep = () => {
    switch (state.step) {
      case 1:
        return (
          <SelectUsersStep
            tenantId={tenantId}
            filter={state.userFilter}
            onFilterChange={(filter) => updateState({ userFilter: filter })}
            onSelectUsers={(userIds) => updateState({ selectedUserIds: userIds })}
            onNext={nextStep}
          />
        )
      case 2:
        return (
          <ChooseOperationStep
            selected={state.operationType}
            onSelect={(type) => updateState({ operationType: type })}
            onNext={nextStep}
          />
        )
      case 3:
        return (
          <ConfigureStep
            operationType={state.operationType}
            config={state.operationConfig}
            onConfigChange={(config) => updateState({ operationConfig: config })}
            onNext={nextStep}
          />
        )
      case 4:
        return (
          <ReviewStep
            tenantId={tenantId}
            selectedUserIds={state.selectedUserIds}
            operationType={state.operationType}
            operationConfig={state.operationConfig}
            dryRunResults={state.dryRunResults}
            onDryRun={(results) => updateState({ dryRunResults: results })}
            onNext={nextStep}
            onExecuteStart={() => {
              const opId = `op-${Date.now()}`
              updateState({ operationId: opId })
              if (onExecute) {
                handleExecute()
              }
            }}
          />
        )
      case 5:
        return (
          <ExecuteStep
            tenantId={tenantId}
            operationId={state.operationId}
            progress={state.executionProgress}
            onExecute={(id, progress) => {
              updateState({ operationId: id, executionProgress: progress })
              if (showAdvancedFeatures && onExecute && state.executionResult) {
                goToStep(6)
              }
            }}
          />
        )
      case 6:
        if (!showAdvancedFeatures || !state.executionResult) {
          return null
        }
        return (
          <CompletionStep
            result={state.executionResult}
            hasRollback={!!onRollback}
            isRollingBack={loading}
            onRollback={handleRollback}
            onNewOperation={() => {
              setState({
                step: 1,
                selectedUserIds: [],
                operationType: '',
                operationConfig: {},
                userFilter: {}
              })
            }}
          />
        )
      default:
        return null
    }
  }

  return (
    <div className="w-full max-w-4xl mx-auto p-4 space-y-6">
      {/* Progress indicator */}
      <div className="space-y-3">
        <div className="flex justify-between items-center">
          {steps.map((s) => (
            <button
              key={s.number}
              onClick={() => goToStep(s.number as any)}
              disabled={s.number > state.step && state.step < 5}
              className={`flex flex-col items-center gap-1 text-sm transition-all ${
                s.number === state.step
                  ? 'text-blue-600 font-semibold'
                  : s.number < state.step
                  ? 'text-green-600 cursor-pointer'
                  : 'text-gray-400 cursor-not-allowed'
              }`}
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                  s.number === state.step
                    ? 'bg-blue-100 text-blue-600'
                    : s.number < state.step
                    ? 'bg-green-100 text-green-600'
                    : 'bg-gray-100 text-gray-400'
                }`}
              >
                {s.number < state.step ? '✓' : s.number}
              </div>
              <span className="hidden sm:inline text-xs">{s.title}</span>
            </button>
          ))}
        </div>
        {/* Progress bar */}
        <div className="w-full h-1 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-blue-500 transition-all duration-300"
            style={{ width: `${(state.step / 5) * 100}%` }}
          />
        </div>
      </div>

      {/* Error display */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
        </div>
      )}

      {/* Step content */}
      <Card className="p-6 min-h-96">
        {renderStep()}
      </Card>

      {/* Navigation buttons */}
      <div className="flex justify-between items-center gap-4">
        <Button
          variant="outline"
          onClick={prevStep}
          disabled={state.step === 1 || loading}
          className="px-6"
        >
          Back
        </Button>

        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={loading}
            className="px-6"
          >
            {state.step === maxStep ? 'Close' : 'Cancel'}
          </Button>
          {state.step < maxStep && (
            <Button
              onClick={nextStep}
              disabled={loading}
              className="px-6 bg-blue-600 hover:bg-blue-700"
            >
              Next
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
