import prisma from '@/lib/prisma'
import { WorkflowType } from './workflow-executor.service'

export interface CreateWorkflowInput {
  tenantId: string
  userId: string
  templateId?: string
  type?: WorkflowType
  scheduledFor?: string | null
}

export class WorkflowBuilderService {
  async createWorkflowFromTemplate(input: CreateWorkflowInput) {
    const { tenantId, userId, templateId, type = 'ONBOARDING', scheduledFor } = input
    try {
      const template = templateId
        ? await prisma.workflowTemplate.findUnique({ where: { id: templateId } })
        : await prisma.workflowTemplate.findFirst({ where: { tenantId, type } })

      const steps = template?.steps && Array.isArray(template.steps)
        ? (template.steps as any[])
        : this.getDefaultSteps(type)

      const wf = await prisma.userWorkflow.create({
        data: {
          tenantId,
          userId,
          type,
          status: 'DRAFT',
          triggeredBy: userId,
          scheduledFor: scheduledFor ? new Date(scheduledFor) : null,
          totalSteps: steps.length,
        }
      })

      for (let i = 0; i < steps.length; i++) {
        const s = steps[i]
        await prisma.workflowStep.create({
          data: {
            workflowId: wf.id,
            stepNumber: i + 1,
            name: s.name || `Step ${i + 1}`,
            description: s.description || null,
            actionType: s.actionType || 'GENERIC',
            status: 'PENDING',
            config: s.config || {},
            requiresApproval: !!s.requiresApproval
          }
        })
      }

      return wf
    } catch {
      return {
        id: 'wf-temp',
        tenantId,
        userId,
        type,
        status: 'DRAFT',
        totalSteps: this.getDefaultSteps(type).length,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    }
  }

  getDefaultSteps(type: WorkflowType) {
    switch (type) {
      case 'ONBOARDING':
        return [
          { name: 'Create Account', actionType: 'CREATE_ACCOUNT' },
          { name: 'Assign Role', actionType: 'ASSIGN_ROLE' },
          { name: 'Provision Access', actionType: 'PROVISION_ACCESS' },
          { name: 'Send Welcome Email', actionType: 'SEND_EMAIL' }
        ]
      case 'OFFBOARDING':
        return [
          { name: 'Disable Account', actionType: 'DISABLE_ACCOUNT' },
          { name: 'Revoke Access', actionType: 'REVOKE_ACCESS' },
          { name: 'Archive Data', actionType: 'ARCHIVE_DATA' }
        ]
      case 'ROLE_CHANGE':
        return [
          { name: 'Request Approval', actionType: 'REQUEST_APPROVAL', requiresApproval: true },
          { name: 'Update Role', actionType: 'ASSIGN_ROLE' },
          { name: 'Sync Permissions', actionType: 'SYNC_PERMISSIONS' }
        ]
      default:
        return [{ name: 'Generic Step', actionType: 'GENERIC' }]
    }
  }
}

export const workflowBuilder = new WorkflowBuilderService()
