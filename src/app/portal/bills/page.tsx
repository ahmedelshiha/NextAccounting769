/**
 * Bills Page - Server Component
 * Entry point for Bills feature
 */

import { Suspense } from "react";
import BillsClientPage from "@/components/portal/bills/BillsClientPage";
import { Loader2 } from "lucide-react";

export const metadata = {
  title: "Bills Management | NextAccounting",
  description: "Upload, scan, and manage your bills with OCR data extraction",
};

export default function BillsPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        </div>
      }
    >
      <BillsClientPage />
    </Suspense>
  );
}
