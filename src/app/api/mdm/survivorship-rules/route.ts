/**
 * Master Data Management - Survivorship Rules API
 * 
 * Endpoints for managing survivorship rules used during merge operations
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

const CreateRuleSchema = z.object({
  recordType: z.enum(['PARTY', 'PRODUCT', 'TAX_CODE']),
  ruleName: z.string().min(1).max(255),
  description: z.string().optional(),
  fieldMappings: z.record(z.union([z.literal('MASTER'), z.literal('DUPLICATE'), z.literal('NEWER'), z.literal('OLDER'), z.literal('CUSTOM')])),
  customLogic: z.string().optional(),
  priority: z.number().int().default(0),
});

const UpdateRuleSchema = z.object({
  ruleName: z.string().max(255).optional(),
  description: z.string().optional(),
  fieldMappings: z.record(z.union([z.literal('MASTER'), z.literal('DUPLICATE'), z.literal('NEWER'), z.literal('OLDER'), z.literal('CUSTOM')])).optional(),
  customLogic: z.string().optional(),
  priority: z.number().int().optional(),
  isActive: z.boolean().optional(),
});

const ListRulesSchema = z.object({
  recordType: z.enum(['PARTY', 'PRODUCT', 'TAX_CODE']).optional(),
  isActive: z.boolean().optional(),
});

// ============================================================================
// GET /api/mdm/survivorship-rules - List rules
// ============================================================================

async function handleGET(request: NextRequest) {
  try {
    const ctx = tenantContext.getContext();

    // Ensure tenant context is present
    if (!ctx.tenantId) {
      return NextResponse.json(
        { error: 'Tenant context is missing' },
        { status: 400 }
      );
    }

    // Parse query parameters
    const searchParams = request.nextUrl.searchParams;
    const params = ListRulesSchema.parse({
      recordType: searchParams.get('recordType') || undefined,
      isActive: searchParams.get('isActive') === 'true' ? true : undefined,
    });

    // Initialize MDM service
    const mdm = new MDMService(prisma);

    // List rules
    const rules = await mdm.listSurvivorshipRules(
      ctx.tenantId,
      params.recordType
    );

    return NextResponse.json({
      success: true,
      data: rules,
      metadata: {
        count: rules.length,
      },
    });
  } catch (error) {
    logger.error('Error listing survivorship rules', { error });
    return NextResponse.json(
      { error: 'Failed to list survivorship rules' },
      { status: 500 }
    );
  }
}

// ============================================================================
// POST /api/mdm/survivorship-rules - Create rule
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
    const data = CreateRuleSchema.parse(body);

    // Check for duplicate rule name
    const existing = await prisma.survivorshipRule.findFirst({
      where: {
        tenantId: ctx.tenantId,
        ruleName: data.ruleName,
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: 'A rule with this name already exists' },
        { status: 409 }
      );
    }

    // Create rule
    const rule = await prisma.survivorshipRule.create({
      data: {
        tenantId: ctx.tenantId,
        ...data,
        createdBy: ctx.userId,
        updatedBy: ctx.userId,
      },
    });

    logger.info('Survivorship rule created', {
      tenantId: ctx.tenantId,
      ruleId: rule.id,
      ruleName: rule.ruleName,
    });

    return NextResponse.json(
      {
        success: true,
        data: rule,
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.flatten() },
        { status: 400 }
      );
    }

    logger.error('Error creating survivorship rule', { error });
    return NextResponse.json(
      { error: 'Failed to create survivorship rule' },
      { status: 500 }
    );
  }
}

export const GET = withTenantContext(handleGET, { requireAuth: true });
export const POST = withTenantContext(handlePOST, { requireAuth: true });
