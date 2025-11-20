/**
 * ApprovalStatus Component - Status Badge
 * Displays approval status with appropriate styling
 */

import { Badge } from "@/components/ui/badge";
import { ApprovalStatus as Status } from "@/types/approvals";
import { CheckCircle2, XCircle, Clock, UserCheck, AlertTriangle, Ban } from "lucide-react";

interface ApprovalStatusProps {
  status: Status;
  className?: string;
}

export function ApprovalStatus({ status, className }: ApprovalStatusProps) {
  const config = {
    [Status.PENDING]: {
      label: "Pending",
      variant: "secondary" as const,
      icon: Clock,
      className: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
    },
    [Status.APPROVED]: {
      label: "Approved",
      variant: "default" as const,
      icon: CheckCircle2,
      className: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
    },
    [Status.REJECTED]: {
      label: "Rejected",
      variant: "destructive" as const,
      icon: XCircle,
      className: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
    },
    [Status.DELEGATED]: {
      label: "Delegated",
      variant: "secondary" as const,
      icon: UserCheck,
      className: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
    },
    [Status.ESCALATED]: {
      label: "Escalated",
      variant: "secondary" as const,
      icon: AlertTriangle,
      className: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
    },
    [Status.EXPIRED]: {
      label: "Expired",
      variant: "secondary" as const,
      icon: Ban,
      className: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200",
    },
  };

  const { label, icon: Icon, className: statusClassName } = config[status];

  return (
    <Badge className={`${statusClassName} ${className || ""}`}>
      <Icon className="h-3 w-3 mr-1" />
      {label}
    </Badge>
  );
}
