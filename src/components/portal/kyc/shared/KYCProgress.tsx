/**
 * KYCProgress Component
 * Displays progress bar for KYC completion
 */

import { Progress } from "@/components/ui/progress";
import { KYCProgressBarProps } from "../types/kyc";
import { cn } from "@/lib/utils";

/**
 * Progress bar component for visualizing KYC completion percentage
 * 
 * @param value - Progress percentage (0-100)
 * @param className - Optional additional CSS classes
 * 
 * @example
 * ```tsx
 * <KYCProgress value={75} />
 * <KYCProgress value={100} className="h-3" />
 * ```
 */
export function KYCProgress({ value, className }: KYCProgressBarProps) {
  // Determine color based on progress
  const getProgressColor = (percentage: number) => {
    if (percentage === 100) {
      return "bg-green-600 dark:bg-green-500";
    }
    if (percentage >= 50) {
      return "bg-blue-600 dark:bg-blue-500";
    }
    return "bg-gray-400 dark:bg-gray-600";
  };

  return (
    <div className="space-y-2">
      <Progress
        value={value}
        className={cn("h-2", className)}
        indicatorClassName={getProgressColor(value)}
      />
      <div className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-400">
        <span>{value}% Complete</span>
        {value === 100 && (
          <span className="text-green-600 dark:text-green-400 font-medium">
            ✓ All steps completed
          </span>
        )}
      </div>
    </div>
  );
}
