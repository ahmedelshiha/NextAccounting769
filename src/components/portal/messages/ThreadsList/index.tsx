/**
 * ThreadsList Component - Threads List Container
 * Main container for message threads list
 */

"use client";

import { useState } from "react";
import { useThreads } from "@/lib/hooks/messages/useMessages";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, RefreshCw, Loader2, MessageSquare, Ticket } from "lucide-react";
import { MessageTime } from "../shared/MessageTime";
import { TicketStatus } from "../shared/TicketStatus";
import { TicketPriority } from "../shared/TicketPriority";
import type { MessageFilters, MessageThread } from "@/types/messages";

interface ThreadsListProps {
  onThreadSelect: (threadId: string) => void;
  selectedThreadId: string | null;
}

export function ThreadsList({ onThreadSelect, selectedThreadId }: ThreadsListProps) {
  const [filters, setFilters] = useState<MessageFilters>({
    type: "all",
    sortBy: "createdAt",
    sortOrder: "desc",
    limit: 50,
    offset: 0,
  });

  const [searchInput, setSearchInput] = useState("");

  const { threads, total, isLoading, mutate } = useThreads(filters);

  const handleSearch = () => {
    setFilters((prev) => ({ ...prev, search: searchInput, offset: 0 }));
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  if (isLoading) {
    return (
      <Card className="h-full">
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Search */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search messages..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyPress={handleKeyPress}
              className="pl-10"
            />
          </div>
          <Button onClick={handleSearch} variant="secondary" size="icon">
            <Search className="h-4 w-4" />
          </Button>
          <Button onClick={() => mutate()} variant="outline" size="icon">
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Threads List */}
      <div className="flex-1 overflow-y-auto">
        {threads.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center px-4">
            <MessageSquare className="h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              No messages yet
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Start a conversation or create a support ticket
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {threads.map((thread) => (
              <ThreadCard
                key={thread.id}
                thread={thread}
                isSelected={thread.id === selectedThreadId}
                onClick={() => onThreadSelect(thread.id)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

interface ThreadCardProps {
  thread: MessageThread;
  isSelected: boolean;
  onClick: () => void;
}

function ThreadCard({ thread, isSelected, onClick }: ThreadCardProps) {
  const isTicket = thread.type === "ticket";

  return (
    <button
      onClick={onClick}
      className={`w-full text-left p-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors ${
        isSelected ? "bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-600" : ""
      }`}
    >
      <div className="flex items-start gap-3">
        <div className={`mt-1 ${isTicket ? "text-purple-600" : "text-blue-600"}`}>
          {isTicket ? <Ticket className="h-5 w-5" /> : <MessageSquare className="h-5 w-5" />}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-1">
            <h4 className="font-medium text-gray-900 dark:text-white truncate">
              {thread.title}
            </h4>
            <MessageTime timestamp={thread.lastMessageAt} />
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400 truncate mb-2">
            {thread.lastMessage}
          </p>
          {isTicket && thread.metadata && (
            <div className="flex items-center gap-2 flex-wrap">
              <TicketStatus status={thread.metadata.status} />
              <TicketPriority priority={thread.metadata.priority} />
            </div>
          )}
          {thread.unreadCount > 0 && (
            <div className="inline-flex items-center justify-center bg-blue-600 text-white text-xs font-bold rounded-full h-5 min-w-[20px] px-1.5 mt-2">
              {thread.unreadCount}
            </div>
          )}
        </div>
      </div>
    </button>
  );
}
