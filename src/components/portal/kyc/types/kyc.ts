/**
 * KYC Types
 * Centralized TypeScript type definitions for KYC feature
 */

// KYC Step Status
export type KYCStepStatus = "completed" | "in_progress" | "pending";

// Risk Level
export type RiskLevel = "low" | "medium" | "high";

// KYC Step Interface
export interface KYCStep {
  id: string;
  title: string;
  description: string;
  status: KYCStepStatus;
  percentage?: number;
  route?: string;
}

// Individual Step Data Interfaces
export interface IdentityData {
  status: "completed" | "pending";
  documentType?: string;
  documentNumber?: string;
  verifiedAt?: string;
}

export interface AddressData {
  status: "completed" | "pending";
  address?: string;
  city?: string;
  country?: string;
  postalCode?: string;
  verifiedAt?: string;
}

export interface BusinessInfoData {
  status: "completed" | "pending";
  registrationNumber?: string;
  businessName?: string;
  businessType?: string;
  verifiedAt?: string;
}

export interface BeneficialOwnersData {
  status: "completed" | "pending";
  ownersCount?: number;
  owners?: BeneficialOwner[];
  verifiedAt?: string;
}

export interface BeneficialOwner {
  id: string;
  name: string;
  ownershipPercentage: number;
  nationality?: string;
  verified: boolean;
}

export interface TaxInfoData {
  status: "completed" | "pending";
  tinNumber?: string;
  taxResidency?: string;
  verifiedAt?: string;
}

export interface RiskAssessmentData {
  status: "completed" | "pending";
  level?: RiskLevel;
  score?: number;
  factors?: string[];
  verifiedAt?: string;
}

// Complete KYC Data Interface
export interface KYCData {
  identity: IdentityData;
  address: AddressData;
  businessInfo: BusinessInfoData;
  beneficialOwners: BeneficialOwnersData;
  taxInfo: TaxInfoData;
  riskAssessment: RiskAssessmentData;
}

// KYC Progress Interface
export interface KYCProgress {
  completedSteps: number;
  totalSteps: number;
  percentage: number;
  isComplete: boolean;
}

// API Response Interfaces
export interface KYCApiResponse {
  success: boolean;
  data: KYCData;
  error?: string;
}

export interface KYCStepApiResponse {
  success: boolean;
  data: any;
  error?: string;
}

// Component Props Interfaces
export interface KYCProgressCardProps {
  completedSteps: number;
  totalSteps: number;
  percentage: number;
}

export interface KYCStepsListProps {
  steps: KYCStep[];
  onStepClick: (stepId: string) => void;
}

export interface KYCTimelineProps {
  completedSteps: KYCStep[];
}

export interface KYCStepCardProps {
  step: KYCStep;
  onClick: () => void;
}

export interface KYCStatusBadgeProps {
  status: KYCStepStatus;
  label?: string;
}

export interface KYCStepIconProps {
  status: KYCStepStatus;
  size?: "sm" | "md" | "lg";
}

export interface KYCProgressBarProps {
  value: number;
  className?: string;
}
