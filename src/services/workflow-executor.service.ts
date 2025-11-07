import prisma from '@/lib/prisma'

export type WorkflowStatus = 'DRAFT' | 'PENDING' | 'IN_PROGRESS' | 'PAUSED' | 'COMPLETED' | 'FAILED' | 'CANCELLED'
export type StepStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED' | 'SKIPPED'
export type WorkflowType = 'ONBOARDING' | 'OFFBOARDING' | 'ROLE_CHANGE'

export interface WorkflowProgress {
  workflowId: string
  status: WorkflowStatus
  progressPercent: number
  totalSteps: number
  completedSteps: number
}

export class WorkflowExecutorService {
  async executeWorkflow(workflowId: string): Promise<WorkflowProgress> {
    try {
      const wf = await prisma.userWorkflow.update({
        where: { id: workflowId },
        data: { status: 'IN_PROGRESS', startedAt: new Date() }
      })
      const steps = await prisma.workflowStep.findMany({ where: { workflowId }, orderBy: { stepNumber: 'asc' } })
      let completed = 0
      for (const step of steps) {
        await prisma.workflowStep.update({ where: { id: step.id }, data: { status: 'IN_PROGRESS', startedAt: new Date() } })
        // Simulate execution; real handlers implemented in step modules (Phase 4c+)
        await prisma.workflowStep.update({ where: { id: step.id }, data: { status: 'COMPLETED', completedAt: new Date() } })
        completed++
        const progress = Math.round((completed / steps.length) * 100)
        await prisma.userWorkflow.update({ where: { id: workflowId }, data: { completedSteps: completed, progressPercent: progress } })
      }
      const finalWf = await prisma.userWorkflow.update({
        where: { id: workflowId },
        data: { status: 'COMPLETED', completedAt: new Date() }
      })
      return {
        workflowId,
        status: finalWf.status as WorkflowStatus,
        progressPercent: finalWf.progressPercent,
        totalSteps: finalWf.totalSteps,
        completedSteps: finalWf.completedSteps
      }
    } catch (err) {
      // Fallback when table not present or other DB errors
      return { workflowId, status: 'FAILED', progressPercent: 0, totalSteps: 0, completedSteps: 0 }
    }
  }

  async executeStep(stepId: string): Promise<StepStatus> {
    try {
      await prisma.workflowStep.update({ where: { id: stepId }, data: { status: 'IN_PROGRESS', startedAt: new Date() } })
      await prisma.workflowStep.update({ where: { id: stepId }, data: { status: 'COMPLETED', completedAt: new Date() } })
      return 'COMPLETED'
    } catch {
      return 'FAILED'
    }
  }

  async approveStep(stepId: string, approverUserId: string): Promise<StepStatus> {
    try {
      const step = await prisma.workflowStep.update({
        where: { id: stepId },
        data: { approvedAt: new Date(), approvedBy: approverUserId }
      })
      return step.status as StepStatus
    } catch {
      return 'FAILED'
    }
  }

  async pauseWorkflow(workflowId: string): Promise<WorkflowStatus> {
    try {
      const wf = await prisma.userWorkflow.update({ where: { id: workflowId }, data: { status: 'PAUSED' } })
      return wf.status as WorkflowStatus
    } catch {
      return 'FAILED'
    }
  }

  async resumeWorkflow(workflowId: string): Promise<WorkflowStatus> {
    try {
      const wf = await prisma.userWorkflow.update({ where: { id: workflowId }, data: { status: 'IN_PROGRESS' } })
      return wf.status as WorkflowStatus
    } catch {
      return 'FAILED'
    }
  }

  async cancelWorkflow(workflowId: string): Promise<WorkflowStatus> {
    try {
      const wf = await prisma.userWorkflow.update({ where: { id: workflowId }, data: { status: 'CANCELLED' } })
      return wf.status as WorkflowStatus
    } catch {
      return 'FAILED'
    }
  }

  async getWorkflowProgress(workflowId: string): Promise<WorkflowProgress | null> {
    try {
      const wf = await prisma.userWorkflow.findUnique({ where: { id: workflowId } })
      if (!wf) return null
      return {
        workflowId,
        status: wf.status as WorkflowStatus,
        progressPercent: wf.progressPercent,
        totalSteps: wf.totalSteps,
        completedSteps: wf.completedSteps
      }
    } catch {
      return null
    }
  }
}

export const workflowExecutor = new WorkflowExecutorService()
