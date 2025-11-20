import { NextRequest, NextResponse } from "next/server";
import { withTenantContext } from "@/lib/api-wrapper";
import { requireTenantContext } from "@/lib/tenant-utils";
import { getVerificationState } from "@/lib/jobs/entity-setup";
import { logger } from "@/lib/logger";
import prisma from "@/lib/prisma";

/**
 * GET /api/entities/[id]/verification-status
 * Check the current verification status of an entity setup job
 */
const _api_GET = async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  try {
    const { id: entityId } = await params;
    const ctx = requireTenantContext();

    if (!ctx.userId || !ctx.tenantId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Verify entity exists and belongs to tenant
    const entity = await prisma.entity.findUnique({
      where: { id: entityId },
    });

    if (!entity) {
      return NextResponse.json(
        { error: "Entity not found" },
        { status: 404 }
      );
    }

    // Verify tenant ownership
    if (entity.tenantId !== ctx.tenantId) {
      return NextResponse.json(
        { error: "Forbidden" },
        { status: 403 }
      );
    }

    // Get verification state from Redis
    const jobState = await getVerificationState(entityId);

    // If no job state exists, check entity status from database
    if (!jobState) {
      // Entity may have been verified without job state (e.g., manual verification)
      return NextResponse.json({
        success: true,
        data: {
          entityId,
          status: entity.status === "VERIFIED" ? "VERIFIED_SUCCESS" : "PENDING_VERIFICATION",
          startedAt: entity.createdAt,
          completedAt: entity.status === "VERIFIED" ? entity.updatedAt : null,
          verifiedRegistrations: [],
        },
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        entityId: jobState.entityId,
        status: jobState.status,
        startedAt: jobState.startedAt,
        completedAt: jobState.completedAt || null,
        verifiedRegistrations: jobState.verifiedRegistrations,
        failureReason: jobState.failureReason || null,
        retryCount: jobState.retryCount,
      },
    });
  } catch (error) {
    logger.error("Error fetching verification status", { error });
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
};

export const GET = withTenantContext(_api_GET, { requireAuth: true });
