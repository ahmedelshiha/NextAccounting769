/**
 * KYC Steps Constants
 * Centralized step definitions and configurations
 */

import { KYCStep } from "../types/kyc";

// KYC Step Definitions
export const KYC_STEPS_CONFIG = [
  {
    id: "identity",
    title: "Identity Verification",
    description: "Verify your personal or business identity",
    route: "/portal/kyc/identity",
  },
  {
    id: "address",
    title: "Address Verification",
    description: "Confirm registered business or residential address",
    route: "/portal/kyc/address",
  },
  {
    id: "business",
    title: "Business Registration",
    description: "Link business registration and license details",
    route: "/portal/kyc/business",
  },
  {
    id: "owners",
    title: "Beneficial Owners",
    description: "Identify and verify all beneficial owners",
    route: "/portal/kyc/owners",
  },
  {
    id: "tax",
    title: "Tax Information",
    description: "Enter tax ID and filing information",
    route: "/portal/kyc/tax",
  },
  {
    id: "risk",
    title: "Risk Assessment",
    description: "Complete compliance and risk questionnaire",
    route: "/portal/kyc/risk",
  },
] as const;

// Step IDs for type safety
export const KYC_STEP_IDS = {
  IDENTITY: "identity",
  ADDRESS: "address",
  BUSINESS: "business",
  OWNERS: "owners",
  TAX: "tax",
  RISK: "risk",
} as const;

// Status Colors
export const KYC_STATUS_COLORS = {
  completed: "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800",
  in_progress: "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800",
  pending: "bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700",
} as const;

// Badge Colors
export const KYC_BADGE_COLORS = {
  completed: "bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200",
  in_progress: "bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200",
  pending: "bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-200",
} as const;

// Risk Level Colors
export const RISK_LEVEL_COLORS = {
  low: "text-green-600 dark:text-green-400",
  medium: "text-yellow-600 dark:text-yellow-400",
  high: "text-red-600 dark:text-red-400",
} as const;

// Risk Level Badges
export const RISK_LEVEL_BADGES = {
  low: "bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200",
  medium: "bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200",
  high: "bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200",
} as const;

// Helper function to get step by ID
export function getStepById(stepId: string) {
  return KYC_STEPS_CONFIG.find((step) => step.id === stepId);
}

// Helper function to get step index
export function getStepIndex(stepId: string): number {
  return KYC_STEPS_CONFIG.findIndex((step) => step.id === stepId);
}

// Helper function to get next step
export function getNextStep(currentStepId: string) {
  const currentIndex = getStepIndex(currentStepId);
  if (currentIndex === -1 || currentIndex === KYC_STEPS_CONFIG.length - 1) {
    return null;
  }
  return KYC_STEPS_CONFIG[currentIndex + 1];
}

// Helper function to get previous step
export function getPreviousStep(currentStepId: string) {
  const currentIndex = getStepIndex(currentStepId);
  if (currentIndex <= 0) {
    return null;
  }
  return KYC_STEPS_CONFIG[currentIndex - 1];
}
