"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import useSWR from "swr";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Users,
  FileText,
  DollarSign,
  Receipt,
  CheckSquare,
  MessageCircle,
  ChevronRight,
  AlertCircle,
} from "lucide-react";

interface FeatureTile {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  href: string;
  badge?: number;
  badgeLabel?: string;
  color: "blue" | "purple" | "green" | "orange" | "red" | "gray";
  enabled?: boolean;
}

interface FeatureCounts {
  kycPending: number;
  documentsPending: number;
  invoicesPending: number;
  billsPending: number;
  approvalsPending: number;
}

const fetcher = (url: string) => fetch(url).then((res) => res.json());

const colorClasses = {
  blue: "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800",
  purple: "bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800",
  green: "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800",
  orange: "bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800",
  red: "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800",
  gray: "bg-gray-50 dark:bg-gray-900/20 border-gray-200 dark:border-gray-800",
};

const colorIconClasses = {
  blue: "text-blue-600 dark:text-blue-400",
  purple: "text-purple-600 dark:text-purple-400",
  green: "text-green-600 dark:text-green-400",
  orange: "text-orange-600 dark:text-orange-400",
  red: "text-red-600 dark:text-red-400",
  gray: "text-gray-600 dark:text-gray-400",
};

const badgeColorClasses = {
  blue: "bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200",
  purple: "bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200",
  green: "bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200",
  orange: "bg-orange-100 dark:bg-orange-900 text-orange-800 dark:text-orange-200",
  red: "bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200",
  gray: "bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-200",
};

interface FeaturesHubProps {
  entityId?: string;
}

export default function FeaturesHub({ entityId }: FeaturesHubProps) {
  const router = useRouter();

  // Fetch feature counts
  const { data: countsResponse, isLoading } = useSWR<{
    success: boolean;
    data: FeatureCounts;
  }>(entityId ? `/api/features/counts?entityId=${entityId}` : null, fetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 30000, // Revalidate every 30 seconds
  });

  const counts = countsResponse?.data || {
    kycPending: 0,
    documentsPending: 0,
    invoicesPending: 0,
    billsPending: 0,
    approvalsPending: 0,
  };

  // Define feature tiles
  const tiles: FeatureTile[] = useMemo(
    () => [
      {
        id: "kyc",
        title: "KYC Center",
        description: "Verify identity and business information",
        icon: <Users className="h-6 w-6" />,
        href: "/portal/kyc",
        badge: counts.kycPending,
        badgeLabel: "pending",
        color: "blue",
        enabled: true,
      },
      {
        id: "documents",
        title: "Documents",
        description: "Upload and manage tax documents",
        icon: <FileText className="h-6 w-6" />,
        href: "/portal/documents",
        badge: counts.documentsPending,
        badgeLabel: "pending",
        color: "purple",
        enabled: true,
      },
      {
        id: "invoicing",
        title: "Invoicing",
        description: "Create and manage invoices",
        icon: <DollarSign className="h-6 w-6" />,
        href: "/portal/invoicing",
        badge: counts.invoicesPending,
        badgeLabel: "pending",
        color: "green",
        enabled: true,
      },
      {
        id: "bills",
        title: "Upload Bill",
        description: "Scan and extract bill data with OCR",
        icon: <Receipt className="h-6 w-6" />,
        href: "/portal/bills",
        badge: counts.billsPending,
        badgeLabel: "pending",
        color: "orange",
        enabled: true,
      },
      {
        id: "approvals",
        title: "Approvals",
        description: "Review and approve pending items",
        icon: <CheckSquare className="h-6 w-6" />,
        href: "/portal/approvals",
        badge: counts.approvalsPending,
        badgeLabel: "pending",
        color: "red",
        enabled: true,
      },
      {
        id: "messaging",
        title: "Messaging",
        description: "Communicate with support team",
        icon: <MessageCircle className="h-6 w-6" />,
        href: "/portal/messages",
        badge: 0,
        color: "gray",
        enabled: true,
      },
    ],
    [counts]
  );

  // Filter enabled tiles
  const enabledTiles = tiles.filter((tile) => tile.enabled !== false);

  // Calculate totals for summary
  const totalPending = counts.kycPending +
    counts.documentsPending +
    counts.invoicesPending +
    counts.billsPending +
    counts.approvalsPending;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Features
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          {totalPending > 0 && (
            <span className="inline-flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-orange-600" />
              {totalPending} item{totalPending !== 1 ? "s" : ""} need attention
            </span>
          )}
          {totalPending === 0 && "All caught up! Explore available features."}
        </p>
      </div>

      {/* Feature Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {isLoading
          ? // Loading skeleton
            Array.from({ length: 6 }).map((_, idx) => (
              <Card key={idx} className="overflow-hidden">
                <CardContent className="pt-6">
                  <Skeleton className="h-12 w-12 rounded mb-4" />
                  <Skeleton className="h-5 w-32 mb-2" />
                  <Skeleton className="h-4 w-40 mb-4" />
                  <Skeleton className="h-9 w-24" />
                </CardContent>
              </Card>
            ))
          : // Feature tiles
            enabledTiles.map((tile) => (
              <Card
                key={tile.id}
                className={`border ${colorClasses[tile.color]} overflow-hidden hover:shadow-md transition-shadow cursor-pointer`}
                onClick={() => router.push(tile.href)}
              >
                <CardContent className="pt-6">
                  {/* Icon & Badge */}
                  <div className="flex items-start justify-between mb-3">
                    <div className={`${colorIconClasses[tile.color]}`}>
                      {tile.icon}
                    </div>
                    {tile.badge !== undefined && tile.badge > 0 && (
                      <Badge className={badgeColorClasses[tile.color]} variant="secondary">
                        {tile.badge} {tile.badgeLabel}
                      </Badge>
                    )}
                  </div>

                  {/* Title & Description */}
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                    {tile.title}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                    {tile.description}
                  </p>

                  {/* CTA Button */}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full justify-between group"
                    onClick={(e) => {
                      e.stopPropagation();
                      router.push(tile.href);
                    }}
                  >
                    Open
                    <ChevronRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </CardContent>
              </Card>
            ))}
      </div>

      {/* Help Section */}
      <Card className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
        <CardContent className="pt-6">
          <div className="flex gap-3">
            <AlertCircle className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-blue-900 dark:text-blue-200 mb-1">
                Need help?
              </p>
              <p className="text-sm text-blue-800 dark:text-blue-300 mb-3">
                Check out our help center or contact our support team for assistance.
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="border-blue-300 dark:border-blue-700 text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/40"
                  onClick={() => router.push("/help")}
                >
                  Help Center
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="border-blue-300 dark:border-blue-700 text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/40"
                  onClick={() => router.push("/portal/messages")}
                >
                  Contact Support
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
