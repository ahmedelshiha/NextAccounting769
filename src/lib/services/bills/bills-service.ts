/**
 * Bills Service - Business Logic Layer
 * Handles all bill-related operations
 */

import prisma from "@/lib/prisma";
import { logger } from "@/lib/logger";
import {
  BillStatus,
  OcrStatus,
} from "@/types/bills";
import type {
  Bill,
  BillCreateInput,
  BillUpdateInput,
  BillFilters,
  BillStats,
} from "@/types/bills";

export class BillsService {
  /**
   * List bills with filters and pagination
   */
  async listBills(
    tenantId: string,
    filters: BillFilters = {}
  ): Promise<{ bills: any[]; total: number }> {
    const {
      search,
      status,
      category,
      vendor,
      startDate,
      endDate,
      minAmount,
      maxAmount,
      sortBy = "date",
      sortOrder = "desc",
      limit = 20,
      offset = 0,
    } = filters;

    // Build where clause
    const where: any = {
      tenantId,
      AND: [],
    };

    // Search filter
    if (search) {
      where.AND.push({
        OR: [
          { vendor: { contains: search, mode: "insensitive" } },
          { billNumber: { contains: search, mode: "insensitive" } },
          { description: { contains: search, mode: "insensitive" } },
        ],
      });
    }

    // Status filter
    if (status && status !== "all") {
      where.AND.push({ status });
    }

    // Category filter
    if (category) {
      where.AND.push({ category });
    }

    // Vendor filter
    if (vendor) {
      where.AND.push({ vendor: { contains: vendor, mode: "insensitive" } });
    }

    // Date range filter
    if (startDate || endDate) {
      const dateFilter: any = {};
      if (startDate) dateFilter.gte = new Date(startDate);
      if (endDate) dateFilter.lte = new Date(endDate);
      where.AND.push({ date: dateFilter });
    }

    // Amount range filter
    if (minAmount !== undefined || maxAmount !== undefined) {
      const amountFilter: any = {};
      if (minAmount !== undefined) amountFilter.gte = minAmount;
      if (maxAmount !== undefined) amountFilter.lte = maxAmount;
      where.AND.push({ amount: amountFilter });
    }

    // Remove empty AND array
    if (where.AND.length === 0) {
      delete where.AND;
    }

    // Count total
    const total = await prisma.bill.count({ where });

    // Fetch bills
    const bills = await prisma.bill.findMany({
      where,
      include: {
        attachment: {
          select: {
            id: true,
            name: true,
            url: true,
            contentType: true,
            size: true,
          },
        },
      },
      orderBy: { [sortBy]: sortOrder },
      take: limit,
      skip: offset,
    });

    return { bills, total };
  }

