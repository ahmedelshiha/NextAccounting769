/**
 * KYCProgressCard Component
 * Displays overall KYC verification progress
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { KYCProgressCardProps } from "../types/kyc";
import { KYCStatusBadge } from "../shared/KYCStatusBadge";
import { KYCProgress } from "../shared/KYCProgress";

/**
 * Card component that displays overall KYC progress with summary
 * 
 * @param completedSteps - Number of completed steps
 * @param totalSteps - Total number of steps
 * @param percentage - Overall completion percentage
 * 
 * @example
 * ```tsx
 * <KYCProgressCard
 *   completedSteps={4}
 *   totalSteps={6}
 *   percentage={67}
 * />
 * ```
 */
export function KYCProgressCard({
  completedSteps,
  totalSteps,
  percentage,
}: KYCProgressCardProps) {
  // Determine status based on percentage
  const getStatus = () => {
    if (percentage === 100) return "completed";
    if (percentage > 0) return "in_progress";
    return "pending";
  };

  const status = getStatus();

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Verification Progress</CardTitle>
            <CardDescription>
              {completedSteps} of {totalSteps} steps completed
            </CardDescription>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              {percentage}%
            </div>
            <KYCStatusBadge
              status={status}
              label={
                percentage === 100
                  ? "Complete"
                  : percentage > 50
                  ? "In Progress"
                  : "Not Started"
              }
            />
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mt-4">
          <KYCProgress value={percentage} />
        </div>
      </CardHeader>
    </Card>
  );
}
