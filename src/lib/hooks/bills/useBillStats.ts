/**
 * useBillStats Hook - Bills Analytics
 * Custom hook for fetching bills statistics
 */

import useSWR from "swr";
import type { BillStats } from "@/types/bills";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export function useBillStats() {
  const { data, error, isLoading, mutate } = useSWR<{
    success: boolean;
    data: BillStats;
  }>("/api/bills/stats", fetcher, {
    revalidateOnFocus: false,
    refreshInterval: 60000, // Refresh every minute
  });

  return {
    stats: data?.data || null,
    isLoading,
    error,
    mutate,
  };
}
