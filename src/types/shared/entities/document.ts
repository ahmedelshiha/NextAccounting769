/**
 * Shared Document Entity Type Definitions
 * Used by both Admin and Portal for document management
 * 
 * [PORTAL] = visible to portal users
 * [ADMIN] = visible only to admins
 */

/**
 * Document status enumeration
 */
export enum DocumentStatus {
  PENDING = 'PENDING',
  SCANNING = 'SCANNING',
  SCANNED = 'SCANNED',
  CLEAN = 'CLEAN',
  INFECTED = 'INFECTED',
  ERROR = 'ERROR',
  ARCHIVED = 'ARCHIVED',
}

/**
 * Document visibility level
 */
export enum DocumentVisibility {
  PRIVATE = 'PRIVATE',      // Only uploader
  INTERNAL = 'INTERNAL',    // Team only
  SHARED = 'SHARED',        // Specific users
  PUBLIC = 'PUBLIC',        // Everyone in tenant
}

/**
 * Core Document/File Version entity
 */
export interface Document {
  // Core identification
  id: string; // [PORTAL] [ADMIN]
  tenantId: string; // [ADMIN]
  
  // File information
  filename: string; // [PORTAL] [ADMIN]
  storageKey: string; // [ADMIN] - Storage provider key
  mimeType: string; // [PORTAL] [ADMIN]
  size: number; // Bytes [PORTAL] [ADMIN]
  
  // Metadata
  description?: string | null; // [PORTAL] [ADMIN]
  category?: string | null; // [ADMIN]
  tags?: string[]; // [ADMIN]
  
  // Uploader information
  uploadedById: string; // [PORTAL] [ADMIN]
  uploadedAt: string; // ISO-8601 datetime [PORTAL] [ADMIN]
  
  // Version control
  version: number; // [ADMIN]
  parentDocumentId?: string | null; // [ADMIN] - For document versions
  
  // Visibility and access control
  visibility: DocumentVisibility; // [ADMIN]
  sharedWithUserIds?: string[]; // [ADMIN] - Users who have access
  sharedWithRoles?: string[]; // [ADMIN] - Roles who have access
  
  // Virus scanning status [ADMIN]
  status: DocumentStatus;
  scannerResult?: string | null; // [ADMIN]
  scannedAt?: string | null; // ISO-8601 datetime [ADMIN]
  
  // Audit and retention
  viewCount?: number; // [ADMIN]
  downloadCount?: number; // [ADMIN]
  lastViewedAt?: string | null; // ISO-8601 datetime [ADMIN]
  
  // Lifecycle management [ADMIN]
  expiresAt?: string | null; // ISO-8601 datetime
  retentionDays?: number | null;
  isStarred?: boolean; // [PORTAL] - User's favorite flag
  isArchived?: boolean; // [ADMIN]
  
  // Metadata
  metadata?: Record<string, unknown> | null; // [ADMIN]
  
  // Timestamps
  createdAt: string; // ISO-8601 datetime
  updatedAt: string; // ISO-8601 datetime
  
  // Relations (optional)
  uploader?: {
    id: string;
    name: string | null;
    email: string;
  };
}

/**
 * Document folder/collection
 */
export interface DocumentFolder {
  id: string;
  tenantId: string;
  name: string;
  description?: string;
  parentFolderId?: string | null;
  ownerId: string;
  createdAt: string;
  updatedAt: string;
  documents?: Document[];
  subFolders?: DocumentFolder[];
}

/**
 * Document link (share link)
 */
export interface DocumentLink {
  id: string;
  documentId: string;
  token: string;
  createdBy: string;
  expiresAt?: string | null;
  allowDownload: boolean;
  allowPreview: boolean;
  createdAt: string;
  updatedAt: string;
}

/**
 * Document audit log [ADMIN]
 */
export interface DocumentAuditLog {
  id: string;
  documentId: string;
  userId: string;
  action: 'UPLOADED' | 'VIEWED' | 'DOWNLOADED' | 'DELETED' | 'SHARED' | 'SCANNED';
  details?: Record<string, unknown>;
  timestamp: string; // ISO-8601 datetime
}

/**
 * Document upload request
 */
export interface DocumentUploadRequest {
  file: File;
  description?: string;
  category?: string;
  tags?: string[];
  visibility?: DocumentVisibility;
  sharedWithUserIds?: string[];
  sharedWithRoles?: string[];
}

/**
 * Document filters for list queries
 */
export interface DocumentFilters {
  category?: string;
  tags?: string[];
  uploadedBy?: string;
  visibility?: DocumentVisibility | 'all';
  status?: DocumentStatus | 'all';
  search?: string;
  fromDate?: string;
  toDate?: string;
  isArchived?: boolean | null;
  isStarred?: boolean | null;
}

/**
 * Document list request parameters
 */
export interface DocumentListParams extends DocumentFilters {
  limit?: number;
  offset?: number;
  sortBy?: 'uploadedAt' | 'filename' | 'size' | 'views';
  sortOrder?: 'asc' | 'desc';
}

/**
 * Portal-safe document view (excludes admin-only fields)
 */
export type DocumentPortalView = Omit<
  Document,
  | 'tenantId'
  | 'storageKey'
  | 'category'
  | 'tags'
  | 'visibility'
  | 'sharedWithUserIds'
  | 'sharedWithRoles'
  | 'status'
  | 'scannerResult'
  | 'scannedAt'
  | 'viewCount'
  | 'downloadCount'
  | 'lastViewedAt'
  | 'retentionDays'
  | 'isArchived'
  | 'metadata'
>;

/**
 * Document list API response
 */
export interface DocumentListResponse {
  documents: Document[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

/**
 * Document statistics [ADMIN]
 */
export interface DocumentStats {
  total: number;
  byStatus: Record<string, number>;
  totalSize: number; // in bytes
  scannedCount: number;
  infectedCount: number;
  averageSize: number;
  newestDocument?: string;
  oldestDocument?: string;
}

/**
 * Document with preview/thumbnail
 */
export interface DocumentWithPreview extends Document {
  previewUrl?: string;
  thumbnailUrl?: string;
  isPreviewable?: boolean;
}

/**
 * Document version history [ADMIN]
 */
export interface DocumentVersionHistory {
  versions: Array<{
    id: string;
    version: number;
    uploadedAt: string;
    uploadedBy: string;
    size: number;
  }>;
}

/**
 * Bulk document operations [ADMIN]
 */
export interface DocumentBulkAction {
  action: 'move' | 'delete' | 'share' | 'archive' | 'tag';
  documentIds: string[];
  value?: string | string[];
}

/**
 * Document notification settings
 */
export interface DocumentNotificationSettings {
  notifyOnUpload: boolean;
  notifyOnDelete: boolean;
  notifyOnShare: boolean;
  notifyOnExpiry: boolean;
}
