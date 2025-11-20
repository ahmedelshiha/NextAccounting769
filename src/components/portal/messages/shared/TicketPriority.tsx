/**
 * TicketPriority Component - Priority Badge
 * Displays ticket priority with color coding
 */

import { Badge } from "@/components/ui/badge";
import { TicketPriority as Priority } from "@/types/messages";
import { ArrowDown, Minus, ArrowUp, AlertTriangle, Flame } from "lucide-react";

interface TicketPriorityProps {
  priority: string;
  className?: string;
}

export function TicketPriority({ priority, className }: TicketPriorityProps) {
  const config: Record<string, any> = {
    LOW: {
      label: "Low",
      icon: ArrowDown,
      className: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
    },
    MEDIUM: {
      label: "Medium",
      icon: Minus,
      className: "bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-400",
    },
    HIGH: {
      label: "High",
      icon: ArrowUp,
      className: "bg-orange-100 text-orange-600 dark:bg-orange-900 dark:text-orange-400",
    },
    URGENT: {
      label: "Urgent",
      icon: AlertTriangle,
      className: "bg-red-100 text-red-600 dark:bg-red-900 dark:text-red-400",
    },
    CRITICAL: {
      label: "Critical",
      icon: Flame,
      className: "bg-red-200 text-red-800 dark:bg-red-950 dark:text-red-300 font-bold",
    },
  };

  const { label, icon: Icon, className: priorityClassName } = config[priority] || config.MEDIUM;

  return (
    <Badge variant="outline" className={`${priorityClassName} ${className || ""}`}>
      <Icon className="h-3 w-3 mr-1" />
      {label}
    </Badge>
  );
}
