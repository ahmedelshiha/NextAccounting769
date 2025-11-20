"use client";

import { lazy, Suspense } from "react";
import { Loader2 } from "lucide-react";

// Lazy load the dashboard component
const ComplianceDashboard = lazy(() => import("@/components/portal/compliance/ComplianceDashboard"));

// Loading skeleton
function DashboardSkeleton() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header Skeleton */}
        <div className="h-10 w-64 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
        
        {/* Stats Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-32 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
          ))}
        </div>
        
        {/* List Skeleton */}
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-48 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
          ))}
        </div>
      </div>
    </div>
  );
}

export default function CompliancePage() {
  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <ComplianceDashboard />
    </Suspense>
  );
}
