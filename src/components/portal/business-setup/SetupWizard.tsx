"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import ExistingBusinessTab from "./tabs/ExistingBusiness";
import NewStartupTab from "./tabs/NewStartup";
import IndividualTab from "./tabs/Individual";

export interface SetupWizardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onComplete?: (entityId: string) => void;
}

export interface SetupFormData {
  country: "AE" | "SA" | "EG";
  licenseNumber?: string;
  businessName?: string;
  economicZoneId?: string;
  legalForm?: string;
  activityCode?: string;
  consentVersion?: string;
  attachments?: File[];
  registrations?: Array<{
    type: string;
    value: string;
  }>;
}

export default function SetupWizard({
  open,
  onOpenChange,
  onComplete,
}: SetupWizardProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"existing" | "new" | "individual">("existing");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleTabChange = useCallback((tab: string) => {
    setError(null);
    setActiveTab(tab as any);
  }, []);

  const handleError = useCallback((message: string) => {
    setError(message);
  }, []);

  const handleSetupComplete = useCallback((entityId: string) => {
    // Close the wizard dialog
    onOpenChange(false);

    // Call completion callback if provided
    onComplete?.(entityId);

    // Redirect to verification status page
    router.push(`/portal/setup/status/${entityId}`);
  }, [onComplete, onOpenChange, router]);

  const isRtl = typeof document !== 'undefined' && document.documentElement.dir === 'rtl';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" dir={isRtl ? "rtl" : "ltr"}>
        <DialogHeader>
          <div className="flex items-center gap-3">
            <span className="text-2xl">🏢</span>
            <div>
              <DialogTitle>Business Account Setup</DialogTitle>
              <DialogDescription className="text-sm text-gray-600 mt-1">
                Create or link your business account in just a few steps
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="existing">Existing Business</TabsTrigger>
            <TabsTrigger value="new">New Startup</TabsTrigger>
            <TabsTrigger value="individual">Individual</TabsTrigger>
          </TabsList>

          <TabsContent value="existing" className="space-y-4">
            <ExistingBusinessTab
              onError={handleError}
              onComplete={handleSetupComplete}
              isLoading={isLoading}
              setIsLoading={setIsLoading}
            />
          </TabsContent>

          <TabsContent value="new" className="space-y-4">
            <NewStartupTab
              onError={handleError}
              onComplete={handleSetupComplete}
              isLoading={isLoading}
              setIsLoading={setIsLoading}
            />
          </TabsContent>

          <TabsContent value="individual" className="space-y-4">
            <IndividualTab
              onError={handleError}
              onComplete={handleSetupComplete}
              isLoading={isLoading}
              setIsLoading={setIsLoading}
            />
          </TabsContent>
        </Tabs>

        <div className="mt-4 text-xs text-gray-600 border-t pt-4">
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
