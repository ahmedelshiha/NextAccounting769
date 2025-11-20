/**
 * useBills Hook - Bills Data Management
 * Custom hook for fetching and managing bills data
 */

import useSWR from "swr";
import type { Bill, BillFilters } from "@/types/bills";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export function useBills(filters: BillFilters = {}) {
  // Build query string
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      params.append(key, String(value));
    }
  });

  const url = `/api/bills?${params.toString()}`;

  const { data, error, isLoading, mutate } = useSWR<{
    success: boolean;
    data: {
      bills: Bill[];
      total: number;
      limit: number;
      offset: number;
    };
  }>(url, fetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 5000,
  });

  return {
    bills: data?.data?.bills || [],
    total: data?.data?.total || 0,
    isLoading,
    error,
    mutate,
  };
}

export function useBill(billId: string | null) {
  const { data, error, isLoading, mutate } = useSWR<{
    success: boolean;
    data: Bill;
  }>(billId ? `/api/bills/${billId}` : null, fetcher, {
    revalidateOnFocus: false,
  });

  return {
    bill: data?.data || null,
    isLoading,
    error,
    mutate,
  };
}
