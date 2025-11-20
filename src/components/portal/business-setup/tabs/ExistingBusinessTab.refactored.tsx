/**
 * ExistingBusinessTab - Refactored
 * Modular, focused component using shared components and hooks
 */

"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CountrySelector } from "../shared/CountrySelector";
import { EconomicZoneSelector } from "../shared/EconomicZoneSelector";
import { LegalFormSelector } from "../shared/LegalFormSelector";
import { TermsCheckbox } from "../shared/TermsCheckbox";
import { FormActions } from "../shared/FormActions";
import { LicenseLookupCard } from "../forms/LicenseLookupCard";
import { useLicenseLookup } from "../hooks/useLicenseLookup";
import { useEntityCreation } from "../hooks/useEntityCreation";
import { existingBusinessSchema, type ExistingBusinessInput } from "../schemas/existingBusinessSchema";
import type { TabProps } from "../types/setup";

export default function ExistingBusinessTab({
  onError,
  onComplete,
  isLoading,
  setIsLoading,
}: TabProps) {
  const { result, isLooking, lookupLicense } = useLicenseLookup();
  const { createEntity, isCreating } = useEntityCreation();

  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
    watch,
    setValue,
  } = useForm<ExistingBusinessInput>({
    resolver: zodResolver(existingBusinessSchema),
    defaultValues: {
      country: "AE",
      termsAccepted: false,
    },
    mode: "onChange",
  });

  const selectedCountry = watch("country");
  const licenseNumber = watch("licenseNumber");

  const handleLookup = () => {
    lookupLicense(selectedCountry, licenseNumber);
  };

  const onSubmit = async (data: ExistingBusinessInput) => {
    try {
      setIsLoading(true);
      const entityId = await createEntity({
        ...data,
        country: data.country || 'AE',
      } as ExistingBusinessInput);
      onComplete(entityId);
    } catch (error: any) {
      onError(error.message || "Failed to create entity");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Country */}
      <CountrySelector
        value={selectedCountry}
        onChange={(value) => setValue("country", value)}
        error={errors.country?.message}
      />

      {/* License Number */}
      <div className="space-y-2">
        <Label htmlFor="licenseNumber">License Number *</Label>
        <Input
          id="licenseNumber"
          {...register("licenseNumber")}
          placeholder="Enter your business license number"
          disabled={isLoading}
        />
        {errors.licenseNumber && (
          <p className="text-sm text-red-600">{errors.licenseNumber.message}</p>
        )}
      </div>

      {/* License Lookup */}
      <LicenseLookupCard
        result={result}
        isLooking={isLooking}
        onLookup={handleLookup}
        disabled={!licenseNumber || licenseNumber.length < 3 || isLoading}
      />

      {/* Business Name */}
      <div className="space-y-2">
        <Label htmlFor="businessName">Business Name *</Label>
        <Input
          id="businessName"
          {...register("businessName")}
          placeholder="Enter your business name"
          disabled={isLoading}
        />
        {errors.businessName && (
          <p className="text-sm text-red-600">{errors.businessName.message}</p>
        )}
      </div>

      {/* Economic Zone */}
      <EconomicZoneSelector
        country={selectedCountry}
        value={watch("economicZoneId")}
        onChange={(value) => setValue("economicZoneId", value)}
        disabled={isLoading}
        error={errors.economicZoneId?.message}
      />

      {/* Legal Form */}
      <LegalFormSelector
        country={selectedCountry}
        value={watch("legalForm")}
        onChange={(value) => setValue("legalForm", value)}
        disabled={isLoading}
        error={errors.legalForm?.message}
      />

      {/* Terms */}
      <TermsCheckbox
        checked={watch("termsAccepted")}
        onChange={(checked) => setValue("termsAccepted", checked)}
        disabled={isLoading}
        error={errors.termsAccepted?.message}
      />

      {/* Submit */}
      <FormActions
        isLoading={isLoading || isCreating}
        isValid={isValid}
        onSubmit={handleSubmit(onSubmit)}
        submitText="Link Existing Business"
      />
    </form>
  );
}
