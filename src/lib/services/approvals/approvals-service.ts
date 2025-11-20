/**
 * Approvals Service - Business Logic Layer
 * Handles all approval-related operations
 */

import prisma from "@/lib/prisma";
import { logger } from "@/lib/logger";
import {
  ApprovalStatus,
} from "@/types/approvals";
import type {
  Approval,
  ApprovalFilters,
  ApprovalStats,
  ApprovalItemType,
} from "@/types/approvals";

export class ApprovalsService {
  /**
   * List approvals with filters and pagination
   */
  async listApprovals(
    tenantId: string,
    userId: string,
    filters: ApprovalFilters = {}
  ): Promise<{ approvals: any[]; total: number }> {
    const {
      search,
      status,
      itemType,
      priority,
      approverId,
      requesterId,
      startDate,
      endDate,
      sortBy = "requestedAt",
      sortOrder = "desc",
      limit = 20,
      offset = 0,
    } = filters;

    // Build where clause
    const where: any = {
      tenantId,
      approverId: approverId || userId, // Default to current user's approvals
      AND: [],
    };

    // Search filter
    if (search) {
      where.AND.push({
        OR: [
          { requesterName: { contains: search, mode: "insensitive" } },
          { approverName: { contains: search, mode: "insensitive" } },
          { reason: { contains: search, mode: "insensitive" } },
        ],
      });
    }

    // Status filter
    if (status && status !== "all") {
      where.AND.push({ status });
    }

    // Item type filter
    if (itemType && itemType !== "all") {
      where.AND.push({ itemType });
    }

    // Priority filter
    if (priority && priority !== "all") {
      where.AND.push({ priority });
    }

    // Requester filter
    if (requesterId) {
      where.AND.push({ requesterId });
    }

    // Date range filter
    if (startDate || endDate) {
      const dateFilter: any = {};
      if (startDate) dateFilter.gte = new Date(startDate);
      if (endDate) dateFilter.lte = new Date(endDate);
      where.AND.push({ requestedAt: dateFilter });
    }

    // Remove empty AND array
    if (where.AND.length === 0) {
      delete where.AND;
    }

    // Count total
    const total = await prisma.approval.count({ where });

    // Fetch approvals
    const approvals = await prisma.approval.findMany({
      where,
      include: {
        requester: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        approver: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        history: {
          orderBy: { performedAt: "desc" },
          take: 5,
          include: {
            performer: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
      },
      orderBy: { [sortBy]: sortOrder },
      take: limit,
      skip: offset,
    });

    return { approvals, total };
  }

  /**
   * Get approval by ID
   */
  async getApproval(tenantId: string, approvalId: string): Promise<any | null> {
    const approval = await prisma.approval.findFirst({
      where: {
        id: approvalId,
        tenantId,
      },
      include: {
        requester: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        approver: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        decider: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        history: {
          orderBy: { performedAt: "desc" },
          include: {
            performer: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
      },
    });

    return approval;
  }

  /**
   * Approve an item
   */
  async approveItem(
    tenantId: string,
    userId: string,
    approvalId: string,
    notes?: string
  ): Promise<any> {
    // Verify approval exists and user is the approver
    const existingApproval = await this.getApproval(tenantId, approvalId);
    if (!existingApproval) {
      throw new Error("Approval not found");
    }

    if (existingApproval.approverId !== userId) {
      throw new Error("You are not authorized to approve this item");
    }

    if (existingApproval.status !== ApprovalStatus.PENDING) {
      throw new Error("This approval has already been processed");
    }

    // Update approval
    const approval = await prisma.approval.update({
      where: { id: approvalId },
      data: {
        status: ApprovalStatus.APPROVED,
        decision: "APPROVED",
        decisionAt: new Date(),
        decisionBy: userId,
        decisionNotes: notes,
      },
      include: {
        requester: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        approver: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    // Create history entry
    await prisma.approvalHistory.create({
      data: {
        approvalId,
        tenantId,
        action: "APPROVED",
        performedBy: userId,
        fromStatus: ApprovalStatus.PENDING,
        toStatus: ApprovalStatus.APPROVED,
        notes,
      },
    });

    // Log audit event
    await prisma.auditEvent.create({
      data: {
        tenantId,
        userId,
        type: "approval.approved",
        resource: "approval",
        details: {
          approvalId,
          itemType: approval.itemType,
          itemId: approval.itemId,
        },
      },
    });

    logger.info("Approval approved", { approvalId, tenantId, userId });

    return approval;
  }

  /**
   * Reject an item
   */
  async rejectItem(
    tenantId: string,
    userId: string,
    approvalId: string,
    notes?: string
  ): Promise<any> {
    // Verify approval exists and user is the approver
    const existingApproval = await this.getApproval(tenantId, approvalId);
    if (!existingApproval) {
      throw new Error("Approval not found");
    }

    if (existingApproval.approverId !== userId) {
      throw new Error("You are not authorized to reject this item");
    }

    if (existingApproval.status !== ApprovalStatus.PENDING) {
      throw new Error("This approval has already been processed");
    }

    // Update approval
    const approval = await prisma.approval.update({
      where: { id: approvalId },
      data: {
        status: ApprovalStatus.REJECTED,
        decision: "REJECTED",
        decisionAt: new Date(),
        decisionBy: userId,
        decisionNotes: notes,
      },
      include: {
        requester: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        approver: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    // Create history entry
    await prisma.approvalHistory.create({
      data: {
        approvalId,
        tenantId,
        action: "REJECTED",
        performedBy: userId,
        fromStatus: ApprovalStatus.PENDING,
        toStatus: ApprovalStatus.REJECTED,
        notes,
      },
    });

    // Log audit event
    await prisma.auditEvent.create({
      data: {
        tenantId,
        userId,
        type: "approval.rejected",
        resource: "approval",
        details: {
          approvalId,
          itemType: approval.itemType,
          itemId: approval.itemId,
        },
      },
    });

    logger.info("Approval rejected", { approvalId, tenantId, userId });

    return approval;
  }

  /**
   * Delegate approval to another user
   */
  async delegateApproval(
    tenantId: string,
    userId: string,
    approvalId: string,
    newApproverId: string,
    reason?: string
  ): Promise<any> {
    // Verify approval exists and user is the approver
    const existingApproval = await this.getApproval(tenantId, approvalId);
    if (!existingApproval) {
      throw new Error("Approval not found");
    }

    if (existingApproval.approverId !== userId) {
      throw new Error("You are not authorized to delegate this approval");
    }

    if (existingApproval.status !== "PENDING") {
      throw new Error("This approval has already been processed");
    }

    // Get new approver info
    const newApprover = await prisma.user.findUnique({
      where: { id: newApproverId },
      select: { id: true, name: true, email: true },
    });

    if (!newApprover) {
      throw new Error("New approver not found");
    }

    // Update approval
    const approval = await prisma.approval.update({
      where: { id: approvalId },
      data: {
        approverId: newApproverId,
        approverName: newApprover.name || undefined,
        status: "DELEGATED",
      },
      include: {
        requester: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        approver: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    // Create history entry
    await prisma.approvalHistory.create({
      data: {
        approvalId,
        tenantId,
        action: "DELEGATED",
        performedBy: userId,
        fromStatus: "PENDING",
        toStatus: "DELEGATED",
        notes: reason,
        metadata: {
          fromApproverId: userId,
          toApproverId: newApproverId,
        },
      },
    });

    // Log audit event
    await prisma.auditEvent.create({
      data: {
        tenantId,
        userId,
        type: "approval.delegated",
        resource: "approval",
        details: {
          approvalId,
          fromApproverId: userId,
          toApproverId: newApproverId,
        },
      },
    });

    logger.info("Approval delegated", {
      approvalId,
      tenantId,
      fromUserId: userId,
      toUserId: newApproverId,
    });

    return approval;
  }

  /**
   * Get approval statistics
   */
  async getStats(tenantId: string, userId: string): Promise<ApprovalStats> {
    const approvals = await prisma.approval.findMany({
      where: {
        tenantId,
        approverId: userId,
      },
      select: {
        status: true,
        itemType: true,
        priority: true,
        requestedAt: true,
        decisionAt: true,
      },
    });

    const stats: ApprovalStats = {
      total: approvals.length,
      pending: 0,
      approved: 0,
      rejected: 0,
      expired: 0,
      byType: {},
      byPriority: {},
      avgApprovalTime: 0,
      todayApprovals: 0,
      weekApprovals: 0,
    };

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    let totalApprovalTime = 0;
    let approvedCount = 0;

    approvals.forEach((approval) => {
      // Status counts
      if (approval.status === ApprovalStatus.PENDING) stats.pending++;
      else if (approval.status === ApprovalStatus.APPROVED) stats.approved++;
      else if (approval.status === ApprovalStatus.REJECTED) stats.rejected++;
      else if (approval.status === ApprovalStatus.EXPIRED) stats.expired++;

      // By type
      if (!stats.byType[approval.itemType]) {
        stats.byType[approval.itemType] = 0;
      }
      stats.byType[approval.itemType]++;

      // By priority
      if (!stats.byPriority[approval.priority]) {
        stats.byPriority[approval.priority] = 0;
      }
      stats.byPriority[approval.priority]++;

      // Approval time
      if (approval.decisionAt && approval.status === ApprovalStatus.APPROVED) {
        const timeDiff =
          new Date(approval.decisionAt).getTime() -
          new Date(approval.requestedAt).getTime();
        totalApprovalTime += timeDiff;
        approvedCount++;
      }

      // Today and week counts
      const requestedAt = new Date(approval.requestedAt);
      if (requestedAt >= today) stats.todayApprovals++;
      if (requestedAt >= weekAgo) stats.weekApprovals++;
    });

    // Calculate average approval time in hours
    if (approvedCount > 0) {
      stats.avgApprovalTime = totalApprovalTime / approvedCount / (1000 * 60 * 60);
    }

    return stats;
  }
}

export const approvalsService = new ApprovalsService();
