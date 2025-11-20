/**
 * KYCStepIcon Component
 * Displays status-based icon for KYC steps
 */

import { CheckCircle2, Circle } from "lucide-react";
import { KYCStepIconProps } from "../types/kyc";
import { cn } from "@/lib/utils";

/**
 * Icon component that displays different icons based on step status
 * 
 * @param status - Step status (completed, in_progress, pending)
 * @param size - Icon size variant (sm, md, lg)
 * 
 * @example
 * ```tsx
 * <KYCStepIcon status="completed" size="md" />
 * ```
 */
export function KYCStepIcon({ status, size = "md" }: KYCStepIconProps) {
  const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-6 w-6",
    lg: "h-8 w-8",
  };

  const iconSize = sizeClasses[size];

  // Completed status - green checkmark
  if (status === "completed") {
    return (
      <CheckCircle2
        className={cn(
          iconSize,
          "text-green-600 dark:text-green-400 flex-shrink-0"
        )}
      />
    );
  }

  // In progress status - spinning border
  if (status === "in_progress") {
    return (
      <div
        className={cn(
          iconSize,
          "rounded-full border-2 border-blue-600 border-r-transparent animate-spin flex-shrink-0"
        )}
      />
    );
  }

  // Pending status - empty circle
  return (
    <Circle
      className={cn(
        iconSize,
        "text-gray-400 dark:text-gray-600 flex-shrink-0"
      )}
    />
  );
}
