export { BaseStepHandler, type WorkflowContext, type StepHandlerResult } from './base-handler'
export { CreateAccountStepHandler } from './create-account'
export { ProvisionAccessStepHandler } from './provision-access'
export { SendEmailStepHandler } from './send-email'
export { AssignRoleStepHandler } from './assign-role'
export { DisableAccountStepHandler } from './disable-account'
export { ArchiveDataStepHandler } from './archive-data'
export { RequestApprovalStepHandler } from './request-approval'
export { SyncPermissionsStepHandler } from './sync-permissions'

import { createAccountHandler } from './create-account'
import { provisionAccessHandler } from './provision-access'
import { sendEmailHandler } from './send-email'
import { assignRoleHandler } from './assign-role'
import { disableAccountHandler } from './disable-account'
import { archiveDataHandler } from './archive-data'
import { requestApprovalHandler } from './request-approval'
import { syncPermissionsHandler } from './sync-permissions'

export const stepHandlersMap: Record<string, any> = {
  CREATE_ACCOUNT: createAccountHandler,
  PROVISION_ACCESS: provisionAccessHandler,
  SEND_EMAIL: sendEmailHandler,
  ASSIGN_ROLE: assignRoleHandler,
  DISABLE_ACCOUNT: disableAccountHandler,
  ARCHIVE_DATA: archiveDataHandler,
  REQUEST_APPROVAL: requestApprovalHandler,
  SYNC_PERMISSIONS: syncPermissionsHandler
}

export {
  createAccountHandler,
  provisionAccessHandler,
  sendEmailHandler,
  assignRoleHandler,
  disableAccountHandler,
  archiveDataHandler,
  requestApprovalHandler,
  syncPermissionsHandler
}

export function getStepHandler(actionType: string) {
  return stepHandlersMap[actionType] || null
}
