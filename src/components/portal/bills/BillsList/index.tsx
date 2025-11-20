/**
 * BillsList Component - Bills List Container
 * Main container for displaying list of bills
 */

"use client";

import { useState } from "react";
import { useBills } from "@/lib/hooks/bills/useBills";
import { BillsTable } from "./BillsTable";
import { BillsFilters } from "./BillsFilters";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import type { BillFilters } from "@/types/bills";

interface BillsListProps {
  onBillSelect?: (billId: string) => void;
}

export function BillsList({ onBillSelect }: BillsListProps) {
  const [filters, setFilters] = useState<BillFilters>({
    limit: 20,
    offset: 0,
    sortBy: "date",
    sortOrder: "desc",
  });

  const { bills, total, isLoading, mutate } = useBills(filters);

  const handleFilterChange = (newFilters: Partial<BillFilters>) => {
    setFilters((prev) => ({
      ...prev,
      ...newFilters,
      offset: 0, // Reset pagination
    }));
  };

  const handleLoadMore = () => {
    setFilters((prev) => ({
      ...prev,
      offset: (prev.offset || 0) + (prev.limit || 20),
    }));
  };

  return (
    <div className="space-y-6">
      {/* Filters */}
      <BillsFilters filters={filters} onFilterChange={handleFilterChange} />

      {/* Bills Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Bills ({total})</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading && bills.length === 0 ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </div>
          ) : (
            <BillsTable
              bills={bills}
              onBillSelect={onBillSelect}
              onRefresh={mutate}
            />
          )}

          {/* Load More */}
          {bills.length < total && (
            <div className="mt-4 text-center">
              <button
                onClick={handleLoadMore}
                disabled={isLoading}
                className="text-blue-600 hover:underline"
              >
                {isLoading ? "Loading..." : "Load More"}
              </button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
