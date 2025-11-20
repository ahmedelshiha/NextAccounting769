/**
 * useBillUpload Hook - Bill Upload Management
 * Custom hook for uploading bills with progress tracking
 */

import { useState } from "react";
import type { Bill, BillCreateInput } from "@/types/bills";
import { toast } from "sonner";

export function useBillUpload() {
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<Error | null>(null);

  const upload = async (
    file: File,
    data?: Partial<BillCreateInput>
  ): Promise<Bill> => {
    try {
      setIsUploading(true);
      setProgress(0);
      setError(null);

      // Step 1: Upload file to documents (30%)
      const formData = new FormData();
      formData.append("file", file);
      formData.append("category", "bill");

      setProgress(10);

      const uploadResponse = await fetch("/api/documents", {
        method: "POST",
        body: formData,
      });

      if (!uploadResponse.ok) {
        throw new Error("File upload failed");
      }

      const uploadResult = await uploadResponse.json();
      const attachmentId = uploadResult.data.id;

      setProgress(40);

      // Step 2: Create bill with attachment (30%)
      const billData: BillCreateInput = {
        vendor: data?.vendor || "Unknown Vendor",
        amount: data?.amount || 0,
        currency: data?.currency || "USD",
        date: data?.date || new Date().toISOString(),
        dueDate: data?.dueDate,
        category: data?.category,
        description: data?.description,
        notes: data?.notes,
        tags: data?.tags,
        attachmentId,
      };

      const billResponse = await fetch("/api/bills", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(billData),
      });

      if (!billResponse.ok) {
        throw new Error("Bill creation failed");
      }

      const billResult = await billResponse.json();
      const bill = billResult.data;

      setProgress(70);

      // Step 3: Trigger OCR extraction (30%)
      try {
        await fetch(`/api/bills/${bill.id}/extract`, {
          method: "POST",
        });
      } catch (ocrError) {
        // OCR failure is not critical
        console.warn("OCR extraction failed:", ocrError);
      }

      setProgress(100);
      toast.success("Bill uploaded successfully!");

      return bill;
    } catch (err) {
      const error = err instanceof Error ? err : new Error("Upload failed");
      setError(error);
      toast.error(error.message);
      throw error;
    } finally {
      setIsUploading(false);
    }
  };

  return {
    upload,
    isUploading,
    progress,
    error,
  };
}
