/**
 * Shared Message Entity Type Definitions
 * Used by both Admin and Portal for messaging and communication
 * 
 * [PORTAL] = visible to portal users
 * [ADMIN] = visible only to admins
 */

/**
 * Message type enumeration
 */
export enum MessageType {
  TEXT = 'TEXT',
  FILE = 'FILE',
  IMAGE = 'IMAGE',
  VIDEO = 'VIDEO',
  SYSTEM = 'SYSTEM',
  MENTION = 'MENTION',
}

/**
 * Thread type enumeration
 */
export enum ThreadType {
  CHAT = 'CHAT',
  SUPPORT_TICKET = 'SUPPORT_TICKET',
  TASK_DISCUSSION = 'TASK_DISCUSSION',
  BOOKING_DISCUSSION = 'BOOKING_DISCUSSION',
}

/**
 * Core Message entity
 */
export interface Message {
  // Core identification
  id: string; // [PORTAL] [ADMIN]
  tenantId: string; // [ADMIN]
  threadId: string; // [PORTAL] [ADMIN]
  
  // Content
  type: MessageType; // [PORTAL] [ADMIN]
  content: string; // [PORTAL] [ADMIN]
  
  // Sender information
  senderId: string; // [PORTAL] [ADMIN]
  senderName?: string | null; // [PORTAL] [ADMIN]
  senderRole?: string | null; // [PORTAL] [ADMIN]
  
  // Attachments
  attachmentIds?: string[]; // [PORTAL] [ADMIN]
  attachments?: Array<{
    id: string;
    filename: string;
    mimeType: string;
    size: number;
    url?: string;
  }>;
  
  // Mentions and reactions
  mentionedUserIds?: string[]; // [PORTAL] [ADMIN]
  mentions?: Array<{
    userId: string;
    userName: string;
    notified: boolean;
  }>;
  
  reactions?: Record<string, string[]>; // emoji -> [userIds] [PORTAL] [ADMIN]
  
  // Edit history [ADMIN]
  originalContent?: string | null;
  editedAt?: string | null; // ISO-8601 datetime
  editedBy?: string | null;
  editHistory?: Array<{
    editedAt: string;
    editedBy: string;
    oldContent: string;
  }>;
  
  // Admin fields
  isSystemMessage?: boolean; // [ADMIN]
  isHidden?: boolean; // [ADMIN] - For moderation
  moderatedBy?: string | null; // [ADMIN]
  metadata?: Record<string, unknown> | null; // [ADMIN]
  
  // Timestamps
  createdAt: string; // ISO-8601 datetime
  updatedAt: string; // ISO-8601 datetime
  deletedAt?: string | null; // ISO-8601 datetime [ADMIN]
  
  // Relations (optional)
  sender?: {
    id: string;
    name: string | null;
    email: string;
    image?: string;
  };
}

/**
 * Message thread
 */
export interface MessageThread {
  // Core identification
  id: string; // [PORTAL] [ADMIN]
  tenantId: string; // [ADMIN]
  
  // Thread information
  type: ThreadType; // [PORTAL] [ADMIN]
  title: string; // [PORTAL] [ADMIN]
  description?: string | null; // [PORTAL] [ADMIN]
  
  // Content summary
  lastMessage?: string | null; // [PORTAL] [ADMIN]
  lastMessageAt?: string | null; // ISO-8601 datetime [PORTAL] [ADMIN]
  
  // Participants
  participantIds: string[]; // [ADMIN]
  participants?: Array<{
    id: string;
    name: string | null;
    email: string;
    role?: string;
  }>; // [PORTAL] [ADMIN]
  
  // Unread tracking
  unreadCount?: number; // [PORTAL]
  lastReadAt?: string | null; // ISO-8601 datetime [PORTAL]
  
  // Thread settings
  isArchived?: boolean; // [PORTAL] [ADMIN]
  isPinned?: boolean; // [PORTAL] [ADMIN]
  muteNotifications?: boolean; // [PORTAL] [ADMIN]
  
