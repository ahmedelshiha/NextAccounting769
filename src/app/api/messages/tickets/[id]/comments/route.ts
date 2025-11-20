/**
 * Messages API - Ticket Comments
 * POST /api/messages/tickets/[id]/comments - Add comment
 */

import { NextRequest, NextResponse } from "next/server";
import { withTenantContext } from "@/lib/api-wrapper";
import { requireTenantContext } from "@/lib/tenant-utils";
import { TicketsService } from "@/lib/services/messages/tickets-service";
import { z } from "zod";

const addCommentSchema = z.object({
  content: z.string().min(1, "Comment content is required").max(5000),
  attachments: z.array(z.string()).optional(),
  isInternal: z.boolean().optional(),
});

export const POST = withTenantContext(async (
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
    const userId = ctx.userId;
    const ticketId = params.id;

    // Parse and validate request body
    const body = await request.json();
    const validation = addCommentSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Validation error",
          details: validation.error.errors,
        },
        { status: 400 }
      );
    }

    // Add comment
    const comment = await TicketsService.addComment(tenantId, userId, {
      ticketId,
      ...validation.data,
      content: validation.data.content || 'No content',
    } as any);

    return NextResponse.json({
      success: true,
      data: comment,
      message: "Comment added successfully",
    });
  } catch (error: any) {
    console.error("Error adding comment:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to add comment",
        details: error.message,
      },
      { status: 500 }
    );
  }
});
