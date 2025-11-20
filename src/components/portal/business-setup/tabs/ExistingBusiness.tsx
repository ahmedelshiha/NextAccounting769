"use client";

import { useState, useCallback } from "react";
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
import { Checkbox } from "@/components/ui/checkbox";
import { SwipeToConfirm } from "@/components/ui/SwipeToConfirm";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useMediaQuery } from "@/hooks/useMediaQuery";

interface ExistingBusinessTabProps {
  onError: (message: string) => void;
  onComplete: (entityId: string) => void;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
}

const existingBusinessSchema = z.object({
  country: z.enum(["AE", "SA", "EG"]),
  licenseNumber: z.string().min(3, "License number is required"),
  businessName: z.string().min(1, "Business name is required"),
  economicZoneId: z.string().optional(),
  legalForm: z.string().optional(),
  termsAccepted: z.boolean().refine((val) => val === true, {
    message: "You must accept the terms and conditions",
  }),
});

type ExistingBusinessInput = z.infer<typeof existingBusinessSchema>;

const economicZones: Record<string, Array<{ id: string; name: string }>> = {
  AE: [
    { id: "ded", name: "Abu Dhabi Department of Economic Development (DED)" },
    { id: "difc", name: "Dubai International Financial Centre (DIFC)" },
    { id: "dtec", name: "Dubai Technology & Enterprise Campus (DTEC)" },
    { id: "jafza", name: "Jebel Ali Free Zone (JAFZA)" },
    { id: "adgm", name: "Abu Dhabi Global Market (ADGM)" },
  ],
  SA: [
    { id: "riyadh", name: "Riyadh Chamber of Commerce" },
    { id: "jeddah", name: "Jeddah Chamber of Commerce" },
    { id: "dmmh", name: "Dammam Chamber of Commerce" },
    { id: "neom", name: "NEOM Economic Zone" },
  ],
  EG: [
    { id: "cairo", name: "Cairo" },
    { id: "giza", name: "Giza" },
    { id: "alex", name: "Alexandria" },
    { id: "suez", name: "Suez Canal Zone" },
  ],
};

export default function ExistingBusinessTab({
  onError,
  onComplete,
  isLoading,
  setIsLoading,
}: ExistingBusinessTabProps) {
  const [licenseLookupResult, setLicenseLookupResult] = useState<any>(null);
  const [isLookingUp, setIsLookingUp] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    watch,
    setValue,
  } = useForm<ExistingBusinessInput>({
    resolver: zodResolver(existingBusinessSchema),
    defaultValues: {
      country: "AE",
    },
  });

  const selectedCountry = watch("country");
  const licenseNumber = watch("licenseNumber");
  const isMobile = useMediaQuery("(max-width: 768px)");

  const handleLicenseLookup = useCallback(async () => {
    if (!licenseNumber || licenseNumber.length < 3) {
      onError("Please enter a valid license number");
      return;
    }

    try {
      setIsLookingUp(true);
      const response = await fetch(
        `/api/registries/${selectedCountry}/license/${encodeURIComponent(licenseNumber)}`
      );

      if (!response.ok) {
        throw new Error("License not found. Please verify the number or continue with manual review.");
      }

      const result = await response.json();
      setLicenseLookupResult(result.data);
      setValue("businessName", result.data.name || "");
      toast.success("License found! Details auto-filled.");
    } catch (error) {
      onError(error instanceof Error ? error.message : "Failed to lookup license");
      setLicenseLookupResult(null);
    } finally {
      setIsLookingUp(false);
    }
  }, [licenseNumber, selectedCountry, onError, setValue]);

  const onSubmit = async (data: ExistingBusinessInput) => {
    try {
      setIsLoading(true);
      
      // Generate idempotency key for this request
      const idempotencyKey = crypto.randomUUID();
      
      const response = await fetch("/api/entities/setup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          country: data.country,
          tab: "existing",
          licenseNumber: data.licenseNumber,
          businessName: data.businessName,
          economicZoneId: data.economicZoneId,
          legalForm: data.legalForm,
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
      toast.success("Business account setup started!");
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
          <CardTitle className="text-lg">Verify Existing Business</CardTitle>
          <CardDescription>
            Search for your existing business registration and auto-fill details
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

            {/* License Number Lookup */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                License Number *
              </label>
              <div className="flex gap-2">
                <Input
                  {...register("licenseNumber")}
                  placeholder={`e.g., ${selectedCountry === "AE" ? "P123456X" : selectedCountry === "SA" ? "1010123456" : "123456789"}`}
                  className={errors.licenseNumber ? "border-red-500" : ""}
                />
                <Button
                  type="button"
                  onClick={handleLicenseLookup}
                  disabled={isLookingUp || !licenseNumber || licenseNumber.length < 3}
                  variant="outline"
                >
                  {isLookingUp ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    "Lookup"
                  )}
                </Button>
              </div>
              {errors.licenseNumber && (
                <p className="text-red-600 text-sm mt-1">{errors.licenseNumber.message}</p>
              )}
              <p className="text-xs text-gray-500 mt-1">
                Your business license or commercial registration number
              </p>
            </div>

            {/* Business Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Business Name *
              </label>
              <Input
                {...register("businessName")}
                placeholder="Legal business name"
                className={errors.businessName ? "border-red-500" : ""}
              />
              {errors.businessName && (
                <p className="text-red-600 text-sm mt-1">{errors.businessName.message}</p>
              )}
            </div>

            {/* Economic Zone */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Department / Zone (optional)
              </label>
              <Select value={watch("economicZoneId") || ""} onValueChange={(val) => setValue("economicZoneId", val)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select department or zone" />
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

            {/* Legal Form */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Legal Form (optional)
              </label>
              <Input
                {...register("legalForm")}
                placeholder={`e.g., ${selectedCountry === "AE" ? "LLC" : selectedCountry === "SA" ? "Company" : "Business"}`}
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
                  I agree to the license agreement
                </label>
                <p className="text-xs text-gray-600 mt-1">
                  By proceeding, you confirm that the information provided is accurate and you have
                  authority to represent this business.{" "}
                  <a href="#" className="text-blue-600 hover:underline">
                    View agreement
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
                text="Swipe to set up"
                successText="Setting up..."
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
                  "Set up Business"
                )}
              </Button>
            )}
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
