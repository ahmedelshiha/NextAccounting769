/**
 * BillAnalytics Component - Analytics Dashboard
 * Displays bills statistics and analytics
 */

"use client";

import { useBillStats } from "@/lib/hooks/bills/useBillStats";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BillAmount } from "../shared/BillAmount";
import { Loader2, Receipt, CheckCircle, Clock, DollarSign } from "lucide-react";

export function BillAnalytics() {
  const { stats, isLoading } = useBillStats();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!stats) {
    return null;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {/* Total Bills */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
            <Receipt className="h-4 w-4" />
            Total Bills
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-gray-900 dark:text-white">
            {stats.total}
          </div>
          <p className="text-sm text-gray-500 mt-1">
            <BillAmount amount={stats.totalAmount} />
          </p>
        </CardContent>
      </Card>

      {/* Pending */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Pending
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-orange-600">
            {stats.pending}
          </div>
          <p className="text-sm text-gray-500 mt-1">
            <BillAmount amount={stats.pendingAmount} />
          </p>
        </CardContent>
      </Card>

      {/* Approved */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
            <CheckCircle className="h-4 w-4" />
            Approved
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600">
            {stats.approved}
          </div>
          <p className="text-sm text-gray-500 mt-1">
            <BillAmount amount={stats.approvedAmount} />
          </p>
        </CardContent>
      </Card>

      {/* Paid */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
            <DollarSign className="h-4 w-4" />
            Paid
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-blue-600">{stats.paid}</div>
          <p className="text-sm text-gray-500 mt-1">
            <BillAmount amount={stats.paidAmount} />
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
