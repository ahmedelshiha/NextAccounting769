/**
 * Messages API - List Threads
 * GET /api/messages - List all message threads (chat + tickets)
 */

import { NextRequest, NextResponse } from "next/server";
import { withTenantContext } from "@/lib/api-wrapper";
import { requireTenantContext } from "@/lib/tenant-utils";
import { MessagesService } from "@/lib/services/messages/messages-service";
import type { MessageFilters } from "@/types/messages";

export const GET = withTenantContext(async (request: NextRequest) => {
  try {
    // Authentication
    const ctx = requireTenantContext();
    if (!ctx.userId || !ctx.tenantId) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const tenantId = ctx.tenantId;
    const userId = ctx.userId;

    // Parse query parameters
    const searchParams = request.nextUrl.searchParams;
    const filters: MessageFilters = {
      type: (searchParams.get("type") as any) || "all",
      search: searchParams.get("search") || undefined,
      sortBy: (searchParams.get("sortBy") as any) || "createdAt",
      sortOrder: (searchParams.get("sortOrder") as any) || "desc",
      limit: parseInt(searchParams.get("limit") || "20"),
      offset: parseInt(searchParams.get("offset") || "0"),
    };

    // Get threads
    const { threads, total } = await MessagesService.getThreads(
      tenantId,
      userId,
      filters
    );

    return NextResponse.json({
      success: true,
      data: {
        threads,
        total,
        limit: filters.limit,
        offset: filters.offset,
      },
    });
  } catch (error: any) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error ? error.stack : undefined;

    console.error("Error fetching message threads:", {
      message: errorMsg,
      stack: errorStack,
    });

    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch message threads",
        details: errorMsg,
        ...(process.env.NODE_ENV === 'development' && { stack: errorStack }),
      },
      { status: 500 }
    );
  }
});
