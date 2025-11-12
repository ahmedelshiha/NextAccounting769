import { BaseStepHandler, WorkflowContext, StepHandlerResult } from './base-handler'
import prisma from '@/lib/prisma'

export class AssignRoleStepHandler extends BaseStepHandler {
  actionType = 'ASSIGN_ROLE'
  estimatedDurationSeconds = 4

  protected async executeStep(context: WorkflowContext): Promise<StepHandlerResult> {
    const { config, workflowId } = context

    try {
      const workflow = await prisma.userWorkflow.findUnique({
        where: { id: workflowId },
        include: { user: true }
      })

      if (!workflow || !workflow.user) {
        return { success: false, error: 'User not found' }
      }

      const newRole = config?.role || 'TEAM_MEMBER'
      const validRoles = ['CLIENT', 'TEAM_MEMBER', 'STAFF', 'TEAM_LEAD', 'ADMIN', 'SUPER_ADMIN']

      if (!validRoles.includes(newRole)) {
        return { success: false, error: `Invalid role: ${newRole}` }
      }

      const oldRole = workflow.user.role

      await prisma.user.update({
        where: { id: workflow.user.id },
        data: { role: newRole as any }
      })

      return {
        success: true,
        message: `Role changed from ${oldRole} to ${newRole}`,
        data: { oldRole, newRole }
      }
    } catch (err: any) {
      return { success: false, error: err?.message || 'Failed to assign role' }
    }
  }
}

export const assignRoleHandler = new AssignRoleStepHandler()
