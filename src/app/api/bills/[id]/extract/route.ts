import { NextRequest, NextResponse } from "next/server";
import { withTenantContext } from "@/lib/api-wrapper";
import { requireTenantContext } from "@/lib/tenant-utils";
import { billOcrService } from "@/lib/services/bills/ocr-extraction";
import { logger } from "@/lib/logger";

/**
 * POST /api/bills/[id]/extract
 * Extract OCR data from bill attachment
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

    // Extract OCR data
    const result = await billOcrService.extractBillData(tenantId, params.id);

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "Bill not found") {
        return NextResponse.json(
          { error: "Bill not found" },
          { status: 404 }
        );
      }
      if (error.message === "Bill has no attachment") {
        return NextResponse.json(
          { error: "Bill has no attachment to extract" },
          { status: 400 }
        );
      }
    }

    logger.error("Error extracting bill data", { error, billId: params.id });
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
};

export const POST = withTenantContext(_api_POST, { requireAuth: true });
