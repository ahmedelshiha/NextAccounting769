/**
 * Master Data Management - Individual Survivorship Rule API
 * 
 * Endpoints for managing individual survivorship rules
 */

import { NextRequest, NextResponse } from 'next/server';
import { withTenantContext } from '@/lib/api-wrapper';
import { tenantContext } from '@/lib/tenant-context';
import prisma from '@/lib/prisma';
import { logger } from '@/lib/logger';
import { z } from 'zod';

// ============================================================================
// Validation Schemas
// ============================================================================

const UpdateRuleSchema = z.object({
  ruleName: z.string().max(255).optional(),
  description: z.string().optional(),
  fieldMappings: z.record(z.union([z.literal('MASTER'), z.literal('DUPLICATE'), z.literal('NEWER'), z.literal('OLDER'), z.literal('CUSTOM')])).optional(),
  customLogic: z.string().optional(),
  priority: z.number().int().optional(),
  isActive: z.boolean().optional(),
});

// ============================================================================
// GET /api/mdm/survivorship-rules/[id] - Get rule by ID
// ============================================================================

async function handleGET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const ctx = tenantContext.getContext();

    // Ensure tenant context is present
    if (!ctx.tenantId) {
      return NextResponse.json(
        { error: 'Tenant context is missing' },
        { status: 400 }
      );
    }

    // Fetch rule
    const rule = await prisma.survivorshipRule.findUnique({
      where: { id: params.id },
    });

    if (!rule || rule.tenantId !== ctx.tenantId) {
      return NextResponse.json(
        { error: 'Survivorship rule not found' },
        { status: 404 }
      );
    }

    logger.info('Survivorship rule retrieved', {
      tenantId: ctx.tenantId,
      ruleId: params.id,
    });

    return NextResponse.json({
      success: true,
      data: rule,
    });
  } catch (error) {
    logger.error('Error fetching survivorship rule', { error });
    return NextResponse.json(
      { error: 'Failed to fetch survivorship rule' },
      { status: 500 }
    );
  }
}

// ============================================================================
// PUT /api/mdm/survivorship-rules/[id] - Update rule
// ============================================================================

async function handlePUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const ctx = tenantContext.getContext();

    // Ensure tenant context is present
    if (!ctx.tenantId) {
      return NextResponse.json(
        { error: 'Tenant context is missing' },
        { status: 400 }
      );
    }

    // Verify rule exists and belongs to tenant
    const rule = await prisma.survivorshipRule.findUnique({
      where: { id: params.id },
    });

    if (!rule || rule.tenantId !== ctx.tenantId) {
      return NextResponse.json(
        { error: 'Survivorship rule not found' },
        { status: 404 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const data = UpdateRuleSchema.parse(body);

    // Update rule
    const updated = await prisma.survivorshipRule.update({
      where: { id: params.id },
      data: {
        ...data,
        updatedBy: ctx.userId,
        updatedAt: new Date(),
      },
    });

    logger.info('Survivorship rule updated', {
      tenantId: ctx.tenantId,
      ruleId: params.id,
    });

    return NextResponse.json({
      success: true,
      data: updated,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.flatten() },
        { status: 400 }
      );
    }

    logger.error('Error updating survivorship rule', { error });
    return NextResponse.json(
      { error: 'Failed to update survivorship rule' },
      { status: 500 }
    );
  }
}

// ============================================================================
// DELETE /api/mdm/survivorship-rules/[id] - Delete rule
// ============================================================================

async function handleDELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const ctx = tenantContext.getContext();

    // Ensure tenant context is present
    if (!ctx.tenantId) {
      return NextResponse.json(
        { error: 'Tenant context is missing' },
        { status: 400 }
      );
    }

    // Verify rule exists and belongs to tenant
    const rule = await prisma.survivorshipRule.findUnique({
      where: { id: params.id },
    });

    if (!rule || rule.tenantId !== ctx.tenantId) {
      return NextResponse.json(
        { error: 'Survivorship rule not found' },
        { status: 404 }
      );
    }

    // Delete rule
    await prisma.survivorshipRule.delete({
      where: { id: params.id },
    });

    logger.info('Survivorship rule deleted', {
      tenantId: ctx.tenantId,
      ruleId: params.id,
    });

    return NextResponse.json({
      success: true,
      message: 'Survivorship rule deleted',
    });
  } catch (error) {
    logger.error('Error deleting survivorship rule', { error });
    return NextResponse.json(
      { error: 'Failed to delete survivorship rule' },
      { status: 500 }
    );
  }
}

export const GET = withTenantContext(handleGET, { requireAuth: true });
export const PUT = withTenantContext(handlePUT, { requireAuth: true });
export const DELETE = withTenantContext(handleDELETE, { requireAuth: true });
