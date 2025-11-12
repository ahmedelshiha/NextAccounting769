import { BaseStepHandler, WorkflowContext, StepHandlerResult } from './base-handler'
import prisma from '@/lib/prisma'
import { notificationManager } from '../notification-manager.service'

export class SendEmailStepHandler extends BaseStepHandler {
  actionType = 'SEND_EMAIL'
  estimatedDurationSeconds = 3

  protected async executeStep(context: WorkflowContext): Promise<StepHandlerResult> {
    const { config, workflowId } = context

    try {
      const workflow = await prisma.userWorkflow.findUnique({
        where: { id: workflowId },
        include: { user: true }
      })

      if (!workflow) {
        return { success: false, error: 'Workflow not found' }
      }

      const recipientEmail = config?.recipientEmail || workflow.user?.email || ''
      const emailSubject = config?.subject || 'Workflow Notification'
      const emailBody = config?.body || 'Your workflow has been processed'

      if (!recipientEmail) {
        return { success: false, error: 'No recipient email specified' }
      }

      const result = await notificationManager.queueEmail(
        workflowId,
        recipientEmail,
        emailSubject,
        emailBody
      )

      if (!result.success) {
        return { success: false, error: 'Failed to queue email' }
      }

      return {
        success: true,
        message: `Email queued for ${recipientEmail}`,
        data: { notificationId: result.id }
      }
    } catch (err: any) {
      return { success: false, error: err?.message || 'Failed to send email' }
    }
  }
}

export const sendEmailHandler = new SendEmailStepHandler()
