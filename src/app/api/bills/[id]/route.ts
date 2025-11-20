import { NextRequest, NextResponse } from "next/server";
import { withTenantContext } from "@/lib/api-wrapper";
import { requireTenantContext } from "@/lib/tenant-utils";
import { billsService } from "@/lib/services/bills/bills-service";
import { logger } from "@/lib/logger";
import type { BillUpdateInput } from "@/types/bills";
import { z } from "zod";

const BillUpdateSchema = z.object({
  vendor: z.string().min(1).optional(),
  amount: z.number().positive().optional(),
  currency: z.string().optional(),
  date: z.string().datetime().or(z.date()).optional(),
  dueDate: z.string().datetime().or(z.date()).optional(),
  status: z.enum(["PENDING", "APPROVED", "REJECTED", "PAID"]).optional(),
  category: z.string().optional(),
  description: z.string().optional(),
  notes: z.string().optional(),
  tags: z.array(z.string()).optional(),
  billNumber: z.string().optional(),
});

/**
 * GET /api/bills/[id]
 * Get bill by ID
 */
const _api_GET = async (
  request: NextRequest,
  { params }: { params: { id: string } }
) => {
  try {
    const ctx = requireTenantContext();
    const { userId, tenantId } = ctx;

    if (!userId || !tenantId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const bill = await billsService.getBill(tenantId, params.id);

    if (!bill) {
      return NextResponse.json({ error: "Bill not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: bill,
    });
  } catch (error) {
    logger.error("Error fetching bill", { error, billId: params.id });
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
};

/**
 * PATCH /api/bills/[id]
 * Update bill
 */
const _api_PATCH = async (
  request: NextRequest,
  { params }: { params: { id: string } }
) => {
  try {
    const ctx = requireTenantContext();
    const { userId, tenantId } = ctx;

    if (!userId || !tenantId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();

    // Validate input
    const data = BillUpdateSchema.parse(body) as BillUpdateInput;

    // Update bill
    const bill = await billsService.updateBill(
      tenantId,
      userId,
      params.id,
      data
    );

    return NextResponse.json({
      success: true,
      data: bill,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.issues },
        { status: 400 }
      );
    }

    if (error instanceof Error && error.message === "Bill not found") {
      return NextResponse.json({ error: "Bill not found" }, { status: 404 });
    }

    logger.error("Error updating bill", { error, billId: params.id });
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
};

/**
 * DELETE /api/bills/[id]
 * Delete bill
 */
const _api_DELETE = async (
  request: NextRequest,
  { params }: { params: { id: string } }
) => {
  try {
    const ctx = requireTenantContext();
    const { userId, tenantId } = ctx;

    if (!userId || !tenantId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await billsService.deleteBill(tenantId, userId, params.id);

    return NextResponse.json({
      success: true,
      message: "Bill deleted successfully",
    });
  } catch (error) {
    if (error instanceof Error && error.message === "Bill not found") {
      return NextResponse.json({ error: "Bill not found" }, { status: 404 });
    }

    logger.error("Error deleting bill", { error, billId: params.id });
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
};

export const GET = withTenantContext(_api_GET, { requireAuth: true });
export const PATCH = withTenantContext(_api_PATCH, { requireAuth: true });
export const DELETE = withTenantContext(_api_DELETE, { requireAuth: true });
