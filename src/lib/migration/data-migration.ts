import { z } from 'zod'

import { createHash } from 'crypto'

/**
 * Data Migration Service
 * Handles legacy data import, backfills, dual-run support, and rollback
 */

export const MigrationPlanSchema = z.object({
  id: z.string(),
  tenantId: z.string(),
  name: z.string(),
  sourceSystem: z.string(), // e.g., 'LEGACY_SYSTEM', 'QUICKBOOKS', 'SAP'
  dataTypes: z.array(z.enum([
    'ENTITIES',
    'INVOICES',
    'PAYMENTS',
    'DOCUMENTS',
    'USERS',
    'FILINGS',
    'BANK_TRANSACTIONS',
    'EXPENSES',
    'CONTACTS',
  ])),
  estimatedRecords: z.record(z.string(), z.number()),
  startDate: z.date().optional(),
  plannedCutoverDate: z.date(),
  status: z.enum(['PLANNING', 'IN_PROGRESS', 'DUAL_RUN', 'CUTOVER', 'COMPLETED', 'ROLLED_BACK']),
  phases: z.array(z.object({
    id: z.string(),
    name: z.string(),
    dataType: z.string(),
    estimatedRecords: z.number(),
    status: z.enum(['PENDING', 'IN_PROGRESS', 'COMPLETED', 'FAILED']),
    startedAt: z.date().optional(),
    completedAt: z.date().optional(),
    successCount: z.number().default(0),
    failureCount: z.number().default(0),
    skipCount: z.number().default(0),
  })),
  createdAt: z.date(),
  updatedAt: z.date(),
})

export const MigrationErrorSchema = z.object({
  id: z.string(),
  planId: z.string(),
  recordId: z.string(),
  dataType: z.string(),
  sourceValue: z.any(),
  errorType: z.enum([
    'VALIDATION_ERROR',
    'DUPLICATE_KEY',
    'FOREIGN_KEY_MISSING',
    'DATA_TYPE_MISMATCH',
    'REQUIRED_FIELD_MISSING',
    'CUSTOM_RULE_VIOLATION',
  ]),
  errorMessage: z.string(),
  severity: z.enum(['WARNING', 'ERROR', 'CRITICAL']),
  suggestedFix: z.string().optional(),
  manuallyResolved: z.boolean().default(false),
  resolvedAt: z.date().optional(),
  createdAt: z.date(),
})

export const DualRunValidationSchema = z.object({
  id: z.string(),
  planId: z.string(),
  timestamp: z.date(),
  recordCount: z.number(),
  matchingRecords: z.number(),
  missingInNew: z.number(),
  missingInLegacy: z.number(),
  discrepancies: z.array(z.object({
    recordId: z.string(),
    field: z.string(),
    legacyValue: z.any(),
    newValue: z.any(),
  })),
  validationScore: z.number().min(0).max(100), // 0-100 percentage match
  readyForCutover: z.boolean(),
})

export type MigrationPlan = z.infer<typeof MigrationPlanSchema>
export type MigrationError = z.infer<typeof MigrationErrorSchema>
export type DualRunValidation = z.infer<typeof DualRunValidationSchema>

/**
 * Creates a migration plan
 */
export function createMigrationPlan(
  tenantId: string,
  name: string,
  sourceSystem: string,
  dataTypes: string[],
  estimatedRecords: Record<string, number>,
  cutoverDate: Date
): MigrationPlan {
  const phases = dataTypes.map((dataType, index) => ({
    id: `phase-${index + 1}`,
    name: `Migrate ${dataType}`,
    dataType,
    estimatedRecords: estimatedRecords[dataType] || 0,
    status: 'PENDING' as const,
  }))

  return {
    id: Math.random().toString(36).substr(2, 9),
    tenantId,
    name,
    sourceSystem,
    dataTypes: dataTypes as any,
    estimatedRecords,
    plannedCutoverDate: cutoverDate,
    status: 'PLANNING',
    phases: phases as any,
    createdAt: new Date(),
    updatedAt: new Date(),
  }
}

/**
 * Validates data before migration
 */
