/**
 * Invoice Entity Validation Schemas
 * Using Zod for runtime validation of Invoice data
 */

import { z } from 'zod';
import { InvoiceStatus, PaymentStatus } from '@/types/shared';

/**
 * Invoice line item schema
 */
export const InvoiceLineItemSchema = z.object({
  description: z.string().min(1).max(500),
  quantity: z.number().positive('Quantity must be positive'),
  unitPrice: z.number().positive('Unit price must be positive'),
  serviceId: z.string().cuid().optional().nullable(),
  bookingId: z.string().cuid().optional().nullable(),
  taxRate: z.number().min(0).max(100).optional(),
});

/**
 * Create invoice schema
 */
export const InvoiceCreateSchema = z.object({
  clientId: z.string().cuid('Invalid client ID'),
  invoiceDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format'),
  dueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format'),
  lineItems: z.array(InvoiceLineItemSchema).min(1, 'At least one line item is required'),
  notes: z.string().max(2000).optional().nullable(),
  internalNotes: z.string().max(2000).optional().nullable(),
  discountAmount: z.number().min(0).optional().nullable(),
  taxAmount: z.number().min(0).optional(),
  template: z.string().optional().nullable(),
});

/**
 * Update invoice schema
 */
export const InvoiceUpdateSchema = InvoiceCreateSchema.partial();

/**
 * Invoice payment schema
 */
export const InvoicePaymentSchema = z.object({
  invoiceId: z.string().cuid(),
  amount: z.number().positive('Amount must be positive'),
  paymentMethodId: z.string(),
  reference: z.string().optional(),
});

/**
 * Invoice filters schema
 */
export const InvoiceFiltersSchema = z.object({
  status: z.string().optional(),
  paymentStatus: z.string().optional(),
  clientId: z.string().optional(),
  fromDate: z.string().optional(),
  toDate: z.string().optional(),
  search: z.string().optional(),
  overdue: z.boolean().optional().nullable(),
  limit: z.number().int().min(1).max(100).default(50),
  offset: z.number().int().min(0).default(0),
  sortBy: z.enum(['invoiceDate', 'dueDate', 'total', 'status']).optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
});

/**
 * Send invoice schema
 */
export const SendInvoiceSchema = z.object({
  invoiceId: z.string().cuid(),
  recipientEmail: z.string().email('Invalid email address'),
  message: z.string().max(1000).optional(),
});

/**
 * Bulk invoice operation schema
 */
export const InvoiceBulkActionSchema = z.object({
  action: z.enum(['send', 'mark-paid', 'cancel', 'delete', 'regenerate-pdf']),
  invoiceIds: z.array(z.string().cuid()).min(1),
});

/**
 * Recurring invoice schema
 */
export const RecurringInvoiceSchema = z.object({
  clientId: z.string().cuid(),
  frequency: z.enum(['WEEKLY', 'MONTHLY', 'QUARTERLY', 'ANNUALLY']),
  nextInvoiceDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().nullable(),
  lineItems: z.array(InvoiceLineItemSchema).min(1),
});

/**
 * Infer TypeScript types from schemas
 */
export type InvoiceCreate = z.infer<typeof InvoiceCreateSchema>;
export type InvoiceUpdate = z.infer<typeof InvoiceUpdateSchema>;
export type InvoicePayment = z.infer<typeof InvoicePaymentSchema>;
export type InvoiceFilters = z.infer<typeof InvoiceFiltersSchema>;
export type SendInvoice = z.infer<typeof SendInvoiceSchema>;
export type InvoiceBulkAction = z.infer<typeof InvoiceBulkActionSchema>;
export type RecurringInvoice = z.infer<typeof RecurringInvoiceSchema>;

/**
 * Helper validation functions
 */
export function validateInvoiceCreate(data: unknown) {
  return InvoiceCreateSchema.parse(data);
}

export function safeParseInvoiceCreate(data: unknown) {
  return InvoiceCreateSchema.safeParse(data);
}

export function validateInvoicePayment(data: unknown) {
  return InvoicePaymentSchema.parse(data);
}
