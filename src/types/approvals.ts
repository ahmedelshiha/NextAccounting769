/**
 * Approvals Feature - TypeScript Types
 * Production-ready type definitions for Approvals management
 */

export enum ApprovalItemType {
  BILL = "BILL",
  EXPENSE = "EXPENSE",
  DOCUMENT = "DOCUMENT",
  INVOICE = "INVOICE",
  SERVICE_REQUEST = "SERVICE_REQUEST",
  ENTITY = "ENTITY",
  USER = "USER",
  OTHER = "OTHER",
}

export enum ApprovalStatus {
  PENDING = "PENDING",
  APPROVED = "APPROVED",
  REJECTED = "REJECTED",
  DELEGATED = "DELEGATED",
  ESCALATED = "ESCALATED",
  EXPIRED = "EXPIRED",
}

export enum ApprovalPriority {
  LOW = "LOW",
  NORMAL = "NORMAL",
  HIGH = "HIGH",
  URGENT = "URGENT",
}

export interface Approval {
  id: string;
  tenantId: string;
  
  // Item reference
  itemType: ApprovalItemType;
  itemId: string;
  itemData?: any;
  
  // Requester
  requesterId: string;
  requesterName?: string;
  requestedAt: Date | string;
  
  // Approver
  approverId: string;
  approverName?: string;
  
  // Status
  status: ApprovalStatus;
  priority: ApprovalPriority;
  
  // Decision
  decision?: string;
  decisionAt?: Date | string;
  decisionBy?: string;
  decisionNotes?: string;
  
  // Workflow
  workflowId?: string;
  workflowStep?: number;
  totalSteps?: number;
  
  // Metadata
  reason?: string;
  notes?: string;
  tags?: string[];
  metadata?: any;
  
  // Timestamps
  createdAt: Date | string;
  updatedAt: Date | string;
  expiresAt?: Date | string;
  
  // Relations
  requester?: {
    id: string;
    name: string;
    email: string;
  };
  approver?: {
    id: string;
    name: string;
    email: string;
  };
  history?: ApprovalHistory[];
}

export interface ApprovalHistory {
  id: string;
  approvalId: string;
  tenantId: string;
  
  action: string;
  performedBy: string;
  performedAt: Date | string;
  
  fromStatus?: ApprovalStatus;
  toStatus?: ApprovalStatus;
  
  notes?: string;
  metadata?: any;
  
  performer?: {
    id: string;
    name: string;
    email: string;
  };
}

export interface ApprovalFilters {
  search?: string;
  status?: ApprovalStatus | "all";
  itemType?: ApprovalItemType | "all";
  priority?: ApprovalPriority | "all";
  approverId?: string;
  requesterId?: string;
  startDate?: string;
  endDate?: string;
  sortBy?: "requestedAt" | "priority" | "itemType" | "status";
  sortOrder?: "asc" | "desc";
  limit?: number;
  offset?: number;
}

export interface ApprovalStats {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
  expired: number;
  byType: Record<string, number>;
  byPriority: Record<string, number>;
  avgApprovalTime: number; // in hours
  todayApprovals: number;
  weekApprovals: number;
}

export interface ApprovalActionInput {
  decision: "APPROVED" | "REJECTED";
  notes?: string;
}

export interface ApprovalDelegateInput {
  newApproverId: string;
  reason?: string;
}

// API Response types
export interface ApprovalsListResponse {
  success: boolean;
  data: {
    approvals: Approval[];
    total: number;
    limit: number;
    offset: number;
  };
}

export interface ApprovalResponse {
  success: boolean;
  data: Approval;
}

export interface ApprovalStatsResponse {
  success: boolean;
  data: ApprovalStats;
}

// Hook return types
export interface UseApprovalsReturn {
  approvals: Approval[];
  total: number;
  isLoading: boolean;
  error: Error | null;
  mutate: () => void;
}

export interface UseApprovalActionsReturn {
  approve: (approvalId: string, notes?: string) => Promise<void>;
  reject: (approvalId: string, notes?: string) => Promise<void>;
  delegate: (approvalId: string, newApproverId: string, reason?: string) => Promise<void>;
  isProcessing: boolean;
  error: Error | null;
}

export interface UseApprovalStatsReturn {
  stats: ApprovalStats | null;
  isLoading: boolean;
  error: Error | null;
  mutate: () => void;
}
