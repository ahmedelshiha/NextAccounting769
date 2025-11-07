import prisma from '@/lib/prisma'

export interface EmailTemplate {
  subject: string
  body: string
}

export class NotificationManagerService {
  private emailTemplates: Record<string, (context: any) => EmailTemplate> = {
    'workflow-started': (context) => ({
      subject: `Workflow Started: ${context.workflowType}`,
      body: `
        <h2>Workflow Started</h2>
        <p>A new ${context.workflowType} workflow has been started for ${context.userName}.</p>
        <p><strong>Workflow ID:</strong> ${context.workflowId}</p>
        <p><strong>Started At:</strong> ${context.startedAt}</p>
        <p><strong>Estimated Duration:</strong> ${context.estimatedDuration} minutes</p>
      `
    }),
    'step-completed': (context) => ({
      subject: `Step Completed: ${context.stepName}`,
      body: `
        <h2>Step Completed</h2>
        <p>Step "${context.stepName}" in workflow ${context.workflowType} has been completed.</p>
        <p><strong>Step ${context.stepNumber} of ${context.totalSteps}</strong></p>
        <p><strong>Completed At:</strong> ${context.completedAt}</p>
        <p><strong>Progress:</strong> ${context.progressPercent}%</p>
      `
    }),
    'approval-requested': (context) => ({
      subject: `Approval Requested: ${context.stepName}`,
      body: `
        <h2>Approval Requested</h2>
        <p>Your approval is requested for the following step:</p>
        <p><strong>Step:</strong> ${context.stepName}</p>
        <p><strong>Workflow:</strong> ${context.workflowType} for ${context.userName}</p>
        <p><strong>Description:</strong> ${context.stepDescription || 'N/A'}</p>
        <p><strong>Due Date:</strong> ${context.dueDate || 'N/A'}</p>
        <p>Please log in to review and approve.</p>
      `
    }),
    'workflow-completed': (context) => ({
      subject: `Workflow Completed: ${context.workflowType}`,
      body: `
        <h2>Workflow Completed</h2>
        <p>The ${context.workflowType} workflow for ${context.userName} has been completed successfully.</p>
        <p><strong>Workflow ID:</strong> ${context.workflowId}</p>
        <p><strong>Completed At:</strong> ${context.completedAt}</p>
        <p><strong>Total Steps:</strong> ${context.totalSteps}</p>
        <p><strong>Duration:</strong> ${context.duration} minutes</p>
      `
    }),
    'workflow-failed': (context) => ({
      subject: `Workflow Failed: ${context.workflowType}`,
      body: `
        <h2>Workflow Failed</h2>
        <p>The ${context.workflowType} workflow for ${context.userName} has encountered an error.</p>
        <p><strong>Workflow ID:</strong> ${context.workflowId}</p>
        <p><strong>Failed At:</strong> ${context.failedAt}</p>
        <p><strong>Error:</strong> ${context.errorMessage}</p>
        <p><strong>Last Completed Step:</strong> ${context.lastCompletedStep}</p>
        <p>An administrator has been notified and will investigate.</p>
      `
    }),
    'workflow-reminder': (context) => ({
      subject: `Workflow Reminder: Action Required`,
      body: `
        <h2>Workflow Reminder</h2>
        <p>This is a reminder about a pending workflow.</p>
        <p><strong>Workflow:</strong> ${context.workflowType} for ${context.userName}</p>
        <p><strong>Current Step:</strong> ${context.currentStep}</p>
        <p><strong>Due Date:</strong> ${context.dueDate}</p>
        <p>Please take action to move this workflow forward.</p>
      `
    })
  }

  async queueEmail(workflowId: string, to: string, subject: string, body: string) {
    try {
      const n = await prisma.workflowNotification.create({
        data: {
          workflowId,
          emailTo: to,
          emailSubject: subject,
          emailBody: body,
          status: 'PENDING'
        }
      })
      return { success: true, id: n.id }
    } catch {
      return { success: false }
    }
  }

  async sendTemplatedEmail(workflowId: string, to: string, templateName: string, context: any) {
    try {
      const template = this.emailTemplates[templateName]
      if (!template) {
        return { success: false, error: `Template not found: ${templateName}` }
      }

      const { subject, body } = template(context)
      return this.queueEmail(workflowId, to, subject, body)
    } catch (err: any) {
      return { success: false, error: err?.message }
    }
  }

  async markSent(notificationId: string) {
    try {
      await prisma.workflowNotification.update({
        where: { id: notificationId },
        data: { status: 'SENT', sentAt: new Date() }
      })
      return { success: true }
    } catch {
      return { success: false }
    }
  }

  async markFailed(notificationId: string, errorMessage: string) {
    try {
      await prisma.workflowNotification.update({
        where: { id: notificationId },
        data: { status: 'FAILED', errorMessage }
      })
      return { success: true }
    } catch {
      return { success: false }
    }
  }

  async getPendingNotifications(limit: number = 100) {
    try {
      return await prisma.workflowNotification.findMany({
        where: { status: 'PENDING' },
        take: limit,
        orderBy: { createdAt: 'asc' }
      })
    } catch {
      return []
    }
  }

  getTemplateNames(): string[] {
    return Object.keys(this.emailTemplates)
  }
}

export const notificationManager = new NotificationManagerService()
