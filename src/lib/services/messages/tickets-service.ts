/**
 * Tickets Service - Business Logic Layer
 * Handles support ticket management
 */

import prisma from "@/lib/prisma";
import type {
  SupportTicket,
  CreateTicketRequest,
  UpdateTicketRequest,
  AddCommentRequest,
  TicketStatus,
  TicketPriority,
  TicketCategory,
} from "@/types/messages";

export class TicketsService {
  /**
   * Get all support tickets
   */
  static async getTickets(
    tenantId: string,
    userId: string,
    filters: {
      status?: TicketStatus | "all";
      priority?: TicketPriority | "all";
      category?: TicketCategory | "all";
      search?: string;
      limit?: number;
      offset?: number;
    } = {}
  ): Promise<{ tickets: SupportTicket[]; total: number }> {
    const {
      status,
      priority,
      category,
      search = "",
      limit = 20,
      offset = 0,
    } = filters;

    const where: any = { tenantId };

    if (status && status !== "all") {
      where.status = status;
    }

    if (priority && priority !== "all") {
      where.priority = priority;
    }

    if (category && category !== "all") {
      where.category = category;
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
      ];
    }

    const [tickets, total] = await Promise.all([
      prisma.supportTicket.findMany({
        where,
        include: {
          user: {
            select: { id: true, name: true, email: true },
          },
          assignedTo: {
            select: { id: true, name: true, email: true },
          },
          comments: {
            orderBy: { createdAt: "desc" },
            take: 5,
            include: {
              author: {
                select: { id: true, name: true, email: true },
              },
            },
          },
          statusHistory: {
            orderBy: { changedAt: "desc" },
            take: 10,
          },
        },
        orderBy: { createdAt: "desc" },
        take: limit,
        skip: offset,
      }),
      prisma.supportTicket.count({ where }),
    ]);

