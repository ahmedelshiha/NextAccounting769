'use server'

import { prisma } from '@/lib/prisma'
import { EventEmitter } from '@/lib/events/event-emitter'
import { NotificationHub } from '@/lib/notifications/hub'
import type { Approval, ApprovalItemType, ApprovalStatus } from '@prisma/client'

/**
 * Approval workflow context
 */
export interface ApprovalContext {
  tenantId: string
  itemType: ApprovalItemType
  itemId: string
  approverId: string
  requesterId: string
  priority?: 'low' | 'normal' | 'high' | 'urgent'
  expiresAt?: Date
  metadata?: Record<string, any>
}

/**
 * Approval decision
 */
export interface ApprovalDecision {
  approverId: string
  status: 'approved' | 'rejected'
  notes?: string
  metadata?: Record<string, any>
}

/**
 * Approval Workflow Engine - Manages approval routing and automation
 */
export class ApprovalEngine {
  /**
   * Create approval request
   */
  static async requestApproval(context: ApprovalContext): Promise<Approval> {
    const {
      tenantId,
      itemType,
      itemId,
      approverId,
      requesterId,
      priority = 'normal',
      expiresAt,
      metadata,
    } = context

    // Create approval record
    const approval = await prisma.approval.create({
      data: {
        tenantId,
        itemType,
        itemId,
        approverId,
        requesterId,
        status: 'PENDING',
        priority,
        expiresAt: expiresAt || this.getDefaultExpiration(),
        metadata,
      },
      include: {
        approver: true,
        requester: true,
      },
    })

    // Emit event
    await EventEmitter.emit({
      event: 'approval:requested',
      tenantId,
      userId: requesterId,
      entityType: itemType,
      entityId: itemId,
      data: { approverId, priority },
    })

    return approval
  }

  /**
   * Approve request
   */
  static async approve(
    approvalId: string,
    decision: ApprovalDecision
  ): Promise<Approval> {
    const { approverId, notes, metadata } = decision

    // Fetch current approval
    const approval = await prisma.approval.findUnique({
      where: { id: approvalId },
      include: { approver: true, requester: true },
    })

    if (!approval) {
      throw new Error('Approval not found')
    }

    if (approval.status !== 'PENDING') {
      throw new Error(`Cannot approve already ${approval.status} request`)
    }

    if (approval.expiresAt && new Date() > approval.expiresAt) {
      throw new Error('Approval request has expired')
    }

    // Update approval
    const updated = await prisma.approval.update({
      where: { id: approvalId },
      data: {
        status: 'APPROVED',
        approvedAt: new Date(),
        approvedBy: approverId,
        notes,
        metadata,
      },
      include: { approver: true, requester: true },
    })

    // Create history record
    await prisma.approvalHistory.create({
      data: {
        approvalId,
        tenantId: approval.tenantId,
        action: 'approved',
        performedBy: approverId,
        fromStatus: 'PENDING',
        toStatus: 'APPROVED',
        notes,
      },
    })

    // Emit event
    await EventEmitter.emit({
      event: 'approval:approved',
      tenantId: approval.tenantId,
      userId: approverId,
      entityType: approval.itemType,
      entityId: approval.itemId,
      data: { notes },
    })

    // Notify requester
    await NotificationHub.send({
      userId: approval.requesterId,
      tenantId: approval.tenantId,
      type: 'approval_approved',
      title: 'Approval Granted',
      message: `Your ${approval.itemType} has been approved`,
      link: `/portal/approvals/${approvalId}`,
      entityType: 'approval',
      entityId: approvalId,
      relatedUserId: approverId,
      priority: 'high',
    })

    return updated
  }

