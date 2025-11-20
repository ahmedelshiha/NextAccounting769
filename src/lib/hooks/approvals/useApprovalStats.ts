/**
 * useApprovalStats Hook - Approval Statistics Management
 * Custom hook for fetching approval analytics and statistics
 */

import useSWR from "swr";
import type { ApprovalStats } from "@/types/approvals";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export function useApprovalStats() {
  const { data, error, isLoading, mutate } = useSWR<{
    success: boolean;
    data: ApprovalStats;
  }>("/api/approvals/stats", fetcher, {
    revalidateOnFocus: false,
    refreshInterval: 30000, // Refresh every 30 seconds
  });

  return {
    stats: data?.data || null,
    isLoading,
    error,
    mutate,
  };
}
