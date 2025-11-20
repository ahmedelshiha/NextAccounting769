/**
 * useApprovals Hook - Approvals Data Management
 * Custom hook for fetching and managing approvals data
 */

import useSWR from "swr";
import type { Approval, ApprovalFilters } from "@/types/approvals";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export function useApprovals(filters: ApprovalFilters = {}) {
  // Build query string
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      params.append(key, String(value));
    }
  });

  const url = `/api/approvals?${params.toString()}`;

  const { data, error, isLoading, mutate } = useSWR<{
    success: boolean;
    data: {
      approvals: Approval[];
      total: number;
      limit: number;
      offset: number;
    };
  }>(url, fetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 5000,
  });

  return {
    approvals: data?.data?.approvals || [],
    total: data?.data?.total || 0,
    isLoading,
    error,
    mutate,
  };
}

export function useApproval(approvalId: string | null) {
  const { data, error, isLoading, mutate } = useSWR<{
    success: boolean;
    data: Approval;
  }>(approvalId ? `/api/approvals/${approvalId}` : null, fetcher, {
    revalidateOnFocus: false,
  });

  return {
    approval: data?.data || null,
    isLoading,
    error,
    mutate,
  };
}
