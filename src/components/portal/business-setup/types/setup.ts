/**
 * Business Setup - TypeScript Type Definitions
 * Centralized types for the Business Setup Modal
 */

export type Country = "AE" | "SA" | "EG";

export type BusinessType = "existing" | "new" | "individual";

export interface SetupFormData {
  country: Country;
  licenseNumber?: string;
  businessName?: string;
  economicZoneId?: string;
  legalForm?: string;
  activityCode?: string;
  termsAccepted: boolean;
  consentVersion?: string;
  attachments?: File[];
  registrations?: Registration[];
}

export interface Registration {
  type: string;
  value: string;
}

export interface EconomicZone {
  id: string;
  name: string;
  country: Country;
}

export interface LegalForm {
  id: string;
  name: string;
  country: Country;
}

export interface LicenseLookupResult {
  found: boolean;
  businessName?: string;
  status?: string;
  legalForm?: string;
  registrations?: Registration[];
  economicZone?: string;
}

export interface SetupWizardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onComplete?: (entityId: string) => void;
}

export interface TabProps {
  onError: (message: string) => void;
  onComplete: (entityId: string) => void;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
}

export interface FormProps {
  onSubmit: (data: SetupFormData) => Promise<void>;
  isLoading: boolean;
  defaultValues?: Partial<SetupFormData>;
}
