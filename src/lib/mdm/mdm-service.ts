/**
 * Master Data Management (MDM) Service
 * 
 * Provides comprehensive data management for parties, products, and tax codes including:
 * - Deduplication and duplicate detection
 * - Master record management
 * - Merge/unmerge operations
 * - Survivorship rule application
 * - Data quality scoring
 * - Audit logging
 */

import { Prisma, PrismaClient } from '@prisma/client';
import { logger } from '@/lib/logger';
import { z } from 'zod';

// ============================================================================
// Type Definitions
// ============================================================================

export interface PartyDuplicateMatch {
  partyId: string;
  matchScore: number; // 0-100
  matchReasons: string[];
  confidence: 'HIGH' | 'MEDIUM' | 'LOW';
}

export interface ProductDuplicateMatch {
  productId: string;
  matchScore: number;
  matchReasons: string[];
  confidence: 'HIGH' | 'MEDIUM' | 'LOW';
}

export interface MergeResult {
  success: boolean;
  mergeLogId: string;
  masterRecordId: string;
  duplicateRecordId: string;
  mergedFields: Record<string, any>;
  errors?: string[];
}

export interface UnmergeResult {
  success: boolean;
  masterRecordId: string;
  duplicateRecordId: string;
  restoredFields: Record<string, any>;
  errors?: string[];
}

export interface DataQualityScore {
  recordId: string;
  score: number; // 0-100
  issues: DataQualityIssue[];
  recommendations: string[];
}

export interface DataQualityIssue {
  field: string;
  severity: 'ERROR' | 'WARNING' | 'INFO';
  message: string;
}

// ============================================================================
// Validation Schemas
// ============================================================================

const PartyDuplicateSchema = z.object({
  tenantId: z.string().cuid(),
  partyType: z.enum(['VENDOR', 'CUSTOMER', 'EMPLOYEE', 'PARTNER', 'INTERNAL']),
  name: z.string().min(1).max(255),
  registrationNumber: z.string().optional(),
  taxId: z.string().optional(),
  email: z.string().email().optional(),
});

const MergePartySchema = z.object({
  tenantId: z.string().cuid(),
  masterPartyId: z.string().cuid(),
  duplicatePartyId: z.string().cuid(),
  survivorshipRuleId: z.string().cuid().optional(),
  mergeReason: z.string().optional(),
});

// ============================================================================
// MDM Service Class
// ============================================================================

export class MDMService {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  // =========================================================================
  // Party Deduplication
  // =========================================================================

  /**
   * Find potential duplicate parties
   * Uses fuzzy matching on name, registration number, and tax ID
   */
  async findPartyDuplicates(
    tenantId: string,
    partyId: string,
    threshold: number = 75
  ): Promise<PartyDuplicateMatch[]> {
    try {
      const party = await this.prisma.party.findUnique({
        where: { id: partyId },
      });

      if (!party || party.tenantId !== tenantId) {
        throw new Error('Party not found or unauthorized');
      }

      // Find candidates with same party type
      const candidates = await this.prisma.party.findMany({
        where: {
          tenantId,
          partyType: party.partyType,
          id: { not: partyId },
          status: 'ACTIVE',
        },
      });

      const matches: PartyDuplicateMatch[] = [];

      for (const candidate of candidates) {
        const score = this.calculatePartyMatchScore(party, candidate);
        const matchReasons = this.getPartyMatchReasons(party, candidate);

        if (score >= threshold) {
          matches.push({
            partyId: candidate.id,
            matchScore: score,
            matchReasons,
            confidence: score >= 90 ? 'HIGH' : score >= 75 ? 'MEDIUM' : 'LOW',
          });
        }
      }

      // Sort by match score descending
      return matches.sort((a, b) => b.matchScore - a.matchScore);
    } catch (error) {
      logger.error('Error finding party duplicates', { tenantId, partyId, error });
      throw error;
    }
  }

