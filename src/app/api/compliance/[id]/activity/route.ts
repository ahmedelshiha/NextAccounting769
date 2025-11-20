import { NextRequest, NextResponse } from "next/server";
import { withTenantContext } from "@/lib/api-wrapper";
import { requireTenantContext } from "@/lib/tenant-utils";
import { logger } from "@/lib/logger";

/**
 * GET /api/compliance/[id]/activity
 * Get activity log for a compliance filing
 */
const _api_GET = async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  try {
    const { id } = await params;
    const ctx = requireTenantContext();

    if (!ctx.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Mock activity log
    const mockActivity = [
      {
        id: "act-1",
        timestamp: new Date().toISOString(),
        user: "You",
        action: "Created filing deadline",
        details: "VAT return deadline added to calendar",
      },
      {
        id: "act-2",
        timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
        user: "System",
        action: "Reminder sent",
        details: "Email reminder sent 1 day before deadline",
      },
      {
        id: "act-3",
        timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
        user: "You",
        action: "Linked document",
        details: "Bank Statement - January 2025",
      },
      {
        id: "act-4",
        timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        user: "You",
        action: "Created checklist item",
        details: "Added: Prepare Payment",
      },
    ];

    return NextResponse.json({
      success: true,
      data: mockActivity,
    });
  } catch (error) {
    logger.error("Error fetching compliance activity", { error });
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
};

export const GET = withTenantContext(_api_GET, { requireAuth: true });
