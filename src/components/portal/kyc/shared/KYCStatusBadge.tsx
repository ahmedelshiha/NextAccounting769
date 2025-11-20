/**
 * KYCStatusBadge Component
 * Displays status badge with color coding for KYC steps
 */

import { Badge } from "@/components/ui/badge";
import { KYCStatusBadgeProps } from "../types/kyc";
import { KYC_BADGE_COLORS } from "../constants/kycSteps";
import { cn } from "@/lib/utils";

/**
 * Badge component that displays step status with appropriate styling
 * 
 * @param status - Step status (completed, in_progress, pending)
 * @param label - Optional custom label (defaults to status name)
 * 
 * @example
 * ```tsx
 * <KYCStatusBadge status="completed" />
 * <KYCStatusBadge status="in_progress" label="Processing" />
 * ```
 */
export function KYCStatusBadge({ status, label }: KYCStatusBadgeProps) {
  // Default labels for each status
  const defaultLabels = {
    completed: "Completed",
    in_progress: "In Progress",
    pending: "Pending",
  };

  const displayLabel = label || defaultLabels[status];
  const colorClass = KYC_BADGE_COLORS[status];

  return (
    <Badge
      variant="outline"
      className={cn(
        "font-medium",
        colorClass
      )}
    >
      {displayLabel}
    </Badge>
  );
}
