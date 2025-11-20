import { NextRequest, NextResponse } from "next/server";
import { withTenantContext } from "@/lib/api-wrapper";
import { requireTenantContext } from "@/lib/tenant-utils";
import { approvalsService } from "@/lib/services/approvals/approvals-service";
import { logger } from "@/lib/logger";
import { z } from "zod";

const DelegateSchema = z.object({
  newApproverId: z.string().min(1, "New approver ID is required"),
  reason: z.string().optional(),
});

/**
 * POST /api/approvals/[id]/delegate
 * Delegate approval to another user
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
    const { newApproverId, reason } = DelegateSchema.parse(body);

    // Delegate approval
    const approval = await approvalsService.delegateApproval(
      tenantId,
      userId,
      params.id,
      newApproverId,
      reason
    );

    return NextResponse.json({
      success: true,
      data: approval,
      message: "Approval delegated successfully",
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.issues },
        { status: 400 }
      );
    }

    if (error instanceof Error) {
      if (
        error.message === "Approval not found" ||
        error.message === "New approver not found"
      ) {
        return NextResponse.json({ error: error.message }, { status: 404 });
      }
      if (
        error.message === "You are not authorized to delegate this approval" ||
        error.message === "This approval has already been processed"
      ) {
        return NextResponse.json({ error: error.message }, { status: 403 });
      }
    }

    logger.error("Error delegating approval", { error, approvalId: params.id });
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
};

export const POST = withTenantContext(_api_POST, { requireAuth: true });
