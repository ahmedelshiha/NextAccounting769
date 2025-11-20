/**
 * ApprovalsList Component - List Container
 * Main container for approvals list with filters and table
 */

"use client";

import { useState } from "react";
import { useApprovals } from "@/lib/hooks/approvals/useApprovals";
import { ApprovalsTable } from "./ApprovalsTable";
import { ApprovalsFilters } from "./ApprovalsFilters";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { ApprovalStatus } from "@/types/approvals";
import type { ApprovalFilters } from "@/types/approvals";

interface ApprovalsListProps {
  onApprovalSelect: (approvalId: string) => void;
}

export function ApprovalsList({ onApprovalSelect }: ApprovalsListProps) {
  const [filters, setFilters] = useState<ApprovalFilters>({
    status: ApprovalStatus.PENDING,
    sortBy: "requestedAt",
    sortOrder: "desc",
    limit: 20,
    offset: 0,
  });

  const { approvals, total, isLoading, mutate } = useApprovals(filters);

  const handleFilterChange = (newFilters: Partial<ApprovalFilters>) => {
    setFilters((prev) => ({ ...prev, ...newFilters, offset: 0 }));
  };

  const handleRefresh = () => {
    mutate();
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <ApprovalsFilters
        filters={filters}
        onFilterChange={handleFilterChange}
        onRefresh={handleRefresh}
      />
      <ApprovalsTable
        approvals={approvals}
        total={total}
        filters={filters}
        onFilterChange={handleFilterChange}
        onApprovalSelect={onApprovalSelect}
        onRefresh={handleRefresh}
      />
    </div>
  );
}
