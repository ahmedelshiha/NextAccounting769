/**
 * API Type Definitions
 * 
 * Centralized type definitions for all API requests, responses, and related types.
 * Ensures consistency across the application and reduces type duplication.
 */

import { UserItem } from '../contexts/UsersContextProvider'

// ============================================================================
// REQUEST TYPES
// ============================================================================

export interface GetUsersRequest {
  limit?: number
  offset?: number
  search?: string
  role?: string
  status?: string
  department?: string
  sort?: string
  sortOrder?: 'asc' | 'desc'
}

export interface UpdateUserRequest {
  id: string
  updates: Partial<UserItem>
}

export interface BulkActionRequest {
  userIds: string[]
  action: string
  value: any
}

export interface DryRunRequest {
  userIds: string[]
  action: string
  value: any
}

export interface UndoRequest {
  operationId: string
}

// ============================================================================
// RESPONSE TYPES
// ============================================================================

export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
  message?: string
  timestamp?: string
}

export interface PaginatedResponse<T> {
  items: T[]
  total: number
  limit: number
  offset: number
  hasMore: boolean
}

export interface GetUsersResponse {
  users: UserItem[]
  total: number
  limit: number
  offset: number
}

export interface GetUserResponse {
  user: UserItem
}

export interface UpdateUserResponse {
  user: UserItem
  message?: string
}

export interface DeleteUserResponse {
  success: boolean
  deletedId: string
  message?: string
}

export interface StatsResponse {
  totalUsers: number
  activeUsers: number
  pendingApprovals: number
  inProgressWorkflows: number
  systemHealth: number
  costPerUser: number
  roleDistribution?: Record<string, number>
  userGrowth?: {
    labels: string[]
    values: number[]
  }
  lastUpdated?: string
}

export interface BulkActionResponse {
  success: boolean
  affected: number
  operationId: string
  message: string
  errors?: string[]
  startTime?: string
  completedTime?: string
}

export interface DryRunResponse {
  affected: number
  estimatedTime: number
  warnings: string[]
  details: {
    field: string
    oldValue: any
    newValue: any
  }[]
}

export interface UndoResponse {
  success: boolean
  reverted: number
  message: string
  operationId: string
}

// ============================================================================
// ERROR TYPES
// ============================================================================

export class ApiError extends Error {
  constructor(
    public statusCode: number,
    public message: string,
    public code?: string,
    public details?: any
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

export interface ApiErrorResponse {
  error: {
    code: string
    message: string
    details?: any
    statusCode: number
  }
}

// ============================================================================
// QUERY PARAMETER TYPES
// ============================================================================

export interface UserQueryParams {
  limit?: number
  offset?: number
  search?: string
  role?: string
  status?: string
  department?: string
  sort?: 'name' | 'email' | 'createdAt' | 'lastLoginAt'
  sortOrder?: 'asc' | 'desc'
  minLastLogin?: string // ISO date string
  maxLastLogin?: string // ISO date string
}

export interface StatsQueryParams {
  startDate?: string // ISO date string
  endDate?: string // ISO date string
  groupBy?: 'day' | 'week' | 'month'
}

// ============================================================================
// OPERATION TRACKING TYPES
// ============================================================================

export interface BulkOperation {
  id: string
  type: string
  userId: string
  userIds: string[]
  action: string
  value: any
  status: 'pending' | 'in_progress' | 'completed' | 'failed'
  affectedCount: number
  totalCount: number
  startedAt: string
  completedAt?: string
  error?: string
  canUndo: boolean
  undoExpiresAt?: string
}

export interface OperationHistory {
  operations: BulkOperation[]
  total: number
  limit: number
  offset: number
}

// ============================================================================
// CACHE TYPES
// ============================================================================

export interface CacheEntry<T> {
  data: T
  timestamp: number
  expiresAt: number
  etag?: string
}

export interface CacheConfig {
  ttl: number // Time to live in milliseconds
  maxSize?: number
  strategy?: 'LRU' | 'FIFO'
}

// ============================================================================
// FILTER & SORT TYPES
// ============================================================================

export interface FilterCriteria {
  field: string
  operator: 'eq' | 'ne' | 'gt' | 'lt' | 'gte' | 'lte' | 'in' | 'contains'
  value: any
}

export interface SortCriteria {
  field: string
  order: 'asc' | 'desc'
}

// ============================================================================
// VALIDATION TYPES
// ============================================================================

export interface ValidationError {
  field: string
  message: string
  code: string
}

export interface ValidationResult {
  valid: boolean
  errors: ValidationError[]
  warnings?: ValidationError[]
}

// ============================================================================
// WEBHOOK & EVENT TYPES
// ============================================================================

export interface WebhookEvent {
  id: string
  type: 'user.created' | 'user.updated' | 'user.deleted' | 'bulk_action.completed'
  timestamp: string
  data: any
  metadata?: Record<string, any>
}

export interface WebhookPayload {
  event: WebhookEvent
  signature: string
  timestamp: number
}

// ============================================================================
// FEATURE FLAG TYPES
// ============================================================================

export interface FeatureFlagConfig {
  name: string
  enabled: boolean
  rolloutPercentage: number
  targetUsers?: string[]
  targetRoles?: string[]
  metadata?: Record<string, any>
}

export interface FeatureFlagResponse {
  flags: FeatureFlagConfig[]
  timestamp: string
}

// ============================================================================
// HEALTH CHECK TYPES
// ============================================================================

export interface HealthCheckResponse {
  status: 'healthy' | 'degraded' | 'unhealthy'
  timestamp: string
  services: {
    database: 'ok' | 'error'
    cache: 'ok' | 'error'
    storage: 'ok' | 'error'
  }
  version: string
}

// ============================================================================
// PERFORMANCE METRICS TYPES
// ============================================================================

export interface PerformanceMetrics {
  endpoint: string
  method: string
  duration: number // milliseconds
  statusCode: number
  timestamp: string
  userId?: string
  cacheHit: boolean
}

export interface PerformanceStatsResponse {
  metrics: PerformanceMetrics[]
  aggregates: {
    avgDuration: number
    minDuration: number
    maxDuration: number
    p95Duration: number
    p99Duration: number
    totalRequests: number
    errorRate: number
  }
}

// ============================================================================
// EXPORT TYPES
// ============================================================================

export interface ExportFormat {
  format: 'csv' | 'json' | 'xlsx'
  fields: string[]
  includeMetadata?: boolean
}

export interface ExportRequest {
  userIds?: string[]
  filters?: Record<string, any>
  exportFormat: ExportFormat
}

export interface ExportResponse {
  jobId: string
  status: 'queued' | 'processing' | 'completed' | 'failed'
  downloadUrl?: string
  expiresAt?: string
  message?: string
}
