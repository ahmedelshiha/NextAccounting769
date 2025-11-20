/**
 * useMessages Hook - Messages Data Management
 * Custom hook for fetching and managing messages
 */

import useSWR from "swr";
import { useState } from "react";
import type { MessageFilters, MessageThread, ChatMessage } from "@/types/messages";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

/**
 * Hook to fetch message threads
 */
export function useThreads(filters: MessageFilters = {}) {
  const params = new URLSearchParams();
  
  if (filters.type) params.append("type", filters.type);
  if (filters.search) params.append("search", filters.search);
  if (filters.sortBy) params.append("sortBy", filters.sortBy);
  if (filters.sortOrder) params.append("sortOrder", filters.sortOrder);
  if (filters.limit) params.append("limit", filters.limit.toString());
  if (filters.offset) params.append("offset", filters.offset.toString());

  const { data, error, mutate, isLoading } = useSWR(
    `/api/messages?${params.toString()}`,
    fetcher,
    {
      refreshInterval: 10000, // Auto-refresh every 10 seconds
      revalidateOnFocus: true,
    }
  );

  return {
    threads: (data?.data?.threads || []) as MessageThread[],
    total: data?.data?.total || 0,
    isLoading,
    isError: error,
    mutate,
  };
}

/**
 * Hook to fetch thread details and messages
 */
export function useThreadDetails(threadId: string | null) {
  const { data, error, mutate, isLoading } = useSWR(
    threadId ? `/api/messages/${threadId}` : null,
    fetcher,
    {
      refreshInterval: 5000, // Auto-refresh every 5 seconds
      revalidateOnFocus: true,
    }
  );

  return {
    messages: (data?.data?.messages || []) as ChatMessage[],
    ticket: data?.data?.ticket || null,
    total: data?.data?.total || 0,
    isLoading,
    isError: error,
    mutate,
  };
}

/**
 * Hook to send messages
 */
export function useSendMessage() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sendMessage = async (threadId: string, text: string) => {
    setIsProcessing(true);
    setError(null);

    try {
      const response = await fetch(`/api/messages/${threadId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Failed to send message");
      }

      return data.data;
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setIsProcessing(false);
    }
  };

  return {
    sendMessage,
    isProcessing,
    error,
  };
}

/**
 * Hook to fetch messaging statistics
 */
export function useMessagesStats() {
  const { data, error, mutate, isLoading } = useSWR(
    "/api/messages/stats",
    fetcher,
    {
      refreshInterval: 30000, // Auto-refresh every 30 seconds
    }
  );

  return {
    stats: data?.data || null,
    isLoading,
    isError: error,
    mutate,
  };
}
