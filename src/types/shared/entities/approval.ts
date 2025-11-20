/**
 * Shared Approval Entity Type Definitions
 * Used by both Admin and Portal for approval workflows
 * 
 * [PORTAL] = visible to portal users
 * [ADMIN] = visible only to admins
 */

/**
 * Approval item type enumeration
 */
export enum ApprovalItemType {
  BILL = 'BILL',
  EXPENSE = 'EXPENSE',
  DOCUMENT = 'DOCUMENT',
  INVOICE = 'INVOICE',
  SERVICE_REQUEST = 'SERVICE_REQUEST',
  ENTITY = 'ENTITY',
  USER = 'USER',
  OTHER = 'OTHER',
}

/**
 * Approval status enumeration
 */
export enum ApprovalStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  DELEGATED = 'DELEGATED',
  ESCALATED = 'ESCALATED',
  EXPIRED = 'EXPIRED',
}

/**
 * Approval priority enumeration
 */
export enum ApprovalPriority {
  LOW = 'LOW',
  NORMAL = 'NORMAL',
  HIGH = 'HIGH',
  URGENT = 'URGENT',
}

/**
 * Core Approval entity
 */
export interface Approval {
  // Core identification
  id: string; // [PORTAL] [ADMIN]
  tenantId: string; // [ADMIN]
  
  // Item reference
  itemType: ApprovalItemType; // [PORTAL] [ADMIN]
  itemId: string; // [PORTAL] [ADMIN]
  itemData?: Record<string, unknown>; // [PORTAL] [ADMIN]
  
  // Requester information
  requesterId: string; // [PORTAL] [ADMIN]
  requesterName?: string | null; // [PORTAL] [ADMIN]
  requestedAt: string; // ISO-8601 datetime [PORTAL] [ADMIN]
  
  // Approver information
  approverId: string; // [PORTAL] [ADMIN]
  approverName?: string | null; // [PORTAL] [ADMIN]
  
  // Status and priority
  status: ApprovalStatus; // [PORTAL] [ADMIN]
  priority: ApprovalPriority; // [ADMIN]
  
  // Decision information
  decision?: string; // APPROVED | REJECTED [PORTAL] [ADMIN]
  decisionAt?: string | null; // ISO-8601 datetime [PORTAL] [ADMIN]
  decisionBy?: string | null; // [ADMIN]
  decisionNotes?: string | null; // [PORTAL] [ADMIN]
  
  // Workflow information
  workflowId?: string | null; // [ADMIN]
  workflowStep?: number; // [ADMIN]
  totalSteps?: number; // [ADMIN]
  
  // Additional information
  reason?: string | null; // [PORTAL] [ADMIN]
  notes?: string | null; // [PORTAL] [ADMIN]
  tags?: string[]; // [ADMIN]
  
  // Lifecycle
  expiresAt?: string | null; // ISO-8601 datetime [ADMIN]
  
  // Admin metadata
  metadata?: Record<string, unknown> | null; // [ADMIN]
  
  // Timestamps
  createdAt: string; // ISO-8601 datetime
  updatedAt: string; // ISO-8601 datetime
  
  // Relations (optional)
  requester?: {
    id: string;
    name: string | null;
    email: string;
  };
  
  approver?: {
    id: string;
    name: string | null;
    email: string;
  };
  
  history?: ApprovalHistory[];
}

/**
 * Approval history/audit log
 */
export interface ApprovalHistory {
  id: string;
  approvalId: string;
  tenantId: string;
  
  // Action and transition
  action: string;
  performedBy: string;
  performedAt: string; // ISO-8601 datetime
  
  // Status transition
  fromStatus?: ApprovalStatus;
  toStatus?: ApprovalStatus;
  
  // Additional information
  notes?: string | null;
  metadata?: Record<string, unknown>;
  
  // Relations
  performer?: {
    id: string;
    name: string | null;
    email: string;
  };
}

/**
 * Approval form data for creation
 */
export interface ApprovalFormData {
  itemType: ApprovalItemType;
  itemId: string;
  itemData?: Record<string, unknown>;
  approverId: string;
  priority?: ApprovalPriority;
  reason?: string;
  notes?: string;
  expiresAt?: string | null;
}

/**
 * Approval decision request
 */
export interface ApprovalDecisionRequest {
  approvalId: string;
  decision: 'APPROVED' | 'REJECTED';
  decisionNotes?: string;
  reason?: string;
}

/**
 * Approval delegation request
 */
export interface ApprovalDelegationRequest {
  approvalId: string;
  newApproverId: string;
  reason?: string;
}

/**
 * Approval filters for list queries
 */
export interface ApprovalFilters {
  status?: ApprovalStatus | 'all';
  itemType?: ApprovalItemType | 'all';
  priority?: ApprovalPriority | 'all';
  approverId?: string;
  requesterId?: string;
  fromDate?: string;
  toDate?: string;
  search?: string;
}

/**
 * Approval list request parameters
 */
export interface ApprovalListParams extends ApprovalFilters {
  limit?: number;
  offset?: number;
  sortBy?: 'requestedAt' | 'priority' | 'status' | 'expiresAt';
  sortOrder?: 'asc' | 'desc';
}

/**
 * Portal-safe approval view (excludes admin-only fields)
 */
export type ApprovalPortalView = Omit<
  Approval,
  | 'tenantId'
  | 'priority'
  | 'workflowId'
  | 'workflowStep'
  | 'totalSteps'
  | 'tags'
  | 'metadata'
  | 'decisionBy'
>;

/**
 * Approval list API response
 */
export interface ApprovalListResponse {
  approvals: Approval[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

/**
 * Approval statistics [ADMIN]
 */
export interface ApprovalStats {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
  expired: number;
  byType: Record<string, number>;
  byPriority: Record<string, number>;
  averageApprovalTime: number; // in hours
  todayApprovals: number;
  weekApprovals: number;
}

/**
 * Approval workflow configuration [ADMIN]
 */
export interface ApprovalWorkflow {
  id: string;
  tenantId: string;
  name: string;
  description?: string;
  itemType: ApprovalItemType;
  steps: ApprovalWorkflowStep[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

/**
 * Approval workflow step [ADMIN]
 */
export interface ApprovalWorkflowStep {
  stepNumber: number;
  name: string;
  approverIds: string[];
  requireAllApprovals: boolean;
  timeoutDays?: number;
  escalationApproverId?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Bulk approval operations [ADMIN]
 */
export interface ApprovalBulkAction {
  action: 'approve' | 'reject' | 'delegate' | 'expire';
  approvalIds: string[];
  value?: string | string[];
  notes?: string;
}

/**
 * Approval notification settings
 */
export interface ApprovalNotificationSettings {
  notifyOnCreate: boolean;
  notifyOnApprove: boolean;
  notifyOnReject: boolean;
  notifyOnExpiry: boolean;
  daysBeforeExpiry: number;
}
