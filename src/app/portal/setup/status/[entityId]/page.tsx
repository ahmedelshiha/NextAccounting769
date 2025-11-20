"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import VerificationPending from "@/components/portal/business-setup/VerificationPending";
import { logger } from "@/lib/logger";

interface EntitySetupStatusPageProps {
  params: Promise<{ entityId: string }>;
}

export default function EntitySetupStatusPage() {
  const params = useParams();
  const router = useRouter();
  const entityId = params.entityId as string;
  
  const [entityName, setEntityName] = useState<string>("Your business");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Fetch entity name to display in verification screen
    const fetchEntity = async () => {
      try {
        const response = await fetch(`/api/entities/${entityId}`);
        
        if (response.ok) {
          const data = await response.json();
          setEntityName(data.data?.name || "Your business");
        }
      } catch (err) {
        logger.error("Error fetching entity", { entityId, err });
      } finally {
        setIsLoading(false);
      }
    };

    fetchEntity();
  }, [entityId]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin">⏳</div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 py-8 px-4">
      <div className="max-w-xl mx-auto">
        <div className="space-y-6">
          {/* Header */}
          <div className="text-center space-y-2">
            <h1 className="text-2xl font-bold">Business Setup</h1>
            <p className="text-gray-600">
              We&apos;re setting up your account and verifying your details
            </p>
          </div>

          {/* Verification Screen */}
          <VerificationPending
            entityId={entityId}
            entityName={entityName}
            estimatedTime="~5 minutes"
            onStatusChange={(status) => {
              if (status === "verified") {
                // Redirect to dashboard after a short delay
                setTimeout(() => {
                  router.push("/portal/dashboard");
                }, 2000);
              }
            }}
            onContinue={() => {
              // Navigate to dashboard
              router.push("/portal/dashboard");
            }}
            onManualReview={() => {
              // Open messaging/support
              router.push("/portal/messages?case=setup-review");
            }}
          />

          {/* Footer Info */}
          <div className="border-t pt-6 text-center text-xs text-gray-500 space-y-2">
            <p>
              Entity ID: <code className="bg-gray-100 px-2 py-1 rounded">{entityId}</code>
            </p>
            <p>
              Need help?{" "}
              <a href="/support" className="text-blue-600 hover:underline">
                Contact support
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
