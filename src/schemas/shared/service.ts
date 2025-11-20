/**
 * Service Entity Validation Schemas
 * Using Zod for runtime validation of Service data
 * Used in API routes and client forms
 */

import { z } from 'zod';
import { ServiceStatus } from '@/types/shared';

/**
 * Base service schema - common fields for all operations
 */
export const ServiceBaseSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255, 'Name must be 255 characters or less'),
  slug: z.string().min(1, 'Slug is required').max(255).regex(/^[a-z0-9-]+$/, 'Slug must contain only lowercase letters, numbers, and hyphens'),
  description: z.string().min(10, 'Description must be at least 10 characters').max(5000, 'Description must be 5000 characters or less'),
  shortDesc: z.string().max(500, 'Short description must be 500 characters or less').optional().nullable(),
  category: z.string().max(255).optional().nullable(),
  features: z.array(z.string()).default([]),
  price: z.number().positive('Price must be positive').optional().nullable(),
  currency: z.string().length(3, 'Currency must be 3-letter ISO code').optional().nullable(),
  duration: z.number().int().positive('Duration must be positive').optional().nullable(),
  image: z.string().url('Image must be a valid URL').optional().nullable(),
  active: z.boolean().default(true),
  featured: z.boolean().default(false),
  status: z.nativeEnum(ServiceStatus).default(ServiceStatus.ACTIVE),
});

/**
 * Create service schema (admin)
 * Includes admin-only fields like basePrice, booking settings
 */
export const ServiceCreateSchema = ServiceBaseSchema.extend({
  basePrice: z.number().positive('Base price must be positive').optional().nullable(),
  estimatedDurationHours: z.number().int().positive().optional().nullable(),
  requiredSkills: z.array(z.string()).optional(),
  bookingEnabled: z.boolean().default(true),
  advanceBookingDays: z.number().int().min(0).default(30),
  minAdvanceHours: z.number().int().min(0).default(24),
  maxDailyBookings: z.number().int().positive().optional().nullable(),
  bufferTime: z.number().int().min(0).default(0),
  businessHours: z.record(z.any()).optional().nullable(),
  blackoutDates: z.array(z.string()).optional(),
  serviceSettings: z.record(z.any()).optional().nullable(),
});

/**
 * Update service schema (admin)
 * All fields are optional for partial updates
 */
export const ServiceUpdateSchema = ServiceCreateSchema.partial();

/**
 * Service list filters schema
 */
export const ServiceFiltersSchema = z.object({
  search: z.string().optional(),
  category: z.string().optional().nullable(),
  featured: z.boolean().optional().nullable(),
  status: z.string().optional(),
  minPrice: z.number().optional().nullable(),
  maxPrice: z.number().optional().nullable(),
  tags: z.array(z.string()).optional(),
  bookingEnabled: z.boolean().optional().nullable(),
  currency: z.string().optional().nullable(),
  limit: z.number().int().min(1).max(100).default(50),
  offset: z.number().int().min(0).default(0),
  sortBy: z.enum(['name', 'price', 'createdAt', 'updatedAt', 'views', 'bookings']).optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
});

/**
 * Service bulk action schema
 */
export const ServiceBulkActionSchema = z.object({
  action: z.enum(['activate', 'deactivate', 'feature', 'unfeature', 'delete', 'category', 'price-update', 'clone', 'settings-update']),
  serviceIds: z.array(z.string().min(1)).min(1),
  value: z.union([z.string(), z.number(), z.record(z.any())]).optional(),
});

/**
 * Infer TypeScript types from schemas
 */
export type ServiceCreate = z.infer<typeof ServiceCreateSchema>;
export type ServiceUpdate = z.infer<typeof ServiceUpdateSchema>;
export type ServiceFilters = z.infer<typeof ServiceFiltersSchema>;
export type ServiceBulkAction = z.infer<typeof ServiceBulkActionSchema>;

/**
 * Helper function to validate and parse service data
 */
export function validateServiceCreate(data: unknown) {
  return ServiceCreateSchema.parse(data);
}

/**
 * Helper function to safely parse service data (returns null on error)
 */
export function safeParseServiceCreate(data: unknown) {
  return ServiceCreateSchema.safeParse(data);
}
