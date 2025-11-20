/**
 * ApprovalPriority Component - Priority Indicator
 * Displays approval priority with color coding
 */

import { Badge } from "@/components/ui/badge";
import { ApprovalPriority as Priority } from "@/types/approvals";
import { ArrowDown, Minus, ArrowUp, AlertTriangle } from "lucide-react";

interface ApprovalPriorityProps {
  priority: Priority;
  className?: string;
}

export function ApprovalPriority({ priority, className }: ApprovalPriorityProps) {
  const config = {
    [Priority.LOW]: {
      label: "Low",
      icon: ArrowDown,
      className: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
    },
    [Priority.NORMAL]: {
      label: "Normal",
      icon: Minus,
      className: "bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-400",
    },
    [Priority.HIGH]: {
      label: "High",
      icon: ArrowUp,
      className: "bg-orange-100 text-orange-600 dark:bg-orange-900 dark:text-orange-400",
    },
    [Priority.URGENT]: {
      label: "Urgent",
      icon: AlertTriangle,
      className: "bg-red-100 text-red-600 dark:bg-red-900 dark:text-red-400",
    },
  };

  const { label, icon: Icon, className: priorityClassName } = config[priority];

  return (
    <Badge variant="outline" className={`${priorityClassName} ${className || ""}`}>
      <Icon className="h-3 w-3 mr-1" />
      {label}
    </Badge>
  );
}
