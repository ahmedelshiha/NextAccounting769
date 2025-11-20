"use client";

import { useEffect, useState } from "react";
import { Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { logger } from "@/lib/logger";

interface VerificationPendingProps {
  entityId: string;
  entityName?: string;
  estimatedTime?: string;
  onStatusChange?: (status: "pending" | "verified" | "failed") => void;
  onContinue?: () => void;
  onManualReview?: () => void;
}

export default function VerificationPending({
  entityId,
  entityName = "Your business",
  estimatedTime = "~5 minutes",
  onStatusChange,
  onContinue,
  onManualReview,
}: VerificationPendingProps) {
  const [status, setStatus] = useState<"pending" | "verified" | "failed">("pending");
  const [isPolling, setIsPolling] = useState(true);
  const [pollCount, setPollCount] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isPolling || status !== "pending") return;

    const pollInterval = setInterval(async () => {
      try {
        const response = await fetch(`/api/entities/${entityId}/verification-status`);
        
        if (!response.ok) {
          throw new Error("Failed to fetch verification status");
        }

        const data = await response.json();

        // Update status based on response
        if (data.data?.status === "VERIFIED_SUCCESS") {
          setStatus("verified");
          setIsPolling(false);
          onStatusChange?.("verified");
        } else if (
          data.data?.status === "VERIFICATION_FAILED" ||
          data.data?.status === "MANUAL_REVIEW"
        ) {
          setStatus("failed");
          setError(data.data?.failureReason || "Verification failed");
          setIsPolling(false);
          onStatusChange?.("failed");
        }

        setPollCount((prev) => prev + 1);

        // Stop polling after 20 minutes (240 checks at 5s interval)
        if (pollCount > 240) {
          setIsPolling(false);
          setStatus("failed");
          setError("Verification timeout. Please contact support.");
        }
      } catch (err) {
        logger.error("Error polling verification status", { entityId, err });
        // Continue polling on error
      }
    }, 5000); // Poll every 5 seconds

    return () => clearInterval(pollInterval);
  }, [isPolling, status, pollCount, entityId, onStatusChange]);

  if (status === "verified") {
    return <VerificationSuccess entityName={entityName} onContinue={onContinue} />;
  }

  if (status === "failed") {
    return (
      <VerificationError
        entityName={entityName}
        error={error}
        onRetry={() => {
          setStatus("pending");
          setIsPolling(true);
          setPollCount(0);
          setError(null);
        }}
        onManualReview={onManualReview}
      />
    );
  }

  // Pending state
  return (
    <div className="space-y-6">
      <Card className="border-0 shadow-none">
        <CardContent className="pt-8">
          <div className="flex flex-col items-center space-y-4 text-center">
            <div className="relative w-16 h-16 flex items-center justify-center">
              <div className="absolute inset-0 rounded-full bg-blue-100 animate-pulse" />
              <Loader2 className="w-8 h-8 text-blue-600 animate-spin relative z-10" />
            </div>

            <div className="space-y-2">
              <h3 className="text-lg font-semibold">Verifying Your Business</h3>
              <p className="text-sm text-gray-600">
                We&apos;re securely verifying your business details and registrations.
              </p>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 w-full max-w-sm">
              <p className="text-sm text-blue-900">
                <span className="font-semibold">Estimated time:</span> {estimatedTime}
              </p>
              <p className="text-xs text-blue-700 mt-1">
                You can close this window. We&apos;ll send you a notification when done.
              </p>
            </div>

            <div className="space-y-2 w-full max-w-sm">
              <div className="flex items-center gap-2 text-sm">
                <div className="w-2 h-2 rounded-full bg-gray-300" />
                <span className="text-gray-600">Verifying license</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <div className="w-2 h-2 rounded-full bg-gray-300" />
                <span className="text-gray-600">Checking registrations</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <div className="w-2 h-2 rounded-full bg-gray-300" />
                <span className="text-gray-600">Creating your portal</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex gap-3">
        <Button
          onClick={() => {
            setIsPolling(false);
            onContinue?.();
          }}
          variant="outline"
          className="flex-1"
        >
          Continue in Background
        </Button>
        <Button disabled className="flex-1">
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          Verifying...
        </Button>
      </div>
    </div>
  );
}

function VerificationSuccess({
  entityName,
  onContinue,
}: {
  entityName: string;
  onContinue?: () => void;
}) {
  return (
    <div className="space-y-6">
      <Card className="border-0 shadow-none">
        <CardContent className="pt-8">
          <div className="flex flex-col items-center space-y-4 text-center">
            <div className="relative w-16 h-16 flex items-center justify-center">
              <div className="absolute inset-0 rounded-full bg-green-100" />
              <CheckCircle2 className="w-8 h-8 text-green-600 relative z-10" />
            </div>

            <div className="space-y-2">
              <h3 className="text-lg font-semibold">Verification Complete!</h3>
              <p className="text-sm text-gray-600">
                {entityName} has been successfully verified and your portal is ready.
              </p>
            </div>

            <div className="bg-green-50 border border-green-200 rounded-lg p-4 w-full max-w-sm">
              <ul className="space-y-2 text-sm">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span className="text-green-900">License verified</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span className="text-green-900">Registrations confirmed</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span className="text-green-900">Portal activated</span>
                </li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      <Button onClick={onContinue} className="w-full" size="lg">
        Continue to Dashboard
      </Button>
    </div>
  );
}

function VerificationError({
  entityName,
  error,
  onRetry,
  onManualReview,
}: {
  entityName: string;
  error?: string | null;
  onRetry: () => void;
  onManualReview?: () => void;
}) {
  return (
    <div className="space-y-6">
      <Card className="border-0 shadow-none">
        <CardContent className="pt-8">
          <div className="flex flex-col items-center space-y-4 text-center">
            <div className="relative w-16 h-16 flex items-center justify-center">
              <div className="absolute inset-0 rounded-full bg-red-100" />
              <AlertCircle className="w-8 h-8 text-red-600 relative z-10" />
            </div>

            <div className="space-y-2">
              <h3 className="text-lg font-semibold">Verification Issue</h3>
              <p className="text-sm text-gray-600">
                We encountered an issue verifying {entityName}.
              </p>
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 w-full max-w-sm">
              <p className="text-sm text-amber-900">
                <span className="font-semibold">What next?</span>
                <br />
                Our team will review your details manually. You&apos;ll receive an email with updates within 24 hours.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex gap-3">
        <Button onClick={onRetry} variant="outline" className="flex-1">
          Try Again
        </Button>
        <Button onClick={onManualReview} className="flex-1">
          Contact Support
        </Button>
      </div>
    </div>
  );
}
