import { NextRequest, NextResponse } from "next/server";
import { withTenantContext } from "@/lib/api-wrapper";
import { requireTenantContext } from "@/lib/tenant-utils";
import { approvalsService } from "@/lib/services/approvals/approvals-service";
import { logger } from "@/lib/logger";
import type { ApprovalFilters } from "@/types/approvals";
import { z } from "zod";

// Validation schemas
const ApprovalFiltersSchema = z.object({
  search: z.string().optional(),
  status: z.enum(["PENDING", "APPROVED", "REJECTED", "DELEGATED", "ESCALATED", "EXPIRED", "all"]).optional(),
  itemType: z.enum(["BILL", "EXPENSE", "DOCUMENT", "INVOICE", "SERVICE_REQUEST", "ENTITY", "USER", "OTHER", "all"]).optional(),
  priority: z.enum(["LOW", "NORMAL", "HIGH", "URGENT", "all"]).optional(),
  approverId: z.string().optional(),
  requesterId: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  sortBy: z.enum(["requestedAt", "priority", "itemType", "status"]).default("requestedAt"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
  limit: z.coerce.number().min(1).max(100).default(20),
  offset: z.coerce.number().min(0).default(0),
});

/**
 * GET /api/approvals
 * List approvals with filters and pagination
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
    const filters = ApprovalFiltersSchema.parse(queryParams) as ApprovalFilters;

    // Fetch approvals
    const { approvals, total } = await approvalsService.listApprovals(
      tenantId,
      userId,
      filters
    );

    return NextResponse.json({
      success: true,
      data: {
        approvals,
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

    logger.error("Error listing approvals", { error });
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
};

export const GET = withTenantContext(_api_GET, { requireAuth: true });
