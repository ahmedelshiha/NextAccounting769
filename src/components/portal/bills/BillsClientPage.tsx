/**
 * BillsClientPage - Main Bills Page Component
 * Production-ready Bills management with modular architecture and lazy loading
 */

"use client";

import { lazy, Suspense, useState } from "react";
import { BillUpload } from "./BillUpload";
import { BillsList } from "./BillsList";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2 } from "lucide-react";
import Link from "next/link";

// Lazy load heavy components
const BillAnalytics = lazy(() =>
  import("./BillAnalytics").then((mod) => ({ default: mod.BillAnalytics }))
);

const BillDetail = lazy(() =>
  import("./BillDetail").then((mod) => ({ default: mod.BillDetail }))
);

export default function BillsClientPage() {
  const [selectedBillId, setSelectedBillId] = useState<string | null>(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleBillSelect = (billId: string) => {
    setSelectedBillId(billId);
    setDetailModalOpen(true);
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
                  Bills Management
                </h1>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Upload, scan, and manage your bills with OCR
                </p>
              </div>
            </div>
            <BillUpload onUploadComplete={handleRefresh} />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Analytics Dashboard - Lazy Loaded */}
        <Suspense
          fallback={
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </div>
          }
        >
          <BillAnalytics key={refreshKey} />
        </Suspense>

        {/* Bills List */}
        <BillsList key={refreshKey} onBillSelect={handleBillSelect} />
      </main>

      {/* Bill Detail Modal - Lazy Loaded */}
      <Suspense fallback={null}>
        <BillDetail
          billId={selectedBillId}
          open={detailModalOpen}
          onOpenChange={setDetailModalOpen}
          onRefresh={handleRefresh}
        />
      </Suspense>
    </div>
  );
}
