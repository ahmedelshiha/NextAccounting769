/**
 * Shared Service Entity Type Definitions
 * Used by both Admin and Portal for service management and browsing
 * 
 * Admin can see and modify all fields.
 * Portal users see only publicly available fields marked as [PORTAL].
 */

/**
 * Service Status enumeration
 * Represents the lifecycle state of a service
 */
export enum ServiceStatus {
  DRAFT = 'DRAFT',
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  DEPRECATED = 'DEPRECATED',
  RETIRED = 'RETIRED',
}

/**
 * Core Service entity - Base fields available to both portal and admin
 * [PORTAL] = visible to portal users
 * [ADMIN] = visible only to admins
 */
export interface Service {
  // Core identification
  id: string; // [PORTAL] [ADMIN]
  tenantId: string; // [ADMIN]
  slug: string; // [PORTAL] [ADMIN]
  
  // Display information
  name: string; // [PORTAL] [ADMIN]
  description: string; // [PORTAL] [ADMIN]
  shortDesc?: string | null; // [PORTAL] [ADMIN]
  image?: string | null; // [PORTAL] [ADMIN]
  
  // Categorization
  category?: string | null; // [PORTAL] [ADMIN]
  features: string[]; // [PORTAL] [ADMIN]
  requiredSkills?: string[]; // [ADMIN]
  
  // Pricing (mixed visibility)
  price?: number | null; // [PORTAL] [ADMIN]
  basePrice?: number | null; // [ADMIN] - internal cost
  currency?: string | null; // [PORTAL] [ADMIN]
  
  // Duration
  duration?: number | null; // Minutes [PORTAL] [ADMIN]
  estimatedDurationHours?: number | null; // [ADMIN]
  
  // Status and visibility
  active: boolean; // [PORTAL] [ADMIN]
  featured: boolean; // [PORTAL] [ADMIN]
  status: ServiceStatus; // [PORTAL] [ADMIN]
  
  // Admin-only operational settings
  bookingEnabled?: boolean; // [ADMIN]
  advanceBookingDays?: number; // [ADMIN] - How many days in advance clients can book
  minAdvanceHours?: number; // [ADMIN] - Minimum hours before booking is allowed
  maxDailyBookings?: number | null; // [ADMIN] - Limit bookings per day
  bufferTime?: number; // [ADMIN] - Minutes between bookings
  
  // Advanced admin settings
  businessHours?: Record<string, unknown> | null; // [ADMIN]
  blackoutDates?: string[]; // [ADMIN] - Dates when service is unavailable
  serviceSettings?: Record<string, unknown> | null; // [ADMIN]
  
  // Metrics and analytics
  views?: number; // [ADMIN]
  metrics?: ServiceOperationalMetrics; // [ADMIN]
  
  // Timestamps
  createdAt: string; // ISO-8601 datetime
  updatedAt: string; // ISO-8601 datetime
}

/**
 * Service operational metrics (admin-only)
 */
export interface ServiceOperationalMetrics {
  bookings?: number;
  revenue?: number;
  conversionRate?: number;
  rating?: number;
  lastBookingAt?: string | null;
}

/**
 * Lightweight service representation for lists and dropdowns
 */
export interface ServiceLite {
  id: string;
  name: string;
  shortDesc?: string | null;
  price?: number | null;
  duration?: number | null;
  slug: string;
}

/**
 * Service data for create/update forms
 */
export interface ServiceFormData {
  name: string;
  slug: string;
  description: string;
  shortDesc?: string | null;
  features: string[];
  price?: number | null;
  basePrice?: number | null;
  duration?: number | null;
  estimatedDurationHours?: number | null;
  category?: string | null;
  currency?: string | null;
  featured: boolean;
  active: boolean;
  status: ServiceStatus;
  image?: string | null;
  bookingEnabled?: boolean;
  advanceBookingDays?: number | null;
  minAdvanceHours?: number | null;
  maxDailyBookings?: number | null;
  bufferTime?: number | null;
  requiredSkills?: string[];
  serviceSettings?: Record<string, unknown> | null;
  blackoutDates?: string[];
  businessHours?: Record<string, unknown> | null;
}

/**
 * Service filtering options
 */
export interface ServiceFilters {
  search?: string;
  category?: string | null;
  featured?: boolean | null;
  status?: ServiceStatus | 'all';
  minPrice?: number | null;
  maxPrice?: number | null;
  tags?: string[];
  bookingEnabled?: boolean | null;
  currency?: string | null;
}

/**
 * Service list request parameters (extends filters with pagination/sorting)
 */
export interface ServiceListParams extends ServiceFilters {
  limit?: number;
  offset?: number;
  sortBy?: 'name' | 'price' | 'createdAt' | 'updatedAt' | 'views' | 'bookings';
  sortOrder?: 'asc' | 'desc';
}

/**
 * Service list API response
 */
export interface ServiceListResponse {
  services: Service[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

/**
 * Portal-safe service view (excludes admin-only fields)
 */
export type ServicePortalView = Omit<
  Service,
  | 'basePrice'
  | 'advanceBookingDays'
  | 'minAdvanceHours'
  | 'maxDailyBookings'
  | 'bufferTime'
  | 'businessHours'
  | 'blackoutDates'
  | 'serviceSettings'
  | 'views'
  | 'metrics'
  | 'requiredSkills'
>;

/**
 * Service statistics (admin-only)
 */
export interface ServiceStats {
  total: number;
  active: number;
  inactive: number;
  featured: number;
  draft: number;
  categories: number;
  averagePrice: number;
  totalRevenue: number;
}

/**
 * Service analytics data (admin-only)
 */
export interface ServiceAnalytics {
  monthlyBookings: Array<{ month: string; bookings: number }>;
  revenueByService: Array<{ service: string; revenue: number }>;
  popularServices: Array<{ service: string; bookings: number }>;
  conversionRates: Array<{ service: string; rate: number }>;
}

/**
 * Bulk action types for services
 */
export type ServiceBulkActionType =
  | 'activate'
  | 'deactivate'
  | 'feature'
  | 'unfeature'
  | 'delete'
  | 'category'
  | 'price-update'
  | 'clone'
  | 'settings-update';

/**
 * Bulk action request
 */
export interface BulkAction {
  action: ServiceBulkActionType;
  serviceIds: string[];
  value?: string | number | Record<string, unknown>;
}
