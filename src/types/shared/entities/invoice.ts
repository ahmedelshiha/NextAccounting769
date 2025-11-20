/**
 * Shared Invoice Entity Type Definitions
 * Used by Admin for creation and Portal for viewing/payment
 * 
 * [PORTAL] = visible to portal users
 * [ADMIN] = visible only to admins
 */

/**
 * Invoice status enumeration
 */
export enum InvoiceStatus {
  DRAFT = 'DRAFT',
  SENT = 'SENT',
  VIEWED = 'VIEWED',
  OVERDUE = 'OVERDUE',
  PAID = 'PAID',
  PARTIALLY_PAID = 'PARTIALLY_PAID',
  CANCELLED = 'CANCELLED',
  REFUNDED = 'REFUNDED',
}

/**
 * Payment status enumeration
 */
export enum PaymentStatus {
  NOT_STARTED = 'NOT_STARTED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  REFUNDED = 'REFUNDED',
}

/**
 * Invoice line item
 */
export interface InvoiceLineItem {
  id: string;
  invoiceId: string;
  description: string; // [PORTAL] [ADMIN]
  quantity: number; // [PORTAL] [ADMIN]
  unitPrice: number; // [PORTAL] [ADMIN]
  lineTotal: number; // [PORTAL] [ADMIN]
  serviceId?: string | null; // [ADMIN]
  bookingId?: string | null; // [ADMIN]
  taxAmount?: number; // [PORTAL] [ADMIN]
  taxRate?: number; // [ADMIN]
}

/**
 * Core Invoice entity
 */
export interface Invoice {
  // Core identification
  id: string; // [PORTAL] [ADMIN]
  tenantId: string; // [ADMIN]
  invoiceNumber: string; // [PORTAL] [ADMIN]
  
  // Client information
  clientId: string; // [ADMIN]
  clientName: string; // [PORTAL] [ADMIN]
  clientEmail: string; // [ADMIN]
  clientAddress?: string | null; // [ADMIN]
  
  // Date information
  invoiceDate: string; // ISO-8601 date [PORTAL] [ADMIN]
  dueDate: string; // ISO-8601 date [PORTAL] [ADMIN]
  
  // Financial details
  subtotal: number; // [PORTAL] [ADMIN]
  taxAmount: number; // [PORTAL] [ADMIN]
  discountAmount?: number | null; // [ADMIN]
  total: number; // [PORTAL] [ADMIN]
  currency?: string | null; // [PORTAL] [ADMIN]
  
  // Payment tracking
  status: InvoiceStatus; // [PORTAL] [ADMIN]
  amountPaid?: number; // [PORTAL] [ADMIN]
  paymentStatus?: PaymentStatus; // [PORTAL] [ADMIN]
  
  // Payment information [ADMIN]
  paymentMethod?: string | null;
  paymentReference?: string | null;
  paymentDueDate?: string | null;
  
  // Notes
  notes?: string | null; // [PORTAL] [ADMIN]
  internalNotes?: string | null; // [ADMIN]
  
  // Timeline [ADMIN]
  sentAt?: string | null; // ISO-8601 datetime
  viewedAt?: string | null; // ISO-8601 datetime
  paidAt?: string | null; // ISO-8601 datetime
  reminderSentAt?: string | null;
  overdueNotificationSentAt?: string | null;
  
  // Admin fields
  createdBy?: string | null; // [ADMIN]
  template?: string | null; // [ADMIN]
  metadata?: Record<string, unknown> | null; // [ADMIN]
  
  // Timestamps
  createdAt: string; // ISO-8601 datetime
  updatedAt: string; // ISO-8601 datetime
  
  // Relations (optional)
  lineItems?: InvoiceLineItem[];
  
  client?: {
    id: string;
    name: string;
    email: string;
  };
  
  payments?: Payment[];
}

/**
 * Payment record
 */
