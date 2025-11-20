import { z } from 'zod'
import crypto from 'crypto'

/**
 * Step-Up Authentication Service
 * Provides additional authentication requirements for sensitive operations
 */

export const StepUpChallengeSchema = z.object({
  id: z.string(),
  userId: z.string(),
  tenantId: z.string(),
  operationType: z.enum([
    'DELETE_ENTITY',
    'MODIFY_PAYMENT_METHOD',
    'AUTHORIZE_LARGE_PAYMENT',
    'CHANGE_PERMISSIONS',
    'ACCESS_AUDIT_LOG',
    'EXPORT_DATA',
    'MODIFY_SECURITY_SETTINGS',
  ]),
  requiredAuthLevel: z.enum(['MFA', 'BIOMETRIC', 'SECURITY_KEY', 'ELEVATED_PASSWORD']),
  challenge: z.string(),
  challengeType: z.enum(['OTP', 'SECURITY_QUESTION', 'DEVICE_VERIFICATION']),
  createdAt: z.date(),
  expiresAt: z.date(),
  attempts: z.number().default(0),
  maxAttempts: z.number().default(5),
  verified: z.boolean().default(false),
  verifiedAt: z.date().optional(),
  metadata: z.record(z.string(), z.any()).optional(),
})

export const DeviceSchema = z.object({
  id: z.string(),
  userId: z.string(),
  tenantId: z.string(),
  deviceType: z.enum(['MOBILE', 'DESKTOP', 'TABLET', 'OTHER']),
  deviceName: z.string(),
  osType: z.string(),
  osVersion: z.string(),
  browserType: z.string(),
  browserVersion: z.string(),
  fingerprint: z.string().optional(),
  ipAddress: z.string(),
  userAgent: z.string(),
  lastActivityAt: z.date(),
  approvalStatus: z.enum(['PENDING', 'APPROVED', 'REJECTED', 'REVOKED']),
  approvedAt: z.date().optional(),
  approvedBy: z.string().optional(),
  trustLevel: z.number().min(0).max(100),
  createdAt: z.date(),
  updatedAt: z.date(),
})

export const IPAllowlistSchema = z.object({
  id: z.string(),
  tenantId: z.string(),
  ipAddress: z.string().ip(),
  description: z.string().optional(),
  allowedOperations: z.array(z.string()).default(['ALL']),
  restrictedCountries: z.array(z.string()).optional(),
  expiresAt: z.date().optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
})

export const RetentionPolicySchema = z.object({
  id: z.string(),
  tenantId: z.string(),
  dataType: z.enum([
    'AUDIT_LOGS',
    'CHAT_HISTORY',
    'DOCUMENTS',
    'INVOICES',
    'EMAILS',
    'TRANSACTIONS',
    'FILINGS',
  ]),
  retentionPeriodDays: z.number().min(1),
  archiveBeforeDays: z.number().min(0),
  deleteAfterDays: z.number(),
  anonymizeBeforeDelete: z.boolean().default(true),
  legalHoldOverride: z.boolean().default(false),
  createdAt: z.date(),
  updatedAt: z.date(),
})

export type StepUpChallenge = z.infer<typeof StepUpChallengeSchema>
export type Device = z.infer<typeof DeviceSchema>
export type IPAllowlist = z.infer<typeof IPAllowlistSchema>
export type RetentionPolicy = z.infer<typeof RetentionPolicySchema>

/**
 * Operations requiring step-up authentication
 */
const STEP_UP_REQUIREMENTS: Record<string, {
  authLevel: string
  reason: string
  delaySeconds?: number
}> = {
  DELETE_ENTITY: {
    authLevel: 'MFA',
    reason: 'Deleting an entity is a critical operation',
    delaySeconds: 0,
  },
  MODIFY_PAYMENT_METHOD: {
    authLevel: 'MFA',
    reason: 'Payment methods are sensitive financial information',
    delaySeconds: 5,
  },
  AUTHORIZE_LARGE_PAYMENT: {
    authLevel: 'ELEVATED_PASSWORD',
    reason: 'Large payments require additional authorization',
    delaySeconds: 10,
  },
  CHANGE_PERMISSIONS: {
    authLevel: 'MFA',
    reason: 'Permission changes affect system access',
    delaySeconds: 5,
  },
  ACCESS_AUDIT_LOG: {
    authLevel: 'MFA',
    reason: 'Audit logs contain sensitive operational data',
    delaySeconds: 0,
  },
  EXPORT_DATA: {
    authLevel: 'MFA',
    reason: 'Data exports require verification for compliance',
    delaySeconds: 5,
  },
  MODIFY_SECURITY_SETTINGS: {
    authLevel: 'ELEVATED_PASSWORD',
    reason: 'Security settings control account protection',
    delaySeconds: 10,
  },
}

/**
 * Creates a step-up authentication challenge
 */
export function createStepUpChallenge(
  userId: string,
  tenantId: string,
  operationType: keyof typeof STEP_UP_REQUIREMENTS,
  metadata?: Record<string, any>
): StepUpChallenge {
  const requirement = STEP_UP_REQUIREMENTS[operationType]
  const challengeId = Math.random().toString(36).substr(2, 9)
  const challenge = crypto.randomBytes(16).toString('hex')

  return {
    id: challengeId,
    userId,
    tenantId,
    operationType: operationType as any,
    requiredAuthLevel: requirement.authLevel as any,
    challenge,
    challengeType: 'OTP',
    createdAt: new Date(),
    expiresAt: new Date(Date.now() + 15 * 60 * 1000), // 15 minutes
    attempts: 0,
    maxAttempts: 5,
    verified: false,
    metadata,
  }
}

/**
 * Verifies step-up challenge
 */
