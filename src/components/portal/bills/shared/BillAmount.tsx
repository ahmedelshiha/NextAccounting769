/**
 * BillAmount Component - Amount Display
 * Formats and displays bill amounts with currency
 */

interface BillAmountProps {
  amount: number;
  currency?: string;
  className?: string;
}

export function BillAmount({
  amount,
  currency = "USD",
  className = "",
}: BillAmountProps) {
  const formatted = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency,
  }).format(amount);

  return <span className={className}>{formatted}</span>;
}
