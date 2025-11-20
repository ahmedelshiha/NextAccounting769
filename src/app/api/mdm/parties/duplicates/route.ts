/**
 * Master Data Management - Duplicate Detection API
 * 
 * Endpoints for finding and managing duplicate records
 */

import { NextRequest, NextResponse } from 'next/server';
import { withTenantContext } from '@/lib/api-wrapper';
import { tenantContext } from '@/lib/tenant-context';
import prisma from '@/lib/prisma';
import MDMService from '@/lib/mdm/mdm-service';
import { logger } from '@/lib/logger';
import { z } from 'zod';

// ============================================================================
// Validation Schemas
// ============================================================================

const FindDuplicatesSchema = z.object({
  partyId: z.string().cuid(),
  threshold: z.number().min(0).max(100).default(75),
});

const MergePartiesSchema = z.object({
  masterPartyId: z.string().cuid(),
  duplicatePartyId: z.string().cuid(),
  survivorshipRuleId: z.string().cuid().optional(),
  mergeReason: z.string().optional(),
});



// ============================================================================
// POST /api/mdm/parties/duplicates/find - Find duplicate parties
// ============================================================================

async function handlePOST(request: NextRequest) {
  try {
    const ctx = tenantContext.getContext();

    // Ensure tenant context is present
    if (!ctx.tenantId) {
      return NextResponse.json(
        { error: 'Tenant context is missing' },
        { status: 400 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const { partyId, threshold } = FindDuplicatesSchema.parse(body);

    // Initialize MDM service
    const mdm = new MDMService(prisma);

    // Find duplicates
    const duplicates = await mdm.findPartyDuplicates(
      ctx.tenantId,
      partyId,
      threshold
    );

    logger.info('Duplicate detection completed', {
      tenantId: ctx.tenantId,
      partyId,
      matchCount: duplicates.length,
    });

    return NextResponse.json({
      success: true,
      data: duplicates,
      metadata: {
        partyId,
        threshold,
        matchCount: duplicates.length,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.flatten() },
        { status: 400 }
      );
    }

    logger.error('Error finding duplicates', { error });
    return NextResponse.json(
      { error: 'Failed to find duplicates' },
      { status: 500 }
    );
  }
}

export const POST = withTenantContext(handlePOST, { requireAuth: true });
