/**
 * Messages API - Ticket Detail
 * GET /api/messages/tickets/[id] - Get ticket
 * PATCH /api/messages/tickets/[id] - Update ticket
 */

import { NextRequest, NextResponse } from "next/server";
import { withTenantContext } from "@/lib/api-wrapper";
import { requireTenantContext } from "@/lib/tenant-utils";
import { TicketsService } from "@/lib/services/messages/tickets-service";
import { TicketCategory, TicketPriority, TicketStatus } from "@/types/messages";
import { z } from "zod";

const updateTicketSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(5000).optional(),
  category: z.nativeEnum(TicketCategory).optional(),
  priority: z.nativeEnum(TicketPriority).optional(),
  status: z.nativeEnum(TicketStatus).optional(),
  assignedToId: z.string().optional(),
  tags: z.array(z.string()).optional(),
});

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
    const ticketId = params.id;

    // Get ticket
    const ticket = await TicketsService.getTicketById(tenantId, ticketId);

    if (!ticket) {
      return NextResponse.json(
        { success: false, error: "Ticket not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: ticket,
    });
  } catch (error: any) {
    console.error("Error fetching ticket:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch ticket",
        details: error.message,
      },
      { status: 500 }
    );
  }
});

export const PATCH = withTenantContext(async (
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
    const validation = updateTicketSchema.safeParse(body);

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

    // Update ticket
    const ticket = await TicketsService.updateTicket(
      tenantId,
      ticketId,
      userId,
      validation.data
    );

    return NextResponse.json({
      success: true,
      data: ticket,
      message: "Ticket updated successfully",
    });
  } catch (error: any) {
    console.error("Error updating ticket:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to update ticket",
        details: error.message,
      },
      { status: 500 }
    );
  }
});