  /**
   * Calculate similarity score between two parties (0-100)
   */
  private calculatePartyMatchScore(party1: any, party2: any): number {
    let score = 0;
    let weights = 0;

    // Name similarity (40% weight)
    if (party1.name && party2.name) {
      const nameSimilarity = this.stringSimilarity(party1.name, party2.name);
      score += nameSimilarity * 0.4;
      weights += 0.4;
    }

    // Registration number match (30% weight)
    if (party1.registrationNumber && party2.registrationNumber) {
      if (party1.registrationNumber === party2.registrationNumber) {
        score += 100 * 0.3;
      }
      weights += 0.3;
    }

    // Tax ID match (20% weight)
    if (party1.taxId && party2.taxId) {
      if (party1.taxId === party2.taxId) {
        score += 100 * 0.2;
      }
      weights += 0.2;
    }

    // Email match (10% weight)
    if (party1.email && party2.email) {
      if (party1.email.toLowerCase() === party2.email.toLowerCase()) {
        score += 100 * 0.1;
      }
      weights += 0.1;
    }

    return weights > 0 ? score / weights : 0;
  }

  /**
   * Get reasons why two parties match
   */
  private getPartyMatchReasons(party1: any, party2: any): string[] {
    const reasons: string[] = [];

    if (party1.name && party2.name) {
      const similarity = this.stringSimilarity(party1.name, party2.name);
      if (similarity > 80) {
        reasons.push(`Name match: ${similarity.toFixed(0)}% similar`);
      }
    }

    if (party1.registrationNumber === party2.registrationNumber && party1.registrationNumber) {
      reasons.push('Registration number match');
    }

    if (party1.taxId === party2.taxId && party1.taxId) {
      reasons.push('Tax ID match');
    }

    if (party1.email === party2.email && party1.email) {
      reasons.push('Email match');
    }

    return reasons;
  }

  /**
   * Levenshtein distance-based string similarity (0-100)
   */
  private stringSimilarity(str1: string, str2: string): number {
    const s1 = str1.toLowerCase().trim();
    const s2 = str2.toLowerCase().trim();

    if (s1 === s2) return 100;

    const longer = s1.length > s2.length ? s1 : s2;
    const shorter = s1.length > s2.length ? s2 : s1;

    if (longer.length === 0) return 100;

    const editDistance = this.levenshteinDistance(longer, shorter);
    return ((longer.length - editDistance) / longer.length) * 100;
  }

  /**
   * Calculate Levenshtein distance between two strings
   */
  private levenshteinDistance(s1: string, s2: string): number {
    const costs: number[] = [];

    for (let i = 0; i <= s1.length; i++) {
      let lastValue = i;
      for (let j = 0; j <= s2.length; j++) {
        if (i === 0) {
          costs[j] = j;
        } else if (j > 0) {
          let newValue = costs[j - 1];
          if (s1.charAt(i - 1) !== s2.charAt(j - 1)) {
            newValue = Math.min(Math.min(newValue, lastValue), costs[j]) + 1;
          }
          costs[j - 1] = lastValue;
          lastValue = newValue;
        }
      }
      if (i > 0) costs[s2.length] = lastValue;
    }

    return costs[s2.length];
  }

  // =========================================================================
  // Merge Operations
  // =========================================================================

