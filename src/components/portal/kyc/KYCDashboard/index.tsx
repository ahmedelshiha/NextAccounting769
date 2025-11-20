/**
 * KYCDashboard Component
 * Main container for KYC verification dashboard
 */

"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, AlertCircle } from "lucide-react";
import Link from "next/link";
import { useKYCData } from "../hooks/useKYCData";
import { useKYCProgress } from "../hooks/useKYCProgress";
import { KYCProgressCard } from "./KYCProgressCard";
import { KYCStepsList } from "./KYCStepsList";
import { KYCTimeline } from "./KYCTimeline";

/**
 * Main KYC Dashboard component that orchestrates all sub-components
 * 
 * @example
 * ```tsx
 * <KYCDashboard />
 * ```
 */
export default function KYCDashboard() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const entityId = searchParams.get("entityId");

  const [activeTab, setActiveTab] = useState("overview");

  // Fetch KYC data using custom hook
  const { kycData, isLoading, isError } = useKYCData({ entityId });

  // Calculate progress using custom hook
  const {
    completedSteps,
    totalSteps,
    percentage,
    steps,
  } = useKYCProgress({ kycData });

  // Filter completed steps for timeline
  const completedStepsList = steps.filter((s) => s.status === "completed");

  // Handle step click navigation
  const handleStepClick = (stepId: string) => {
    if (entityId) {
      router.push(`/portal/kyc/${stepId}?entityId=${entityId}`);
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Loading KYC data...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (isError) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
        <Alert variant="destructive" className="max-w-md">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Failed to load KYC data. Please try again later.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-3">
            <Link href="/portal/dashboard">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                KYC Center
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Complete your Know Your Customer verification
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Progress Overview */}
        <KYCProgressCard
          completedSteps={completedSteps}
          totalSteps={totalSteps}
          percentage={percentage}
        />

        {/* Tabs for different sections */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="timeline">Timeline</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-4">
            <KYCStepsList steps={steps} onStepClick={handleStepClick} />
          </TabsContent>

          {/* Timeline Tab */}
          <TabsContent value="timeline" className="space-y-4">
            <KYCTimeline completedSteps={completedStepsList} />
          </TabsContent>
        </Tabs>

        {/* Help Section */}
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Need help? Our compliance team is here to assist you through each verification step.{" "}
            <Button variant="link" className="p-0 h-auto font-semibold">
              Contact Support
            </Button>
          </AlertDescription>
        </Alert>
      </main>
    </div>
  );
}
