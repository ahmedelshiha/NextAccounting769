/**
 * ApprovalType Component - Type Badge
 * Displays approval item type with icon
 */

import { Badge } from "@/components/ui/badge";
import { ApprovalItemType } from "@/types/approvals";
import {
  FileText,
  Receipt,
  File,
  FileSpreadsheet,
  Briefcase,
  Building2,
  User,
  HelpCircle,
} from "lucide-react";

interface ApprovalTypeProps {
  type: ApprovalItemType;
  className?: string;
}

export function ApprovalType({ type, className }: ApprovalTypeProps) {
  const config = {
    [ApprovalItemType.BILL]: {
      label: "Bill",
      icon: Receipt,
      className: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
    },
    [ApprovalItemType.EXPENSE]: {
      label: "Expense",
      icon: Receipt,
      className: "bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200",
    },
    [ApprovalItemType.DOCUMENT]: {
      label: "Document",
      icon: File,
      className: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
    },
    [ApprovalItemType.INVOICE]: {
      label: "Invoice",
      icon: FileSpreadsheet,
      className: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
    },
    [ApprovalItemType.SERVICE_REQUEST]: {
      label: "Service Request",
      icon: Briefcase,
      className: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200",
    },
    [ApprovalItemType.ENTITY]: {
      label: "Entity",
      icon: Building2,
      className: "bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-200",
    },
    [ApprovalItemType.USER]: {
      label: "User",
      icon: User,
      className: "bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-200",
    },
    [ApprovalItemType.OTHER]: {
      label: "Other",
      icon: HelpCircle,
      className: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200",
    },
  };

  const { label, icon: Icon, className: typeClassName } = config[type];

  return (
    <Badge variant="outline" className={`${typeClassName} ${className || ""}`}>
      <Icon className="h-3 w-3 mr-1" />
      {label}
    </Badge>
  );
}