  /**
   * Merge a duplicate party into a master party
   */
  async mergeParties(
    tenantId: string,
    masterPartyId: string,
    duplicatePartyId: string,
    survivorshipRuleId?: string,
    mergeReason?: string
  ): Promise<MergeResult> {
    const mergeLogId = this.generateId();

    try {
      // Validate parties exist and belong to tenant
      const [masterParty, duplicateParty] = await Promise.all([
        this.prisma.party.findUnique({ where: { id: masterPartyId } }),
        this.prisma.party.findUnique({ where: { id: duplicatePartyId } }),
      ]);

      if (!masterParty || masterParty.tenantId !== tenantId) {
        throw new Error('Master party not found or unauthorized');
      }

      if (!duplicateParty || duplicateParty.tenantId !== tenantId) {
        throw new Error('Duplicate party not found or unauthorized');
      }

      // Load survivorship rule if provided
      let rule: any = null;
      if (survivorshipRuleId) {
        rule = await this.prisma.survivorshipRule.findUnique({
          where: { id: survivorshipRuleId },
        });
      }

      // Apply survivorship logic
      const mergedFields = this.applySurvivorshipRules(
        masterParty,
        duplicateParty,
        rule
      );

      // Perform merge in transaction
      const result = await this.prisma.$transaction(async (tx) => {
        // Update master party with merged fields
        const updated = await tx.party.update({
          where: { id: masterPartyId },
          data: {
            ...mergedFields,
            updatedAt: new Date(),
            updatedBy: tenantId,
          },
        });

        // Mark duplicate as merged
        await tx.party.update({
          where: { id: duplicatePartyId },
          data: {
            status: 'MERGED',
            masterRecordId: masterPartyId,
            updatedAt: new Date(),
          },
        });

        // Create merge log
        await tx.mergeLog.create({
          data: {
            tenantId,
            recordType: 'PARTY',
            masterRecordId: masterPartyId,
            masterRecordName: masterParty.name,
            duplicateRecordId: duplicatePartyId,
            duplicateRecordName: duplicateParty.name,
            mergeReason,
            survivorshipRuleId,
            survivorshipStrategy: rule ? 'RULE_BASED' : 'MANUAL',
            mergeStatus: 'COMPLETED',
            mergedBy: tenantId,
            metadata: { mergedFields },
          },
        });

        return updated;
      });

      logger.info('Party merge completed', {
        tenantId,
        masterPartyId,
        duplicatePartyId,
        mergeLogId,
      });

      return {
        success: true,
        mergeLogId,
        masterRecordId: masterPartyId,
        duplicateRecordId: duplicatePartyId,
        mergedFields,
      };
    } catch (error) {
      logger.error('Party merge failed', {
        tenantId,
        masterPartyId,
        duplicatePartyId,
        error,
      });

      throw error;
    }
  }

  /**
   * Apply survivorship rules to determine merged field values
   */
  private applySurvivorshipRules(
    masterRecord: any,
    duplicateRecord: any,
    rule?: any
  ): Record<string, any> {
    const merged: Record<string, any> = {};

    if (rule && rule.fieldMappings) {
      const mappings = rule.fieldMappings;

      for (const [field, strategy] of Object.entries(mappings)) {
        switch (strategy) {
          case 'MASTER':
            merged[field] = masterRecord[field];
            break;
          case 'DUPLICATE':
            merged[field] = duplicateRecord[field];
            break;
          case 'NEWER':
            merged[field] =
              masterRecord.updatedAt > duplicateRecord.updatedAt
                ? masterRecord[field]
                : duplicateRecord[field];
            break;
          case 'OLDER':
            merged[field] =
              masterRecord.createdAt < duplicateRecord.createdAt
                ? masterRecord[field]
                : duplicateRecord[field];
            break;
          default:
            merged[field] = masterRecord[field];
        }
      }
    } else {
      // Default survivorship: keep master, fill in blanks from duplicate
      const fields = [
        'legalName',
        'registrationNumber',
        'taxId',
        'email',
        'phone',
        'address',
        'city',
        'country',
      ];

      for (const field of fields) {
        merged[field] = masterRecord[field] || duplicateRecord[field];
      }
    }

    return merged;
  }

  /**
   * Unmerge a previously merged party
   */
  async unmergeParty(
    tenantId: string,
    mergeLogId: string,
    unmergeReason?: string
  ): Promise<UnmergeResult> {
    try {
      const mergeLog = await this.prisma.mergeLog.findUnique({
        where: { id: mergeLogId },
      });

      if (!mergeLog || mergeLog.tenantId !== tenantId) {
        throw new Error('Merge log not found or unauthorized');
      }

      if (!mergeLog.canUnmerge) {
        throw new Error('This merge cannot be unmerged');
      }

      const masterRecordId = mergeLog.masterRecordId;
      const duplicateRecordId = mergeLog.duplicateRecordId;

      // Restore duplicate party
      const result = await this.prisma.$transaction(async (tx) => {
        // Mark duplicate as active again
        await tx.party.update({
          where: { id: duplicateRecordId },
          data: {
            status: 'ACTIVE',
            masterRecordId: null,
            updatedAt: new Date(),
          },
        });

        // Update merge log
        await tx.mergeLog.update({
          where: { id: mergeLogId },
          data: {
            unmergeReason,
            unmergedAt: new Date(),
            unmergedBy: tenantId,
          },
        });

        return { masterRecordId, duplicateRecordId };
      });

      logger.info('Party unmerge completed', {
        tenantId,
        mergeLogId,
        masterRecordId,
        duplicateRecordId,
      });

      return {
        success: true,
        masterRecordId,
        duplicateRecordId,
        restoredFields: {},
      };
    } catch (error) {
      logger.error('Party unmerge failed', { tenantId, mergeLogId, error });
      throw error;
    }
  }

