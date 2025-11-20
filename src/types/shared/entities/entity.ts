/**
 * Shared Entity/KYC Type Definitions
 * Used for business entity setup, verification, and compliance
 * 
 * [PORTAL] = visible to portal users
 * [ADMIN] = visible only to admins
 */

/**
 * Entity type enumeration
 */
export enum EntityType {
  SOLE_PROPRIETOR = 'SOLE_PROPRIETOR',
  PARTNERSHIP = 'PARTNERSHIP',
  LLC = 'LLC',
  CORPORATION = 'CORPORATION',
  NONPROFIT = 'NONPROFIT',
  GOVERNMENT = 'GOVERNMENT',
  OTHER = 'OTHER',
}

/**
 * Entity status enumeration
 */
export enum EntityStatus {
  DRAFT = 'DRAFT',
  PENDING_VERIFICATION = 'PENDING_VERIFICATION',
  VERIFIED = 'VERIFIED',
  REJECTED = 'REJECTED',
  SUSPENDED = 'SUSPENDED',
  ARCHIVED = 'ARCHIVED',
}

/**
 * KYC verification step enumeration
 */
export enum KYCStep {
  BASIC_INFO = 'BASIC_INFO',
  BUSINESS_INFO = 'BUSINESS_INFO',
  OWNERSHIP_INFO = 'OWNERSHIP_INFO',
  TAX_INFO = 'TAX_INFO',
  BANKING_INFO = 'BANKING_INFO',
  DOCUMENT_UPLOAD = 'DOCUMENT_UPLOAD',
  IDENTITY_VERIFICATION = 'IDENTITY_VERIFICATION',
  FINAL_REVIEW = 'FINAL_REVIEW',
}

/**
 * Verification status for each KYC step
 */
export enum VerificationStatus {
  NOT_STARTED = 'NOT_STARTED',
  IN_PROGRESS = 'IN_PROGRESS',
  SUBMITTED = 'SUBMITTED',
  UNDER_REVIEW = 'UNDER_REVIEW',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  RESUBMISSION_REQUIRED = 'RESUBMISSION_REQUIRED',
}

/**
 * Core Entity information
 */
export interface Entity {
  // Core identification
  id: string; // [PORTAL] [ADMIN]
  tenantId: string; // [ADMIN]
  
  // Entity information
  entityType: EntityType; // [PORTAL] [ADMIN]
  legalName: string; // [PORTAL] [ADMIN]
  tradeName?: string | null; // [PORTAL] [ADMIN]
  
  // Status and verification
  status: EntityStatus; // [PORTAL] [ADMIN]
  verificationLevel: number; // 0-100 [PORTAL] [ADMIN]
  
  // Contact information
  email: string; // [PORTAL] [ADMIN]
  phone?: string | null; // [PORTAL] [ADMIN]
  website?: string | null; // [PORTAL] [ADMIN]
  
  // Address information
  address: {
    street: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  }; // [PORTAL] [ADMIN]
  
  // Tax information
  taxId?: string | null; // [ADMIN]
  registrationNumber?: string | null; // [ADMIN]
  
  // Banking information [ADMIN]
  bankAccountNumber?: string | null;
  bankRoutingNumber?: string | null;
  bankAccountName?: string | null;
  
  // Ownership information [ADMIN]
  owners?: Array<{
    id: string;
    name: string;
    role: string;
    ownershipPercentage: number;
  }>;
  
  // Business details [ADMIN]
  yearsInBusiness?: number | null;
  employeeCount?: number | null;
  businessDescription?: string | null;
  industryCategory?: string | null;
  
  // KYC verification tracking
  kycSteps?: KYCStepProgress[]; // [PORTAL] [ADMIN]
  completionPercentage?: number; // 0-100 [PORTAL] [ADMIN]
  
  // Admin fields
  verifiedBy?: string | null; // [ADMIN]
  verificationNotes?: string | null; // [ADMIN]
  rejectionReason?: string | null; // [ADMIN]
  metadata?: Record<string, unknown> | null; // [ADMIN]
  
