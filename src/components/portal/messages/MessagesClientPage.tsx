/**
 * MessagesClientPage - Main Messages Page Component
 * Production-ready messaging system with modular architecture and lazy loading
 */

"use client";

import { lazy, Suspense, useState } from "react";
import { ThreadsList } from "./ThreadsList";
import { MessageThread } from "./MessageThread";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Plus, Loader2 } from "lucide-react";
import Link from "next/link";

// Lazy load heavy components
const TicketModal = lazy(() =>
  import("./TicketModal").then((mod) => ({ default: mod.TicketModal }))
);

const TicketDetail = lazy(() =>
  import("./TicketDetail").then((mod) => ({ default: mod.TicketDetail }))
);

export default function MessagesClientPage() {
  const [selectedThreadId, setSelectedThreadId] = useState<string | null>(null);
  const [ticketModalOpen, setTicketModalOpen] = useState(false);
  const [ticketDetailOpen, setTicketDetailOpen] = useState(false);
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleThreadSelect = (threadId: string) => {
    setSelectedThreadId(threadId);
    
    // If it's a ticket (starts with 'cl' typically), open ticket detail
    // This is a simple heuristic; you might want to check thread type
    if (threadId.length > 20) {
      setSelectedTicketId(threadId);
      setTicketDetailOpen(true);
    }
  };

  const handleRefresh = () => {
    setRefreshKey((prev) => prev + 1);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link href="/portal/dashboard">
                <Button variant="ghost" size="icon">
                  <ArrowLeft className="h-5 w-5" />
                </Button>
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Messages
                </h1>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Chat with support and manage tickets
                </p>
              </div>
            </div>
            <Button onClick={() => setTicketModalOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              New Ticket
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-200px)]">
          {/* Threads List */}
          <div className="lg:col-span-1 h-full">
            <ThreadsList
              key={refreshKey}
              onThreadSelect={handleThreadSelect}
              selectedThreadId={selectedThreadId}
            />
          </div>

          {/* Message Thread */}
          <div className="lg:col-span-2 h-full">
            <MessageThread threadId={selectedThreadId} />
          </div>
        </div>
      </main>

      {/* Create Ticket Modal - Lazy Loaded */}
      <Suspense fallback={null}>
        <TicketModal
          open={ticketModalOpen}
          onOpenChange={setTicketModalOpen}
          onSuccess={handleRefresh}
        />
      </Suspense>

      {/* Ticket Detail Modal - Lazy Loaded */}
      <Suspense fallback={null}>
        <TicketDetail
          ticketId={selectedTicketId}
          open={ticketDetailOpen}
          onOpenChange={setTicketDetailOpen}
          onRefresh={handleRefresh}
        />
      </Suspense>
    </div>
  );
}
