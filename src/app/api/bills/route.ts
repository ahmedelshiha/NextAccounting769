import { NextRequest, NextResponse } from "next/server";
import { withTenantContext } from "@/lib/api-wrapper";
import { requireTenantContext } from "@/lib/tenant-utils";
import { billsService } from "@/lib/services/bills/bills-service";
import { logger } from "@/lib/logger";
import type { BillFilters } from "@/types/bills";
import { z } from "zod";

// Validation schemas
const BillFiltersSchema = z.object({
  search: z.string().optional(),
  status: z.enum(["PENDING", "APPROVED", "REJECTED", "PAID", "all"]).optional(),
  category: z.string().optional(),
  vendor: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  minAmount: z.coerce.number().optional(),
  maxAmount: z.coerce.number().optional(),
  sortBy: z.enum(["date", "amount", "vendor", "createdAt"]).default("date"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
  limit: z.coerce.number().min(1).max(100).default(20),
  offset: z.coerce.number().min(0).default(0),
});

const BillCreateSchema = z.object({
  vendor: z.string().min(1, "Vendor is required"),
  amount: z.number().positive("Amount must be positive"),
  currency: z.string().default("USD"),
  date: z.string().datetime().or(z.date()),
  dueDate: z.string().datetime().or(z.date()).optional(),
  category: z.string().optional(),
  description: z.string().optional(),
  notes: z.string().optional(),
  tags: z.array(z.string()).optional(),
  attachmentId: z.string().optional(),
});

/**
 * GET /api/bills
 * List bills with filters and pagination
 */
const _api_GET = async (request: NextRequest) => {
  try {
    const ctx = requireTenantContext();
    const { userId, tenantId } = ctx;

    if (!userId || !tenantId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Parse and validate query parameters
    const queryParams = Object.fromEntries(request.nextUrl.searchParams);
    const filters = BillFiltersSchema.parse(queryParams) as BillFilters;

    // Fetch bills
    const { bills, total } = await billsService.listBills(tenantId, filters);

    return NextResponse.json({
      success: true,
      data: {
        bills,
        total,
        limit: filters.limit,
        offset: filters.offset,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.issues },
        { status: 400 }
      );
    }

    logger.error("Error listing bills", { error });
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
};

/**
 * POST /api/bills
 * Create new bill
 */
const _api_POST = async (request: NextRequest) => {
  try {
    const ctx = requireTenantContext();
    const { userId, tenantId } = ctx;

    if (!userId || !tenantId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();

    // Validate input
    const data = BillCreateSchema.parse(body);

    // Create bill
    const bill = await billsService.createBill(tenantId, userId, data);

    return NextResponse.json(
      {
        success: true,
        data: bill,
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.issues },
        { status: 400 }
      );
    }

    logger.error("Error creating bill", { error });
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
};

export const GET = withTenantContext(_api_GET, { requireAuth: true });
export const POST = withTenantContext(_api_POST, { requireAuth: true });
