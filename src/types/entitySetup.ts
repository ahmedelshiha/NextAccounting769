import { Prisma } from "@prisma/client";

/**
 * Supported registration types across countries
 */
export type RegistrationType =
  | "TRN" // UAE Tax Registration Number
  | "ZATCA" // KSA VAT Registration
  | "ZAKAT" // KSA Zakat Registration
  | "WHT" // Withholding Tax Registration (KSA)
  | "ETA" // Egypt Tax Authority
  | "VAT"; // Generic VAT Registration

/**
 * Entity types for obligation filtering
 */
export type EntityType = "company" | "individual" | "freelancer" | "partnership";

/**
 * Entity status
 */
export type EntityStatus = "ACTIVE" | "PENDING" | "ARCHIVED" | "SUSPENDED";

/**
 * License/Registration status
 */
export type RegistrationStatus = "ACTIVE" | "PENDING" | "EXPIRED" | "FAILED" | "VERIFIED";

/**
 * Obligation status
 */
export type ObligationStatus = "ACTIVE" | "INACTIVE" | "WAIVED";

/**
 * Filing period status
 */
export type FilingPeriodStatus = "UPCOMING" | "OVERDUE" | "FILED" | "WAIVED" | "PENDING_APPROVAL";

/**
 * Input for creating an entity
 */
export interface EntityCreateInput {
  country: string; // ISO 3166-1 alpha-2 country code (e.g., "AE", "SA", "EG")
  name: string; // Legal entity name
  legalForm?: string; // e.g., "LLC", "Sole Establishment", "Corporation"
  entityType?: EntityType; // Type of entity for determining applicable obligations
  activityCode?: string; // Industry/activity code
  fiscalYearStart?: Date; // Fiscal year start date
  licenses?: EntityLicenseInput[]; // Initial licenses
  registrations?: EntityRegistrationInput[]; // Initial registrations (TRN, ZATCA, etc.)
  metadata?: Record<string, unknown>; // Additional metadata
}

/**
 * Input for updating an entity
 */
export interface EntityUpdateInput {
  name?: string;
  legalForm?: string;
  status?: EntityStatus;
  activityCode?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Entity license input
 */
export interface EntityLicenseInput {
  country: string;
  authority: string; // Authority that issued the license (e.g., "DED", "DIFC", "DTEC")
  licenseNumber: string;
  legalForm?: string;
  issuedAt?: Date;
  expiresAt?: Date;
  economicZoneId?: string; // Link to economic zone if applicable
  status?: RegistrationStatus;
  metadata?: Record<string, unknown>;
}

/**
 * Entity registration input (TRN, ZATCA, etc.)
 */
export interface EntityRegistrationInput {
  type: RegistrationType;
  value: string; // The actual registration number/ID
  source?: string; // Where the registration came from (e.g., "manual", "api", "import")
  status?: RegistrationStatus;
  metadata?: Record<string, unknown>;
}

/**
 * Obligation input (for manual creation)
 */
export interface ObligationInput {
  type: string; // e.g., "VAT", "ESR", "ZAKAT"
  country: string;
  frequency: string; // "MONTHLY", "QUARTERLY", "ANNUALLY", "ON_DEMAND"
  ruleConfig?: Record<string, unknown>; // Rule configuration for computing deadlines
}

/**
 * Filters for listing entities
 */
export interface EntityFilters {
  country?: string;
  status?: EntityStatus;
  search?: string; // Search by name
  skip?: number;
  take?: number;
  orderBy?: Prisma.EntityOrderByWithRelationInput;
}

/**
 * Entity with all relations loaded
 */
export interface EntityWithRelations {
  id: string;
  tenantId: string;
  country: string;
  name: string;
  legalForm?: string | null;
  status: string;
  fiscalYearStart?: Date | null;
  registrationCertUrl?: string | null;
  registrationCertHash?: string | null;
  activityCode?: string | null;
  parentEntityId?: string | null;
  metadata?: Prisma.JsonValue | null;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  updatedBy?: string | null;
  licenses: EntityLicenseWithZone[];
  registrations: EntityRegistrationRecord[];
  obligations: ObligationWithPeriods[];
  auditLogs: EntityAuditLogRecord[];
}

/**
 * Entity license with economic zone
 */
export interface EntityLicenseWithZone {
  id: string;
  entityId: string;
  country: string;
  authority: string;
  licenseNumber: string;
  legalForm?: string | null;
  issuedAt?: Date | null;
  expiresAt?: Date | null;
  economicZoneId?: string | null;
  status: string;
  metadata?: Prisma.JsonValue | null;
  createdAt: Date;
  updatedAt: Date;
  verifiedAt?: Date | null;
}

/**
 * Entity registration record
 */
export interface EntityRegistrationRecord {
  id: string;
  entityId: string;
  type: string;
  value: string;
  verifiedAt?: Date | null;
  source?: string | null;
  status: string;
  metadata?: Prisma.JsonValue | null;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Obligation with filing periods
 */
export interface ObligationWithPeriods {
  id: string;
  entityId: string;
  type: string;
  country: string;
  frequency: string;
  ruleConfig?: Prisma.JsonValue | null;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
  periods: FilingPeriodRecord[];
}

/**
 * Filing period record
 */
export interface FilingPeriodRecord {
  id: string;
  obligationId: string;
  periodStart: Date;
  periodEnd: Date;
  dueAt: Date;
  status: string;
  assigneeId?: string | null;
  snoozeUntil?: Date | null;
  notes?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Entity audit log record
 */
export interface EntityAuditLogRecord {
  id: string;
  entityId: string;
  userId: string;
  action: string;
  changes?: Prisma.JsonValue | null;
  metadata?: Prisma.JsonValue | null;
  createdAt: Date;
}

/**
 * Entity setup job input (async verification)
 */
export interface EntitySetupJobInput {
  tenantId: string;
  entityId: string;
  country: string;
  userId: string;
  correlationId: string; // For tracking verification attempts
}

/**
 * Entity setup job result
 */
export interface EntitySetupJobResult {
  entityId: string;
  status: "PENDING" | "VERIFIED" | "FAILED";
  verificationResults: Record<string, boolean>; // type -> verified mapping
  failureReasons?: Record<string, string>; // type -> reason mapping
  completedAt?: Date;
  nextRetryAt?: Date;
}

/**
 * Economic zone for entity licenses
 */
export interface EconomicZoneRecord {
  id: string;
  country: string;
  name: string;
  authorityCode?: string | null;
  city?: string | null;
  region?: string | null;
  metadata?: Prisma.JsonValue | null;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Verification attempt record
 */
export interface VerificationAttemptRecord {
  id: string;
  tenantId: string;
  type: string; // "license", "tax_id", etc.
  value: string;
  country: string;
  status: string; // "PENDING", "SUCCESS", "FAILED", "RETRY"
  result?: Prisma.JsonValue | null;
  attemptedBy?: string | null;
  attemptedAt: Date;
  correlationId?: string | null;
  metadata?: Prisma.JsonValue | null;
  createdAt: Date;
}

/**
 * Consent record
 */
export interface ConsentRecord {
  id: string;
  tenantId: string;
  entityId?: string | null;
  userId?: string | null;
  type: string; // "terms", "privacy", "service"
  version: string;
  acceptedBy: string;
  acceptedAt: Date;
  ip?: string | null;
  userAgent?: string | null;
  metadata?: Prisma.JsonValue | null;
  createdAt: Date;
}
