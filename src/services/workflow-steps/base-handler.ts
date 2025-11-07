import prisma from '@/lib/prisma'

export interface WorkflowContext {
  workflowId: string
  stepId: string
  tenantId: string
  userId: string
  config: Record<string, any>
}

export interface StepHandlerResult {
  success: boolean
  message?: string
  data?: any
  error?: string
}

export abstract class BaseStepHandler {
  abstract actionType: string
  abstract estimatedDurationSeconds: number

  async execute(context: WorkflowContext): Promise<StepHandlerResult> {
    try {
      const step = await prisma.workflowStep.findUnique({ where: { id: context.stepId } })
      if (!step) return { success: false, error: 'Step not found' }

      const result = await this.executeStep(context)
      if (result.success) {
        await prisma.workflowStep.update({
          where: { id: context.stepId },
          data: {
            status: 'COMPLETED',
            completedAt: new Date(),
            durationMs: Math.round((Date.now() - (step.startedAt?.getTime() || Date.now())) / 1000) * 1000
          }
        })
      } else {
        await prisma.workflowStep.update({
          where: { id: context.stepId },
          data: {
            status: 'FAILED',
            errorMessage: result.error || 'Unknown error'
          }
        })
      }
      return result
    } catch (err: any) {
      return { success: false, error: err?.message || 'Execution failed' }
    }
  }

  protected abstract executeStep(context: WorkflowContext): Promise<StepHandlerResult>

  validate(config: Record<string, any>): boolean {
    return true
  }

  async rollback(context: WorkflowContext): Promise<StepHandlerResult> {
    return { success: true, message: 'No rollback needed' }
  }

  estimate(): number {
    return this.estimatedDurationSeconds
  }
}
