/**
 * Messages API - Thread Details
 * GET /api/messages/[id] - Get thread details and messages
 */

import { NextRequest, NextResponse } from "next/server";
import { withTenantContext } from "@/lib/api-wrapper";
import { requireTenantContext } from "@/lib/tenant-utils";
import { MessagesService } from "@/lib/services/messages/messages-service";
import { TicketsService } from "@/lib/services/messages/tickets-service";

export const GET = withTenantContext(async (
  request: NextRequest,
  { params }: { params: { id: string } }
) => {
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
    const threadId = params.id;

    // Parse query parameters
    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get("limit") || "50");
    const offset = parseInt(searchParams.get("offset") || "0");

    // Try to get as chat thread first
    const { messages, total } = await MessagesService.getThreadMessages(
      tenantId,
      threadId,
      limit,
      offset
    );

    // If no messages, try as ticket
    let ticket = null;
    if (messages.length === 0) {
      ticket = await TicketsService.getTicketById(tenantId, threadId);
    }

    return NextResponse.json({
      success: true,
      data: {
        threadId,
        messages,
        ticket,
        total,
        limit,
        offset,
      },
    });
  } catch (error: any) {
    console.error("Error fetching thread details:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch thread details",
        details: error.message,
      },
      { status: 500 }
    );
  }
});
