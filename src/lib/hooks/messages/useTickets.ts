/**
 * useTickets Hook - Support Tickets Management
 * Custom hook for managing support tickets
 */

import useSWR from "swr";
import { useState } from "react";
import { toast } from "sonner";
import type {
  SupportTicket,
  CreateTicketRequest,
  UpdateTicketRequest,
  TicketStatus,
  TicketPriority,
  TicketCategory,
} from "@/types/messages";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

/**
 * Hook to fetch support tickets
 */
export function useTickets(filters: {
  status?: TicketStatus | "all";
  priority?: TicketPriority | "all";
  category?: TicketCategory | "all";
  search?: string;
  limit?: number;
  offset?: number;
} = {}) {
  const params = new URLSearchParams();
  
  if (filters.status && filters.status !== "all") params.append("status", filters.status);
  if (filters.priority && filters.priority !== "all") params.append("priority", filters.priority);
  if (filters.category && filters.category !== "all") params.append("category", filters.category);
  if (filters.search) params.append("search", filters.search);
  if (filters.limit) params.append("limit", filters.limit.toString());
  if (filters.offset) params.append("offset", filters.offset.toString());

  const { data, error, mutate, isLoading } = useSWR(
    `/api/messages/tickets?${params.toString()}`,
    fetcher,
    {
      refreshInterval: 15000, // Auto-refresh every 15 seconds
      revalidateOnFocus: true,
    }
  );

  return {
    tickets: (data?.data?.tickets || []) as SupportTicket[],
    total: data?.data?.total || 0,
    isLoading,
    isError: error,
    mutate,
  };
}

/**
 * Hook to fetch a single ticket
 */
export function useTicket(ticketId: string | null) {
  const { data, error, mutate, isLoading } = useSWR(
    ticketId ? `/api/messages/tickets/${ticketId}` : null,
    fetcher,
    {
      refreshInterval: 10000, // Auto-refresh every 10 seconds
      revalidateOnFocus: true,
    }
  );

  return {
    ticket: data?.data as SupportTicket | null,
    isLoading,
    isError: error,
    mutate,
  };
}

/**
 * Hook for ticket actions (create, update, comment)
 */
export function useTicketActions() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createTicket = async (data: CreateTicketRequest) => {
    setIsProcessing(true);
    setError(null);

    try {
      const response = await fetch("/api/messages/tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || "Failed to create ticket");
      }

      toast.success("Support ticket created successfully");
      return result.data;
    } catch (err: any) {
      setError(err.message);
      toast.error(err.message);
      throw err;
    } finally {
      setIsProcessing(false);
    }
  };

  const updateTicket = async (ticketId: string, data: UpdateTicketRequest) => {
    setIsProcessing(true);
    setError(null);

    try {
      const response = await fetch(`/api/messages/tickets/${ticketId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || "Failed to update ticket");
      }

      toast.success("Ticket updated successfully");
      return result.data;
    } catch (err: any) {
      setError(err.message);
      toast.error(err.message);
      throw err;
    } finally {
      setIsProcessing(false);
    }
  };

  const addComment = async (ticketId: string, content: string) => {
    setIsProcessing(true);
    setError(null);

    try {
      const response = await fetch(`/api/messages/tickets/${ticketId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || "Failed to add comment");
      }

      toast.success("Comment added successfully");
      return result.data;
    } catch (err: any) {
      setError(err.message);
      toast.error(err.message);
      throw err;
    } finally {
      setIsProcessing(false);
    }
  };

  return {
    createTicket,
    updateTicket,
    addComment,
    isProcessing,
    error,
  };
}
