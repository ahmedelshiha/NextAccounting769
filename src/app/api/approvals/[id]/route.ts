import { NextRequest, NextResponse } from "next/server";
import { withTenantContext } from "@/lib/api-wrapper";
import { requireTenantContext } from "@/lib/tenant-utils";
import { approvalsService } from "@/lib/services/approvals/approvals-service";
import { logger } from "@/lib/logger";

/**
 * GET /api/approvals/[id]
 * Get approval by ID
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

    const approval = await approvalsService.getApproval(tenantId, params.id);

    if (!approval) {
      return NextResponse.json({ error: "Approval not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: approval,
    });
  } catch (error) {
    logger.error("Error fetching approval", { error, approvalId: params.id });
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
};

export const GET = withTenantContext(_api_GET, { requireAuth: true });
