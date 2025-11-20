import { NextRequest, NextResponse } from "next/server";
import { withTenantContext } from "@/lib/api-wrapper";
import { requireTenantContext } from "@/lib/tenant-utils";
import { logger } from "@/lib/logger";
import prisma from "@/lib/prisma";

interface FeatureCounts {
  kycPending: number;
  documentsPending: number;
  invoicesPending: number;
  billsPending: number;
  approvalsPending: number;
}

/**
 * GET /api/features/counts?entityId=...
 * Get pending item counts for each feature area
 */
const _api_GET = async (request: NextRequest) => {
  try {
    const ctx = requireTenantContext();
    const { searchParams } = new URL(request.url);
    const entityId = searchParams.get("entityId");

    if (!ctx.userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // If entityId provided, verify it belongs to tenant
    const query: any = { tenantId: ctx.tenantId };
    if (entityId) {
      const entity = await prisma.entity.findUnique({
        where: { id: entityId },
      });

      if (!entity || entity.tenantId !== ctx.tenantId) {
        return NextResponse.json(
          { error: "Entity not found" },
          { status: 404 }
        );
      }
      query.entityId = entityId;
    }

    const counts: FeatureCounts = {
      kycPending: 0,
      documentsPending: 0,
      invoicesPending: 0,
      billsPending: 0,
      approvalsPending: 0,
    };

    // KYC pending - count incomplete KYC records
    // This would be implemented with actual KYC model once created
    // For now: 0
    counts.kycPending = 0;

    // Documents pending - count documents awaiting review or action
    // This would count based on document status and assignments
    // For now: 0
    counts.documentsPending = 0;

    // Invoices pending - count unpaid invoices
    // This would be implemented with actual invoicing model
    // For now: 0
    counts.invoicesPending = 0;

    // Bills pending - count bills awaiting categorization/approval
    // This would count unprocessed receipt uploads
    // For now: 0
    counts.billsPending = 0;

    // Approvals pending - count items awaiting approval
    // This would aggregate across all approval types
    // For now: 0
    counts.approvalsPending = 0;

    return NextResponse.json({
      success: true,
      data: counts,
    });
  } catch (error) {
    logger.error("Error fetching feature counts", { error });
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
};

export const GET = withTenantContext(_api_GET, { requireAuth: true });
