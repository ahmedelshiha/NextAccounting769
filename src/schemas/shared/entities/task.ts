import { z } from 'zod'
import { TaskPriority, TaskStatus } from '@/types/shared/entities/task'

export const TaskPrioritySchema = z.nativeEnum(TaskPriority).default(TaskPriority.MEDIUM)

export const TaskStatusSchema = z.nativeEnum(TaskStatus).default(TaskStatus.OPEN)

/**
 * Schema for creating a new task
 */
export const TaskCreateSchema = z.object({
  title: z
    .string()
    .min(1, 'Title is required')
    .max(500, 'Title must be less than 500 characters'),
  description: z
    .string()
    .max(5000, 'Description must be less than 5000 characters')
    .optional()
    .nullable(),
  dueAt: z.coerce.date().optional().nullable(),
  priority: TaskPrioritySchema,
  assigneeId: z.string().uuid('Invalid assignee ID').optional().nullable(),
  complianceRequired: z.boolean().default(false),
  complianceDeadline: z.coerce.date().optional().nullable(),
})

export type TaskCreate = z.infer<typeof TaskCreateSchema>

/**
 * Schema for updating a task
 */
export const TaskUpdateSchema = TaskCreateSchema.partial()

export type TaskUpdate = z.infer<typeof TaskUpdateSchema>

/**
 * Schema for listing/filtering tasks
 */
export const TaskFilterSchema = z.object({
  status: z
    .union([TaskStatusSchema, TaskStatusSchema.array()])
    .optional(),
  priority: z
    .union([TaskPrioritySchema, TaskPrioritySchema.array()])
    .optional(),
  assigneeId: z.string().uuid('Invalid assignee ID').optional(),
  search: z.string().max(100).optional(),
  dueBefore: z.coerce.date().optional(),
  dueAfter: z.coerce.date().optional(),
  limit: z
    .number()
    .int()
    .min(1, 'Limit must be at least 1')
    .max(100, 'Limit must be at most 100')
    .default(20),
  offset: z
    .number()
    .int()
    .min(0, 'Offset must be non-negative')
    .default(0),
  sortBy: z
    .enum(['createdAt', 'dueAt', 'priority', 'status'])
    .default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
})

export type TaskFilter = z.infer<typeof TaskFilterSchema>

/**
 * Schema for task comment creation
 */
export const TaskCommentCreateSchema = z.object({
  content: z
    .string()
    .min(1, 'Comment cannot be empty')
    .max(5000, 'Comment must be less than 5000 characters'),
  parentId: z.string().optional().nullable(),
})

export type TaskCommentCreate = z.infer<typeof TaskCommentCreateSchema>

/**
 * Schema for task comment update
 */
export const TaskCommentUpdateSchema = z.object({
  content: z
    .string()
    .min(1, 'Comment cannot be empty')
    .max(5000, 'Comment must be less than 5000 characters'),
})

export type TaskCommentUpdate = z.infer<typeof TaskCommentUpdateSchema>
