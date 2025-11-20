/**
 * TicketStatus Component - Status Badge
 * Displays ticket status with appropriate styling
 */

import { Badge } from "@/components/ui/badge";
import { TicketStatus as Status } from "@/types/messages";
import {
  Circle,
  PlayCircle,
  Clock,
  CheckCircle2,
  XCircle,
  Ban,
} from "lucide-react";

interface TicketStatusProps {
  status: string;
  className?: string;
}

export function TicketStatus({ status, className }: TicketStatusProps) {
  const config: Record<string, any> = {
    OPEN: {
      label: "Open",
      icon: Circle,
      className: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
    },
    IN_PROGRESS: {
      label: "In Progress",
      icon: PlayCircle,
      className: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
    },
    WAITING_ON_CUSTOMER: {
      label: "Waiting on Customer",
      icon: Clock,
      className: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
    },
    WAITING_ON_SUPPORT: {
      label: "Waiting on Support",
      icon: Clock,
      className: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
    },
    RESOLVED: {
      label: "Resolved",
      icon: CheckCircle2,
      className: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
    },
    CLOSED: {
      label: "Closed",
      icon: CheckCircle2,
      className: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200",
    },
    CANCELLED: {
      label: "Cancelled",
      icon: Ban,
      className: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
    },
  };

  const { label, icon: Icon, className: statusClassName } = config[status] || config.OPEN;

  return (
    <Badge className={`${statusClassName} ${className || ""}`}>
      <Icon className="h-3 w-3 mr-1" />
      {label}
    </Badge>
  );
}
