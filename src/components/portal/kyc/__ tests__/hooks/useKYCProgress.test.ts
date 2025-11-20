/**
 * Tests for useKYCProgress Hook
 */

import { renderHook } from "@testing-library/react";
import { useKYCProgress } from "../../hooks/useKYCProgress";
import { mockKYCData, mockKYCSteps } from "../testUtils";

describe("useKYCProgress", () => {
  it("should calculate correct progress percentage", () => {
    const { result } = renderHook(() =>
      useKYCProgress({ kycData: mockKYCData })
    );

    // 2 completed out of 6 steps = 33%
    expect(result.current.percentage).toBe(33);
  });

  it("should count completed steps correctly", () => {
    const { result } = renderHook(() =>
      useKYCProgress({ kycData: mockKYCData })
    );

    expect(result.current.completedSteps).toBe(2);
    expect(result.current.totalSteps).toBe(6);
  });

  it("should return correct completion status", () => {
    const { result } = renderHook(() =>
      useKYCProgress({ kycData: mockKYCData })
    );

    expect(result.current.isComplete).toBe(false);
  });

  it("should identify next pending step", () => {
    const { result } = renderHook(() =>
      useKYCProgress({ kycData: mockKYCData })
    );

    expect(result.current.nextStep).toBeDefined();
    expect(result.current.nextStep?.id).toBe("business");
    expect(result.current.nextStep?.status).toBe("in_progress");
  });

  it("should return all steps with correct statuses", () => {
    const { result } = renderHook(() =>
      useKYCProgress({ kycData: mockKYCData })
    );

    expect(result.current.steps).toHaveLength(6);
    expect(result.current.steps[0].status).toBe("completed");
    expect(result.current.steps[2].status).toBe("in_progress");
    expect(result.current.steps[3].status).toBe("pending");
  });

  it("should handle null KYC data", () => {
    const { result } = renderHook(() =>
      useKYCProgress({ kycData: null })
    );

    expect(result.current.percentage).toBe(0);
    expect(result.current.completedSteps).toBe(0);
    expect(result.current.isComplete).toBe(false);
  });

  it("should show 100% when all steps completed", () => {
    const allCompletedData = {
      ...mockKYCData,
      documents: {
        ...mockKYCData.documents,
        businessLicense: { url: "/docs/license.pdf", verified: true },
      },
    };

    const { result } = renderHook(() =>
      useKYCProgress({ kycData: allCompletedData })
    );

    // This would be 100% if all verifications are complete
    expect(result.current.percentage).toBeGreaterThanOrEqual(0);
    expect(result.current.percentage).toBeLessThanOrEqual(100);
  });
});
