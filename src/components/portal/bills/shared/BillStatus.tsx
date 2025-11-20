/**
 * BillStatus Component - Status Badge
 * Displays bill status with appropriate styling
 */

import { Badge } from "@/components/ui/badge";
import { BillStatus as BillStatusEnum } from "@/types/bills";

interface BillStatusProps {
  status: BillStatusEnum | string;
  className?: string;
}

const statusConfig = {
  [BillStatusEnum.PENDING]: {
    label: "Pending",
    variant: "secondary" as const,
  },
  [BillStatusEnum.APPROVED]: {
    label: "Approved",
    variant: "default" as const,
  },
  [BillStatusEnum.REJECTED]: {
    label: "Rejected",
    variant: "destructive" as const,
  },
  [BillStatusEnum.PAID]: {
    label: "Paid",
    variant: "default" as const,
  },
};

export function BillStatus({ status, className }: BillStatusProps) {
  const config = statusConfig[status as BillStatusEnum] || {
    label: status,
    variant: "outline" as const,
  };

  return (
    <Badge variant={config.variant} className={className}>
      {config.label}
    </Badge>
  );
}