    return {
      tickets: tickets.map((ticket) => ({
        ...ticket,
        category: ticket.category as TicketCategory,
        createdAt: ticket.createdAt.toISOString(),
        updatedAt: ticket.updatedAt.toISOString(),
        resolvedAt: ticket.resolvedAt?.toISOString() || null,
        dueAt: ticket.dueAt?.toISOString() || null,
        slaFirstResponseAt: ticket.slaFirstResponseAt?.toISOString() || null,
        slaResolutionAt: ticket.slaResolutionAt?.toISOString() || null,
        comments: ticket.comments.map((comment) => ({
          ...comment,
          createdAt: comment.createdAt.toISOString(),
          updatedAt: comment.updatedAt.toISOString(),
        })),
        statusHistory: ticket.statusHistory.map((history) => ({
          ...history,
          changedAt: history.changedAt.toISOString(),
        })),
      })) as SupportTicket[],
      total,
    };
  }

  /**
   * Get a single ticket by ID
   */
  static async getTicketById(
    tenantId: string,
    ticketId: string
  ): Promise<SupportTicket | null> {
    const ticket = await prisma.supportTicket.findFirst({
      where: { id: ticketId, tenantId },
      include: {
        user: {
          select: { id: true, name: true, email: true },
        },
        assignedTo: {
          select: { id: true, name: true, email: true },
        },
        comments: {
          orderBy: { createdAt: "asc" },
          include: {
            author: {
              select: { id: true, name: true, email: true },
            },
          },
        },
        statusHistory: {
          orderBy: { changedAt: "desc" },
        },
      },
    });

    if (!ticket) return null;

    return {
      ...ticket,
      category: ticket.category as TicketCategory,
      createdAt: ticket.createdAt.toISOString(),
      updatedAt: ticket.updatedAt.toISOString(),
      resolvedAt: ticket.resolvedAt?.toISOString() || null,
      dueAt: ticket.dueAt?.toISOString() || null,
      slaFirstResponseAt: ticket.slaFirstResponseAt?.toISOString() || null,
      slaResolutionAt: ticket.slaResolutionAt?.toISOString() || null,
      comments: ticket.comments.map((comment) => ({
        ...comment,
        createdAt: comment.createdAt.toISOString(),
        updatedAt: comment.updatedAt.toISOString(),
      })),
      statusHistory: ticket.statusHistory.map((history) => ({
        ...history,
        changedAt: history.changedAt.toISOString(),
      })),
    } as SupportTicket;
  }

  /**
   * Create a new support ticket
   */
  static async createTicket(
    tenantId: string,
    userId: string,
    data: CreateTicketRequest
  ): Promise<SupportTicket> {
    const ticket = await prisma.supportTicket.create({
      data: {
        tenantId,
        userId,
        title: data.title,
        description: data.description,
        category: data.category,
        priority: data.priority,
        status: "OPEN",
        attachmentIds: data.attachments || [],
        tags: data.tags || [],
      },
      include: {
        user: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    // Create status history entry
    await prisma.supportTicketStatusHistory.create({
      data: {
        ticketId: ticket.id,
        previousStatus: null,
        newStatus: "OPEN",
        changedBy: userId,
        reason: "Ticket created",
      },
    });

    return {
      ...ticket,
      assignedToId: ticket.assignedToId,
      category: ticket.category as TicketCategory,
      createdAt: ticket.createdAt.toISOString(),
      updatedAt: ticket.updatedAt.toISOString(),
      resolvedAt: ticket.resolvedAt?.toISOString() || null,
      dueAt: ticket.dueAt?.toISOString() || null,
      slaFirstResponseAt: ticket.slaFirstResponseAt?.toISOString() || null,
      slaResolutionAt: ticket.slaResolutionAt?.toISOString() || null,
    } as SupportTicket;
  }

  /**
   * Update a support ticket
   */
  static async updateTicket(
    tenantId: string,
    ticketId: string,
    userId: string,
    data: UpdateTicketRequest
  ): Promise<SupportTicket> {
    const existingTicket = await prisma.supportTicket.findFirst({
      where: { id: ticketId, tenantId },
    });

    if (!existingTicket) {
      throw new Error("Ticket not found");
    }

    const updateData: any = {};

    if (data.title !== undefined) updateData.title = data.title;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.category !== undefined) updateData.category = data.category;
    if (data.priority !== undefined) updateData.priority = data.priority;
    if (data.assignedToId !== undefined) updateData.assignedToId = data.assignedToId;
    if (data.tags !== undefined) updateData.tags = data.tags;

    // Handle status change
    if (data.status && data.status !== existingTicket.status) {
      updateData.status = data.status;

      if (data.status === "RESOLVED" || data.status === "CLOSED") {
        updateData.resolvedAt = new Date();
      }

      // Create status history entry
      await prisma.supportTicketStatusHistory.create({
        data: {
          ticketId,
          previousStatus: existingTicket.status,
          newStatus: data.status,
          changedBy: userId,
        },
      });
    }

    const ticket = await prisma.supportTicket.update({
      where: { id: ticketId },
      data: updateData,
      include: {
        user: {
          select: { id: true, name: true, email: true },
        },
        assignedTo: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    return {
      ...ticket,
      category: ticket.category as TicketCategory,
      createdAt: ticket.createdAt.toISOString(),
      updatedAt: ticket.updatedAt.toISOString(),
      resolvedAt: ticket.resolvedAt?.toISOString() || null,
      dueAt: ticket.dueAt?.toISOString() || null,
      slaFirstResponseAt: ticket.slaFirstResponseAt?.toISOString() || null,
      slaResolutionAt: ticket.slaResolutionAt?.toISOString() || null,
    } as SupportTicket;
  }

  /**
   * Add a comment to a ticket
   */
  static async addComment(
    tenantId: string,
    userId: string,
    data: AddCommentRequest
  ): Promise<any> {
    // Verify ticket exists and belongs to tenant
    const ticket = await prisma.supportTicket.findFirst({
      where: { id: data.ticketId, tenantId },
    });

    if (!ticket) {
      throw new Error("Ticket not found");
    }

    const comment = await prisma.supportTicketComment.create({
      data: {
        ticketId: data.ticketId,
        authorId: userId,
        content: data.content,
        attachmentIds: data.attachments || [],
        isInternal: data.isInternal || false,
      },
      include: {
        author: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    // Update ticket's updatedAt
    await prisma.supportTicket.update({
      where: { id: data.ticketId },
      data: { updatedAt: new Date() },
    });

    return {
      ...comment,
      createdAt: comment.createdAt.toISOString(),
      updatedAt: comment.updatedAt.toISOString(),
    };
  }

  /**
   * Get ticket statistics
   */
  static async getStats(
    tenantId: string
  ): Promise<{
    total: number;
    open: number;
    inProgress: number;
    resolved: number;
    byCategory: Record<string, number>;
    byPriority: Record<string, number>;
  }> {
    const [total, open, inProgress, resolved, byCategory, byPriority] = await Promise.all([
      prisma.supportTicket.count({ where: { tenantId } }),
      prisma.supportTicket.count({ where: { tenantId, status: "OPEN" } }),
      prisma.supportTicket.count({ where: { tenantId, status: "IN_PROGRESS" } }),
      prisma.supportTicket.count({ where: { tenantId, status: "RESOLVED" } }),
      prisma.supportTicket.groupBy({
        by: ["category"],
        where: { tenantId },
        _count: { id: true },
      }),
      prisma.supportTicket.groupBy({
        by: ["priority"],
        where: { tenantId },
        _count: { id: true },
      }),
    ]);

    return {
      total,
      open,
      inProgress,
      resolved,
      byCategory: Object.fromEntries(
        byCategory.map((item) => [item.category, item._count.id])
      ),
      byPriority: Object.fromEntries(
        byPriority.map((item) => [item.priority, item._count.id])
      ),
    };
  }
}
