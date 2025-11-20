import { z } from 'zod'

/**
 * Zod schema template for data validation
 * 
 * This template shows how to create validation schemas for:
 * - Create operations (POST requests)
 * - Update operations (PUT/PATCH requests)
 * - Filter/Query operations (GET requests)
 * - API responses
 * 
 * Features:
 * - Type inference with z.infer
 * - Custom error messages
 * - Refinements and transformations
 * - Optional and default fields
 * - Enum and union types
 */

// ============================================================================
// ENUMS AND CONSTANTS
// ============================================================================

export const ItemStatusEnum = z.enum([
  'ACTIVE',
  'INACTIVE',
  'ARCHIVED',
  'PENDING',
])
export type ItemStatus = z.infer<typeof ItemStatusEnum>

export const PriorityEnum = z.enum([
  'LOW',
  'MEDIUM',
  'HIGH',
  'URGENT',
])
export type Priority = z.infer<typeof PriorityEnum>

// ============================================================================
// BASE SCHEMA - Shared fields
// ============================================================================

export const ItemBaseSchema = z.object({
  id: z.string().cuid().describe('Unique identifier'),
  
  name: z
    .string()
    .min(1, 'Name is required')
    .max(255, 'Name must be less than 255 characters')
    .trim()
    .describe('Item name'),

  description: z
    .string()
    .max(5000, 'Description must be less than 5000 characters')
    .optional()
    .describe('Item description'),

  status: ItemStatusEnum
    .default('ACTIVE')
    .describe('Item status'),

  priority: PriorityEnum
    .optional()
    .describe('Item priority level'),

  active: z
    .boolean()
    .default(true)
    .describe('Whether item is active'),

  createdAt: z
    .date()
    .describe('Creation timestamp'),

  updatedAt: z
    .date()
    .describe('Last update timestamp'),

  tenantId: z
    .string()
    .cuid()
    .describe('Tenant ID for multi-tenancy'),
})

// ============================================================================
// CREATE SCHEMA - For POST requests
// ============================================================================

export const ItemCreateSchema = ItemBaseSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  tenantId: true,
}).extend({
  // Add or override fields specific to creation
  // Example: Add required field only on create
  // assigneeId: z.string().cuid('Assignee is required'),
})

// ============================================================================
// UPDATE SCHEMA - For PUT/PATCH requests
// ============================================================================

export const ItemUpdateSchema = ItemCreateSchema.partial().extend({
  // Override any fields that should always be provided on update
})

// ============================================================================
// FILTER SCHEMA - For GET query parameters
// ============================================================================

export const ItemFilterSchema = z.object({
  search: z.string().optional().describe('Search by name or description'),
  status: z.union([ItemStatusEnum, z.literal('all')]).default('all'),
  priority: z.union([PriorityEnum, z.literal('all')]).optional(),
  active: z.enum(['true', 'false', 'all']).default('all').transform(v => v === 'true' ? true : v === 'false' ? false : undefined),
  limit: z.coerce.number().int().min(1).max(100).default(50),
  offset: z.coerce.number().int().min(0).default(0),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
})

// ============================================================================
// RESPONSE SCHEMAS
// ============================================================================

export const ItemDetailSchema = ItemBaseSchema

export const ItemListResponseSchema = z.object({
  items: z.array(ItemDetailSchema),
  total: z.number(),
  limit: z.number(),
  offset: z.number(),
})

export const ItemResponseSchema = z.object({
  success: z.boolean(),
  data: ItemDetailSchema,
})

export const ErrorResponseSchema = z.object({
  success: z.literal(false),
  error: z.object({
    code: z.string(),
    message: z.string(),
  }),
})

// ============================================================================
// TYPE EXPORTS - Inferred from schemas
// ============================================================================

export type ItemCreate = z.infer<typeof ItemCreateSchema>
export type ItemUpdate = z.infer<typeof ItemUpdateSchema>
export type ItemFilter = z.infer<typeof ItemFilterSchema>
export type ItemDetail = z.infer<typeof ItemDetailSchema>
export type ItemListResponse = z.infer<typeof ItemListResponseSchema>
export type ItemResponse = z.infer<typeof ItemResponseSchema>
export type ErrorResponse = z.infer<typeof ErrorResponseSchema>

// ============================================================================
// USAGE EXAMPLES
// ============================================================================

/*
// Create validation
const createData = ItemCreateSchema.parse({
  name: 'My Item',
  description: 'Item description',
  status: 'ACTIVE',
})

// Update validation (partial fields)
const updateData = ItemUpdateSchema.parse({
  name: 'Updated Item',
})

// Query validation
const filters = ItemFilterSchema.parse({
  search: 'my',
  status: 'ACTIVE',
  limit: '25',
  offset: '0',
})

// Response validation
const response = ItemResponseSchema.parse({
  success: true,
  data: { ... }
})
*/
