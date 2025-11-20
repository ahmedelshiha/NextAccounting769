/**
 * BillsTable Component - Bills Table Display
 * Displays bills in a responsive table format
 */

"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { BillStatus } from "../shared/BillStatus";
import { BillAmount } from "../shared/BillAmount";
import { Eye, FileText, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import type { Bill } from "@/types/bills";

interface BillsTableProps {
  bills: Bill[];
  onBillSelect?: (billId: string) => void;
  onRefresh?: () => void;
}

export function BillsTable({ bills, onBillSelect, onRefresh }: BillsTableProps) {
  const handleDelete = async (billId: string) => {
    if (!confirm("Are you sure you want to delete this bill?")) {
      return;
    }

    try {
      const response = await fetch(`/api/bills/${billId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete bill");
      }

      toast.success("Bill deleted successfully");
      onRefresh?.();
    } catch (error) {
      toast.error("Failed to delete bill");
    }
  };

  if (bills.length === 0) {
    return (
      <div className="text-center py-12">
        <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-600 dark:text-gray-400">No bills found</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Vendor</TableHead>
            <TableHead>Amount</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {bills.map((bill) => (
            <TableRow key={bill.id}>
              <TableCell>
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {bill.vendor}
                  </p>
                  {bill.billNumber && (
                    <p className="text-xs text-gray-500">#{bill.billNumber}</p>
                  )}
                </div>
              </TableCell>
              <TableCell>
                <BillAmount
                  amount={bill.amount}
                  currency={bill.currency}
                  className="font-medium"
                />
              </TableCell>
              <TableCell className="text-sm text-gray-600">
                {format(new Date(bill.date), "MMM dd, yyyy")}
              </TableCell>
              <TableCell>
                <BillStatus status={bill.status} />
              </TableCell>
              <TableCell className="text-right">
                <div className="flex items-center justify-end gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onBillSelect?.(bill.id)}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(bill.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