  // Related entity [ADMIN]
  relatedEntityType?: string | null; // 'task', 'booking', 'service_request', etc.
  relatedEntityId?: string | null;
  
  // Admin fields [ADMIN]
  createdById: string;
  assignedToId?: string | null; // For support tickets
  priority?: string | null;
  status?: string | null;
  metadata?: Record<string, unknown> | null;
  
  // Timestamps
  createdAt: string; // ISO-8601 datetime
  updatedAt: string; // ISO-8601 datetime
}

/**
 * Message form data
 */
export interface MessageFormData {
  threadId: string;
  content: string;
  type?: MessageType;
  attachmentIds?: string[];
  mentionedUserIds?: string[];
}

/**
 * Thread creation data
 */
export interface ThreadCreationData {
  type: ThreadType;
  title: string;
  description?: string;
  participantIds: string[];
  relatedEntityType?: string;
  relatedEntityId?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Message filters for list queries
 */
export interface MessageFilters {
  threadId?: string;
  senderId?: string;
  type?: MessageType | 'all';
  fromDate?: string;
  toDate?: string;
  search?: string;
  hasAttachments?: boolean | null;
}

/**
 * Thread list request parameters
 */
export interface ThreadListParams {
  status?: 'active' | 'archived' | 'all';
  type?: ThreadType | 'all';
  search?: string;
  unreadOnly?: boolean;
  pinnedOnly?: boolean;
  sortBy?: 'lastMessageAt' | 'createdAt' | 'title';
  sortOrder?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
}

/**
 * Portal-safe message view (excludes admin-only fields)
 */
export type MessagePortalView = Omit<
  Message,
  | 'tenantId'
  | 'isSystemMessage'
  | 'isHidden'
  | 'moderatedBy'
  | 'metadata'
  | 'deletedAt'
  | 'editHistory'
  | 'originalContent'
  | 'editedBy'
>;

/**
 * Portal-safe thread view (excludes admin-only fields)
 */
export type ThreadPortalView = Omit<
  MessageThread,
  | 'tenantId'
  | 'createdById'
  | 'assignedToId'
  | 'priority'
  | 'status'
  | 'metadata'
  | 'relatedEntityType'
  | 'relatedEntityId'
>;

/**
 * Message list API response
 */
export interface MessageListResponse {
  messages: Message[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

/**
 * Thread list API response
 */
export interface ThreadListResponse {
  threads: MessageThread[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

/**
 * Message search result
 */
export interface MessageSearchResult {
  messageId: string;
  threadId: string;
  threadTitle: string;
  senderName: string;
  content: string;
  createdAt: string;
  context?: string; // Surrounding messages for context
}

/**
 * Message statistics [ADMIN]
 */
export interface MessageStats {
  totalMessages: number;
  totalThreads: number;
  activeThreads: number;
  archivedThreads: number;
  averageResponseTime: number; // in hours
  byType: Record<string, number>;
  unreadCount: number;
}

/**
 * Message/Thread activity (admin)
 */
export interface MessageActivity {
  timestamp: string; // ISO-8601 datetime
  action: 'created' | 'updated' | 'deleted' | 'archived' | 'pinned';
  messageId?: string;
  threadId: string;
  userId: string;
  details?: Record<string, unknown>;
}

/**
 * Typing indicator
 */
export interface TypingIndicator {
  threadId: string;
  userId: string;
  isTyping: boolean;
  lastTypingAt: string; // ISO-8601 datetime
}

/**
 * Message delivery status
 */
export interface MessageDeliveryStatus {
  messageId: string;
  threadId: string;
  sent: boolean;
  delivered: boolean;
  read: boolean;
  readAt?: string | null; // ISO-8601 datetime
  failureReason?: string | null;
}

/**
 * Bulk message operations [ADMIN]
 */
export interface MessageBulkAction {
  action: 'archive' | 'delete' | 'hide' | 'restore';
  messageIds?: string[];
  threadIds?: string[];
}
