"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import useSWR from "swr";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  CheckCircle2,
  Circle,
  Upload,
  AlertCircle,
  ChevronRight,
  ArrowLeft,
} from "lucide-react";
import Link from "next/link";

interface KYCStep {
  id: string;
  title: string;
  description: string;
  status: "completed" | "in_progress" | "pending";
  percentage?: number;
}

interface KYCData {
  identity: {
    status: "completed" | "pending";
    documentType?: string;
    documentNumber?: string;
    verifiedAt?: string;
  };
  address: {
    status: "completed" | "pending";
    address?: string;
    verifiedAt?: string;
  };
  businessInfo: {
    status: "completed" | "pending";
    registrationNumber?: string;
    verifiedAt?: string;
  };
  beneficialOwners: {
    status: "completed" | "pending";
    ownersCount?: number;
    verifiedAt?: string;
  };
  taxInfo: {
    status: "completed" | "pending";
    tinNumber?: string;
    verifiedAt?: string;
  };
  riskAssessment: {
    status: "completed" | "pending";
    level?: "low" | "medium" | "high";
    verifiedAt?: string;
  };
}

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function KYCCenterPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session } = useSession();
  const entityId = searchParams.get("entityId");

  const [activeTab, setActiveTab] = useState("overview");

  // Fetch KYC data
  const { data: kycResponse, isLoading } = useSWR<{
    success: boolean;
    data: KYCData;
  }>(entityId ? `/api/kyc?entityId=${entityId}` : null, fetcher, {
    revalidateOnFocus: false,
  });

  const kycData = kycResponse?.data;

  // Calculate completion percentage
  const steps: KYCStep[] = [
    {
      id: "identity",
      title: "Identity Verification",
      description: "Verify your personal or business identity",
      status: kycData?.identity.status || "pending",
      percentage: kycData?.identity.status === "completed" ? 100 : 0,
    },
    {
      id: "address",
      title: "Address Verification",
      description: "Confirm registered business or residential address",
      status: kycData?.address.status || "pending",
      percentage: kycData?.address.status === "completed" ? 100 : 0,
    },
    {
      id: "business",
      title: "Business Registration",
      description: "Link business registration and license details",
      status: kycData?.businessInfo.status || "pending",
      percentage: kycData?.businessInfo.status === "completed" ? 100 : 0,
    },
    {
      id: "owners",
      title: "Beneficial Owners",
      description: "Identify and verify all beneficial owners",
      status: kycData?.beneficialOwners.status || "pending",
      percentage: kycData?.beneficialOwners.status === "completed" ? 100 : 0,
    },
    {
      id: "tax",
      title: "Tax Information",
      description: "Enter tax ID and filing information",
      status: kycData?.taxInfo.status || "pending",
      percentage: kycData?.taxInfo.status === "completed" ? 100 : 0,
    },
    {
      id: "risk",
      title: "Risk Assessment",
      description: "Complete compliance and risk questionnaire",
      status: kycData?.riskAssessment.status || "pending",
      percentage: kycData?.riskAssessment.status === "completed" ? 100 : 0,
    },
  ];

  const completedSteps = steps.filter((s) => s.status === "completed").length;
  const overallPercentage = Math.round((completedSteps / steps.length) * 100);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-3">
            <Link href="/portal/dashboard">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                KYC Center
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Complete your Know Your Customer verification
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Progress Overview */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Verification Progress</CardTitle>
                <CardDescription>
                  {completedSteps} of {steps.length} steps completed
                </CardDescription>
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold text-gray-900 dark:text-white">
                  {overallPercentage}%
                </div>
                <Badge
                  variant={
                    overallPercentage === 100
                      ? "default"
                      : overallPercentage > 50
                      ? "secondary"
                      : "outline"
                  }
                >
                  {overallPercentage === 100
                    ? "Complete"
                    : overallPercentage > 50
                    ? "In Progress"
                    : "Not Started"}
                </Badge>
              </div>
            </div>

            {/* Progress Bar */}
            <Progress value={overallPercentage} className="mt-4" />
          </CardHeader>
        </Card>

        {/* Tabs for different sections */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="timeline">Timeline</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-4">
            {steps.map((step, idx) => (
              <Card
                key={step.id}
                className={`cursor-pointer hover:shadow-md transition-shadow ${
                  step.status === "completed"
                    ? "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800"
                    : step.status === "in_progress"
                    ? "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800"
                    : "bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700"
                }`}
                onClick={() => router.push(`/portal/kyc/${step.id}?entityId=${entityId}`)}
              >
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4 flex-1">
                      {step.status === "completed" ? (
                        <CheckCircle2 className="h-6 w-6 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                      ) : step.status === "in_progress" ? (
                        <div className="h-6 w-6 rounded-full border-2 border-blue-600 border-r-transparent animate-spin flex-shrink-0 mt-0.5" />
                      ) : (
                        <Circle className="h-6 w-6 text-gray-400 dark:text-gray-600 flex-shrink-0 mt-0.5" />
                      )}

                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 dark:text-white">
                          {step.title}
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                          {step.description}
                        </p>

                        {step.status === "completed" && (
                          <p className="text-xs text-green-700 dark:text-green-300 mt-2">
                            ✓ Verified
                          </p>
                        )}
                      </div>
                    </div>

                    <ChevronRight className="h-5 w-5 text-gray-400 flex-shrink-0 mt-1" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          {/* Timeline Tab */}
          <TabsContent value="timeline" className="space-y-4">
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  {steps
                    .filter((s) => s.status === "completed")
                    .map((step) => (
                      <div key={step.id} className="flex items-start gap-4">
                        <CheckCircle2 className="h-6 w-6 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                        <div className="flex-1">
                          <p className="font-medium text-gray-900 dark:text-white">
                            {step.title}
                          </p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            Completed on {new Date().toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    ))}

                  {steps.filter((s) => s.status === "completed").length === 0 && (
                    <div className="text-center py-8">
                      <AlertCircle className="h-8 w-8 text-gray-400 dark:text-gray-600 mx-auto mb-2" />
                      <p className="text-gray-600 dark:text-gray-400">
                        No steps completed yet
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Help Section */}
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Need help? Our compliance team is here to assist you through each verification step.{" "}
            <Button variant="link" className="p-0 h-auto font-semibold">
              Contact Support
            </Button>
          </AlertDescription>
        </Alert>
      </main>
    </div>
  );
}
