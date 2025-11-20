/**
 * KYCTimeline Component
 * Displays timeline of completed KYC steps
 */

import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";
import { KYCTimelineProps } from "../types/kyc";
import { KYCStepIcon } from "../shared/KYCStepIcon";

/**
 * Timeline component that shows completed steps with verification dates
 * 
 * @param completedSteps - Array of completed KYC steps
 * 
 * @example
 * ```tsx
 * <KYCTimeline completedSteps={completedSteps} />
 * ```
 */
export function KYCTimeline({ completedSteps }: KYCTimelineProps) {
  // Empty state
  if (!completedSteps || completedSteps.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-8">
            <AlertCircle className="h-8 w-8 text-gray-400 dark:text-gray-600 mx-auto mb-2" />
            <p className="text-gray-600 dark:text-gray-400">
              No steps completed yet
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">
              Start your KYC verification to see your progress here
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="space-y-4">
          {completedSteps.map((step, index) => (
            <div key={step.id} className="flex items-start gap-4">
              {/* Icon */}
              <div className="mt-0.5">
                <KYCStepIcon status="completed" size="md" />
              </div>

              {/* Content */}
              <div className="flex-1">
                <p className="font-medium text-gray-900 dark:text-white">
                  {step.title}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-0.5">
                  Completed on {new Date().toLocaleDateString()}
                </p>
              </div>

              {/* Connector line (except for last item) */}
              {index < completedSteps.length - 1 && (
                <div className="absolute left-[29px] mt-8 h-4 w-0.5 bg-green-200 dark:bg-green-800" />
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
