/**
 * Approval Entity Validation Schemas
 * Using Zod for runtime validation of Approval data
 */

import { z } from 'zod';
import { ApprovalStatus, ApprovalItemType, ApprovalPriority } from '@/types/shared';

/**
 * Create approval schema
 */
export const ApprovalCreateSchema = z.object({
  itemType: z.nativeEnum(ApprovalItemType),
  itemId: z.string().cuid('Invalid item ID'),
  itemData: z.record(z.any()).optional(),
  approverId: z.string().cuid('Invalid approver ID'),
  priority: z.nativeEnum(ApprovalPriority).default(ApprovalPriority.NORMAL),
  reason: z.string().max(500).optional(),
  notes: z.string().max(2000).optional(),
  expiresAt: z.string().datetime().optional().nullable(),
});

/**
 * Approval decision schema
 */
export const ApprovalDecisionSchema = z.object({
  approvalId: z.string().cuid(),
  decision: z.enum(['APPROVED', 'REJECTED']),
  decisionNotes: z.string().max(2000).optional(),
  reason: z.string().max(500).optional(),
});

/**
 * Approval delegation schema
 */
export const ApprovalDelegationSchema = z.object({
  approvalId: z.string().cuid(),
  newApproverId: z.string().cuid('Invalid new approver ID'),
  reason: z.string().max(500).optional(),
});

/**
 * Approval filters schema
 */
export const ApprovalFiltersSchema = z.object({
  status: z.string().optional(),
  itemType: z.string().optional(),
  priority: z.string().optional(),
  approverId: z.string().optional(),
  requesterId: z.string().optional(),
  fromDate: z.string().optional(),
  toDate: z.string().optional(),
  search: z.string().optional(),
  limit: z.number().int().min(1).max(100).default(50),
  offset: z.number().int().min(0).default(0),
  sortBy: z.enum(['requestedAt', 'priority', 'status', 'expiresAt']).optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
});

/**
 * Bulk approval operation schema
 */
export const ApprovalBulkActionSchema = z.object({
  action: z.enum(['approve', 'reject', 'delegate', 'expire']),
  approvalIds: z.array(z.string().cuid()).min(1),
  value: z.union([z.string(), z.array(z.string())]).optional(),
  notes: z.string().max(500).optional(),
});

/**
 * Approval workflow step schema
 */
export const ApprovalWorkflowStepSchema = z.object({
  stepNumber: z.number().positive(),
  name: z.string().min(1).max(255),
  approverIds: z.array(z.string().cuid()).min(1),
  requireAllApprovals: z.boolean().default(false),
  timeoutDays: z.number().int().positive().optional(),
  escalationApproverId: z.string().cuid().optional(),
});

/**
 * Approval workflow schema
 */
export const ApprovalWorkflowSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().max(1000).optional(),
  itemType: z.nativeEnum(ApprovalItemType),
  steps: z.array(ApprovalWorkflowStepSchema).min(1),
  isActive: z.boolean().default(true),
});

/**
 * Infer TypeScript types from schemas
 */
export type ApprovalCreate = z.infer<typeof ApprovalCreateSchema>;
export type ApprovalDecision = z.infer<typeof ApprovalDecisionSchema>;
export type ApprovalDelegation = z.infer<typeof ApprovalDelegationSchema>;
export type ApprovalFilters = z.infer<typeof ApprovalFiltersSchema>;
export type ApprovalBulkAction = z.infer<typeof ApprovalBulkActionSchema>;
export type ApprovalWorkflowStep = z.infer<typeof ApprovalWorkflowStepSchema>;
export type ApprovalWorkflow = z.infer<typeof ApprovalWorkflowSchema>;

/**
 * Helper validation functions
 */
export function validateApprovalCreate(data: unknown) {
  return ApprovalCreateSchema.parse(data);
}

export function safeParseApprovalCreate(data: unknown) {
  return ApprovalCreateSchema.safeParse(data);
}

export function validateApprovalDecision(data: unknown) {
  return ApprovalDecisionSchema.parse(data);
}