  /**
   * Get bill by ID
   */
  async getBill(tenantId: string, billId: string): Promise<any | null> {
    const bill = await prisma.bill.findFirst({
      where: {
        id: billId,
        tenantId,
      },
      include: {
        attachment: {
          select: {
            id: true,
            name: true,
            url: true,
            contentType: true,
            size: true,
          },
        },
        entity: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return bill;
  }

  /**
   * Create new bill
   */
  async createBill(
    tenantId: string,
    userId: string,
    data: BillCreateInput
  ): Promise<any> {
    const bill = await prisma.bill.create({
      data: {
        tenantId,
        vendor: data.vendor,
        amount: data.amount,
        currency: data.currency || "USD",
        date: new Date(data.date),
        dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
        category: data.category,
        description: data.description,
        notes: data.notes,
        tags: data.tags || [],
        attachmentId: data.attachmentId,
        status: BillStatus.PENDING,
        ocrStatus: OcrStatus.PENDING,
      },
      include: {
        attachment: {
          select: {
            id: true,
            name: true,
            url: true,
            contentType: true,
            size: true,
          },
        },
      },
    });

    // Log audit event
    await prisma.auditEvent.create({
      data: {
        tenantId,
        userId,
        type: "bill.created",
        resource: "bill",
        details: {
          billId: bill.id,
          vendor: bill.vendor,
          amount: bill.amount,
        },
      },
    });

    logger.info("Bill created", { billId: bill.id, tenantId });

    return bill;
  }

  /**
   * Update bill
   */
  async updateBill(
    tenantId: string,
    userId: string,
    billId: string,
    data: BillUpdateInput
  ): Promise<any> {
    // Verify bill exists and belongs to tenant
    const existingBill = await this.getBill(tenantId, billId);
    if (!existingBill) {
      throw new Error("Bill not found");
    }

    const bill = await prisma.bill.update({
      where: { id: billId },
      data: {
        vendor: data.vendor,
        amount: data.amount,
        currency: data.currency,
        date: data.date ? new Date(data.date) : undefined,
        dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
        status: data.status,
        category: data.category,
        description: data.description,
        notes: data.notes,
        tags: data.tags,
        billNumber: data.billNumber,
      },
      include: {
        attachment: {
          select: {
            id: true,
            name: true,
            url: true,
            contentType: true,
            size: true,
          },
        },
      },
    });

    // Log audit event
    await prisma.auditEvent.create({
      data: {
        tenantId,
        userId,
        type: "bill.updated",
        resource: "bill",
        details: {
          billId: bill.id,
          changes: data,
        } as Record<string, any>,
      },
    });

    logger.info("Bill updated", { billId: bill.id, tenantId });

    return bill;
  }

  /**
   * Delete bill
   */
  async deleteBill(
    tenantId: string,
    userId: string,
    billId: string
  ): Promise<void> {
    // Verify bill exists and belongs to tenant
    const existingBill = await this.getBill(tenantId, billId);
    if (!existingBill) {
      throw new Error("Bill not found");
    }

    await prisma.bill.delete({
      where: { id: billId },
    });

    // Log audit event
    await prisma.auditEvent.create({
      data: {
        tenantId,
        userId,
        type: "bill.deleted",
        resource: "bill",
        details: {
          billId,
          vendor: existingBill.vendor,
          amount: existingBill.amount,
        },
      },
    });

    logger.info("Bill deleted", { billId, tenantId });
  }

  /**
   * Approve or reject bill
   */
  async approveBill(
    tenantId: string,
    userId: string,
    billId: string,
    approved: boolean,
    notes?: string
  ): Promise<any> {
    // Verify bill exists and belongs to tenant
    const existingBill = await this.getBill(tenantId, billId);
    if (!existingBill) {
      throw new Error("Bill not found");
    }

    const bill = await prisma.bill.update({
      where: { id: billId },
      data: {
        status: approved ? "APPROVED" : "REJECTED",
        approvedBy: userId,
        approvedAt: new Date(),
        notes: notes || existingBill.notes,
      },
      include: {
        attachment: {
          select: {
            id: true,
            name: true,
            url: true,
            contentType: true,
            size: true,
          },
        },
      },
    });

    // Log audit event
    await prisma.auditEvent.create({
      data: {
        tenantId,
        userId,
        type: approved ? "bill.approved" : "bill.rejected",
        resource: "bill",
        details: {
          billId: bill.id,
          notes,
        },
      },
    });

    logger.info(`Bill ${approved ? "approved" : "rejected"}`, {
      billId: bill.id,
      tenantId,
    });

    return bill;
  }

  /**
   * Get bills statistics
   */
  async getStats(tenantId: string): Promise<BillStats> {
    const bills = await prisma.bill.findMany({
      where: { tenantId },
      select: {
        status: true,
        amount: true,
        category: true,
        vendor: true,
        date: true,
      },
    });

    const stats: BillStats = {
      total: bills.length,
      totalAmount: 0,
      pending: 0,
      pendingAmount: 0,
      approved: 0,
      approvedAmount: 0,
      paid: 0,
      paidAmount: 0,
      byCategory: {},
      byVendor: {},
      byMonth: [],
    };

    // Calculate stats
    bills.forEach((bill) => {
      stats.totalAmount += bill.amount;

      if (bill.status === BillStatus.PENDING) {
        stats.pending++;
        stats.pendingAmount += bill.amount;
      } else if (bill.status === BillStatus.APPROVED) {
        stats.approved++;
        stats.approvedAmount += bill.amount;
      } else if (bill.status === BillStatus.PAID) {
        stats.paid++;
        stats.paidAmount += bill.amount;
      }

      // By category
      if (bill.category) {
        if (!stats.byCategory[bill.category]) {
          stats.byCategory[bill.category] = { count: 0, amount: 0 };
        }
        stats.byCategory[bill.category].count++;
        stats.byCategory[bill.category].amount += bill.amount;
      }

      // By vendor
      if (!stats.byVendor[bill.vendor]) {
        stats.byVendor[bill.vendor] = { count: 0, amount: 0 };
      }
      stats.byVendor[bill.vendor].count++;
      stats.byVendor[bill.vendor].amount += bill.amount;
    });

    // By month (last 12 months)
    const monthsMap: Record<string, { count: number; amount: number }> = {};
    bills.forEach((bill) => {
      const month = new Date(bill.date).toISOString().slice(0, 7); // YYYY-MM
      if (!monthsMap[month]) {
        monthsMap[month] = { count: 0, amount: 0 };
      }
      monthsMap[month].count++;
      monthsMap[month].amount += bill.amount;
    });

    stats.byMonth = Object.entries(monthsMap)
      .map(([month, data]) => ({ month, ...data }))
      .sort((a, b) => b.month.localeCompare(a.month))
      .slice(0, 12);

    return stats;
  }
}

export const billsService = new BillsService();
