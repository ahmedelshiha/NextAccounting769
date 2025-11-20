/**
 * Document Entity Validation Schemas
 * Using Zod for runtime validation of Document data
 */

import { z } from 'zod';
import { DocumentStatus, DocumentVisibility } from '@/types/shared';

/**
 * Document upload schema
 */
export const DocumentUploadSchema = z.object({
  description: z.string().max(500).optional(),
  category: z.string().max(255).optional().nullable(),
  tags: z.array(z.string()).optional(),
  visibility: z.nativeEnum(DocumentVisibility).default(DocumentVisibility.PRIVATE),
  sharedWithUserIds: z.array(z.string().cuid()).optional(),
  sharedWithRoles: z.array(z.string()).optional(),
});

/**
 * Document update schema
 */
export const DocumentUpdateSchema = DocumentUploadSchema.partial();

/**
 * Document filters schema
 */
export const DocumentFiltersSchema = z.object({
  category: z.string().optional(),
  tags: z.array(z.string()).optional(),
  uploadedBy: z.string().optional(),
  visibility: z.string().optional(),
  status: z.string().optional(),
  search: z.string().optional(),
  fromDate: z.string().optional(),
  toDate: z.string().optional(),
  isArchived: z.boolean().optional().nullable(),
  isStarred: z.boolean().optional().nullable(),
  limit: z.number().int().min(1).max(100).default(50),
  offset: z.number().int().min(0).default(0),
  sortBy: z.enum(['uploadedAt', 'filename', 'size', 'views']).optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
});

/**
 * Document share schema
 */
export const DocumentShareSchema = z.object({
  documentId: z.string().cuid(),
  sharedWithUserIds: z.array(z.string().cuid()).min(1),
  visibility: z.nativeEnum(DocumentVisibility),
});

/**
 * Document bulk action schema
 */
export const DocumentBulkActionSchema = z.object({
  action: z.enum(['move', 'delete', 'share', 'archive', 'tag']),
  documentIds: z.array(z.string().cuid()).min(1),
  value: z.union([z.string(), z.array(z.string())]).optional(),
});

/**
 * Infer TypeScript types from schemas
 */
export type DocumentUpload = z.infer<typeof DocumentUploadSchema>;
export type DocumentUpdate = z.infer<typeof DocumentUpdateSchema>;
export type DocumentFilters = z.infer<typeof DocumentFiltersSchema>;
export type DocumentShare = z.infer<typeof DocumentShareSchema>;
export type DocumentBulkAction = z.infer<typeof DocumentBulkActionSchema>;

/**
 * Helper validation functions
 */
export function validateDocumentShare(data: unknown) {
  return DocumentShareSchema.parse(data);
}

export function safeParseDocumentUpload(data: unknown) {
  return DocumentUploadSchema.safeParse(data);
}
