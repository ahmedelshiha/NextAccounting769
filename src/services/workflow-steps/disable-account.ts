import { BaseStepHandler, WorkflowContext, StepHandlerResult } from './base-handler'
import prisma from '@/lib/prisma'

export class DisableAccountStepHandler extends BaseStepHandler {
  actionType = 'DISABLE_ACCOUNT'
  estimatedDurationSeconds = 5

  protected async executeStep(context: WorkflowContext): Promise<StepHandlerResult> {
    const { workflowId } = context

    try {
      const workflow = await prisma.userWorkflow.findUnique({
        where: { id: workflowId },
        include: { user: true }
      })

      if (!workflow || !workflow.user) {
        return { success: false, error: 'User not found' }
      }

      const disableDate = new Date()

      const profile = await prisma.userProfile.findUnique({
        where: { userId: workflow.user.id }
      })

      if (profile) {
        await prisma.userProfile.update({
          where: { userId: workflow.user.id },
          data: { lockoutUntil: new Date('2099-12-31') }
        })
      }

      return {
        success: true,
        message: `Account disabled for ${workflow.user.email}`,
        data: { userId: workflow.user.id, email: workflow.user.email, disabledAt: disableDate }
      }
    } catch (err: any) {
      return { success: false, error: err?.message || 'Failed to disable account' }
    }
  }
}

export const disableAccountHandler = new DisableAccountStepHandler()
