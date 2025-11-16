/**
 * Messages Service - Business Logic Layer
 * Handles chat messages and thread management
 */

import prisma from "@/lib/prisma";
import type { ChatMessage, MessageThread, MessageFilters } from "@/types/messages";

export class MessagesService {
  /**
   * Get all message threads (chat + tickets)
   */
  static async getThreads(
    tenantId: string,
    userId: string,
    filters: MessageFilters = {}
  ): Promise<{ threads: MessageThread[]; total: number }> {
    const {
      type = "all",
      search = "",
      sortBy = "createdAt",
      sortOrder = "desc",
      limit = 20,
      offset = 0,
    } = filters;

    const threads: MessageThread[] = [];

    // Get chat threads
    if (type === "all" || type === "chat") {
      const chatRooms = await prisma.chatMessage.groupBy({
        by: ["room"],
        where: {
          tenantId,
          room: { not: null },
          ...(search && {
            OR: [
              { text: { contains: search, mode: "insensitive" } },
              { userName: { contains: search, mode: "insensitive" } },
            ],
          }),
        },
        _max: {
          createdAt: true,
        },
        _count: {
          id: true,
        },
      });

      for (const room of chatRooms) {
        if (!room.room) continue;

        const lastMessage = await prisma.chatMessage.findFirst({
          where: { tenantId, room: room.room },
          orderBy: { createdAt: "desc" },
        });

        if (lastMessage) {
          threads.push({
            id: room.room,
            type: "chat",
            title: `Chat: ${room.room}`,
            lastMessage: lastMessage.text,
            lastMessageAt: lastMessage.createdAt.toISOString(),
            unreadCount: 0, // TODO: Implement unread tracking
            participants: [lastMessage.userName],
            metadata: { messageCount: room._count.id },
          });
        }
      }
    }

    // Get ticket threads
    if (type === "all" || type === "ticket") {
      const tickets = await prisma.supportTicket.findMany({
        where: {
          tenantId,
          ...(search && {
            OR: [
              { title: { contains: search, mode: "insensitive" } },
              { description: { contains: search, mode: "insensitive" } },
            ],
          }),
        },
        include: {
          user: {
            select: { id: true, name: true, email: true },
          },
          comments: {
            orderBy: { createdAt: "desc" },
            take: 1,
          },
        },
        orderBy: { [sortBy]: sortOrder },
        take: limit,
        skip: offset,
      });

      for (const ticket of tickets) {
        const lastComment = ticket.comments[0];
        threads.push({
          id: ticket.id,
          type: "ticket",
          title: ticket.title,
          lastMessage: lastComment?.content || ticket.description || "",
          lastMessageAt: ticket.updatedAt.toISOString(),
          unreadCount: 0, // TODO: Implement unread tracking
          participants: [ticket.user?.name || "Unknown"],
          metadata: {
            status: ticket.status,
            priority: ticket.priority,
            category: ticket.category,
          },
        });
      }
    }

    // Sort threads by last message time
    threads.sort((a, b) => {
      const dateA = new Date(a.lastMessageAt).getTime();
      const dateB = new Date(b.lastMessageAt).getTime();
      return sortOrder === "desc" ? dateB - dateA : dateA - dateB;
    });

    return {
      threads: threads.slice(0, limit),
      total: threads.length,
    };
  }

  /**
   * Get messages in a chat thread
   */
  static async getThreadMessages(
    tenantId: string,
    threadId: string,
    limit: number = 50,
    offset: number = 0
  ): Promise<{ messages: ChatMessage[]; total: number }> {
    const messages = await prisma.chatMessage.findMany({
      where: {
        tenantId,
        room: threadId,
      },
      orderBy: { createdAt: "asc" },
      take: limit,
      skip: offset,
    });

    const total = await prisma.chatMessage.count({
      where: { tenantId, room: threadId },
    });

    return {
      messages: messages.map((msg) => ({
        id: msg.id,
        tenantId: msg.tenantId,
        room: msg.room,
        userId: msg.userId,
        userName: msg.userName,
        role: msg.role,
        text: msg.text,
        createdAt: msg.createdAt.toISOString(),
      })),
      total,
    };
  }

  /**
   * Send a message in a chat thread
   */
  static async sendMessage(
    tenantId: string,
    userId: string,
    userName: string,
    userRole: string,
    threadId: string,
    text: string
  ): Promise<ChatMessage> {
    const message = await prisma.chatMessage.create({
      data: {
        tenantId,
        room: threadId,
        userId,
        userName,
        role: userRole,
        text,
      },
    });

    return {
      id: message.id,
      tenantId: message.tenantId,
      room: message.room,
      userId: message.userId,
      userName: message.userName,
      role: message.role,
      text: message.text,
      createdAt: message.createdAt.toISOString(),
    };
  }

  /**
   * Get messaging statistics
   */
  static async getStats(
    tenantId: string,
    userId: string
  ): Promise<{
    totalThreads: number;
    unreadThreads: number;
    totalMessages: number;
    todayMessages: number;
  }> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [chatRooms, totalMessages, todayMessages, openTickets] = await Promise.all([
      prisma.chatMessage.groupBy({
        by: ["room"],
        where: { tenantId, room: { not: null } },
      }),
      prisma.chatMessage.count({ where: { tenantId } }),
      prisma.chatMessage.count({
        where: { tenantId, createdAt: { gte: today } },
      }),
      prisma.supportTicket.count({
        where: { tenantId, status: { in: ["OPEN", "IN_PROGRESS"] } },
      }),
    ]);

    return {
      totalThreads: chatRooms.length + openTickets,
      unreadThreads: 0, // TODO: Implement unread tracking
      totalMessages,
      todayMessages,
    };
  }
}
