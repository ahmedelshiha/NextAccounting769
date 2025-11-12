"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ArrowLeft, Loader2, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { getCountry } from "@/lib/registries/countries";

const createEntitySchema = z.object({
  country: z.enum(["AE", "SA", "EG"]),
  name: z.string().min(1, "Business name is required").max(255),
  legalForm: z.string().optional(),
  activityCode: z.string().optional(),
  entityType: z.enum(["company", "individual", "freelancer", "partnership"]).optional(),
  fiscalYearStart: z.string().optional(),
});

type CreateEntityInput = z.infer<typeof createEntitySchema>;

export default function NewEntityPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    watch,
    setValue,
  } = useForm<CreateEntityInput>({
    resolver: zodResolver(createEntitySchema),
    defaultValues: {
      country: "AE",
    },
  });

  const selectedCountry = watch("country");
  const selectedEntityType = watch("entityType");

  const countryData = getCountry(selectedCountry);

  const onSubmit = async (data: CreateEntityInput) => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch("/api/entities", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          country: data.country,
          name: data.name,
          legalForm: data.legalForm,
          activityCode: data.activityCode,
          entityType: data.entityType,
          fiscalYearStart: data.fiscalYearStart ? new Date(data.fiscalYearStart) : undefined,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to create entity");
      }

      const result = await response.json();
      toast.success("Entity created successfully");
      router.push(`/admin/entities/${result.data.id}`);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to create entity";
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const legalForms: Record<string, string[]> = {
    AE: ["Sole Establishment", "LLC", "Limited Partnership", "Professional Service", "Branch"],
    SA: ["Company", "Sole Proprietor", "Limited Partnership", "Joint Venture"],
    EG: ["Individual", "Company", "Cooperative", "Branch"],
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/admin/entities">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Entities
          </Button>
        </Link>
      </div>

      {/* Title */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Create New Entity</h1>
        <p className="text-gray-600 mt-1">
          Add a new company, individual, or organization to your portfolio
        </p>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Main Form Card */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Entity Details</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                {/* Country Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Country *
                  </label>
                  <Select
                    value={selectedCountry}
                    onValueChange={(value) => setValue("country", value as any)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select country" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="AE">
                        <span className="mr-2">🇦🇪</span> United Arab Emirates
                      </SelectItem>
                      <SelectItem value="SA">
                        <span className="mr-2">🇸🇦</span> Saudi Arabia
                      </SelectItem>
                      <SelectItem value="EG">
                        <span className="mr-2">🇪🇬</span> Egypt
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Business Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Business Name *
                  </label>
                  <Input
                    {...register("name")}
                    placeholder="Enter the legal business name"
                    className={errors.name ? "border-red-500" : ""}
                  />
                  {errors.name && (
                    <p className="text-red-600 text-sm mt-1">{errors.name.message}</p>
                  )}
                </div>

                {/* Legal Form */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Legal Form
                  </label>
                  <Select
                    value={watch("legalForm") || ""}
                    onValueChange={(value) => setValue("legalForm", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select legal form" />
                    </SelectTrigger>
                    <SelectContent>
                      {legalForms[selectedCountry]?.map((form) => (
                        <SelectItem key={form} value={form}>
                          {form}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-gray-500 mt-1">
                    Organization type according to {countryData?.name} regulations
                  </p>
                </div>

                {/* Entity Type */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Entity Type
                  </label>
                  <Select
                    value={selectedEntityType || ""}
                    onValueChange={(value) => setValue("entityType", value as any)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select entity type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="company">Company</SelectItem>
                      <SelectItem value="individual">Individual</SelectItem>
                      <SelectItem value="freelancer">Freelancer</SelectItem>
                      <SelectItem value="partnership">Partnership</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-gray-500 mt-1">
                    This determines which tax obligations apply
                  </p>
                </div>

                {/* Activity Code */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Activity Code
                  </label>
                  <Input
                    {...register("activityCode")}
                    placeholder="e.g., 6201, 1110, 9000"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Industry classification code (optional)
                  </p>
                </div>

                {/* Fiscal Year Start */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Fiscal Year Start Date
                  </label>
                  <Input
                    {...register("fiscalYearStart")}
                    type="date"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    When does your financial year begin?
                  </p>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 pt-6">
                  <Button type="submit" disabled={isSubmitting || loading}>
                    {isSubmitting || loading ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      "Create Entity"
                    )}
                  </Button>
                  <Link href="/admin/entities">
                    <Button type="button" variant="outline">
                      Cancel
                    </Button>
                  </Link>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Help Section */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Help</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">What is an Entity?</h4>
                <p className="text-gray-600">
                  An entity represents a company, individual taxpayer, or organization that needs
                  to file tax returns or maintain regulatory compliance.
                </p>
              </div>

              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Required Information</h4>
                <ul className="text-gray-600 list-disc list-inside space-y-1">
                  <li>Business/Legal Name</li>
                  <li>Country of Registration</li>
                  <li>Legal Form (e.g., LLC, Company)</li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Next Steps</h4>
                <ol className="text-gray-600 list-decimal list-inside space-y-1">
                  <li>Add tax registration numbers (TRN, VAT ID, etc.)</li>
                  <li>Upload business licenses and documents</li>
                  <li>Set up filing obligations</li>
                  <li>Invite team members</li>
                </ol>
              </div>

              {countryData && (
                <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <h4 className="font-semibold text-blue-900 mb-2">
                    {countryData.name} Requirements
                  </h4>
                  <ul className="text-blue-800 text-xs space-y-1">
                    {countryData.obligations?.map((obl) => (
                      <li key={obl.type}>• {obl.type}: {obl.frequency}</li>
                    ))}
                  </ul>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
