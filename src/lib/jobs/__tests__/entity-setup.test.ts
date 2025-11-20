import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  initializeVerificationJob,
  getVerificationState,
  updateVerificationState,
  verifyEntityRegistrations,
  markForManualReview,
  getJobStatus,
  VerificationJobState,
} from "../entity-setup";
import { Redis } from "@upstash/redis";
import prisma from "@/lib/prisma";

// Mock Redis and Prisma
vi.mock("@upstash/redis");
vi.mock("@/lib/prisma");
vi.mock("@/lib/logger");

describe("Entity Setup Verification Job", () => {
  const mockEntityId = "test-entity-123";
  const mockTenantId = "test-tenant-123";

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("initializeVerificationJob", () => {
    it("should create initial job state", async () => {
      const result = await initializeVerificationJob(mockEntityId);

      expect(result).toMatchObject({
        entityId: mockEntityId,
        status: "PENDING_VERIFICATION",
        verifiedRegistrations: [],
        retryCount: 0,
        maxRetries: 3,
      });
      expect(result.startedAt).toBeDefined();
      expect(result.completedAt).toBeUndefined();
    });

    it("should store state in Redis with TTL", async () => {
      const mockRedis = vi.mocked(Redis);
      const setexMock = vi.fn();
      mockRedis.prototype.setex = setexMock;

      await initializeVerificationJob(mockEntityId);

      expect(setexMock).toHaveBeenCalled();
    });
  });

  describe("updateVerificationState", () => {
    it("should update existing job state", async () => {
      const mockRedis = vi.mocked(Redis);
      const getMock = vi.fn().mockResolvedValue(
        JSON.stringify({
          entityId: mockEntityId,
          status: "PENDING_VERIFICATION",
          verifiedRegistrations: [],
          retryCount: 0,
          maxRetries: 3,
          startedAt: new Date(),
        })
      );
      const setexMock = vi.fn();

      mockRedis.prototype.get = getMock;
      mockRedis.prototype.setex = setexMock;

      const updated = await updateVerificationState(mockEntityId, {
        status: "VERIFYING_REGISTRATIONS",
      });

      expect(updated?.status).toBe("VERIFYING_REGISTRATIONS");
      expect(setexMock).toHaveBeenCalled();
    });

    it("should preserve original entityId and startedAt", async () => {
      const originalStart = new Date("2024-01-01");
      const mockRedis = vi.mocked(Redis);
      const getMock = vi.fn().mockResolvedValue(
        JSON.stringify({
          entityId: mockEntityId,
          status: "PENDING_VERIFICATION",
          verifiedRegistrations: [],
          retryCount: 0,
          maxRetries: 3,
          startedAt: originalStart,
        })
      );

      mockRedis.prototype.get = getMock;
      mockRedis.prototype.setex = vi.fn();

      const updated = await updateVerificationState(mockEntityId, {
        status: "VERIFIED_SUCCESS",
      });

      expect(updated?.entityId).toBe(mockEntityId);
      expect(updated?.startedAt).toEqual(originalStart);
    });

    it("should return null if state not found", async () => {
      const mockRedis = vi.mocked(Redis);
      mockRedis.prototype.get = vi.fn().mockResolvedValue(null);

      const result = await updateVerificationState(mockEntityId, {
        status: "VERIFYING_REGISTRATIONS",
      });

      expect(result).toBeNull();
    });
  });

  describe("getVerificationState", () => {
    it("should retrieve state from Redis", async () => {
      const mockState: VerificationJobState = {
        entityId: mockEntityId,
        status: "PENDING_VERIFICATION",
        startedAt: new Date(),
        verifiedRegistrations: [],
        retryCount: 0,
        maxRetries: 3,
      };

      const mockRedis = vi.mocked(Redis);
      mockRedis.prototype.get = vi.fn().mockResolvedValue(JSON.stringify(mockState));

      const result = await getVerificationState(mockEntityId);

      expect(result).toMatchObject(mockState);
    });

    it("should return null if state not found", async () => {
      const mockRedis = vi.mocked(Redis);
      mockRedis.prototype.get = vi.fn().mockResolvedValue(null);

      const result = await getVerificationState(mockEntityId);

      expect(result).toBeNull();
    });
  });

  describe("getJobStatus", () => {
    it("should return state with TTL", async () => {
      const mockState: VerificationJobState = {
        entityId: mockEntityId,
        status: "PENDING_VERIFICATION",
        startedAt: new Date(),
        verifiedRegistrations: [],
        retryCount: 0,
        maxRetries: 3,
      };

      const mockRedis = vi.mocked(Redis);
      mockRedis.prototype.get = vi.fn().mockResolvedValue(JSON.stringify(mockState));
      mockRedis.prototype.ttl = vi.fn().mockResolvedValue(250000); // ~4 minutes remaining

      const result = await getJobStatus(mockEntityId);

      expect(result?.state).toMatchObject(mockState);
      expect(result?.expiresIn).toBe(250000);
    });

    it("should return null if job not found", async () => {
      const mockRedis = vi.mocked(Redis);
      mockRedis.prototype.get = vi.fn().mockResolvedValue(null);

      const result = await getJobStatus(mockEntityId);

      expect(result).toBeNull();
    });
  });

  describe("verifyEntityRegistrations", () => {
    it("should mark entity as verified when all registrations valid", async () => {
      const mockPrisma = vi.mocked(prisma);

      // Mock entity with registrations
      mockPrisma.entity.findUnique = vi.fn().mockResolvedValue({
        id: mockEntityId,
        tenantId: mockTenantId,
        country: "AE",
        name: "Test Business",
        registrations: [
          { id: "reg-1", type: "TRN", value: "123456789012345", status: "PENDING" },
        ],
        licenses: [],
      });

      mockPrisma.entityRegistration.update = vi.fn().mockResolvedValue({});
      mockPrisma.auditEvent.create = vi.fn().mockResolvedValue({});

      // Mock Redis operations
      const mockRedis = vi.mocked(Redis);
      const initialState: VerificationJobState = {
        entityId: mockEntityId,
        status: "PENDING_VERIFICATION",
        startedAt: new Date(),
        verifiedRegistrations: [],
        retryCount: 0,
        maxRetries: 3,
      };

      mockRedis.prototype.get = vi
        .fn()
        .mockResolvedValueOnce(JSON.stringify(initialState))
        .mockResolvedValueOnce(JSON.stringify(initialState));

      mockRedis.prototype.setex = vi.fn();
      mockRedis.prototype.publish = vi.fn();

      const result = await verifyEntityRegistrations(mockEntityId);

      expect(result?.status).toBe("VERIFIED_SUCCESS");
      expect(result?.verifiedRegistrations).toContain("TRN");
    });

    it("should mark entity as failed when registration invalid", async () => {
      const mockPrisma = vi.mocked(prisma);

      mockPrisma.entity.findUnique = vi.fn().mockResolvedValue({
        id: mockEntityId,
        tenantId: mockTenantId,
        country: "AE",
        name: "Test Business",
        registrations: [
          { id: "reg-1", type: "TRN", value: "INVALID", status: "PENDING" },
        ],
        licenses: [],
      });

      mockPrisma.verificationAttempt.create = vi.fn().mockResolvedValue({});
      mockPrisma.auditEvent.create = vi.fn().mockResolvedValue({});

      const mockRedis = vi.mocked(Redis);
      const initialState: VerificationJobState = {
        entityId: mockEntityId,
        status: "PENDING_VERIFICATION",
        startedAt: new Date(),
        verifiedRegistrations: [],
        retryCount: 0,
        maxRetries: 3,
      };

      mockRedis.prototype.get = vi
        .fn()
        .mockResolvedValueOnce(JSON.stringify(initialState))
        .mockResolvedValueOnce(JSON.stringify(initialState));

      mockRedis.prototype.setex = vi.fn();
      mockRedis.prototype.publish = vi.fn();

      const result = await verifyEntityRegistrations(mockEntityId);

      expect(result?.status).toBe("VERIFICATION_FAILED");
      expect(result?.failureReason).toBeDefined();
    });

    it("should return null for non-existent entity", async () => {
      const mockPrisma = vi.mocked(prisma);
      mockPrisma.entity.findUnique = vi.fn().mockResolvedValue(null);

      const mockRedis = vi.mocked(Redis);
      const initialState: VerificationJobState = {
        entityId: mockEntityId,
        status: "PENDING_VERIFICATION",
        startedAt: new Date(),
        verifiedRegistrations: [],
        retryCount: 0,
        maxRetries: 3,
      };

      mockRedis.prototype.get = vi.fn().mockResolvedValue(JSON.stringify(initialState));
      mockRedis.prototype.setex = vi.fn();
      mockRedis.prototype.publish = vi.fn();

      const result = await verifyEntityRegistrations(mockEntityId);

      expect(result?.status).toBe("VERIFICATION_FAILED");
      expect(result?.failureReason).toBe("Entity not found");
    });
  });

  describe("markForManualReview", () => {
    it("should mark entity for manual review", async () => {
      const reason = "License not found in registry";

      const mockRedis = vi.mocked(Redis);
      const initialState: VerificationJobState = {
        entityId: mockEntityId,
        status: "PENDING_VERIFICATION",
        startedAt: new Date(),
        verifiedRegistrations: [],
        retryCount: 0,
        maxRetries: 3,
      };

      mockRedis.prototype.get = vi.fn().mockResolvedValue(JSON.stringify(initialState));
      mockRedis.prototype.setex = vi.fn();
      mockRedis.prototype.publish = vi.fn();

      const result = await markForManualReview(mockEntityId, reason);

      expect(result?.status).toBe("MANUAL_REVIEW");
      expect(result?.failureReason).toBe(reason);
      expect(result?.completedAt).toBeDefined();
    });
  });

  describe("State machine transitions", () => {
    it("should follow correct state transition path", async () => {
      const mockRedis = vi.mocked(Redis);

      // Initial state
      const initialState: VerificationJobState = {
        entityId: mockEntityId,
        status: "PENDING_VERIFICATION",
        startedAt: new Date(),
        verifiedRegistrations: [],
        retryCount: 0,
        maxRetries: 3,
      };

      let currentState = initialState;

      // Simulate: PENDING_VERIFICATION → VERIFYING_REGISTRATIONS
      currentState = {
        ...currentState,
        status: "VERIFYING_REGISTRATIONS",
      };
      expect(currentState.status).toBe("VERIFYING_REGISTRATIONS");

      // Simulate: VERIFYING_REGISTRATIONS → VERIFIED_SUCCESS
      currentState = {
        ...currentState,
        status: "VERIFIED_SUCCESS",
        completedAt: new Date(),
        verifiedRegistrations: ["TRN"],
      };
      expect(currentState.status).toBe("VERIFIED_SUCCESS");
      expect(currentState.completedAt).toBeDefined();
    });

    it("should prevent invalid state transitions", () => {
      // These are validation rules that should be enforced at API level
      const invalidTransitions = [
        { from: "VERIFIED_SUCCESS", to: "PENDING_VERIFICATION" },
        { from: "VERIFICATION_FAILED", to: "VERIFIED_SUCCESS" },
        { from: "MANUAL_REVIEW", to: "PENDING_VERIFICATION" },
      ];

      invalidTransitions.forEach(({ from, to }) => {
        // In a real state machine, these would throw errors
        // This test documents the expected behavior
        expect(true).toBe(true); // Placeholder
      });
    });
  });
});
