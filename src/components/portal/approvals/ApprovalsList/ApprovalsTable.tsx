/**
 * ApprovalsTable Component - Approvals Data Table
 * Displays approvals in a responsive table format
 */

"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ApprovalStatus } from "../shared/ApprovalStatus";
import { ApprovalType } from "../shared/ApprovalType";
import { ApprovalPriority } from "../shared/ApprovalPriority";
import { useApprovalActions } from "@/lib/hooks/approvals/useApprovalActions";
import { CheckCircle2, XCircle, Eye, ChevronLeft, ChevronRight } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import type { Approval, ApprovalFilters } from "@/types/approvals";

interface ApprovalsTableProps {
  approvals: Approval[];
  total: number;
  filters: ApprovalFilters;
  onFilterChange: (filters: Partial<ApprovalFilters>) => void;
  onApprovalSelect: (approvalId: string) => void;
  onRefresh: () => void;
}

export function ApprovalsTable({
  approvals,
  total,
  filters,
  onFilterChange,
  onApprovalSelect,
  onRefresh,
}: ApprovalsTableProps) {
  const { approve, reject, isProcessing } = useApprovalActions();

  const handleApprove = async (approvalId: string) => {
    try {
      await approve(approvalId);
      onRefresh();
    } catch (error) {
      // Error handled by hook
    }
  };

  const handleReject = async (approvalId: string) => {
    try {
      await reject(approvalId);
      onRefresh();
    } catch (error) {
      // Error handled by hook
    }
  };

  const currentPage = Math.floor((filters.offset || 0) / (filters.limit || 20)) + 1;
  const totalPages = Math.ceil(total / (filters.limit || 20));

  const handlePrevPage = () => {
    if (currentPage > 1) {
      onFilterChange({
        offset: (currentPage - 2) * (filters.limit || 20),
      });
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      onFilterChange({
        offset: currentPage * (filters.limit || 20),
      });
    }
  };

  if (approvals.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <CheckCircle2 className="h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            No approvals found
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            {filters.status === "PENDING"
              ? "You're all caught up! No pending approvals at this time."
              : "No approvals match your current filters."}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-0">
        {/* Desktop Table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Requester
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Priority
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Requested
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
              {approvals.map((approval) => (
                <tr
                  key={approval.id}
                  className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <ApprovalType type={approval.itemType} />
                  </td>
                  <td className="px-6 py-4">
                    <div>
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {approval.requesterName || "Unknown"}
                      </div>
                      {approval.reason && (
                        <div className="text-sm text-gray-500 dark:text-gray-400 truncate max-w-xs">
                          {approval.reason}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <ApprovalPriority priority={approval.priority} />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <ApprovalStatus status={approval.status} />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {formatDistanceToNow(new Date(approval.requestedAt), {
                      addSuffix: true,
                    })}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onApprovalSelect(approval.id)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      {approval.status === "PENDING" && (
                        <>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleApprove(approval.id)}
                            disabled={isProcessing}
                            className="text-green-600 hover:text-green-700 hover:bg-green-50"
                          >
                            <CheckCircle2 className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleReject(approval.id)}
                            disabled={isProcessing}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <XCircle className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile Cards */}
        <div className="md:hidden divide-y divide-gray-200 dark:divide-gray-700">
          {approvals.map((approval) => (
            <div key={approval.id} className="p-4 space-y-3">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <ApprovalType type={approval.itemType} />
                  <div className="text-sm font-medium text-gray-900 dark:text-white">
                    {approval.requesterName || "Unknown"}
                  </div>
                </div>
                <ApprovalStatus status={approval.status} />
              </div>
              {approval.reason && (
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {approval.reason}
                </p>
              )}
              <div className="flex items-center justify-between">
                <ApprovalPriority priority={approval.priority} />
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {formatDistanceToNow(new Date(approval.requestedAt), {
                    addSuffix: true,
                  })}
                </span>
              </div>
              {approval.status === "PENDING" && (
                <div className="flex gap-2 pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onApprovalSelect(approval.id)}
                    className="flex-1"
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    View
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleApprove(approval.id)}
                    disabled={isProcessing}
                    className="flex-1 text-green-600 hover:text-green-700"
                  >
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    Approve
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleReject(approval.id)}
                    disabled={isProcessing}
                    className="flex-1 text-red-600 hover:text-red-700"
                  >
                    <XCircle className="h-4 w-4 mr-2" />
                    Reject
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
            <div className="text-sm text-gray-700 dark:text-gray-300">
              Showing {(filters.offset || 0) + 1} to{" "}
              {Math.min((filters.offset || 0) + (filters.limit || 20), total)} of{" "}
              {total} results
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handlePrevPage}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleNextPage}
                disabled={currentPage === totalPages}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