export interface Payment {
  id: string;
  invoiceId: string;
  amount: number;
  paymentMethod: string;
  paymentReference: string;
  status: PaymentStatus;
  processedAt: string; // ISO-8601 datetime
  completedAt?: string | null; // ISO-8601 datetime
  failureReason?: string | null;
  metadata?: Record<string, unknown>;
}

/**
 * Invoice form data for creation/update
 */
export interface InvoiceFormData {
  clientId: string;
  invoiceDate: string;
  dueDate: string;
  lineItems: Array<{
    description: string;
    quantity: number;
    unitPrice: number;
    serviceId?: string | null;
    bookingId?: string | null;
    taxRate?: number;
  }>;
  notes?: string | null;
  internalNotes?: string | null;
  discountAmount?: number | null;
  taxAmount?: number;
  template?: string | null;
}

/**
 * Invoice filters for list queries
 */
export interface InvoiceFilters {
  status?: InvoiceStatus | 'all';
  paymentStatus?: PaymentStatus | 'all';
  clientId?: string;
  fromDate?: string;
  toDate?: string;
  search?: string;
  overdue?: boolean | null;
}

/**
 * Invoice list request parameters
 */
export interface InvoiceListParams extends InvoiceFilters {
  limit?: number;
  offset?: number;
  sortBy?: 'invoiceDate' | 'dueDate' | 'total' | 'status';
  sortOrder?: 'asc' | 'desc';
}

/**
 * Portal-safe invoice view (excludes admin-only fields)
 */
export type InvoicePortalView = Omit<
  Invoice,
  | 'tenantId'
  | 'clientEmail'
  | 'clientAddress'
  | 'discountAmount'
  | 'paymentMethod'
  | 'paymentReference'
  | 'internalNotes'
  | 'sentAt'
  | 'viewedAt'
  | 'reminderSentAt'
  | 'overdueNotificationSentAt'
  | 'createdBy'
  | 'template'
  | 'metadata'
>;

/**
 * Invoice list API response
 */
export interface InvoiceListResponse {
  invoices: Invoice[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

/**
 * Invoice statistics [ADMIN]
 */
export interface InvoiceStats {
  total: number;
  draft: number;
  sent: number;
  paid: number;
  overdue: number;
  totalRevenue: number;
  totalOutstanding: number;
  averagePaymentTime: number; // in days
  paymentRate: number; // percentage
}

/**
 * Invoice payment request
 */
export interface InvoicePaymentRequest {
  invoiceId: string;
  amount: number;
  paymentMethodId: string;
  reference?: string;
}

/**
 * Invoice PDF generation request
 */
export interface InvoicePDFRequest {
  invoiceId: string;
  includePaymentLink?: boolean;
  locale?: string;
}

/**
 * Invoice template
 */
export interface InvoiceTemplate {
  id: string;
  tenantId: string;
  name: string;
  description?: string;
  html: string; // Template HTML
  css?: string; // Template styles
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

/**
 * Recurring invoice
 */
export interface RecurringInvoice {
  id: string;
  tenantId: string;
  clientId: string;
  frequency: 'WEEKLY' | 'MONTHLY' | 'QUARTERLY' | 'ANNUALLY';
  nextInvoiceDate: string; // ISO-8601 date
  endDate?: string | null; // ISO-8601 date
  lineItems: InvoiceLineItem[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

/**
 * Invoice payment method
 */
export interface PaymentMethod {
  id: string;
  userId: string;
  type: 'CREDIT_CARD' | 'BANK_TRANSFER' | 'PAYPAL' | 'STRIPE' | 'OTHER';
  displayName: string;
  isDefault: boolean;
  expiresAt?: string | null;
  metadata?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

/**
 * Invoice for bulk operations [ADMIN]
 */
export interface InvoiceBulkAction {
  action: 'send' | 'mark_paid' | 'cancel' | 'delete' | 'regenerate_pdf';
  invoiceIds: string[];
}
