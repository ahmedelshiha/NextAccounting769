/**
 * Shared Validation Schemas - Central Hub
 * Re-exports all Zod schemas for entity validation
 * Used in API routes and client-side forms
 */

// Service schemas and types
export {
  ServiceBaseSchema,
  ServiceCreateSchema,
  ServiceUpdateSchema,
  ServiceFiltersSchema,
  ServiceBulkActionSchema,
  validateServiceCreate,
  safeParseServiceCreate,
  type ServiceCreate,
  type ServiceUpdate,
  type ServiceFilters,
  type ServiceBulkAction,
} from './service';

// Booking schemas and types
export {
  BookingBaseSchema,
  BookingCreateSchema,
  BookingUpdateAdminSchema,
  BookingFiltersSchema,
  BookingRescheduleSchema,
  BookingCancellationSchema,
  BookingConfirmationSchema,
  AvailabilitySlotSchema,
  BookingBulkActionSchema,
  validateBookingCreate,
  safeParseBookingCreate,
  validateBookingReschedule,
  type BookingCreate,
  type BookingUpdateAdmin,
  type BookingFilters,
  type BookingReschedule,
  type BookingCancellation,
  type BookingConfirmation,
  type AvailabilitySlot,
  type BookingBulkAction,
} from './booking';

// Task schemas and types
export {
  TaskBaseSchema,
  TaskCreateSchema,
  TaskUpdateSchema,
  TaskStatusUpdateSchema,
  TaskCommentSchema,
  TaskFiltersSchema,
  TaskBulkActionSchema,
  validateTaskCreate,
  safeParseTaskCreate,
  validateTaskStatusUpdate,
  type TaskCreate,
  type TaskUpdate,
  type TaskStatusUpdate,
  type TaskComment,
  type TaskFilters,
  type TaskBulkAction,
} from './task';

// Document schemas and types
export {
  DocumentUploadSchema,
  DocumentUpdateSchema,
  DocumentFiltersSchema,
  DocumentShareSchema,
  DocumentBulkActionSchema,
  validateDocumentShare,
  safeParseDocumentUpload,
  type DocumentUpload,
  type DocumentUpdate,
  type DocumentFilters,
  type DocumentShare,
  type DocumentBulkAction,
} from './document';

// Invoice schemas and types
export {
  InvoiceLineItemSchema,
  InvoiceCreateSchema,
  InvoiceUpdateSchema,
  InvoicePaymentSchema,
  InvoiceFiltersSchema,
  SendInvoiceSchema,
  InvoiceBulkActionSchema,
  RecurringInvoiceSchema,
  validateInvoiceCreate,
  safeParseInvoiceCreate,
  validateInvoicePayment,
  type InvoiceCreate,
  type InvoiceUpdate,
  type InvoicePayment,
  type InvoiceFilters,
  type SendInvoice,
  type InvoiceBulkAction,
  type RecurringInvoice,
} from './invoice';

// Approval schemas and types
export {
  ApprovalCreateSchema,
  ApprovalDecisionSchema,
  ApprovalDelegationSchema,
  ApprovalFiltersSchema,
  ApprovalBulkActionSchema,
  ApprovalWorkflowStepSchema,
  ApprovalWorkflowSchema,
  validateApprovalCreate,
  safeParseApprovalCreate,
  validateApprovalDecision,
  type ApprovalCreate,
  type ApprovalDecision,
  type ApprovalDelegation,
  type ApprovalFilters,
  type ApprovalBulkAction,
  type ApprovalWorkflowStep,
  type ApprovalWorkflow,
} from './approval';

// Message schemas and types
export {
  SendMessageSchema,
  CreateThreadSchema,
  UpdateThreadSchema,
  MessageFiltersSchema,
  ThreadListFiltersSchema,
  EditMessageSchema,
  AddReactionSchema,
  MessageBulkActionSchema,
  validateSendMessage,
  safeParseSendMessage,
  validateCreateThread,
  validateEditMessage,
  type SendMessage,
  type CreateThread,
  type UpdateThread,
  type MessageFilters,
  type ThreadListFilters,
  type EditMessage,
  type AddReaction,
  type MessageBulkAction,
} from './message';

// Entity/KYC schemas and types
export {
  AddressSchema,
  EntityCreateSchema,
  EntityUpdateSchema,
  KYCStepSubmissionSchema,
  EntityVerificationSchema,
  OwnerSchema,
  EntityFiltersSchema,
  BankingInfoSchema,
  EntityBulkActionSchema,
  ComplianceRequirementSchema,
  validateEntityCreate,
  safeParseEntityCreate,
  validateKYCStepSubmission,
  validateBankingInfo,
  type EntityCreate,
  type EntityUpdate,
  type KYCStepSubmission,
  type EntityVerification,
  type Owner,
  type EntityFilters,
  type BankingInfo,
  type EntityBulkAction,
  type ComplianceRequirement,
} from './entity';
