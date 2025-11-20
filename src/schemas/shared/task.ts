/**
 * Task Entity Validation Schemas
 * Using Zod for runtime validation of Task data
 */

import { z } from 'zod';
import { TaskStatus, TaskPriority } from '@/types/shared';

/**
 * Base task schema
 */
export const TaskBaseSchema = z.object({
  title: z.string().min(1, 'Title is required').max(255),
  description: z.string().max(5000).optional().nullable(),
  status: z.nativeEnum(TaskStatus).default(TaskStatus.OPEN),
  priority: z.nativeEnum(TaskPriority).default(TaskPriority.NORMAL),
  dueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format').optional().nullable(),
  notes: z.string().max(2000).optional().nullable(),
});

/**
 * Create task schema (admin)
 */
export const TaskCreateSchema = TaskBaseSchema.extend({
  assigneeId: z.string().cuid().optional().nullable(),
  category: z.string().max(255).optional().nullable(),
  tags: z.array(z.string()).optional(),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format').optional().nullable(),
  estimatedHours: z.number().int().positive().optional().nullable(),
  relatedEntityType: z.string().optional().nullable(),
  relatedEntityId: z.string().cuid().optional().nullable(),
  internalNotes: z.string().max(2000).optional().nullable(),
  requiresApproval: z.boolean().optional(),
  approverIds: z.array(z.string().cuid()).optional(),
});

/**
 * Update task schema
 */
export const TaskUpdateSchema = TaskCreateSchema.partial();

/**
 * Task status update schema
 */
export const TaskStatusUpdateSchema = z.object({
  taskId: z.string().cuid(),
  status: z.nativeEnum(TaskStatus),
  completionPercentage: z.number().min(0).max(100).optional(),
  notes: z.string().max(500).optional(),
});

/**
 * Task comment schema
 */
export const TaskCommentSchema = z.object({
  taskId: z.string().cuid(),
  content: z.string().min(1, 'Comment cannot be empty').max(5000),
  isInternal: z.boolean().default(false),
});

/**
 * Task filters schema
 */
export const TaskFiltersSchema = z.object({
  status: z.string().optional(),
  priority: z.string().optional(),
  assigneeId: z.string().optional(),
  createdBy: z.string().optional(),
  category: z.string().optional(),
  tags: z.array(z.string()).optional(),
  search: z.string().optional(),
  dueDateFrom: z.string().optional(),
  dueDateTo: z.string().optional(),
  relatedEntityType: z.string().optional(),
  relatedEntityId: z.string().optional(),
  limit: z.number().int().min(1).max(100).default(50),
  offset: z.number().int().min(0).default(0),
  sortBy: z.enum(['dueDate', 'priority', 'createdAt', 'status']).optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
});

/**
 * Bulk task operation schema
 */
export const TaskBulkActionSchema = z.object({
  action: z.enum(['update-status', 'assign', 'archive', 'delete', 'change-priority']),
  taskIds: z.array(z.string().cuid()).min(1),
  value: z.union([z.string(), z.nativeEnum(TaskStatus), z.nativeEnum(TaskPriority)]).optional(),
});

/**
 * Infer TypeScript types from schemas
 */
export type TaskCreate = z.infer<typeof TaskCreateSchema>;
export type TaskUpdate = z.infer<typeof TaskUpdateSchema>;
export type TaskStatusUpdate = z.infer<typeof TaskStatusUpdateSchema>;
export type TaskComment = z.infer<typeof TaskCommentSchema>;
export type TaskFilters = z.infer<typeof TaskFiltersSchema>;
export type TaskBulkAction = z.infer<typeof TaskBulkActionSchema>;

/**
 * Helper validation functions
 */
export function validateTaskCreate(data: unknown) {
  return TaskCreateSchema.parse(data);
}

export function safeParseTaskCreate(data: unknown) {
  return TaskCreateSchema.safeParse(data);
}

export function validateTaskStatusUpdate(data: unknown) {
  return TaskStatusUpdateSchema.parse(data);
}
