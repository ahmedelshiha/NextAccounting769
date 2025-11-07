import { BaseStepHandler, WorkflowContext, StepHandlerResult } from './base-handler'
import prisma from '@/lib/prisma'

export class CreateAccountStepHandler extends BaseStepHandler {
  actionType = 'CREATE_ACCOUNT'
  estimatedDurationSeconds = 5

  protected async executeStep(context: WorkflowContext): Promise<StepHandlerResult> {
    const { config, userId } = context

    try {
      const workflow = await prisma.userWorkflow.findUnique({
        where: { id: context.workflowId },
        include: { user: true }
      })

      if (!workflow || !workflow.user) {
        return { success: false, error: 'User not found' }
      }

      const user = workflow.user

      if (!user.emailVerified) {
        await prisma.user.update({
          where: { id: user.id },
          data: { emailVerified: new Date() }
        })
      }

      return {
        success: true,
        message: `Account created for ${user.email}`,
        data: { userId: user.id, email: user.email }
      }
    } catch (err: any) {
      return { success: false, error: err?.message || 'Failed to create account' }
    }
  }
}

export const createAccountHandler = new CreateAccountStepHandler()
