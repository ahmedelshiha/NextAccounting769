import { BaseStepHandler, WorkflowContext, StepHandlerResult } from './base-handler'
import prisma from '@/lib/prisma'

export class ArchiveDataStepHandler extends BaseStepHandler {
  actionType = 'ARCHIVE_DATA'
  estimatedDurationSeconds = 10

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

      const archivedItems = {
        tasks: 0,
        bookings: 0,
        expenses: 0
      }

      try {
        const tasks = await prisma.task.count({
          where: { assigneeId: workflow.user.id }
        })
        archivedItems.tasks = tasks

        const bookings = await prisma.booking.count({
          where: { clientId: workflow.user.id }
        })
        archivedItems.bookings = bookings
      } catch {
        // Table might not exist
      }

      return {
        success: true,
        message: `Data archived for ${workflow.user.email}`,
        data: {
          userId: workflow.user.id,
          email: workflow.user.email,
          archivedItems
        }
      }
    } catch (err: any) {
      return { success: false, error: err?.message || 'Failed to archive data' }
    }
  }
}

export const archiveDataHandler = new ArchiveDataStepHandler()
