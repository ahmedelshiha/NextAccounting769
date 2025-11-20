/**
 * useKYCData Hook
 * Custom hook for fetching and managing KYC data
 */

import useSWR from "swr";
import { KYCData, KYCApiResponse } from "../types/kyc";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

interface UseKYCDataOptions {
  entityId: string | null;
  refreshInterval?: number;
  revalidateOnFocus?: boolean;
}

export interface UseKYCDataReturn {
  kycData: KYCData | undefined;
  isLoading: boolean;
  isError: boolean;
  error: Error | undefined;
  refresh: () => void;
}

/**
 * Hook to fetch KYC data for a specific entity
 * 
 * @param options - Configuration options
 * @returns KYC data, loading state, error state, and refresh function
 * 
 * @example
 * ```typescript
 * const { kycData, isLoading, refresh } = useKYCData({ 
 *   entityId: "ent-123" 
 * });
 * ```
 */
export function useKYCData({
  entityId,
  refreshInterval = 0,
  revalidateOnFocus = false,
}: UseKYCDataOptions): UseKYCDataReturn {
  const { data, error, isLoading, mutate } = useSWR<KYCApiResponse>(
    entityId ? `/api/kyc?entityId=${entityId}` : null,
    fetcher,
    {
      refreshInterval,
      revalidateOnFocus,
      dedupingInterval: 5000, // Prevent duplicate requests within 5s
    }
  );

  return {
    kycData: data?.data,
    isLoading,
    isError: !!error,
    error,
    refresh: mutate,
  };
}

/**
 * Fetch KYC data for multiple entities (non-hook version)
 * 
 * @param entityIds - Array of entity IDs
 * @returns Promise resolving to array of KYC data
 */
export async function fetchMultipleKYCData(
  entityIds: string[]
): Promise<(KYCData | undefined)[]> {
  const results = await Promise.all(
    entityIds.map((entityId) =>
      fetch(`/api/kyc?entityId=${entityId}`)
        .then((res) => res.json() as Promise<KYCApiResponse>)
        .then((data) => data.data)
        .catch(() => undefined)
    )
  );
  return results;
}

interface UseMultipleKYCDataOptions {
  entityIds: string[];
  enabled?: boolean;
}

interface UseMultipleKYCDataReturn {
  data: (KYCData | undefined)[];
  isLoading: boolean;
  isError: boolean;
  refresh: () => Promise<void>;
}

/**
 * Hook to fetch KYC data for multiple entities
 * Note: For multiple entities, consider using fetchMultipleKYCData instead
 * 
 * @param options - Configuration options including entityIds array
 * @returns Array of KYC data results
 */
export function useMultipleKYCData({
  entityIds,
  enabled = true,
}: UseMultipleKYCDataOptions): UseMultipleKYCDataReturn {
  const url = enabled && entityIds.length > 0 
    ? `/api/kyc?entityIds=${entityIds.join(",")}` 
    : null;

  const { data, error, isLoading, mutate } = useSWR<KYCApiResponse & { data: (KYCData | undefined)[] }>(
    url,
    (url) =>
      fetch(url)
        .then((res) => res.json())
        .catch(() => ({ data: [] })),
    {
      dedupingInterval: 5000,
    }
  );

  return {
    data: data?.data || [],
    isLoading,
    isError: !!error,
    refresh: async () => {
      await mutate();
    },
  };
}
