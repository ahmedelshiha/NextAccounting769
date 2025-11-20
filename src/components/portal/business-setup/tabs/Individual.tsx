"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { SwipeToConfirm } from "@/components/ui/SwipeToConfirm";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useMediaQuery } from "@/hooks/useMediaQuery";

interface IndividualTabProps {
  onError: (message: string) => void;
  onComplete: (entityId: string) => void;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
}

const individualSchema = z.object({
  country: z.enum(["AE", "SA", "EG"]),
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  taxId: z.string().min(1, "Tax ID is required"),
  emiratesIdOrPassport: z.string().optional(),
  dateOfBirth: z.string().optional(),
  activityCode: z.string().optional(),
  termsAccepted: z.boolean().refine((val) => val === true, {
    message: "You must accept the terms and conditions",
  }),
});

type IndividualInput = z.infer<typeof individualSchema>;

const getTaxIdPlaceholder = (country: string) => {
  switch (country) {
    case "AE":
      return "UAE Emirates ID (15 digits)";
    case "SA":
      return "National ID (10 digits)";
    case "EG":
      return "National ID Number";
    default:
      return "Tax ID / National ID";
  }
};

export default function IndividualTab({
  onError,
  onComplete,
  isLoading,
  setIsLoading,
}: IndividualTabProps) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    watch,
    setValue,
  } = useForm<IndividualInput>({
    resolver: zodResolver(individualSchema),
    defaultValues: {
      country: "AE",
    },
  });

  const selectedCountry = watch("country");
  const isMobile = useMediaQuery("(max-width: 768px)");

  const onSubmit = async (data: IndividualInput) => {
    try {
      setIsLoading(true);
      
      // Generate idempotency key for this request
      const idempotencyKey = crypto.randomUUID();
      
      const response = await fetch("/api/entities/setup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          country: data.country,
          tab: "individual",
          businessName: `${data.firstName} ${data.lastName}`,
          taxId: data.taxId,
          emiratesIdOrPassport: data.emiratesIdOrPassport,
          dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : undefined,
          activityCode: data.activityCode,
          entityType: "individual",
          consentVersion: "1.0",
          consentAccepted: data.termsAccepted,
          idempotencyKey: idempotencyKey,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to set up individual account");
      }

      const result = await response.json();
      toast.success("Individual account created!");
      onComplete(result.data.entityId || result.data.id);
    } catch (error) {
      onError(error instanceof Error ? error.message : "Setup failed");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Individual Taxpayer</CardTitle>
          <CardDescription>
            Set up your account as a self-employed individual or freelancer
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Country */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Country *
              </label>
              <Select value={selectedCountry} onValueChange={(val) => setValue("country", val as any)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="AE">🇦🇪 UAE</SelectItem>
                  <SelectItem value="SA">🇸🇦 Saudi Arabia</SelectItem>
                  <SelectItem value="EG">🇪🇬 Egypt</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* First Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                First Name *
              </label>
              <Input
                {...register("firstName")}
                placeholder="Your first name"
                className={errors.firstName ? "border-red-500" : ""}
              />
              {errors.firstName && (
                <p className="text-red-600 text-sm mt-1">{errors.firstName.message}</p>
              )}
            </div>

            {/* Last Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Last Name *
              </label>
              <Input
                {...register("lastName")}
                placeholder="Your last name"
                className={errors.lastName ? "border-red-500" : ""}
              />
              {errors.lastName && (
                <p className="text-red-600 text-sm mt-1">{errors.lastName.message}</p>
              )}
            </div>

            {/* Tax ID */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tax ID / National ID *
              </label>
              <Input
                {...register("taxId")}
                placeholder={getTaxIdPlaceholder(selectedCountry)}
                className={errors.taxId ? "border-red-500" : ""}
              />
              {errors.taxId && (
                <p className="text-red-600 text-sm mt-1">{errors.taxId.message}</p>
              )}
            </div>

            {/* Emirates ID or Passport */}
            {selectedCountry === "AE" && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Emirates ID (optional)
                </label>
                <Input
                  {...register("emiratesIdOrPassport")}
                  placeholder="15-digit Emirates ID"
                />
              </div>
            )}

            {/* Date of Birth */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Date of Birth (optional)
              </label>
              <Input
                {...register("dateOfBirth")}
                type="date"
              />
            </div>

            {/* Activity Code */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Professional Activity (optional)
              </label>
              <Input
                {...register("activityCode")}
                placeholder="E.g., Consultant, Freelancer, Software Developer"
              />
              <p className="text-xs text-gray-500 mt-1">
                Describe your main business activity or profession
              </p>
            </div>

            {/* Terms Checkbox */}
            <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
              <input
                type="checkbox"
                {...register("termsAccepted")}
                className="mt-1"
              />
              <div className="flex-1">
                <label className="text-sm font-medium text-gray-900">
                  I confirm the information is accurate and complete
                </label>
                <p className="text-xs text-gray-600 mt-1">
                  By proceeding, you confirm that the personal information provided is accurate
                  and you understand your tax obligations in {
                    selectedCountry === "AE"
                      ? "UAE"
                      : selectedCountry === "SA"
                      ? "Saudi Arabia"
                      : "Egypt"
                  }.
                  <a href="#" className="text-blue-600 hover:underline ml-1">
                    Learn more
                  </a>
                </p>
              </div>
            </div>
            {errors.termsAccepted && (
              <p className="text-red-600 text-sm -mt-2">{errors.termsAccepted.message}</p>
            )}

            {/* Submit Button - Mobile Swipe or Desktop Click */}
            {isMobile ? (
              <SwipeToConfirm
                text="Swipe to create account"
                successText="Creating..."
                onSwipeComplete={handleSubmit(onSubmit)}
                disabled={isSubmitting || isLoading}
                isLoading={isLoading}
              />
            ) : (
              <Button
                type="submit"
                className="w-full"
                disabled={isSubmitting || isLoading}
                size="lg"
              >
                {isSubmitting || isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Setting up...
                  </>
                ) : (
                  "Create My Account"
                )}
              </Button>
            )}
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
