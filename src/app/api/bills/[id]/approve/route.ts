import { NextRequest, NextResponse } from "next/server";
import { withTenantContext } from "@/lib/api-wrapper";
import { requireTenantContext } from "@/lib/tenant-utils";
import { billsService } from "@/lib/services/bills/bills-service";
import { logger } from "@/lib/logger";
import { z } from "zod";

const ApprovalSchema = z.object({
  approved: z.boolean(),
  notes: z.string().optional(),
});

/**
 * POST /api/bills/[id]/approve
 * Approve or reject bill
 */
const _api_POST = async (
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
    const { approved, notes } = ApprovalSchema.parse(body);

    // Approve or reject bill
    const bill = await billsService.approveBill(
      tenantId,
      userId,
      params.id,
      approved,
      notes
    );

    return NextResponse.json({
      success: true,
      data: bill,
      message: approved ? "Bill approved" : "Bill rejected",
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

    logger.error("Error approving bill", { error, billId: params.id });
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
};

export const POST = withTenantContext(_api_POST, { requireAuth: true });
