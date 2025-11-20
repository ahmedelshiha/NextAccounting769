/**
 * Message Entity Validation Schemas
 * Using Zod for runtime validation of Message data
 */

import { z } from 'zod';
import { MessageType, ThreadType } from '@/types/shared';

/**
 * Send message schema
 */
export const SendMessageSchema = z.object({
  threadId: z.string().cuid('Invalid thread ID'),
  content: z.string().min(1, 'Message cannot be empty').max(5000),
  type: z.nativeEnum(MessageType).default(MessageType.TEXT),
  attachmentIds: z.array(z.string().cuid()).optional(),
  mentionedUserIds: z.array(z.string().cuid()).optional(),
});

/**
 * Create thread schema
 */
export const CreateThreadSchema = z.object({
  type: z.nativeEnum(ThreadType),
  title: z.string().min(1).max(500),
  description: z.string().max(2000).optional(),
  participantIds: z.array(z.string().cuid()).min(1),
  relatedEntityType: z.string().optional(),
  relatedEntityId: z.string().cuid().optional(),
  metadata: z.record(z.any()).optional(),
});

/**
 * Update thread schema
 */
export const UpdateThreadSchema = z.object({
  threadId: z.string().cuid(),
  title: z.string().min(1).max(500).optional(),
  description: z.string().max(2000).optional(),
  status: z.string().optional(),
  isArchived: z.boolean().optional(),
  isPinned: z.boolean().optional(),
  muteNotifications: z.boolean().optional(),
});

/**
 * Message filters schema
 */
export const MessageFiltersSchema = z.object({
  threadId: z.string().optional(),
  senderId: z.string().optional(),
  type: z.string().optional(),
  fromDate: z.string().optional(),
  toDate: z.string().optional(),
  search: z.string().optional(),
  hasAttachments: z.boolean().optional().nullable(),
  limit: z.number().int().min(1).max(100).default(50),
  offset: z.number().int().min(0).default(0),
});

/**
 * Thread list filters schema
 */
export const ThreadListFiltersSchema = z.object({
  status: z.enum(['active', 'archived', 'all']).default('active'),
  type: z.string().optional(),
  search: z.string().optional(),
  unreadOnly: z.boolean().optional(),
  pinnedOnly: z.boolean().optional(),
  limit: z.number().int().min(1).max(100).default(50),
  offset: z.number().int().min(0).default(0),
  sortBy: z.enum(['lastMessageAt', 'createdAt', 'title']).optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
});

/**
 * Edit message schema
 */
export const EditMessageSchema = z.object({
  messageId: z.string().cuid(),
  content: z.string().min(1).max(5000),
});

/**
 * Add reaction schema
 */
export const AddReactionSchema = z.object({
  messageId: z.string().cuid(),
  emoji: z.string().min(1).max(10),
});

/**
 * Bulk message operation schema
 */
export const MessageBulkActionSchema = z.object({
  action: z.enum(['archive', 'delete', 'hide', 'restore']),
  messageIds: z.array(z.string().cuid()).optional(),
  threadIds: z.array(z.string().cuid()).optional(),
});

/**
 * Infer TypeScript types from schemas
 */
export type SendMessage = z.infer<typeof SendMessageSchema>;
export type CreateThread = z.infer<typeof CreateThreadSchema>;
export type UpdateThread = z.infer<typeof UpdateThreadSchema>;
export type MessageFilters = z.infer<typeof MessageFiltersSchema>;
export type ThreadListFilters = z.infer<typeof ThreadListFiltersSchema>;
export type EditMessage = z.infer<typeof EditMessageSchema>;
export type AddReaction = z.infer<typeof AddReactionSchema>;
export type MessageBulkAction = z.infer<typeof MessageBulkActionSchema>;

/**
 * Helper validation functions
 */
export function validateSendMessage(data: unknown) {
  return SendMessageSchema.parse(data);
}

export function safeParseSendMessage(data: unknown) {
  return SendMessageSchema.safeParse(data);
}

export function validateCreateThread(data: unknown) {
  return CreateThreadSchema.parse(data);
}

export function validateEditMessage(data: unknown) {
  return EditMessageSchema.parse(data);
}
