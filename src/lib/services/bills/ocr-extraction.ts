/**
 * OCR Extraction Service for Bills
 * Handles OCR processing and data extraction from bill images
 */

import prisma from "@/lib/prisma";
import { logger } from "@/lib/logger";
import { OcrService } from "@/lib/ocr/ocr-service";
import type { OcrExtractedData } from "@/types/bills";

export class BillOcrService {
  private ocrService: OcrService;

  constructor() {
    this.ocrService = new OcrService();
  }

  /**
   * Extract data from bill attachment using OCR
   */
  async extractBillData(
    tenantId: string,
    billId: string
  ): Promise<{ ocrData: OcrExtractedData; confidence: number }> {
    // Get bill with attachment
    const bill = await prisma.bill.findFirst({
      where: {
        id: billId,
        tenantId,
      },
      include: {
        attachment: true,
      },
    });

    if (!bill) {
      throw new Error("Bill not found");
    }

    if (!bill.attachment) {
      throw new Error("Bill has no attachment");
    }

    // Update OCR status to processing
    await prisma.bill.update({
      where: { id: billId },
      data: { ocrStatus: "PROCESSING" },
    });

    try {
      // Process document with OCR
      const ocrResult = await this.ocrService.processDocument(bill.attachment);

      // Extract and structure bill data
      const ocrData = this.structureBillData(ocrResult);
      const confidence = this.calculateConfidence(ocrData);

      // Update bill with OCR data
      await prisma.bill.update({
        where: { id: billId },
        data: {
          ocrStatus: "COMPLETED",
          ocrData: ocrData as any,
          ocrConfidence: confidence,
          // Auto-fill fields if confidence is high
          ...(confidence > 0.8 && {
            vendor: ocrData.vendor || bill.vendor,
            amount: ocrData.amount || bill.amount,
            date: ocrData.date ? new Date(ocrData.date) : bill.date,
            billNumber: ocrData.billNumber || bill.billNumber,
          }),
        },
      });

      logger.info("OCR extraction completed", {
        billId,
        confidence,
        tenantId,
      });

      return { ocrData, confidence };
    } catch (error) {
      // Update OCR status to failed
      await prisma.bill.update({
        where: { id: billId },
        data: { ocrStatus: "FAILED" },
      });

      logger.error("OCR extraction failed", {
        billId,
        error,
        tenantId,
      });

      throw error;
    }
  }

  /**
   * Structure raw OCR data into bill format
   */
  private structureBillData(ocrResult: any): OcrExtractedData {
    const extractedData = ocrResult.extractedData || {};

    return {
      vendor: extractedData.vendor || extractedData.store,
      amount: extractedData.totalAmount
        ? parseFloat(extractedData.totalAmount)
        : undefined,
      currency: extractedData.currency || "USD",
      date: extractedData.date,
      billNumber:
        extractedData.billNumber ||
        extractedData.invoiceNumber ||
        extractedData.receiptNumber,
      items: extractedData.items || [],
      taxAmount: extractedData.taxAmount
        ? parseFloat(extractedData.taxAmount)
        : undefined,
      subtotal: extractedData.subtotal
        ? parseFloat(extractedData.subtotal)
        : undefined,
      confidence: ocrResult.confidence,
      rawText: extractedData.text,
    };
  }

  /**
   * Calculate confidence score based on extracted data
   */
  private calculateConfidence(ocrData: OcrExtractedData): number {
    let score = 0;
    let maxScore = 0;

    // Vendor (30%)
    maxScore += 30;
    if (ocrData.vendor && ocrData.vendor.length > 2) score += 30;

    // Amount (30%)
    maxScore += 30;
    if (ocrData.amount && ocrData.amount > 0) score += 30;

    // Date (20%)
    maxScore += 20;
    if (ocrData.date) score += 20;

    // Bill number (10%)
    maxScore += 10;
    if (ocrData.billNumber) score += 10;

    // Items (10%)
    maxScore += 10;
    if (ocrData.items && ocrData.items.length > 0) score += 10;

    return maxScore > 0 ? score / maxScore : 0;
  }

  /**
   * Re-extract data from bill (retry failed extraction)
   */
  async reExtractBillData(
    tenantId: string,
    billId: string
  ): Promise<{ ocrData: OcrExtractedData; confidence: number }> {
    logger.info("Re-extracting bill data", { billId, tenantId });
    return this.extractBillData(tenantId, billId);
  }

  /**
   * Batch extract data from multiple bills
   */
  async batchExtractBillData(
    tenantId: string,
    billIds: string[]
  ): Promise<
    Array<{
      billId: string;
      success: boolean;
      ocrData?: OcrExtractedData;
      confidence?: number;
      error?: string;
    }>
  > {
    const results = [];

    for (const billId of billIds) {
      try {
        const result = await this.extractBillData(tenantId, billId);
        results.push({
          billId,
          success: true,
          ocrData: result.ocrData,
          confidence: result.confidence,
        });
      } catch (error) {
        results.push({
          billId,
          success: false,
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }

    return results;
  }
}

export const billOcrService = new BillOcrService();
