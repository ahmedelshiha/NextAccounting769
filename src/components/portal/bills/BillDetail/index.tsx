/**
 * BillDetail Component - Bill Details View
 * Displays detailed information about a bill
 */

"use client";

import { useBill } from "@/lib/hooks/bills/useBills";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BillStatus } from "../shared/BillStatus";
import { BillAmount } from "../shared/BillAmount";
import { Loader2, Download, CheckCircle, XCircle, Eye } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { useState } from "react";

interface BillDetailProps {
  billId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRefresh?: () => void;
}

export function BillDetail({
  billId,
  open,
  onOpenChange,
  onRefresh,
}: BillDetailProps) {
  const { bill, isLoading, mutate } = useBill(billId);
  const [isApproving, setIsApproving] = useState(false);

  const handleApprove = async (approved: boolean) => {
    if (!bill) return;

    try {
      setIsApproving(true);
      const response = await fetch(`/api/bills/${bill.id}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ approved }),
      });

      if (!response.ok) {
        throw new Error("Failed to update bill status");
      }

      toast.success(approved ? "Bill approved" : "Bill rejected");
      mutate();
      onRefresh?.();
    } catch (error) {
      toast.error("Failed to update bill status");
    } finally {
      setIsApproving(false);
    }
  };

  const handleDownload = async () => {
    if (!bill?.attachment?.url) {
      toast.error("No attachment available");
      return;
    }

    try {
      const response = await fetch(
        `/api/documents/${bill.attachmentId}/download`
      );
      if (!response.ok) throw new Error("Download failed");

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = bill.attachment.name;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success("Download started");
    } catch (error) {
      toast.error("Download failed");
    }
  };

  const handleViewAttachment = () => {
    if (bill?.attachment?.url) {
      window.open(bill.attachment.url, "_blank");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Bill Details</DialogTitle>
          <DialogDescription>
            View and manage bill information
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          </div>
        ) : bill ? (
          <div className="space-y-6">
            {/* Status and Actions */}
            <div className="flex items-center justify-between">
              <BillStatus status={bill.status} />
              {bill.status === "PENDING" && (
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleApprove(false)}
                    disabled={isApproving}
                  >
                    <XCircle className="h-4 w-4 mr-2" />
                    Reject
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => handleApprove(true)}
                    disabled={isApproving}
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Approve
                  </Button>
                </div>
              )}
            </div>

            {/* Basic Information */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-600">
                  Vendor
                </label>
                <p className="text-base font-medium text-gray-900 dark:text-white mt-1">
                  {bill.vendor}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">
                  Amount
                </label>
                <p className="text-base font-medium text-gray-900 dark:text-white mt-1">
                  <BillAmount amount={bill.amount} currency={bill.currency} />
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">
                  Date
                </label>
                <p className="text-base text-gray-900 dark:text-white mt-1">
                  {format(new Date(bill.date), "MMM dd, yyyy")}
                </p>
              </div>
              {bill.dueDate && (
                <div>
                  <label className="text-sm font-medium text-gray-600">
                    Due Date
                  </label>
                  <p className="text-base text-gray-900 dark:text-white mt-1">
                    {format(new Date(bill.dueDate), "MMM dd, yyyy")}
                  </p>
                </div>
              )}
              {bill.billNumber && (
                <div>
                  <label className="text-sm font-medium text-gray-600">
                    Bill Number
                  </label>
                  <p className="text-base text-gray-900 dark:text-white mt-1">
                    {bill.billNumber}
                  </p>
                </div>
              )}
              {bill.category && (
                <div>
                  <label className="text-sm font-medium text-gray-600">
                    Category
                  </label>
                  <p className="text-base text-gray-900 dark:text-white mt-1">
                    {bill.category}
                  </p>
                </div>
              )}
            </div>

            {/* OCR Data */}
            {bill.ocrData && (
              <div>
                <label className="text-sm font-medium text-gray-600 mb-2 block">
                  Extracted Data
                </label>
                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">
                      OCR Confidence
                    </span>
                    <Badge variant="outline">
                      {((bill.ocrConfidence || 0) * 100).toFixed(0)}%
                    </Badge>
                  </div>
                  {bill.ocrData.vendor && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Vendor</span>
                      <span className="text-sm font-medium">
                        {bill.ocrData.vendor}
                      </span>
                    </div>
                  )}
                  {bill.ocrData.amount && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Amount</span>
                      <span className="text-sm font-medium">
                        <BillAmount amount={bill.ocrData.amount} />
                      </span>
                    </div>
                  )}
                  {bill.ocrData.date && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Date</span>
                      <span className="text-sm font-medium">
                        {bill.ocrData.date}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Description */}
            {bill.description && (
              <div>
                <label className="text-sm font-medium text-gray-600">
                  Description
                </label>
                <p className="text-base text-gray-900 dark:text-white mt-1">
                  {bill.description}
                </p>
              </div>
            )}

            {/* Notes */}
            {bill.notes && (
              <div>
                <label className="text-sm font-medium text-gray-600">
                  Notes
                </label>
                <p className="text-base text-gray-900 dark:text-white mt-1">
                  {bill.notes}
                </p>
              </div>
            )}

            {/* Attachment */}
            {bill.attachment && (
              <div>
                <label className="text-sm font-medium text-gray-600 mb-2 block">
                  Attachment
                </label>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={handleViewAttachment}>
                    <Eye className="h-4 w-4 mr-2" />
                    View
                  </Button>
                  <Button variant="outline" size="sm" onClick={handleDownload}>
                    <Download className="h-4 w-4 mr-2" />
                    Download
                  </Button>
                  <span className="text-sm text-gray-600">
                    {bill.attachment.name}
                  </span>
                </div>
              </div>
            )}

            {/* Metadata */}
            <div className="border-t pt-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Created</span>
                  <p className="text-gray-900 dark:text-white">
                    {format(new Date(bill.createdAt), "MMM dd, yyyy HH:mm")}
                  </p>
                </div>
                <div>
                  <span className="text-gray-600">Updated</span>
                  <p className="text-gray-900 dark:text-white">
                    {format(new Date(bill.updatedAt), "MMM dd, yyyy HH:mm")}
                  </p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <p className="text-center text-gray-600 py-12">Bill not found</p>
        )}
      </DialogContent>
    </Dialog>
  );
}
