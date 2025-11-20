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

interface NewStartupTabProps {
  onError: (message: string) => void;
  onComplete: (entityId: string) => void;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
}

const newStartupSchema = z.object({
  country: z.enum(["AE", "SA", "EG"]),
  businessName: z.string().min(1, "Business name is required"),
  legalForm: z.string().min(1, "Legal form is required"),
  economicZoneId: z.string().optional(),
  activityCode: z.string().optional(),
  incorporationDate: z.string().optional(),
  termsAccepted: z.boolean().refine((val) => val === true, {
    message: "You must accept the terms and conditions",
  }),
});

type NewStartupInput = z.infer<typeof newStartupSchema>;

const economicZones: Record<string, Array<{ id: string; name: string }>> = {
  AE: [
    { id: "ded", name: "Abu Dhabi Department of Economic Development (DED)" },
    { id: "difc", name: "Dubai International Financial Centre (DIFC)" },
    { id: "dtec", name: "Dubai Technology & Enterprise Campus (DTEC)" },
    { id: "jafza", name: "Jebel Ali Free Zone (JAFZA)" },
    { id: "adgm", name: "Abu Dhabi Global Market (ADGM)" },
  ],
  SA: [
    { id: "riyadh", name: "Riyadh" },
    { id: "jeddah", name: "Jeddah" },
    { id: "dammam", name: "Dammam" },
    { id: "neom", name: "NEOM Economic Zone" },
  ],
  EG: [
    { id: "cairo", name: "Cairo" },
    { id: "giza", name: "Giza" },
    { id: "alex", name: "Alexandria" },
  ],
};

const legalForms: Record<string, string[]> = {
  AE: ["Sole Establishment", "LLC", "Limited Partnership", "Professional Service"],
  SA: ["Company", "Sole Proprietor", "Limited Partnership"],
  EG: ["Company", "Cooperative"],
};

export default function NewStartupTab({
  onError,
  onComplete,
  isLoading,
  setIsLoading,
}: NewStartupTabProps) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    watch,
    setValue,
  } = useForm<NewStartupInput>({
    resolver: zodResolver(newStartupSchema),
    defaultValues: {
      country: "AE",
      legalForm: "LLC",
    },
  });

  const selectedCountry = watch("country");
  const selectedForm = watch("legalForm");
  const isMobile = useMediaQuery("(max-width: 768px)");

  const onSubmit = async (data: NewStartupInput) => {
    try {
      setIsLoading(true);
      
      // Generate idempotency key for this request
      const idempotencyKey = crypto.randomUUID();
      
      const response = await fetch("/api/entities/setup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          country: data.country,
          tab: "new",
          businessName: data.businessName,
          legalForm: data.legalForm,
          economicZoneId: data.economicZoneId,
          activityCode: data.activityCode,
          incorporationDate: data.incorporationDate ? new Date(data.incorporationDate) : undefined,
          consentVersion: "1.0",
          consentAccepted: data.termsAccepted,
          idempotencyKey: idempotencyKey,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to set up business account");
      }

      const result = await response.json();
      toast.success("Business account created!");
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
          <CardTitle className="text-lg">Create New Business</CardTitle>
          <CardDescription>
            Set up a new company that hasn&apos;t been registered yet
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

            {/* Business Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Proposed Business Name *
              </label>
              <Input
                {...register("businessName")}
                placeholder="Name for your new business"
                className={errors.businessName ? "border-red-500" : ""}
              />
              {errors.businessName && (
                <p className="text-red-600 text-sm mt-1">{errors.businessName.message}</p>
              )}
            </div>

            {/* Legal Form */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Legal Form *
              </label>
              <Select value={selectedForm} onValueChange={(val) => setValue("legalForm", val)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {legalForms[selectedCountry]?.map((form) => (
                    <SelectItem key={form} value={form}>
                      {form}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.legalForm && (
                <p className="text-red-600 text-sm mt-1">{errors.legalForm.message}</p>
              )}
            </div>

            {/* Economic Zone */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Zone / Location (optional)
              </label>
              <Select value={watch("economicZoneId") || ""} onValueChange={(val) => setValue("economicZoneId", val)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select zone or location" />
                </SelectTrigger>
                <SelectContent>
                  {economicZones[selectedCountry]?.map((zone) => (
                    <SelectItem key={zone.id} value={zone.id}>
                      {zone.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Activity Code */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Activity Code (optional)
              </label>
              <Input
                {...register("activityCode")}
                placeholder="Industry classification code"
              />
              <p className="text-xs text-gray-500 mt-1">
                E.g., 6201 (Professional Services), 1110 (Farming)
              </p>
            </div>

            {/* Incorporation Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Planned Incorporation Date (optional)
              </label>
              <Input
                {...register("incorporationDate")}
                type="date"
              />
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
                  I accept the terms and conditions
                </label>
                <p className="text-xs text-gray-600 mt-1">
                  You confirm that you intend to register this business in the selected jurisdiction.
                  <a href="#" className="text-blue-600 hover:underline ml-1">
                    View terms
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
                text="Swipe to create"
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
                  "Create Business Account"
                )}
              </Button>
            )}
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
