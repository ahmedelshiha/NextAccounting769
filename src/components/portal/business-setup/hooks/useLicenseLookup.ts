/**
 * useLicenseLookup Hook - License Lookup Logic
 * Custom hook for license verification
 */

import { useState, useCallback } from "react";
import { toast } from "sonner";
import type { Country, LicenseLookupResult } from "../types/setup";

export function useLicenseLookup() {
  const [result, setResult] = useState<LicenseLookupResult | null>(null);
  const [isLooking, setIsLooking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const lookupLicense = useCallback(
    async (country: Country, licenseNumber: string) => {
      if (!licenseNumber || licenseNumber.length < 3) {
        setError("Please enter a valid license number");
        toast.error("Please enter a valid license number");
        return null;
      }

      try {
        setIsLooking(true);
        setError(null);

        const response = await fetch(
          `/api/registries/${country}/license/${encodeURIComponent(licenseNumber)}`
        );

        if (!response.ok) {
          throw new Error("License lookup failed");
        }

        const data = await response.json();

        if (data.success && data.data) {
          setResult(data.data);
          toast.success("License found! Business details loaded.");
          return data.data;
        } else {
          setResult({ found: false });
          toast.warning("License not found in registry");
          return { found: false };
        }
      } catch (err: any) {
        const errorMessage = err.message || "Failed to lookup license";
        setError(errorMessage);
        toast.error(errorMessage);
        return null;
      } finally {
        setIsLooking(false);
      }
    },
    []
  );

  const reset = useCallback(() => {
    setResult(null);
    setError(null);
  }, []);

  return {
    result,
    isLooking,
    error,
    lookupLicense,
    reset,
  };
}
