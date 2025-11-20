/**
 * KYC Center Page
 * Entry point for KYC verification with lazy loading
 */

"use client";

import { lazy, Suspense } from "react";
import { KYCLoadingSkeleton } from "@/components/portal/kyc/KYCLoadingSkeleton";

// Lazy load the KYC Dashboard for better performance
const KYCDashboard = lazy(() => import("@/components/portal/kyc/KYCDashboard"));

/**
 * KYC Center page with lazy loading and Suspense boundary
 * 
 * Benefits:
 * - Reduces initial bundle size
 * - Faster page load time
 * - Better user experience with loading skeleton
 * - Code splitting for optimal performance
 */
export default function KYCCenterPage() {
  return (
    <Suspense fallback={<KYCLoadingSkeleton />}>
      <KYCDashboard />
    </Suspense>
  );
}
