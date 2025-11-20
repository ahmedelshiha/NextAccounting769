/**
 * useApprovalActions Hook - Approval Actions Management
 * Custom hook for approval actions (approve, reject, delegate)
 */

import { useState } from "react";
import { toast } from "sonner";

export function useApprovalActions() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const approve = async (approvalId: string, notes?: string) => {
    setIsProcessing(true);
    setError(null);

    try {
      const response = await fetch(`/api/approvals/${approvalId}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to approve item");
      }

      toast.success("Item approved successfully");
      return data.data;
    } catch (err) {
      const error = err instanceof Error ? err : new Error("Unknown error");
      setError(error);
      toast.error(error.message);
      throw error;
    } finally {
      setIsProcessing(false);
    }
  };

  const reject = async (approvalId: string, notes?: string) => {
    setIsProcessing(true);
    setError(null);

    try {
      const response = await fetch(`/api/approvals/${approvalId}/reject`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to reject item");
      }

      toast.success("Item rejected successfully");
      return data.data;
    } catch (err) {
      const error = err instanceof Error ? err : new Error("Unknown error");
      setError(error);
      toast.error(error.message);
      throw error;
    } finally {
      setIsProcessing(false);
    }
  };

  const delegate = async (
    approvalId: string,
    newApproverId: string,
    reason?: string
  ) => {
    setIsProcessing(true);
    setError(null);

    try {
      const response = await fetch(`/api/approvals/${approvalId}/delegate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newApproverId, reason }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to delegate approval");
      }

      toast.success("Approval delegated successfully");
      return data.data;
    } catch (err) {
      const error = err instanceof Error ? err : new Error("Unknown error");
      setError(error);
      toast.error(error.message);
      throw error;
    } finally {
      setIsProcessing(false);
    }
  };

  return {
    approve,
    reject,
    delegate,
    isProcessing,
    error,
  };
}
