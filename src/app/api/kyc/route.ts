import { NextRequest, NextResponse } from "next/server";
import { withTenantContext } from "@/lib/api-wrapper";
import { requireTenantContext } from "@/lib/tenant-utils";
import prisma from "@/lib/prisma";
import { logger } from "@/lib/logger";

/**
 * GET /api/kyc
 * Retrieve KYC status for an entity
 */
const _api_GET = async (request: NextRequest) => {
  try {
    const ctx = requireTenantContext();

    if (!ctx.tenantId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const entityId = searchParams.get("entityId");

    if (!entityId) {
      return NextResponse.json(
        { error: "Entity ID is required" },
        { status: 400 }
      );
    }

    // Verify entity belongs to tenant
    const entity = await prisma.entity.findFirst({
      where: {
        id: entityId,
        tenantId: ctx.tenantId,
      },
      include: {
        licenses: true,
        registrations: true,
      },
    });

    if (!entity) {
      return NextResponse.json(
        { error: "Entity not found" },
        { status: 404 }
      );
    }

    // Build KYC status based on available data
    const kycData = {
      identity: {
        status: entity.registrations.some(r => r.type === "TRN" || r.type === "TIN") 
          ? "completed" as const 
          : "pending" as const,
        documentType: entity.registrations.find(r => r.type === "TRN" || r.type === "TIN")?.type,
        documentNumber: entity.registrations.find(r => r.type === "TRN" || r.type === "TIN")?.value,
        verifiedAt: entity.registrations.find(r => r.type === "TRN" || r.type === "TIN")?.verifiedAt?.toISOString(),
      },
      address: {
        status: "pending" as const,
        address: undefined,
        verifiedAt: undefined,
      },
      businessInfo: {
        status: entity.licenses.length > 0 ? "completed" as const : "pending" as const,
        registrationNumber: entity.licenses[0]?.licenseNumber,
        verifiedAt: entity.licenses[0]?.issuedAt?.toISOString(),
      },
      beneficialOwners: {
        status: "pending" as const,
        ownersCount: 0,
        verifiedAt: undefined,
      },
      taxInfo: {
        status: entity.registrations.some(r => r.type === "TRN" || r.type === "TIN" || r.type === "VAT") 
          ? "completed" as const 
          : "pending" as const,
        tinNumber: entity.registrations.find(r => r.type === "TRN" || r.type === "TIN")?.value,
        verifiedAt: entity.registrations.find(r => r.type === "TRN" || r.type === "TIN")?.verifiedAt?.toISOString(),
      },
      riskAssessment: {
        status: "pending" as const,
        level: undefined,
        verifiedAt: undefined,
      },
    };

    return NextResponse.json({
      success: true,
      data: kycData,
    });
  } catch (error) {
    logger.error("Error fetching KYC data", { error });
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
};

export const GET = withTenantContext(_api_GET, { requireAuth: true });
