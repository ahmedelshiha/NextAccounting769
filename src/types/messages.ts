/**
 * Messages Feature - TypeScript Type Definitions
 * Production-ready types for messaging and support tickets
 */

// ============================================================================
// Message Types
// ============================================================================

export interface ChatMessage {
  id: string;
  tenantId: string;
  room: string | null;
  userId: string;
  userName: string;
  role: string;
  text: string;
  createdAt: string;
}

export interface MessageThread {
  id: string;
  type: "chat" | "ticket";
  title: string;
  lastMessage: string;
  lastMessageAt: string;
  unreadCount: number;
  participants: string[];
  metadata?: Record<string, any>;
}

// ============================================================================
// Support Ticket Types
// ============================================================================

export interface SupportTicket {
  id: string;
  tenantId: string;
  userId: string;
  assignedToId: string | null;
  title: string;
  description: string | null;
  category: TicketCategory;
  priority: TicketPriority;
  status: TicketStatus;
  resolution: string | null;
  createdAt: string;
  updatedAt: string;
  resolvedAt: string | null;
  dueAt: string | null;
  slaFirstResponseAt: string | null;
  slaResolutionAt: string | null;
  attachmentIds: string[];
  tags: string[];
  metadata?: Record<string, any>;
  user?: {
    id: string;
    name: string | null;
    email: string;
  };
  assignedTo?: {
    id: string;
    name: string | null;
    email: string;
  } | null;
  comments?: SupportTicketComment[];
  statusHistory?: SupportTicketStatusHistory[];
}

export interface SupportTicketComment {
  id: string;
  ticketId: string;
  authorId: string;
  content: string;
  attachmentIds: string[];
  isInternal: boolean;
  createdAt: string;
  updatedAt: string;
  author?: {
    id: string;
    name: string | null;
    email: string;
  };
}

export interface SupportTicketStatusHistory {
  id: string;
  ticketId: string;
  previousStatus: string | null;
  newStatus: string;
  changedBy: string | null;
  reason: string | null;
  changedAt: string;
}

// ============================================================================
// Enums
// ============================================================================

export enum TicketStatus {
  OPEN = "OPEN",
  IN_PROGRESS = "IN_PROGRESS",
  WAITING_ON_CUSTOMER = "WAITING_ON_CUSTOMER",
  WAITING_ON_SUPPORT = "WAITING_ON_SUPPORT",
  RESOLVED = "RESOLVED",
  CLOSED = "CLOSED",
  CANCELLED = "CANCELLED",
}

export enum TicketPriority {
  LOW = "LOW",
  MEDIUM = "MEDIUM",
  HIGH = "HIGH",
  URGENT = "URGENT",
  CRITICAL = "CRITICAL",
}

export enum TicketCategory {
  GENERAL = "GENERAL",
  TECHNICAL = "TECHNICAL",
  BILLING = "BILLING",
  ACCOUNT = "ACCOUNT",
  FEATURE_REQUEST = "FEATURE_REQUEST",
  BUG_REPORT = "BUG_REPORT",
  COMPLIANCE = "COMPLIANCE",
  TAX = "TAX",
  OTHER = "OTHER",
}

// ============================================================================
// Request/Response Types
// ============================================================================

export interface MessagesListRequest {
  type?: "all" | "chat" | "ticket";
  status?: TicketStatus;
  priority?: TicketPriority;
  category?: TicketCategory;
  search?: string;
  limit?: number;
  offset?: number;
}

export interface MessagesListResponse {
  threads: MessageThread[];
  total: number;
  limit: number;
  offset: number;
}

export interface ThreadDetailsRequest {
  threadId: string;
  limit?: number;
  offset?: number;
}

export interface ThreadDetailsResponse {
  thread: MessageThread;
  messages: ChatMessage[];
  ticket?: SupportTicket;
  total: number;
}

export interface SendMessageRequest {
  threadId: string;
  text: string;
  attachments?: string[];
}

export interface CreateTicketRequest {
  title: string;
  description: string;
  category: TicketCategory;
  priority: TicketPriority;
  tags?: string[];
  attachments?: string[];
}

export interface UpdateTicketRequest {
  title?: string;
  description?: string;
  category?: TicketCategory;
  priority?: TicketPriority;
  status?: TicketStatus;
  assignedToId?: string;
  tags?: string[];
}

export interface AddCommentRequest {
  ticketId: string;
  content: string;
  attachments?: string[];
  isInternal?: boolean;
}

export interface MessagesStatsResponse {
  totalThreads: number;
  unreadThreads: number;
  openTickets: number;
  resolvedTickets: number;
  avgResponseTime: number;
  byCategory: Record<string, number>;
  byPriority: Record<string, number>;
  byStatus: Record<string, number>;
}

// ============================================================================
// Filter Types
// ============================================================================

export interface MessageFilters {
  type?: "all" | "chat" | "ticket";
  status?: TicketStatus | "all";
  priority?: TicketPriority | "all";
  category?: TicketCategory | "all";
  search?: string;
  sortBy?: "createdAt" | "updatedAt" | "priority";
  sortOrder?: "asc" | "desc";
  limit?: number;
  offset?: number;
}

// ============================================================================
// UI State Types
// ============================================================================

export interface MessagesUIState {
  selectedThreadId: string | null;
  isTicketModalOpen: boolean;
  isTicketDetailOpen: boolean;
  selectedTicketId: string | null;
  filters: MessageFilters;
}