  /**
   * Reject request
   */
  static async reject(
    approvalId: string,
    decision: ApprovalDecision
  ): Promise<Approval> {
    const { approverId, notes, metadata } = decision

    // Fetch current approval
    const approval = await prisma.approval.findUnique({
      where: { id: approvalId },
      include: { approver: true, requester: true },
    })

    if (!approval) {
      throw new Error('Approval not found')
    }

    if (approval.status !== 'PENDING') {
      throw new Error(`Cannot reject already ${approval.status} request`)
    }

    // Update approval
    const updated = await prisma.approval.update({
      where: { id: approvalId },
      data: {
        status: 'REJECTED',
        rejectedAt: new Date(),
        rejectedBy: approverId,
        notes,
        metadata,
      },
      include: { approver: true, requester: true },
    })

    // Create history record
    await prisma.approvalHistory.create({
      data: {
        approvalId,
        tenantId: approval.tenantId,
        action: 'rejected',
        performedBy: approverId,
        fromStatus: 'PENDING',
        toStatus: 'REJECTED',
        notes,
      },
    })

    // Emit event
    await EventEmitter.emit({
      event: 'approval:rejected',
      tenantId: approval.tenantId,
      userId: approverId,
      entityType: approval.itemType,
      entityId: approval.itemId,
      data: { notes },
    })

    // Notify requester
    await NotificationHub.send({
      userId: approval.requesterId,
      tenantId: approval.tenantId,
      type: 'approval_rejected',
      title: 'Approval Denied',
      message: `Your ${approval.itemType} was not approved`,
      link: `/portal/approvals/${approvalId}`,
      entityType: 'approval',
      entityId: approvalId,
      relatedUserId: approverId,
      priority: 'high',
    })

    return updated
  }

  /**
   * Delegate approval to another user
   */
  static async delegate(
    approvalId: string,
    fromUserId: string,
    toUserId: string,
    reason?: string
  ): Promise<Approval> {
    const approval = await prisma.approval.findUnique({
      where: { id: approvalId },
    })

    if (!approval) {
      throw new Error('Approval not found')
    }

    if (approval.status !== 'PENDING') {
      throw new Error('Cannot delegate non-pending approval')
    }

    // Update approval
    const updated = await prisma.approval.update({
      where: { id: approvalId },
      data: {
        approverId: toUserId,
        status: 'DELEGATED',
        metadata: {
          ...approval.metadata,
          delegatedFrom: fromUserId,
          delegationReason: reason,
          delegatedAt: new Date(),
        },
      },
      include: { approver: true, requester: true },
    })

    // Create history record
    await prisma.approvalHistory.create({
      data: {
        approvalId,
        tenantId: approval.tenantId,
        action: 'delegated',
        performedBy: fromUserId,
        notes: reason,
      },
    })

    // Notify new approver
    await NotificationHub.send({
      userId: toUserId,
      tenantId: approval.tenantId,
      type: 'approval_requested',
      title: 'Delegated Approval',
      message: `An approval has been delegated to you`,
      link: `/portal/approvals/${approvalId}`,
      entityType: 'approval',
      entityId: approvalId,
      relatedUserId: fromUserId,
      priority: 'high',
    })

    return updated
  }

  /**
   * Get approval details
   */
  static async getApproval(approvalId: string): Promise<Approval | null> {
    return prisma.approval.findUnique({
      where: { id: approvalId },
      include: {
        approver: {
          select: { id: true, name: true, email: true },
        },
        requester: {
          select: { id: true, name: true, email: true },
        },
      },
    })
  }

  /**
   * Get pending approvals for user
   */
  static async getPendingApprovals(
    userId: string,
    tenantId: string,
    limit = 20,
    offset = 0
  ): Promise<{ approvals: Approval[]; total: number }> {
    const [approvals, total] = await Promise.all([
      prisma.approval.findMany({
        where: {
          tenantId,
          approverId: userId,
          status: 'PENDING',
        },
        include: {
          requester: {
            select: { id: true, name: true, email: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      prisma.approval.count({
        where: {
          tenantId,
          approverId: userId,
          status: 'PENDING',
        },
      }),
    ])

    return { approvals, total }
  }

  /**
   * Get user's approval history
   */
  static async getApprovalHistory(
    approvalId: string,
    limit = 10
  ): Promise<any[]> {
    return prisma.approvalHistory.findMany({
      where: { approvalId },
      include: {
        performer: {
          select: { id: true, name: true, email: true },
        },
      },
      orderBy: { performedAt: 'desc' },
      take: limit,
    })
  }

  /**
   * Expire old approvals
   */
  static async expireOldApprovals(tenantId: string): Promise<number> {
    const result = await prisma.approval.updateMany({
      where: {
        tenantId,
        status: 'PENDING',
        expiresAt: {
          lt: new Date(),
        },
      },
      data: {
        status: 'EXPIRED',
      },
    })

    // Emit event for each expired approval
    if (result.count > 0) {
      await EventEmitter.emit({
        event: 'approval:expired',
        tenantId,
        data: { count: result.count },
      })
    }

    return result.count
  }

  /**
   * Get default expiration time (7 days from now)
   */
  private static getDefaultExpiration(): Date {
    const date = new Date()
    date.setDate(date.getDate() + 7)
    return date
  }
}

export default ApprovalEngine
