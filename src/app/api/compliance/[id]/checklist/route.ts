import { NextRequest, NextResponse } from "next/server";
import { withTenantContext } from "@/lib/api-wrapper";
import { requireTenantContext } from "@/lib/tenant-utils";
import { logger } from "@/lib/logger";

/**
 * GET /api/compliance/[id]/checklist
 * Get compliance checklist items
 */
const _api_GET = async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  try {
    const { id } = await params;
    let ctx;
    try {
      ctx = requireTenantContext();
    } catch (contextError) {
      logger.error("Failed to get tenant context in GET /api/compliance/[id]/checklist", { error: contextError });
      return NextResponse.json(
        { error: "Unauthorized", message: "Tenant context not available" },
        { status: 401 }
      );
    }

    if (!ctx.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Mock checklist items for VAT return
    const mockChecklist = [
      {
        id: "check-1",
        title: "Gather Sales Invoices",
        description: "Collect all sales invoices for the month",
        completed: true,
        required: true,
      },
      {
        id: "check-2",
        title: "Collect Purchase Invoices",
        description: "Gather all purchase invoices including VAT",
        completed: true,
        required: true,
      },
      {
        id: "check-3",
        title: "Record Adjustments",
        description: "Note any VAT adjustments or corrections",
        completed: false,
        required: false,
        dueAt: new Date().toISOString(),
      },
      {
        id: "check-4",
        title: "Calculate Total VAT",
        description: "Sum output VAT and input VAT",
        completed: false,
        required: true,
      },
      {
        id: "check-5",
        title: "Prepare Payment",
        description: "Calculate amount due or refund due",
        completed: false,
        required: true,
      },
      {
        id: "check-6",
        title: "Submit to FTA",
        description: "File return through FTA e-Services",
        completed: false,
        required: true,
      },
    ];

    return NextResponse.json({
      success: true,
      data: mockChecklist,
    });
  } catch (error) {
    logger.error("Error fetching compliance checklist", { error });
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
};

export const GET = withTenantContext(_api_GET, { requireAuth: true });
