/**
 * KYCStepCard Component
 * Reusable card component for displaying individual KYC steps
 */

import { Card, CardContent } from "@/components/ui/card";
import { ChevronRight } from "lucide-react";
import { KYCStepCardProps } from "../types/kyc";
import { KYC_STATUS_COLORS } from "../constants/kycSteps";
import { KYCStepIcon } from "./KYCStepIcon";
import { cn } from "@/lib/utils";

/**
 * Card component for displaying a KYC step with status, title, and description
 * 
 * @param step - KYC step data
 * @param onClick - Click handler for navigation
 * 
 * @example
 * ```tsx
 * <KYCStepCard
 *   step={step}
 *   onClick={() => router.push(`/kyc/${step.id}`)}
 * />
 * ```
 */
export function KYCStepCard({ step, onClick }: KYCStepCardProps) {
  const statusColor = KYC_STATUS_COLORS[step.status];

  return (
    <Card
      className={cn(
        "cursor-pointer hover:shadow-md transition-all duration-200",
        "hover:scale-[1.01] active:scale-[0.99]",
        statusColor
      )}
      onClick={onClick}
    >
      <CardContent className="pt-6">
        <div className="flex items-start justify-between gap-4">
          {/* Left side: Icon and content */}
          <div className="flex items-start gap-4 flex-1">
            {/* Status Icon */}
            <div className="mt-0.5">
              <KYCStepIcon status={step.status} size="md" />
            </div>

            {/* Step Content */}
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-gray-900 dark:text-white">
                {step.title}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                {step.description}
              </p>

              {/* Completed indicator */}
              {step.status === "completed" && (
                <p className="text-xs text-green-700 dark:text-green-300 mt-2 font-medium">
                  ✓ Verified
                </p>
              )}

              {/* In progress indicator */}
              {step.status === "in_progress" && step.percentage !== undefined && (
                <div className="mt-2">
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-600 dark:bg-blue-500 transition-all duration-300"
                        style={{ width: `${step.percentage}%` }}
                      />
                    </div>
                    <span className="text-xs text-gray-600 dark:text-gray-400 font-medium">
                      {step.percentage}%
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right side: Chevron */}
          <ChevronRight className="h-5 w-5 text-gray-400 flex-shrink-0 mt-1" />
        </div>
      </CardContent>
    </Card>
  );
}
