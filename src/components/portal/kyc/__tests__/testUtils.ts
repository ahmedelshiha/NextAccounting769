/**
 * Test Utilities for KYC Components
 * Shared test helpers, mock data, and utilities
 */

import { KYCData, KYCStep } from "../types/kyc";

/**
 * Mock KYC Data for testing
 */
export const mockKYCData: KYCData = {
  entityId: "test-entity-123",
  identity: {
    fullName: "John Doe",
    dateOfBirth: "1990-01-01",
    nationality: "US",
    idType: "passport",
    idNumber: "P123456789",
    idExpiry: "2030-12-31",
  },
  address: {
    street: "123 Main St",
    city: "New York",
    state: "NY",
    postalCode: "10001",
    country: "US",
  },
  business: {
    companyName: "Test Corp",
    registrationNumber: "REG123",
    taxId: "TAX456",
    businessType: "LLC",
    industry: "Technology",
  },
  documents: {
    idDocument: { url: "/docs/id.pdf", verified: true },
    proofOfAddress: { url: "/docs/address.pdf", verified: true },
    businessLicense: { url: "/docs/license.pdf", verified: false },
  },
  financialInfo: {
    bankName: "Test Bank",
    accountNumber: "****1234",
    swiftCode: "TESTUS33",
    estimatedRevenue: "100000-500000",
  },
  compliance: {
    amlScreening: { status: "passed", date: "2024-01-15" },
    sanctionsCheck: { status: "passed", date: "2024-01-15" },
    pepCheck: { status: "passed", date: "2024-01-15" },
  },
  riskAssessment: {
    riskLevel: "low",
    riskScore: 15,
    assessmentDate: "2024-01-15",
    notes: "Low risk profile",
  },
};

/**
 * Mock KYC Steps for testing
 */
export const mockKYCSteps: KYCStep[] = [
  {
    id: "identity",
    title: "Identity Verification",
    description: "Verify your identity with government-issued ID",
    status: "completed",
    route: "/portal/kyc/identity",
    percentage: 100,
  },
  {
    id: "address",
    title: "Address Verification",
    description: "Confirm your residential address",
    status: "completed",
    route: "/portal/kyc/address",
    percentage: 100,
  },
  {
    id: "business",
    title: "Business Information",
    description: "Provide your business details",
    status: "in_progress",
    route: "/portal/kyc/business",
    percentage: 60,
  },
  {
    id: "documents",
    title: "Document Upload",
    description: "Upload required documents",
    status: "pending",
    route: "/portal/kyc/documents",
  },
  {
    id: "financial",
    title: "Financial Information",
    description: "Add your banking details",
    status: "pending",
    route: "/portal/kyc/financial",
  },
  {
    id: "review",
    title: "Final Review",
    description: "Review and submit your application",
    status: "pending",
    route: "/portal/kyc/review",
  },
];

/**
 * Mock completed steps for timeline testing
 */
export const mockCompletedSteps: KYCStep[] = mockKYCSteps.filter(
  (step) => step.status === "completed"
);

/**
 * Mock API response for KYC data
 */
export const mockKYCApiResponse = {
  success: true,
  data: mockKYCData,
};

/**
 * Mock API error response
 */
export const mockKYCApiError = {
  success: false,
  error: "Failed to fetch KYC data",
};

/**
 * Mock step API response
 */
export const mockStepApiResponse = {
  success: true,
  message: "Step submitted successfully",
};

/**
 * Helper to create mock fetch response
 */
export const createMockResponse = (data: any, ok = true) => ({
  ok,
  json: async () => data,
  status: ok ? 200 : 400,
  statusText: ok ? "OK" : "Bad Request",
});

/**
 * Helper to wait for async updates
 */
export const waitFor = (ms: number) =>
  new Promise((resolve) => setTimeout(resolve, ms));
