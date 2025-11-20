import { NextRequest, NextResponse } from "next/server";
import { withTenantContext } from "@/lib/api-wrapper";
import { requireTenantContext } from "@/lib/tenant-utils";
import { logger } from "@/lib/logger";

export const GET = withTenantContext(async (request: NextRequest) => {
  try {
    let ctx;
    try {
      ctx = requireTenantContext();
    } catch (contextError) {
      logger.error("Failed to get tenant context in GET /api/compliance", { error: contextError });
      return NextResponse.json(
        { success: false, error: "Unauthorized", message: "Tenant context not available" },
        { status: 401 }
      );
    }

    if (!ctx.userId) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    // Mock data for now - replace with actual database query
    const complianceItems = [
      {
        id: "comp-1",
        entityId: "ent-1",
        entityName: "Acme Corp UAE",
        type: "VAT Return",
        frequency: "Quarterly",
        dueAt: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(),
        status: "UPCOMING",
        priority: "high",
        completionPercentage: 65,
        assigneeId: ctx.userId,
        assigneeName: ctx.userName || "You",
      },
      {
        id: "comp-2",
        entityId: "ent-1",
        entityName: "Acme Corp UAE",
        type: "Corporate Tax Return",
        frequency: "Annual",
        dueAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        status: "OVERDUE",
        priority: "high",
        completionPercentage: 30,
      },
      {
        id: "comp-3",
        entityId: "ent-2",
        entityName: "Tech Solutions KSA",
        type: "Zakat Declaration",
        frequency: "Annual",
        dueAt: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000).toISOString(),
        status: "UPCOMING",
        priority: "medium",
        completionPercentage: 80,
      },
      {
        id: "comp-4",
        entityId: "ent-3",
        entityName: "Services Ltd Egypt",
        type: "Income Tax Return",
        frequency: "Annual",
        dueAt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(),
        status: "FILED",
        priority: "low",
        completionPercentage: 100,
      },
    ];

    return NextResponse.json({
      success: true,
      data: complianceItems,
    });
  } catch (error) {
    console.error("Compliance API error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
});
