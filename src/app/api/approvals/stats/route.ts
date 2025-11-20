import { NextRequest, NextResponse } from "next/server";
import { withTenantContext } from "@/lib/api-wrapper";
import { requireTenantContext } from "@/lib/tenant-utils";
import { approvalsService } from "@/lib/services/approvals/approvals-service";
import { logger } from "@/lib/logger";

/**
 * GET /api/approvals/stats
 * Get approvals statistics and analytics
 */
const _api_GET = async (request: NextRequest) => {
  try {
    let ctx;
    try {
      ctx = requireTenantContext();
    } catch (contextError) {
      logger.error("Failed to get tenant context in GET /api/approvals/stats", { error: contextError });
      return NextResponse.json(
        { error: "Unauthorized", message: "Tenant context not available" },
        { status: 401 }
      );
    }

    const { userId, tenantId } = ctx;

    if (!userId || !tenantId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get statistics
    const stats = await approvalsService.getStats(tenantId, userId);

    return NextResponse.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    logger.error("Error fetching approval stats", { error });
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
};

export const GET = withTenantContext(_api_GET, { requireAuth: true });
