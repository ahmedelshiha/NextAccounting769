/**
 * Entity/KYC Validation Schemas
 * Using Zod for runtime validation of Entity and KYC data
 */

import { z } from 'zod';
import { EntityType, EntityStatus, KYCStep, VerificationStatus } from '@/types/shared';

/**
 * Address schema
 */
export const AddressSchema = z.object({
  street: z.string().min(1).max(255),
  city: z.string().min(1).max(100),
  state: z.string().min(1).max(100),
  postalCode: z.string().min(1).max(20),
  country: z.string().min(2).max(2), // ISO country code
});

/**
 * Create entity schema
 */
export const EntityCreateSchema = z.object({
  entityType: z.nativeEnum(EntityType),
  legalName: z.string().min(1).max(255),
  tradeName: z.string().max(255).optional().nullable(),
  email: z.string().email('Invalid email address'),
  phone: z.string().max(20).optional().nullable(),
  website: z.string().url('Invalid website URL').optional().nullable(),
  address: AddressSchema,
  taxId: z.string().max(50).optional().nullable(),
  registrationNumber: z.string().max(100).optional().nullable(),
});

/**
 * Update entity schema
 */
export const EntityUpdateSchema = EntityCreateSchema.partial();

/**
 * KYC step submission schema
 */
export const KYCStepSubmissionSchema = z.object({
  entityId: z.string().cuid(),
  step: z.nativeEnum(KYCStep),
  data: z.record(z.any()),
  documentIds: z.array(z.string().cuid()).optional(),
});

/**
 * Entity verification schema (admin)
 */
export const EntityVerificationSchema = z.object({
  entityId: z.string().cuid(),
  approved: z.boolean(),
  verificationLevel: z.number().min(0).max(100),
  notes: z.string().max(2000).optional(),
});

/**
 * Owner information schema
 */
export const OwnerSchema = z.object({
  name: z.string().min(1).max(255),
  email: z.string().email(),
  role: z.string().min(1).max(100),
  ownershipPercentage: z.number().min(0).max(100),
});

/**
 * Entity filters schema
 */
export const EntityFiltersSchema = z.object({
  status: z.string().optional(),
  entityType: z.string().optional(),
  verificationLevel: z.enum(['unverified', 'partial', 'complete']).optional(),
  search: z.string().optional(),
  fromDate: z.string().optional(),
  toDate: z.string().optional(),
  limit: z.number().int().min(1).max(100).default(50),
  offset: z.number().int().min(0).default(0),
  sortBy: z.enum(['legalName', 'createdAt', 'status', 'verificationLevel']).optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
});

/**
 * Update banking information schema (admin)
 */
export const BankingInfoSchema = z.object({
  entityId: z.string().cuid(),
  bankAccountNumber: z.string().min(5).max(50),
  bankRoutingNumber: z.string().min(5).max(20),
  bankAccountName: z.string().min(1).max(255),
});

/**
 * Bulk entity operation schema
 */
export const EntityBulkActionSchema = z.object({
  action: z.enum(['verify', 'reject', 'suspend', 'archive']),
  entityIds: z.array(z.string().cuid()).min(1),
  notes: z.string().max(2000).optional(),
});

/**
 * Compliance requirement schema
 */
export const ComplianceRequirementSchema = z.object({
  entityId: z.string().cuid(),
  requirementType: z.string().min(1).max(255),
  deadline: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().nullable(),
  documentIds: z.array(z.string().cuid()).optional(),
  notes: z.string().max(2000).optional(),
});

/**
 * Infer TypeScript types from schemas
 */
export type EntityCreate = z.infer<typeof EntityCreateSchema>;
export type EntityUpdate = z.infer<typeof EntityUpdateSchema>;
export type KYCStepSubmission = z.infer<typeof KYCStepSubmissionSchema>;
export type EntityVerification = z.infer<typeof EntityVerificationSchema>;
export type Owner = z.infer<typeof OwnerSchema>;
export type EntityFilters = z.infer<typeof EntityFiltersSchema>;
export type BankingInfo = z.infer<typeof BankingInfoSchema>;
export type EntityBulkAction = z.infer<typeof EntityBulkActionSchema>;
export type ComplianceRequirement = z.infer<typeof ComplianceRequirementSchema>;

/**
 * Helper validation functions
 */
export function validateEntityCreate(data: unknown) {
  return EntityCreateSchema.parse(data);
}

export function safeParseEntityCreate(data: unknown) {
  return EntityCreateSchema.safeParse(data);
}

export function validateKYCStepSubmission(data: unknown) {
  return KYCStepSubmissionSchema.parse(data);
}

export function validateBankingInfo(data: unknown) {
  return BankingInfoSchema.parse(data);
}