export function verifyStepUpChallenge(
  challenge: Partial<StepUpChallenge>,
  token: string
): { valid: boolean; reason?: string } {
  if (!challenge.id) {
    return { valid: false, reason: 'Invalid challenge' }
  }

  if (!challenge.createdAt || !challenge.expiresAt) {
    return { valid: false, reason: 'Invalid challenge dates' }
  }

  // Check expiration
  if (new Date() > challenge.expiresAt) {
    return { valid: false, reason: 'Challenge expired' }
  }

  // Check attempts
  if (challenge.attempts! >= challenge.maxAttempts!) {
    return { valid: false, reason: 'Too many attempts' }
  }

  // In production, verify token against challenge
  // For now, simple validation
  if (token.length < 6) {
    return { valid: false, reason: 'Invalid token format' }
  }

  return { valid: true }
}

/**
 * Creates device record
 */
export function createDeviceRecord(
  userId: string,
  tenantId: string,
  userAgent: string,
  ipAddress: string,
  deviceDetails?: Partial<Device>
): Device {
  const parseUserAgent = (ua: string) => {
    const osMatch = ua.match(/(Windows|Mac|Linux|iOS|Android)/i)
    const browserMatch = ua.match(/(Chrome|Firefox|Safari|Edge)/i)
    return {
      osType: osMatch ? osMatch[1] : 'Unknown',
      browserType: browserMatch ? browserMatch[1] : 'Unknown',
    }
  }

  const { osType, browserType } = parseUserAgent(userAgent)

  return {
    id: Math.random().toString(36).substr(2, 9),
    userId,
    tenantId,
    deviceType: deviceDetails?.deviceType || 'DESKTOP',
    deviceName: deviceDetails?.deviceName || `${osType} Device`,
    osType,
    osVersion: deviceDetails?.osVersion || 'Unknown',
    browserType,
    browserVersion: deviceDetails?.browserVersion || 'Unknown',
    userAgent,
    ipAddress,
    lastActivityAt: new Date(),
    approvalStatus: 'PENDING',
    trustLevel: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
  }
}

/**
 * Checks if device is trusted
 */
export function isDeviceTrusted(
  device: Partial<Device>,
  minimumTrustLevel: number = 50
): boolean {
  return (
    device.approvalStatus === 'APPROVED' &&
    (device.trustLevel || 0) >= minimumTrustLevel
  )
}

/**
 * Calculates device trust score
 */
export function calculateDeviceTrustScore(
  device: Partial<Device>,
  context?: {
    geoLocationChange?: boolean
    unusualActivityTime?: boolean
    vpnDetected?: boolean
  }
): number {
  let score = 50 // Base score

  // Recent activity increases trust
  if (device.lastActivityAt) {
    const daysSinceActivity = (Date.now() - device.lastActivityAt.getTime()) / (1000 * 60 * 60 * 24)
    if (daysSinceActivity < 7) score += 20
    if (daysSinceActivity < 24) score += 10
  }

  // Approved devices get boost
  if (device.approvalStatus === 'APPROVED') {
    score += 15
  }

  // Reduce trust for suspicious activity
  if (context?.geoLocationChange) score -= 15
  if (context?.unusualActivityTime) score -= 10
  if (context?.vpnDetected) score -= 20

  return Math.max(0, Math.min(100, score))
}

/**
 * Validates IP address against allowlist
 */
export function validateIPAddress(
  ipAddress: string,
  allowlist?: Partial<IPAllowlist>[]
): { allowed: boolean; reason?: string } {
  if (!allowlist || allowlist.length === 0) {
    return { allowed: true } // No restrictions
  }

  for (const entry of allowlist) {
    if (entry.expiresAt && new Date() > entry.expiresAt) {
      continue // Skip expired entries
    }

    // Simple IP comparison (in production, use proper IP matching)
    if (entry.ipAddress === ipAddress) {
      return { allowed: true }
    }
  }

  return { allowed: false, reason: 'IP address not in allowlist' }
}

/**
 * Calculates data retention expiration
 */
export function calculateRetentionExpiration(
  createdAt: Date,
  policy?: Partial<RetentionPolicy>
): {
  archiveDate: Date | null
  deleteDate: Date | null
} {
  if (!policy?.retentionPeriodDays) {
    return { archiveDate: null, deleteDate: null }
  }

  const deleteDate = new Date(createdAt)
  deleteDate.setDate(deleteDate.getDate() + policy.retentionPeriodDays)

  let archiveDate = null
  if (policy.archiveBeforeDays && policy.archiveBeforeDays > 0) {
    archiveDate = new Date(createdAt)
    archiveDate.setDate(archiveDate.getDate() + policy.archiveBeforeDays)
  }

  return { archiveDate, deleteDate }
}

/**
 * Determines if record should be anonymized
 */
export function shouldAnonymize(
  createdAt: Date,
  policy?: Partial<RetentionPolicy>
): boolean {
  if (!policy?.anonymizeBeforeDelete || !policy?.retentionPeriodDays) {
    return false
  }

  const deleteDate = new Date(createdAt)
  deleteDate.setDate(deleteDate.getDate() + policy.retentionPeriodDays)

  const daysUntilDelete = (deleteDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  return daysUntilDelete <= 7 // Anonymize 7 days before deletion
}

/**
 * Generates audit event for sensitive operation
 */
export function generateSecurityAuditEvent(
  action: string,
  userId: string,
  tenantId: string,
  ipAddress: string,
  metadata?: Record<string, any>
): Record<string, any> {
  return {
    id: Math.random().toString(36).substr(2, 9),
    timestamp: new Date(),
    action,
    userId,
    tenantId,
    ipAddress,
    severity: 'HIGH',
    metadata,
  }
}
