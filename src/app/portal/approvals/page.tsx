/**
 * Approvals Page - Server Component
 * Entry point for Approvals feature
 */

import { Suspense } from "react";
import ApprovalsClientPage from "@/components/portal/approvals/ApprovalsClientPage";
import { Loader2 } from "lucide-react";

export const metadata = {
  title: "Approvals | NextAccounting",
  description: "Review and approve pending items",
};

export default function ApprovalsPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        </div>
      }
    >
      <ApprovalsClientPage />
    </Suspense>
  );
}
