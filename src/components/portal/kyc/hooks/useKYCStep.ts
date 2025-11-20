/**
 * useKYCStep Hook
 * Custom hook for managing individual KYC step operations
 */

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { KYCStepApiResponse } from "../types/kyc";
import { getNextStep, getPreviousStep, getStepById } from "../constants/kycSteps";

interface UseKYCStepOptions {
  stepId: string;
  entityId: string | null;
  onSuccess?: () => void;
  onError?: (error: Error) => void;
}

export interface UseKYCStepReturn {
  isSubmitting: boolean;
  error: string | null;
  submitStep: (data: any) => Promise<void>;
  goToNextStep: () => void;
  goToPreviousStep: () => void;
  currentStep: ReturnType<typeof getStepById>;
  nextStep: ReturnType<typeof getNextStep>;
  previousStep: ReturnType<typeof getPreviousStep>;
}

/**
 * Hook to manage individual KYC step operations
 * 
 * @param options - Configuration options
 * @returns Step management functions and state
 * 
 * @example
 * ```typescript
 * const { submitStep, isSubmitting, goToNextStep } = useKYCStep({
 *   stepId: "identity",
 *   entityId: "ent-123"
 * });
 * ```
 */
export function useKYCStep({
  stepId,
  entityId,
  onSuccess,
  onError,
}: UseKYCStepOptions): UseKYCStepReturn {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const currentStep = getStepById(stepId);
  const nextStep = getNextStep(stepId);
  const previousStep = getPreviousStep(stepId);

  /**
   * Submit step data to the API
   */
  const submitStep = useCallback(
    async (data: any) => {
      if (!entityId) {
        setError("Entity ID is required");
        return;
      }

      setIsSubmitting(true);
      setError(null);

      try {
        const response = await fetch(`/api/kyc/${stepId}`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            entityId,
            ...data,
          }),
        });

        const result: KYCStepApiResponse = await response.json();

        if (!result.success) {
          throw new Error(result.error || "Failed to submit step");
        }

        onSuccess?.();
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Unknown error";
        setError(errorMessage);
        onError?.(err instanceof Error ? err : new Error(errorMessage));
      } finally {
        setIsSubmitting(false);
      }
    },
    [stepId, entityId, onSuccess, onError]
  );

  /**
   * Navigate to the next step
   */
  const goToNextStep = useCallback(() => {
    if (nextStep && entityId) {
      router.push(`${nextStep.route}?entityId=${entityId}`);
    } else {
      // If no next step, go back to KYC dashboard
      router.push(`/portal/kyc?entityId=${entityId}`);
    }
  }, [nextStep, entityId, router]);

  /**
   * Navigate to the previous step
   */
  const goToPreviousStep = useCallback(() => {
    if (previousStep && entityId) {
      router.push(`${previousStep.route}?entityId=${entityId}`);
    } else {
      // If no previous step, go back to KYC dashboard
      router.push(`/portal/kyc?entityId=${entityId}`);
    }
  }, [previousStep, entityId, router]);

  return {
    isSubmitting,
    error,
    submitStep,
    goToNextStep,
    goToPreviousStep,
    currentStep,
    nextStep,
    previousStep,
  };
}