export function validateMigrationData(
  record: Record<string, any>,
  rules: {
    requiredFields: string[]
    fieldValidators: Record<string, (value: any) => boolean>
    customRules: Array<(record: Record<string, any>) => string | null>
  }
): { valid: boolean; errors: string[] } {
  const errors: string[] = []

  // Check required fields
  for (const field of rules.requiredFields) {
    if (!record[field]) {
      errors.push(`Required field '${field}' is missing`)
    }
  }

  // Validate individual fields
  for (const [field, validator] of Object.entries(rules.fieldValidators)) {
    if (record[field] !== undefined && !validator(record[field])) {
      errors.push(`Field '${field}' has invalid value: ${record[field]}`)
    }
  }

  // Check custom rules
  for (const rule of rules.customRules) {
    const error = rule(record)
    if (error) {
      errors.push(error)
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  }
}

/**
 * Maps data from legacy system to new schema
 */
export function mapLegacyData(
  legacyRecord: Record<string, any>,
  mapping: Record<string, string | ((value: any) => any)>
): Record<string, any> {
  const newRecord: Record<string, any> = {}

  for (const [legacyField, newField] of Object.entries(mapping)) {
    if (!(legacyField in legacyRecord)) {
      continue
    }

    const value = legacyRecord[legacyField]
    const newFieldName = typeof newField === 'string' ? newField : newField.name || legacyField

    if (typeof newField === 'function') {
      newRecord[newFieldName] = newField(value)
    } else {
      newRecord[newFieldName] = value
    }
  }

  return newRecord
}

/**
 * Detects duplicate records
 */
export function detectDuplicates(
  records: Record<string, any>[],
  keyFields: string[]
): { duplicates: number; clusters: Map<string, Record<string, any>[]> } {
  const clusters = new Map<string, Record<string, any>[]>()

  for (const record of records) {
    const key = keyFields.map(f => record[f]).join('|')
    if (!clusters.has(key)) {
      clusters.set(key, [])
    }
    clusters.get(key)!.push(record)
  }

  const duplicateCount = Array.from(clusters.values()).filter(c => c.length > 1).length

  return {
    duplicates: duplicateCount,
    clusters,
  }
}

/**
 * Computes data hash for verification
 */
export function computeDataHash(
  record: Record<string, any>,
  fieldsToHash: string[]
): string {
  const data = fieldsToHash.map(f => record[f]).join('|')
  return createHash('sha256').update(data).digest('hex')
}

/**
 * Validates dual-run consistency
 */
export function validateDualRun(
  legacyRecords: Record<string, any>[],
  newRecords: Record<string, any>[],
  matchingKey: string
): DualRunValidation {
  const legacyMap = new Map(legacyRecords.map(r => [r[matchingKey], r]))
  const newMap = new Map(newRecords.map(r => [r[matchingKey], r]))

  let matchingCount = 0
  const discrepancies: DualRunValidation['discrepancies'] = []

  // Find matching records and detect discrepancies
  for (const [key, legacyRecord] of legacyMap) {
    if (newMap.has(key)) {
      matchingCount++

      // Check for field discrepancies
      for (const field in legacyRecord) {
        const newRecord = newMap.get(key)!
        if (legacyRecord[field] !== newRecord[field]) {
          discrepancies.push({
            recordId: key,
            field,
            legacyValue: legacyRecord[field],
            newValue: newRecord[field],
          })
        }
      }
    }
  }

  const missingInNew = legacyMap.size - matchingCount
  const missingInLegacy = newMap.size - matchingCount
  const validationScore = (matchingCount / Math.max(legacyMap.size, newMap.size)) * 100

  return {
    id: Math.random().toString(36).substr(2, 9),
    planId: '',
    timestamp: new Date(),
    recordCount: Math.max(legacyMap.size, newMap.size),
    matchingRecords: matchingCount,
    missingInNew,
    missingInLegacy,
    discrepancies,
    validationScore: Math.round(validationScore),
    readyForCutover: validationScore >= 95 && discrepancies.length === 0,
  }
}

/**
 * Generates rollback plan
 */
export function generateRollbackPlan(
  plan: Partial<MigrationPlan>,
  snapshot?: Record<string, any>
): {
  steps: Array<{ id: string; description: string; estimatedMinutes: number }>
  estimatedTotalTime: number
  backupLocation?: string
} {
  const steps = [
    {
      id: 'step-1',
      description: 'Notify all users of system downtime',
      estimatedMinutes: 5,
    },
    {
      id: 'step-2',
      description: 'Pause all background jobs',
      estimatedMinutes: 2,
    },
    {
      id: 'step-3',
      description: 'Restore database from pre-migration backup',
      estimatedMinutes: 30,
    },
    {
      id: 'step-4',
      description: 'Verify data integrity',
      estimatedMinutes: 10,
    },
    {
      id: 'step-5',
      description: 'Resume application services',
      estimatedMinutes: 5,
    },
    {
      id: 'step-6',
      description: 'Notify users of restoration',
      estimatedMinutes: 2,
    },
  ]

  const estimatedTotalTime = steps.reduce((sum, s) => sum + s.estimatedMinutes, 0)

  return {
    steps: steps as any,
    estimatedTotalTime,
    backupLocation: snapshot ? '/backups/pre-migration-backup' : undefined,
  }
}

/**
 * Tracks migration progress
 */
export function calculateMigrationProgress(
  plan: Partial<MigrationPlan>
): {
  percentComplete: number
  successCount: number
  failureCount: number
  skipCount: number
  estimatedTimeRemaining: number
} {
  if (!plan.phases || plan.phases.length === 0) {
    return {
      percentComplete: 0,
      successCount: 0,
      failureCount: 0,
      skipCount: 0,
      estimatedTimeRemaining: 0,
    }
  }

  const completed = plan.phases.filter(p => p.status === 'COMPLETED').length
  const totalPhases = plan.phases.length
  const percentComplete = Math.round((completed / totalPhases) * 100)

  const successCount = plan.phases.reduce((sum, p) => sum + (p.successCount || 0), 0)
  const failureCount = plan.phases.reduce((sum, p) => sum + (p.failureCount || 0), 0)
  const skipCount = plan.phases.reduce((sum, p) => sum + (p.skipCount || 0), 0)

  // Rough estimate: 1 minute per completed phase + 30 minutes per remaining phase
  const estimatedTimeRemaining = (totalPhases - completed) * 30

  return {
    percentComplete,
    successCount,
    failureCount,
    skipCount,
    estimatedTimeRemaining,
  }
}
