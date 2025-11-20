/**
 * KYC Hooks
 * Centralized exports for all KYC custom hooks
 */

export { useKYCData, useMultipleKYCData } from "./useKYCData";
export { useKYCProgress } from "./useKYCProgress";
export { useKYCStep } from "./useKYCStep";

// Re-export types for convenience
export type { UseKYCDataReturn } from "./useKYCData";
export type { UseKYCProgressReturn } from "./useKYCProgress";
export type { UseKYCStepReturn } from "./useKYCStep";
