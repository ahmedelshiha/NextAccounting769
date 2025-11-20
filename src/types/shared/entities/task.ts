/**
 * Task entity types for both portal and admin interfaces
 * Some fields are admin-only and should be filtered at API layer
 */

export enum TaskPriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
}

export enum TaskStatus {
  OPEN = 'OPEN',
  IN_PROGRESS = 'IN_PROGRESS',
  REVIEW = 'REVIEW',
  COMPLETED = 'COMPLETED',
  BLOCKED = 'BLOCKED',
}

export interface Task {
  id: string
  tenantId: string
  title: string
  description?: string | null
  dueAt?: Date | null
  priority: TaskPriority
  status: TaskStatus
  assigneeId?: string | null
  complianceRequired: boolean
  complianceDeadline?: Date | null
  createdAt: Date
  updatedAt: Date
  
  // Relations (optional, loaded on demand)
  assignee?: TaskAssignee | null
  comments?: TaskComment[]
}

export interface TaskAssignee {
  id: string
  name?: string | null
  email: string
  image?: string | null
  department?: string | null
  position?: string | null
}

export interface TaskComment {
  id: string
  taskId: string
  authorId?: string | null
  parentId?: string | null
  content: string
  attachments?: Record<string, any> | null
  createdAt: Date
  updatedAt: Date
  
  // Relations (optional)
  author?: TaskCommentAuthor | null
  parent?: TaskComment | null
  replies?: TaskComment[]
}

export interface TaskCommentAuthor {
  id: string
  name?: string | null
  email: string
  image?: string | null
}

/**
 * Portal-safe version (excludes sensitive fields)
 * Clients can only see their own tasks or tasks assigned to them
 */
export type TaskPortalView = Task

/**
 * Admin view includes all fields
 */
export type TaskAdminView = Task

/**
 * Create task DTO
 */
export interface TaskCreateInput {
  title: string
  description?: string
  dueAt?: Date
  priority?: TaskPriority
  assigneeId?: string
  complianceRequired?: boolean
  complianceDeadline?: Date
}

/**
 * Update task DTO
 */
export interface TaskUpdateInput {
  title?: string
  description?: string
  dueAt?: Date | null
  priority?: TaskPriority
  status?: TaskStatus
  assigneeId?: string | null
  complianceRequired?: boolean
  complianceDeadline?: Date | null
}

/**
 * Task filter/list options
 */
export interface TaskListFilters {
  status?: TaskStatus | TaskStatus[]
  priority?: TaskPriority | TaskPriority[]
  assigneeId?: string
  search?: string
  dueBefore?: Date
  dueAfter?: Date
  limit?: number
  offset?: number
  sortBy?: 'createdAt' | 'dueAt' | 'priority' | 'status'
  sortOrder?: 'asc' | 'desc'
}

/**
 * Task list response
 */
export interface TaskListResponse {
  data: Task[]
  meta: {
    total: number
    limit: number
    offset: number
    hasMore: boolean
  }
}
