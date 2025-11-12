import { NextRequest, NextResponse } from "next/server";
import { withTenantContext } from "@/lib/api-wrapper";
import { requireTenantContext } from "@/lib/tenant-utils";
import { logger } from "@/lib/logger";

/**
 * GET /api/compliance/[id]/documents
 * Get documents linked to a compliance filing
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

    // Mock linked documents
    const mockDocuments = [
      {
        id: "doc-1",
        name: "Sales Invoice Summary - January 2025",
        type: "PDF",
        uploadedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        linkedBy: "you",
      },
      {
        id: "doc-2",
        name: "Purchase Invoices - January 2025",
        type: "Excel",
        uploadedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
        linkedBy: "you",
      },
      {
        id: "doc-3",
        name: "Bank Statement - January 2025",
        type: "PDF",
        uploadedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        linkedBy: "system",
      },
    ];

    return NextResponse.json({
      success: true,
      data: mockDocuments,
    });
  } catch (error) {
    logger.error("Error fetching linked documents", { error });
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
};

export const GET = withTenantContext(_api_GET, { requireAuth: true });
