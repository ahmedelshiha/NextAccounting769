/**
 * Messages Page - Server Component
 * Entry point for Messages feature
 */

import { Suspense } from "react";
import MessagesClientPage from "@/components/portal/messages/MessagesClientPage";
import { Loader2 } from "lucide-react";

export const metadata = {
  title: "Messages | NextAccounting",
  description: "Chat with support and manage tickets",
};

export default function MessagesPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        </div>
      }
    >
      <MessagesClientPage />
    </Suspense>
  );
}