  // Timestamps
  createdAt: string; // ISO-8601 datetime
  updatedAt: string; // ISO-8601 datetime
  verifiedAt?: string | null; // ISO-8601 datetime [ADMIN]
  rejectedAt?: string | null; // ISO-8601 datetime [ADMIN]
}

/**
 * KYC Step Progress
 */
export interface KYCStepProgress {
  step: KYCStep;
  status: VerificationStatus;
  submittedAt?: string | null; // ISO-8601 datetime
  reviewedAt?: string | null; // ISO-8601 datetime
  reviewedBy?: string | null;
  feedback?: string | null;
  requiredDocuments?: string[];
  submittedDocuments?: string[];
  metadata?: Record<string, unknown>;
}

/**
 * Entity form data for creation/update
 */
export interface EntityFormData {
  entityType: EntityType;
  legalName: string;
  tradeName?: string | null;
  email: string;
  phone?: string | null;
  website?: string | null;
  address: {
    street: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };
  taxId?: string | null;
  registrationNumber?: string | null;
}

/**
 * KYC step submission data
 */
export interface KYCStepSubmissionData {
  entityId: string;
  step: KYCStep;
  data: Record<string, unknown>;
  documentIds?: string[];
}

/**
 * Entity filters for list queries [ADMIN]
 */
export interface EntityFilters {
  status?: EntityStatus | 'all';
  entityType?: EntityType | 'all';
  verificationLevel?: 'unverified' | 'partial' | 'complete';
  search?: string;
  fromDate?: string;
  toDate?: string;
}

/**
 * Entity list request parameters [ADMIN]
 */
export interface EntityListParams extends EntityFilters {
  limit?: number;
  offset?: number;
  sortBy?: 'legalName' | 'createdAt' | 'status' | 'verificationLevel';
  sortOrder?: 'asc' | 'desc';
}

/**
 * Portal-safe entity view (excludes admin-only fields)
 */
export type EntityPortalView = Omit<
  Entity,
  | 'tenantId'
  | 'taxId'
  | 'registrationNumber'
  | 'bankAccountNumber'
  | 'bankRoutingNumber'
  | 'bankAccountName'
  | 'owners'
  | 'yearsInBusiness'
  | 'employeeCount'
  | 'verifiedBy'
  | 'verificationNotes'
  | 'rejectionReason'
  | 'metadata'
  | 'verifiedAt'
  | 'rejectedAt'
>;

/**
 * Entity verification response [ADMIN]
 */
export interface EntityVerificationResponse {
  entityId: string;
  approved: boolean;
  verificationLevel: number;
  notes?: string;
  nextSteps?: string[];
}

/**
 * Entity list API response
 */
export interface EntityListResponse {
  entities: Entity[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

/**
 * Entity statistics [ADMIN]
 */
export interface EntityStats {
  total: number;
  verified: number;
  pending: number;
  rejected: number;
  byType: Record<string, number>;
  byStatus: Record<string, number>;
  averageVerificationTime: number; // in days
}

/**
 * Owner information
 */
export interface Owner {
  id: string;
  entityId: string;
  name: string;
  email: string;
  role: string;
  ownershipPercentage: number;
  documentIds?: string[];
  verificationStatus: VerificationStatus;
  createdAt: string;
  updatedAt: string;
}

/**
 * Compliance requirement for entity
 */
export interface ComplianceRequirement {
  id: string;
  entityId: string;
  requirementType: string;
  status: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED';
  deadline?: string | null; // ISO-8601 date
  documentIds?: string[];
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Entity verification timeline [ADMIN]
 */
export interface EntityVerificationTimeline {
  entityId: string;
  events: Array<{
    timestamp: string;
    action: string;
    performedBy: string;
    details?: Record<string, unknown>;
  }>;
}

/**
 * Bulk entity operations [ADMIN]
 */
export interface EntityBulkAction {
  action: 'verify' | 'reject' | 'suspend' | 'archive';
  entityIds: string[];
  notes?: string;
}
