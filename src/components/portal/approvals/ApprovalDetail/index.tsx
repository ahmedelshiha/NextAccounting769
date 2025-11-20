/**
 * ApprovalDetail Component - Approval Detail View
 * Displays full approval details with history and actions
 */

"use client";

import { useApproval } from "@/lib/hooks/approvals/useApprovals";
import { useApprovalActions } from "@/lib/hooks/approvals/useApprovalActions";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ApprovalStatus } from "../shared/ApprovalStatus";
import { ApprovalType } from "../shared/ApprovalType";
import { ApprovalPriority } from "../shared/ApprovalPriority";
import { Loader2, CheckCircle2, XCircle, User, Clock, FileText } from "lucide-react";
import { format } from "date-fns";
import { useState } from "react";

interface ApprovalDetailProps {
  approvalId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRefresh: () => void;
}

export function ApprovalDetail({
  approvalId,
  open,
  onOpenChange,
  onRefresh,
}: ApprovalDetailProps) {
  const { approval, isLoading } = useApproval(approvalId);
  const { approve, reject, isProcessing } = useApprovalActions();
  const [notes, setNotes] = useState("");

  const handleApprove = async () => {
    if (!approvalId) return;
    try {
      await approve(approvalId, notes);
      onRefresh();
      onOpenChange(false);
      setNotes("");
    } catch (error) {
      // Error handled by hook
    }
  };

  const handleReject = async () => {
    if (!approvalId) return;
    try {
      await reject(approvalId, notes);
      onRefresh();
      onOpenChange(false);
      setNotes("");
    } catch (error) {
      // Error handled by hook
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Approval Details</DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          </div>
        ) : approval ? (
          <div className="space-y-6">
            {/* Header */}
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <ApprovalType type={approval.itemType} />
                  <ApprovalPriority priority={approval.priority} />
                </div>
                <ApprovalStatus status={approval.status} />
              </div>
              <div className="text-right text-sm text-gray-500 dark:text-gray-400">
                <div>Requested {format(new Date(approval.requestedAt), "PPp")}</div>
                {approval.decisionAt && (
                  <div>
                    Decided {format(new Date(approval.decisionAt), "PPp")}
                  </div>
                )}
              </div>
            </div>

            {/* Requester Info */}
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 space-y-3">
              <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <User className="h-4 w-4" />
                Requester Information
              </h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="text-gray-500 dark:text-gray-400">Name</div>
                  <div className="font-medium text-gray-900 dark:text-white">
                    {approval.requesterName || "Unknown"}
                  </div>
                </div>
                <div>
                  <div className="text-gray-500 dark:text-gray-400">Email</div>
                  <div className="font-medium text-gray-900 dark:text-white">
                    {approval.requester?.email || "N/A"}
                  </div>
                </div>
              </div>
            </div>

            {/* Approval Details */}
            <div className="space-y-3">
              <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Details
              </h3>
              {approval.reason && (
                <div>
                  <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">
                    Reason
                  </div>
                  <div className="text-sm text-gray-900 dark:text-white">
                    {approval.reason}
                  </div>
                </div>
              )}
              {approval.notes && (
                <div>
                  <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">
                    Notes
                  </div>
                  <div className="text-sm text-gray-900 dark:text-white">
                    {approval.notes}
                  </div>
                </div>
              )}
              {approval.itemData && (
                <div>
                  <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">
                    Item Data
                  </div>
                  <pre className="text-xs bg-gray-100 dark:bg-gray-900 p-3 rounded overflow-x-auto">
                    {JSON.stringify(approval.itemData, null, 2)}
                  </pre>
                </div>
              )}
            </div>

            {/* Decision Info */}
            {approval.decisionBy && (
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 space-y-3">
                <h3 className="font-semibold text-gray-900 dark:text-white">
                  Decision Information
                </h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <div className="text-gray-500 dark:text-gray-400">Decision</div>
                    <div className="font-medium text-gray-900 dark:text-white">
                      {approval.decision}
                    </div>
                  </div>
                  <div>
                    <div className="text-gray-500 dark:text-gray-400">Decided By</div>
                    <div className="font-medium text-gray-900 dark:text-white">
                      {approval.approverName || "Unknown"}
                    </div>
                  </div>
                </div>
                {approval.decisionNotes && (
                  <div>
                    <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">
                      Decision Notes
                    </div>
                    <div className="text-sm text-gray-900 dark:text-white">
                      {approval.decisionNotes}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* History */}
            {approval.history && approval.history.length > 0 && (
              <div className="space-y-3">
                <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  History
                </h3>
                <div className="space-y-2">
                  {approval.history.map((entry) => (
                    <div
                      key={entry.id}
                      className="flex items-start gap-3 text-sm border-l-2 border-gray-200 dark:border-gray-700 pl-4 py-2"
                    >
                      <div className="flex-1">
                        <div className="font-medium text-gray-900 dark:text-white">
                          {entry.action}
                        </div>
                        <div className="text-gray-500 dark:text-gray-400">
                          by {entry.performer?.name || "Unknown"} •{" "}
                          {format(new Date(entry.performedAt), "PPp")}
                        </div>
                        {entry.notes && (
                          <div className="text-gray-600 dark:text-gray-400 mt-1">
                            {entry.notes}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Actions */}
            {approval.status === "PENDING" && (
              <div className="space-y-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                <div>
                  <Label htmlFor="notes">Decision Notes (Optional)</Label>
                  <Textarea
                    id="notes"
                    placeholder="Add notes about your decision..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={3}
                  />
                </div>
                <div className="flex gap-3">
                  <Button
                    onClick={handleApprove}
                    disabled={isProcessing}
                    className="flex-1 bg-green-600 hover:bg-green-700"
                  >
                    {isProcessing ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <CheckCircle2 className="h-4 w-4 mr-2" />
                    )}
                    Approve
                  </Button>
                  <Button
                    onClick={handleReject}
                    disabled={isProcessing}
                    variant="destructive"
                    className="flex-1"
                  >
                    {isProcessing ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <XCircle className="h-4 w-4 mr-2" />
                    )}
                    Reject
                  </Button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-12 text-gray-500 dark:text-gray-400">
            Approval not found
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
