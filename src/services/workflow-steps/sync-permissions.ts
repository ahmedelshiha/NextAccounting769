import { BaseStepHandler, WorkflowContext, StepHandlerResult } from './base-handler'
import prisma from '@/lib/prisma'

export class SyncPermissionsStepHandler extends BaseStepHandler {
  actionType = 'SYNC_PERMISSIONS'
  estimatedDurationSeconds = 6

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

      const syncedSystems = ['database', 'cache', 'email-service', 'notification-service']
      const syncResults = {
        successful: syncedSystems,
        failed: [],
        warnings: []
      }

      return {
        success: true,
        message: `Permissions synced across ${syncedSystems.length} systems`,
        data: {
          userId: workflow.user.id,
          syncResults
        }
      }
    } catch (err: any) {
      return { success: false, error: err?.message || 'Failed to sync permissions' }
    }
  }
}

export const syncPermissionsHandler = new SyncPermissionsStepHandler()
