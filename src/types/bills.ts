/**
 * Bills Feature - TypeScript Types
 * Production-ready type definitions for Bills management
 */

export enum BillStatus {
  PENDING = "PENDING",
  APPROVED = "APPROVED",
  REJECTED = "REJECTED",
  PAID = "PAID",
}

export enum OcrStatus {
  PENDING = "PENDING",
  PROCESSING = "PROCESSING",
  COMPLETED = "COMPLETED",
  FAILED = "FAILED",
}

export interface Bill {
  id: string;
  tenantId: string;
  entityId?: string;
  
  // Basic info
  billNumber?: string;
  vendor: string;
  amount: number;
  currency: string;
  date: Date | string;
  dueDate?: Date | string;
  
  // Status
  status: BillStatus;
  approvedBy?: string;
  approvedAt?: Date | string;
  
  // OCR data
  ocrStatus: OcrStatus;
  ocrData?: OcrExtractedData;
  ocrConfidence?: number;
  
  // Attachments
  attachmentId?: string;
  attachment?: {
    id: string;
    name: string;
    url: string | null;
    contentType: string;
    size: number;
  };
  
  // Metadata
  category?: string;
  description?: string;
  notes?: string;
  tags?: string[];
  
  // Timestamps
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface OcrExtractedData {
  vendor?: string;
  amount?: number;
  currency?: string;
  date?: string;
  billNumber?: string;
  items?: OcrLineItem[];
  taxAmount?: number;
  subtotal?: number;
  confidence?: number;
  rawText?: string;
}

export interface OcrLineItem {
  description: string;
  quantity?: number;
  unitPrice?: number;
  amount: number;
}

export interface BillCreateInput {
  vendor: string;
  amount: number;
  currency?: string;
  date: Date | string;
  dueDate?: Date | string;
  category?: string;
  description?: string;
  notes?: string;
  tags?: string[];
  attachmentId?: string;
}

export interface BillUpdateInput {
  vendor?: string;
  amount?: number;
  currency?: string;
  date?: Date | string;
  dueDate?: Date | string;
  status?: BillStatus;
  category?: string;
  description?: string;
  notes?: string;
  tags?: string[];
  billNumber?: string;
}

export interface BillFilters {
  search?: string;
  status?: BillStatus | "all";
  category?: string;
  vendor?: string;
  startDate?: string;
  endDate?: string;
  minAmount?: number;
  maxAmount?: number;
  sortBy?: "date" | "amount" | "vendor" | "createdAt";
  sortOrder?: "asc" | "desc";
  limit?: number;
  offset?: number;
}

export interface BillStats {
  total: number;
  totalAmount: number;
  pending: number;
  pendingAmount: number;
  approved: number;
  approvedAmount: number;
  paid: number;
  paidAmount: number;
  byCategory: Record<string, { count: number; amount: number }>;
  byVendor: Record<string, { count: number; amount: number }>;
  byMonth: Array<{ month: string; count: number; amount: number }>;
}

export interface BillUploadResult {
  bill: Bill;
  ocrData?: OcrExtractedData;
}

export interface BillApprovalInput {
  approved: boolean;
  notes?: string;
}

// API Response types
export interface BillsListResponse {
  success: boolean;
  data: {
    bills: Bill[];
    total: number;
    limit: number;
    offset: number;
  };
}

export interface BillResponse {
  success: boolean;
  data: Bill;
}

export interface BillStatsResponse {
  success: boolean;
  data: BillStats;
}

export interface BillOcrResponse {
  success: boolean;
  data: {
    ocrData: OcrExtractedData;
    confidence: number;
  };
}

// Hook return types
export interface UseBillsReturn {
  bills: Bill[];
  total: number;
  isLoading: boolean;
  error: Error | null;
  mutate: () => void;
  loadMore: () => void;
  hasMore: boolean;
}

export interface UseBillUploadReturn {
  upload: (file: File, data?: Partial<BillCreateInput>) => Promise<Bill>;
  isUploading: boolean;
  progress: number;
  error: Error | null;
}

export interface UseBillStatsReturn {
  stats: BillStats | null;
  isLoading: boolean;
  error: Error | null;
  mutate: () => void;
}
