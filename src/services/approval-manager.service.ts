import prisma from '@/lib/prisma'

export interface ApprovalRequest {
  stepId: string
  approverEmails: string[]
  dueDate?: Date
  reason?: string
}

export class ApprovalManagerService {
  async requestApproval(stepId: string, approverEmails: string[]) {
    try {
      const step = await prisma.workflowStep.findUnique({
        where: { id: stepId },
        include: { workflow: true }
      })
      if (!step) return { success: false }

      const notifications = await Promise.all(
        approverEmails.map(email =>
          prisma.workflowNotification.create({
            data: {
              workflowId: step.workflowId,
              emailTo: email,
              emailSubject: `Approval requested: ${step.name}`,
              emailBody: `Please approve step ${step.stepNumber}: ${step.name}`
            }
          })
        )
      )
      return { success: true, notifications: notifications.length }
    } catch {
      return { success: false }
    }
  }

  async approveStep(stepId: string, approverUserId: string, notes?: string) {
    try {
      const step = await prisma.workflowStep.findUnique({
        where: { id: stepId },
        include: { workflow: true }
      })

      if (!step) return { success: false, error: 'Step not found' }

      await prisma.workflowStep.update({
        where: { id: stepId },
        data: {
          approvedAt: new Date(),
          approvedBy: approverUserId,
          status: 'COMPLETED'
        }
      })

      if (step.workflow) {
        await prisma.workflowHistory.create({
          data: {
            workflowId: step.workflowId,
            eventType: 'STEP_APPROVED',
            eventDescription: `Step "${step.name}" approved by ${approverUserId}. ${notes || ''}`,
            changedBy: approverUserId,
            newValue: { stepId, approvedAt: new Date(), approverUserId }
          }
        })
      }

      return { success: true }
    } catch (err: any) {
      return { success: false, error: err?.message }
    }
  }

  async rejectStep(stepId: string, rejectorUserId: string, reason: string) {
    try {
      const step = await prisma.workflowStep.findUnique({
        where: { id: stepId },
        include: { workflow: true }
      })

      if (!step) return { success: false, error: 'Step not found' }

      await prisma.workflowStep.update({
        where: { id: stepId },
        data: {
          status: 'PENDING',
          errorMessage: `Rejected by ${rejectorUserId}: ${reason}`
        }
      })

      if (step.workflow) {
        await prisma.workflowHistory.create({
          data: {
            workflowId: step.workflowId,
            eventType: 'STEP_REJECTED',
            eventDescription: `Step "${step.name}" rejected by ${rejectorUserId}. Reason: ${reason}`,
            changedBy: rejectorUserId,
            newValue: { stepId, rejectedAt: new Date(), rejectorUserId, reason }
          }
        })
      }

      return { success: true }
    } catch (err: any) {
      return { success: false, error: err?.message }
    }
  }

  async getApprovalStatus(stepId: string) {
    try {
      const step = await prisma.workflowStep.findUnique({
        where: { id: stepId }
      })
      if (!step) return { approved: false }
      return {
        approved: !!step.approvedAt,
        approvedBy: step.approvedBy,
        approvedAt: step.approvedAt
      }
    } catch {
      return { approved: false }
    }
  }

  async enforceSLA(workflowId: string, maxHours: number = 48) {
    try {
      const workflow = await prisma.userWorkflow.findUnique({
        where: { id: workflowId },
        include: { steps: true }
      })

      if (!workflow) return { success: false }

      const now = new Date()
      const slaDeadline = new Date(workflow.createdAt.getTime() + maxHours * 60 * 60 * 1000)

      if (now > slaDeadline && workflow.status !== 'COMPLETED' && workflow.status !== 'CANCELLED') {
        await prisma.userWorkflow.update({
          where: { id: workflowId },
          data: {
            errorMessage: `SLA violation: Workflow exceeded ${maxHours}h deadline`,
            status: 'FAILED'
          }
        })
        return { success: true, slaViolated: true, violatedAt: now }
      }

      return { success: true, slaViolated: false }
    } catch (err: any) {
      return { success: false, error: err?.message }
    }
  }
}

export const approvalManager = new ApprovalManagerService()
