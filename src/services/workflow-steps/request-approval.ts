import { BaseStepHandler, WorkflowContext, StepHandlerResult } from './base-handler'
import prisma from '@/lib/prisma'
import { approvalManager } from '../approval-manager.service'

export class RequestApprovalStepHandler extends BaseStepHandler {
  actionType = 'REQUEST_APPROVAL'
  estimatedDurationSeconds = 3

  protected async executeStep(context: WorkflowContext): Promise<StepHandlerResult> {
    const { config, stepId } = context

    try {
      const step = await prisma.workflowStep.findUnique({
        where: { id: stepId }
      })

      if (!step) {
        return { success: false, error: 'Step not found' }
      }

      const approverEmails = config?.approverEmails || []

      if (approverEmails.length === 0) {
        return { success: false, error: 'No approvers specified' }
      }

      await prisma.workflowStep.update({
        where: { id: stepId },
        data: { status: 'IN_PROGRESS' }
      })

      const result = await approvalManager.requestApproval(stepId, approverEmails)

      if (!result.success) {
        return { success: false, error: 'Failed to send approval requests' }
      }

      return {
        success: true,
        message: `Approval requested from ${approverEmails.length} approver(s)`,
        data: {
          stepId,
          approvers: approverEmails,
          notificationsCount: result.notifications
        }
      }
    } catch (err: any) {
      return { success: false, error: err?.message || 'Failed to request approval' }
    }
  }
}

export const requestApprovalHandler = new RequestApprovalStepHandler()
