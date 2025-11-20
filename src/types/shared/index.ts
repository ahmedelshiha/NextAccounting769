/**
 * Shared Types - Central Hub
 * Main export point for all shared types used across Portal and Admin
 * 
 * This index re-exports all domain entities and shared type utilities
 * making them available as a single import point: `import { Service, Booking, ... } from '@/types/shared'`
 */

// Re-export all entity types and enums
export * from './entities';

// Type export summary for documentation purposes
/**
 * Entity Types Available:
 * 
 * Core Entities:
 * - Service: Service catalog and management
 * - Booking: Service bookings and scheduling
 * - Task: Project/work tasks
 * - User/TeamMember: User profiles and team information
 * - Document: File uploads and document management
 * - Invoice: Billing and invoicing
 * - Approval: Approval workflows
 * - Message: Messaging and communication
 * - Entity/KYC: Business entity verification
 * 
 * Status Enums:
 * - ServiceStatus
 * - BookingStatus
 * - TaskStatus, TaskPriority
 * - DocumentStatus, DocumentVisibility
 * - InvoiceStatus, PaymentStatus
 * - ApprovalStatus, ApprovalPriority, ApprovalItemType
 * - MessageType, ThreadType
 * - EntityStatus, EntityType, KYCStep, VerificationStatus
 * - UserRole, AvailabilityStatus, ExpertiseLevel
 * 
 * Portal-Safe Views:
 * - ServicePortalView: Service without admin pricing/settings
 * - BookingPortalView: Booking without admin-only fields
 * - TaskPortalView: Task without admin-only tracking
 * - UserPortalView: User without sensitive admin info
 * - DocumentPortalView: Document without sensitive metadata
 * - InvoicePortalView: Invoice without payment details
 * - ApprovalPortalView: Approval without workflow info
 * - MessagePortalView: Message without admin fields
 * - ThreadPortalView: Thread without admin tracking
 * - EntityPortalView: Entity without sensitive financial data
 * 
 * API Response Types:
 * - ServiceListResponse
 * - BookingListResponse
 * - TaskListResponse
 * - DocumentListResponse
 * - InvoiceListResponse
 * - ApprovalListResponse
 * - MessageListResponse
 * - ThreadListResponse
 * - EntityListResponse
 * 
 * Form Data Types:
 * - ServiceFormData
 * - BookingFormData
 * - TaskFormData
 * - InvoiceFormData
 * - EntityFormData
 * - KYCStepSubmissionData
 * 
 * Filter Types:
 * - ServiceFilters / ServiceListParams
 * - BookingFilters / BookingListParams
 * - TaskFilters / TaskListParams
 * - DocumentFilters / DocumentListParams
 * - InvoiceFilters / InvoiceListParams
 * - ApprovalFilters / ApprovalListParams
 * - UserFilters / UserListParams
 * - EntityFilters / EntityListParams
 * 
 * Statistics Types:
 * - ServiceStats
 * - BookingStats
 * - TaskStats
 * - DocumentStats
 * - InvoiceStats
 * - ApprovalStats
 * - UserStats
 * - EntityStats
 * - MessageStats
 * 
 * Additional Types:
 * - ServiceLite
 * - TaskTemplate
 * - InvoiceTemplate
 * - DocumentFolder
 * - Owner
 * - ComplianceRequirement
 * - And more...
 */
