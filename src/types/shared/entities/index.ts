/**
 * Shared Entity Types - Central Export
 * Re-exports all domain entity type definitions for use across Portal and Admin
 */

// Service entity types
export type {
  Service,
  ServiceLite,
  ServiceFormData,
  ServiceFilters,
  ServiceListParams,
  ServiceListResponse,
  ServicePortalView,
  ServiceStats,
  ServiceAnalytics,
  BulkAction,
  ServiceOperationalMetrics,
} from './service';

export {
  ServiceStatus,
} from './service';

// Booking entity types
export type {
  Booking,
  BookingFormData,
  BookingFilters,
  BookingListParams,
  AvailabilitySlot,
  BookingCalendarView,
  BookingPortalView,
  BookingListResponse,
  BookingStats,
  BookingConfirmation,
  BookingRescheduleRequest,
  BookingCancellationRequest,
} from './booking';

export {
  BookingStatus,
} from './booking';

// Task entity types
export type {
  Task,
  TaskComment,
  TaskFormData,
  TaskFilters,
  TaskListParams,
  TaskPortalView,
  TaskListResponse,
  TaskStats,
  TaskStatusUpdateRequest,
  TaskTemplate,
  TaskBoardColumn,
  TaskGanttItem,
  TaskKanbanCard,
} from './task';

export {
  TaskStatus,
  TaskPriority,
} from './task';

// User entity types
export type {
  UserProfile,
  TeamMemberProfile,
  ClientProfile,
  UserSummary,
  UserFilters,
  UserListParams,
  UserProfileUpdateData,
  TeamMemberUpdateData,
  UserBulkAction,
  UserStats,
  UserActivityLog,
  UserPreferences,
  UserPortalView,
} from './user';

export {
  UserRole,
  AvailabilityStatus,
  ExpertiseLevel,
} from './user';

// Document entity types
export type {
  Document,
  DocumentFolder,
  DocumentLink,
  DocumentAuditLog,
  DocumentUploadRequest,
  DocumentFilters,
  DocumentListParams,
  DocumentPortalView,
  DocumentListResponse,
  DocumentStats,
  DocumentWithPreview,
  DocumentVersionHistory,
  DocumentBulkAction,
  DocumentNotificationSettings,
} from './document';

export {
  DocumentStatus,
  DocumentVisibility,
} from './document';

// Invoice entity types
export type {
  Invoice,
  InvoiceLineItem,
  Payment,
  InvoiceFormData,
  InvoiceFilters,
  InvoiceListParams,
  InvoicePortalView,
  InvoiceListResponse,
  InvoiceStats,
  InvoicePaymentRequest,
  InvoicePDFRequest,
  InvoiceTemplate,
  RecurringInvoice,
  PaymentMethod,
  InvoiceBulkAction,
} from './invoice';

export {
  InvoiceStatus,
  PaymentStatus,
} from './invoice';

// Approval entity types
export type {
  Approval,
  ApprovalHistory,
  ApprovalFormData,
  ApprovalDecisionRequest,
  ApprovalDelegationRequest,
  ApprovalFilters,
  ApprovalListParams,
  ApprovalPortalView,
  ApprovalListResponse,
  ApprovalStats,
  ApprovalWorkflow,
  ApprovalWorkflowStep,
  ApprovalBulkAction,
  ApprovalNotificationSettings,
} from './approval';

export {
  ApprovalItemType,
  ApprovalStatus,
  ApprovalPriority,
} from './approval';

// Message entity types
export type {
  Message,
  MessageThread,
  MessageFormData,
  ThreadCreationData,
  MessageFilters,
  ThreadListParams,
  MessagePortalView,
  ThreadPortalView,
  MessageListResponse,
  ThreadListResponse,
  MessageSearchResult,
  MessageStats,
  MessageActivity,
  TypingIndicator,
  MessageDeliveryStatus,
  MessageBulkAction,
} from './message';

export {
  MessageType,
  ThreadType,
} from './message';

// Entity/KYC entity types
export type {
  Entity,
  KYCStepProgress,
  EntityFormData,
  KYCStepSubmissionData,
  EntityFilters,
  EntityListParams,
  EntityPortalView,
  EntityVerificationResponse,
  EntityListResponse,
  EntityStats,
  Owner,
  ComplianceRequirement,
  EntityVerificationTimeline,
  EntityBulkAction,
} from './entity';

export {
  EntityType,
  EntityStatus,
  KYCStep,
  VerificationStatus,
} from './entity';
