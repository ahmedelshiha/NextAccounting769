/**
 * useKYCProgress Hook
 * Custom hook for calculating KYC verification progress
 */

import { useMemo } from "react";
import { KYCStep, KYCProgress, KYCData } from "../types/kyc";
import { KYC_STEPS_CONFIG } from "../constants/kycSteps";

interface UseKYCProgressOptions {
  kycData: KYCData | undefined;
}

export interface UseKYCProgressReturn extends KYCProgress {
  steps: KYCStep[];
  completedStepIds: string[];
  pendingStepIds: string[];
  nextStep: KYCStep | null;
}

/**
 * Hook to calculate KYC progress and step statuses
 * 
 * @param options - Configuration options with KYC data
 * @returns Progress information, steps with statuses, and navigation helpers
 * 
 * @example
 * ```typescript
 * const { percentage, steps, nextStep } = useKYCProgress({ kycData });
 * ```
 */
export function useKYCProgress({
  kycData,
}: UseKYCProgressOptions): UseKYCProgressReturn {
  const steps = useMemo<KYCStep[]>(() => {
    if (!kycData) {
      return KYC_STEPS_CONFIG.map((config) => ({
        ...config,
        status: "pending" as const,
        percentage: 0,
      }));
    }

    return KYC_STEPS_CONFIG.map((config) => {
      let status: "completed" | "in_progress" | "pending" = "pending";
      let percentage = 0;

      // Map step ID to KYC data field
      const dataMap: Record<string, any> = {
        identity: kycData.identity,
        address: kycData.address,
        business: kycData.businessInfo,
        owners: kycData.beneficialOwners,
        tax: kycData.taxInfo,
        risk: kycData.riskAssessment,
      };

      const stepData = dataMap[config.id];

      if (stepData) {
        if (stepData.status === "completed") {
          status = "completed";
          percentage = 100;
        } else if (stepData.status === "in_progress") {
          status = "in_progress";
          percentage = 50; // Default to 50% for in-progress
        }
      }

      return {
        ...config,
        status,
        percentage,
      };
    });
  }, [kycData]);

  const progress = useMemo<KYCProgress>(() => {
    const completedSteps = steps.filter((s) => s.status === "completed").length;
    const totalSteps = steps.length;
    const percentage = Math.round((completedSteps / totalSteps) * 100);

    return {
      completedSteps,
      totalSteps,
      percentage,
      isComplete: percentage === 100,
    };
  }, [steps]);

  const completedStepIds = useMemo(
    () => steps.filter((s) => s.status === "completed").map((s) => s.id),
    [steps]
  );

  const pendingStepIds = useMemo(
    () => steps.filter((s) => s.status === "pending").map((s) => s.id),
    [steps]
  );

  const nextStep = useMemo(() => {
    const firstPending = steps.find((s) => s.status === "pending");
    return firstPending || null;
  }, [steps]);

  return {
    ...progress,
    steps,
    completedStepIds,
    pendingStepIds,
    nextStep,
  };
}
