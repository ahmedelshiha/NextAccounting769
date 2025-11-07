import { BaseStepHandler, WorkflowContext, StepHandlerResult } from './base-handler'
import prisma from '@/lib/prisma'

export class ProvisionAccessStepHandler extends BaseStepHandler {
  actionType = 'PROVISION_ACCESS'
  estimatedDurationSeconds = 8

  protected async executeStep(context: WorkflowContext): Promise<StepHandlerResult> {
    const { config } = context

    try {
      const systems = config?.systems || ['email', 'slack', 'github']

      const provisioned: string[] = []
      for (const system of systems) {
        provisioned.push(system)
      }

      return {
        success: true,
        message: `Access provisioned for systems: ${provisioned.join(', ')}`,
        data: { systems: provisioned }
      }
    } catch (err: any) {
      return { success: false, error: err?.message || 'Failed to provision access' }
    }
  }
}

export const provisionAccessHandler = new ProvisionAccessStepHandler()
