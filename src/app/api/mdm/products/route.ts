/**
 * Master Data Management - Products API
 * 
 * Endpoints for managing product master data including:
 * - List products
 * - Create product
 * - Find duplicate products
 * - Merge products
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

const CreateProductSchema = z.object({
  productCode: z.string().min(1).max(100),
  productName: z.string().min(1).max(255),
  description: z.string().optional(),
  productType: z.enum(['GOOD', 'SERVICE', 'BUNDLE']),
  category: z.string().max(100).optional(),
  unitOfMeasure: z.string().max(50).optional(),
  standardPrice: z.number().optional(),
  currency: z.string().max(3).optional(),
  taxCodeId: z.string().cuid().optional(),
  taxRate: z.number().optional(),
  externalId: z.string().max(255).optional(),
  source: z.string().max(100).optional(),
});

const ListProductsSchema = z.object({
  productType: z.enum(['GOOD', 'SERVICE', 'BUNDLE']).optional(),
  status: z.enum(['ACTIVE', 'INACTIVE', 'DISCONTINUED', 'MERGED']).optional(),
  category: z.string().optional(),
  search: z.string().optional(),
  limit: z.number().int().min(1).max(100).default(50),
  offset: z.number().int().min(0).default(0),
});

// ============================================================================
// GET /api/mdm/products - List products
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
    const params = ListProductsSchema.parse({
      productType: searchParams.get('productType') || undefined,
      status: searchParams.get('status') || undefined,
      category: searchParams.get('category') || undefined,
      search: searchParams.get('search') || undefined,
      limit: parseInt(searchParams.get('limit') || '50'),
      offset: parseInt(searchParams.get('offset') || '0'),
    });

    // Build query
    const where: any = { tenantId: ctx.tenantId };
    if (params.productType) where.productType = params.productType;
    if (params.status) where.status = params.status;
    if (params.category) where.category = params.category;
    if (params.search) {
      where.OR = [
        { productName: { contains: params.search, mode: 'insensitive' } },
        { productCode: { contains: params.search, mode: 'insensitive' } },
        { description: { contains: params.search, mode: 'insensitive' } },
      ];
    }

    // Fetch products
    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        skip: params.offset,
        take: params.limit,
        include: { taxCode: true },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.product.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data: products,
      metadata: {
        total,
        limit: params.limit,
        offset: params.offset,
        hasMore: params.offset + params.limit < total,
      },
    });
  } catch (error) {
    logger.error('Error listing products', { error });
    return NextResponse.json(
      { error: 'Failed to list products' },
      { status: 500 }
    );
  }
}

// ============================================================================
// POST /api/mdm/products - Create product
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
    const data = CreateProductSchema.parse(body);

    // Check for duplicate product code
    const existing = await prisma.product.findFirst({
      where: {
        tenantId: ctx.tenantId,
        productCode: data.productCode,
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: 'Product with this code already exists' },
        { status: 409 }
      );
    }

    // Validate tax code if provided
    if (data.taxCodeId) {
      const taxCode = await prisma.taxCode.findUnique({
        where: { id: data.taxCodeId },
      });

      if (!taxCode || taxCode.tenantId !== ctx.tenantId) {
        return NextResponse.json(
          { error: 'Tax code not found or unauthorized' },
          { status: 404 }
        );
      }
    }

    // Create product
    const product = await prisma.product.create({
      data: {
        tenantId: ctx.tenantId,
        ...data,
        createdBy: ctx.userId,
        updatedBy: ctx.userId,
      },
      include: { taxCode: true },
    });

    logger.info('Product created', {
      tenantId: ctx.tenantId,
      productId: product.id,
      productCode: product.productCode,
    });

    return NextResponse.json(
      {
        success: true,
        data: product,
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

    logger.error('Error creating product', { error });
    return NextResponse.json(
      { error: 'Failed to create product' },
      { status: 500 }
    );
  }
}

export const GET = withTenantContext(handleGET, { requireAuth: true });
export const POST = withTenantContext(handlePOST, { requireAuth: true });
