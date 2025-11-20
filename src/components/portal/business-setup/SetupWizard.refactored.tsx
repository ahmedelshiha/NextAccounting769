/**
 * SetupWizard - Refactored with Lazy Loading
 * Production-ready modular architecture
 */

"use client";

import { lazy, Suspense, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, AlertCircle } from "lucide-react";
import type { SetupWizardProps, BusinessType } from "./types/setup";

// Lazy load tab components
const ExistingBusinessTab = lazy(() => import("./tabs/ExistingBusinessTab.refactored"));
const NewStartupTab = lazy(() => import("./tabs/NewStartup"));
const IndividualTab = lazy(() => import("./tabs/Individual"));

// Tab loading skeleton
function TabSkeleton() {
  return (
    <div className="space-y-4 py-8">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="space-y-2">
          <div className="h-4 w-24 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
          <div className="h-10 w-full bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
        </div>
      ))}
    </div>
  );
}

export default function SetupWizard({
  open,
  onOpenChange,
  onComplete,
}: SetupWizardProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<BusinessType>("existing");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleTabChange = useCallback((tab: string) => {
    setError(null);
    setActiveTab(tab as BusinessType);
  }, []);

  const handleError = useCallback((message: string) => {
    setError(message);
  }, []);

  const handleSetupComplete = useCallback(
    (entityId: string) => {
      onOpenChange(false);
      onComplete?.(entityId);
      router.push(`/portal/setup/status/${entityId}`);
    },
    [onComplete, onOpenChange, router]
  );

  const isRtl = typeof document !== "undefined" && document.documentElement.dir === "rtl";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-2xl max-h-[90vh] overflow-y-auto"
        dir={isRtl ? "rtl" : "ltr"}
      >
        {/* Header */}
        <DialogHeader>
          <div className="flex items-center gap-3">
            <span className="text-2xl">🏢</span>
            <div>
              <DialogTitle>Business Account Setup</DialogTitle>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Create or link your business account in just a few steps
              </p>
            </div>
          </div>
        </DialogHeader>

        {/* Error Alert */}
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="existing">Existing Business</TabsTrigger>
            <TabsTrigger value="new">New Startup</TabsTrigger>
            <TabsTrigger value="individual">Individual</TabsTrigger>
          </TabsList>

          {/* Existing Business Tab */}
          <TabsContent value="existing" className="space-y-4">
            <Suspense fallback={<TabSkeleton />}>
              <ExistingBusinessTab
                onError={handleError}
                onComplete={handleSetupComplete}
                isLoading={isLoading}
                setIsLoading={setIsLoading}
              />
            </Suspense>
          </TabsContent>

          {/* New Startup Tab */}
          <TabsContent value="new" className="space-y-4">
            <Suspense fallback={<TabSkeleton />}>
              <NewStartupTab
                onError={handleError}
                onComplete={handleSetupComplete}
                isLoading={isLoading}
                setIsLoading={setIsLoading}
              />
            </Suspense>
          </TabsContent>

          {/* Individual Tab */}
          <TabsContent value="individual" className="space-y-4">
            <Suspense fallback={<TabSkeleton />}>
              <IndividualTab
                onError={handleError}
                onComplete={handleSetupComplete}
                isLoading={isLoading}
                setIsLoading={setIsLoading}
              />
            </Suspense>
          </TabsContent>
        </Tabs>

        {/* Footer */}
        <div className="mt-4 text-xs text-gray-600 dark:text-gray-400 border-t pt-4">
          <div className="flex items-start gap-2">
            <span className="text-green-600 mt-0.5">✓</span>
            <p>
              We protect your data with encryption and comply with{" "}
              <a href="#privacy" className="text-blue-600 hover:underline">
                privacy regulations
              </a>{" "}
              in UAE, KSA, and Egypt.
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