  // =========================================================================
  // Data Quality Scoring
  // =========================================================================

  /**
   * Calculate data quality score for a party
   */
  async calculatePartyQualityScore(
    tenantId: string,
    partyId: string
  ): Promise<DataQualityScore> {
    try {
      const party = await this.prisma.party.findUnique({
        where: { id: partyId },
      });

      if (!party || party.tenantId !== tenantId) {
        throw new Error('Party not found or unauthorized');
      }

      const issues: DataQualityIssue[] = [];
      let score = 100;

      // Check required fields
      if (!party.name || party.name.trim().length === 0) {
        issues.push({
          field: 'name',
          severity: 'ERROR',
          message: 'Party name is required',
        });
        score -= 20;
      }

      if (!party.registrationNumber && !party.taxId) {
        issues.push({
          field: 'registrationNumber/taxId',
          severity: 'WARNING',
          message: 'At least one identifier (registration number or tax ID) is recommended',
        });
        score -= 10;
      }

      if (!party.email) {
        issues.push({
          field: 'email',
          severity: 'INFO',
          message: 'Email address is recommended for communication',
        });
        score -= 5;
      }

      if (!party.address) {
        issues.push({
          field: 'address',
          severity: 'INFO',
          message: 'Address is recommended for compliance',
        });
        score -= 5;
      }

      // Check for suspicious patterns
      if (party.name && party.name.length < 3) {
        issues.push({
          field: 'name',
          severity: 'WARNING',
          message: 'Party name is unusually short',
        });
        score -= 5;
      }

      const recommendations: string[] = [];
      if (issues.some((i) => i.severity === 'ERROR')) {
        recommendations.push('Resolve all errors before using this record');
      }
      if (issues.some((i) => i.severity === 'WARNING')) {
        recommendations.push('Consider addressing warnings to improve data quality');
      }

      // Ensure score is between 0 and 100
      score = Math.max(0, Math.min(100, score));

      // Update party with quality score
      await this.prisma.party.update({
        where: { id: partyId },
        data: {
          dataQualityScore: new Prisma.Decimal(score),
          lastValidatedAt: new Date(),
          validationErrors: issues.map((i) => i.message),
        },
      });

      return {
        recordId: partyId,
        score,
        issues,
        recommendations,
      };
    } catch (error) {
      logger.error('Error calculating party quality score', {
        tenantId,
        partyId,
        error,
      });
      throw error;
    }
  }

  // =========================================================================
  // Utility Methods
  // =========================================================================

  /**
   * Generate a unique ID
   */
  private generateId(): string {
    return `merge_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get merge history for a record
   */
  async getMergeHistory(
    tenantId: string,
    recordId: string,
    limit: number = 50
  ) {
    try {
      return await this.prisma.mergeLog.findMany({
        where: {
          tenantId,
          OR: [
            { masterRecordId: recordId },
            { duplicateRecordId: recordId },
          ],
        },
        orderBy: { mergedAt: 'desc' },
        take: limit,
      });
    } catch (error) {
      logger.error('Error fetching merge history', { tenantId, recordId, error });
      throw error;
    }
  }

  /**
   * List all survivorship rules for a tenant
   */
  async listSurvivorshipRules(
    tenantId: string,
    recordType?: string
  ) {
    try {
      return await this.prisma.survivorshipRule.findMany({
        where: {
          tenantId,
          ...(recordType && { recordType: recordType as any }),
          isActive: true,
        },
        orderBy: { priority: 'desc' },
      });
    } catch (error) {
      logger.error('Error listing survivorship rules', { tenantId, error });
      throw error;
    }
  }
}

export default MDMService;
