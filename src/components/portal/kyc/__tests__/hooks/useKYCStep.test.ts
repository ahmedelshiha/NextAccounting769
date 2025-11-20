/**
 * Tests for useKYCStep Hook
 */

import { renderHook, act, waitFor } from "@testing-library/react";
import { useKYCStep } from "../../hooks/useKYCStep";
import { mockStepApiResponse, createMockResponse } from "../testUtils";

// Mock next/navigation
jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
}));

// Mock fetch
global.fetch = jest.fn();

describe("useKYCStep", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should initialize with correct default state", () => {
    const { result } = renderHook(() =>
      useKYCStep({
        stepId: "identity",
        entityId: "test-entity-123",
      })
    );

    expect(result.current.isSubmitting).toBe(false);
    expect(result.current.error).toBeNull();
    expect(result.current.currentStep).toBeDefined();
    expect(result.current.currentStep?.id).toBe("identity");
  });

  it("should get next step correctly", () => {
    const { result } = renderHook(() =>
      useKYCStep({
        stepId: "identity",
        entityId: "test-entity-123",
      })
    );

    expect(result.current.nextStep).toBeDefined();
    expect(result.current.nextStep?.id).toBe("address");
  });

  it("should get previous step correctly", () => {
    const { result } = renderHook(() =>
      useKYCStep({
        stepId: "address",
        entityId: "test-entity-123",
      })
    );

    expect(result.current.previousStep).toBeDefined();
    expect(result.current.previousStep?.id).toBe("identity");
  });

  it("should submit step data successfully", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce(
      createMockResponse(mockStepApiResponse)
    );

    const onSuccess = jest.fn();
    const { result } = renderHook(() =>
      useKYCStep({
        stepId: "identity",
        entityId: "test-entity-123",
        onSuccess,
      })
    );

    await act(async () => {
      await result.current.submitStep({ fullName: "John Doe" });
    });

    await waitFor(() => {
      expect(result.current.isSubmitting).toBe(false);
      expect(result.current.error).toBeNull();
      expect(onSuccess).toHaveBeenCalled();
    });
  });

  it("should handle submission error", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce(
      createMockResponse({ success: false, error: "Validation failed" }, false)
    );

    const onError = jest.fn();
    const { result } = renderHook(() =>
      useKYCStep({
        stepId: "identity",
        entityId: "test-entity-123",
        onError,
      })
    );

    await act(async () => {
      await result.current.submitStep({ fullName: "" });
    });

    await waitFor(() => {
      expect(result.current.isSubmitting).toBe(false);
      expect(result.current.error).toBeTruthy();
      expect(onError).toHaveBeenCalled();
    });
  });

  it("should not submit without entity ID", async () => {
    const { result } = renderHook(() =>
      useKYCStep({
        stepId: "identity",
        entityId: null,
      })
    );

    await act(async () => {
      await result.current.submitStep({ fullName: "John Doe" });
    });

    expect(result.current.error).toBe("Entity ID is required");
    expect(global.fetch).not.toHaveBeenCalled();
  });
});
